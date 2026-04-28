import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { eq, sql } from "drizzle-orm";
import { initDb, db, usersTable, matchesTable } from "./db";
import { createEngine } from "./game/engineFactory";
import { CLASSIC_BOARD_CONFIG, MEGA_BOARD_CONFIG } from "./config/boardConfig";
import { Room, GameState, RoomPhase, BoardCellState, PlayerState, ContractProposal, CellResolveResult } from "./game/types";
import {
rollThreeDice, rollDie, checkBankruptcy, checkForcedBalance, findNextUnownedProperty,
findNextOpponentProperty, getGroupKey, calculateRent, canBuildOnGroup, getBuildingCost,
getSellValue, getValidTicketTargets, isPropertyTradable
} from "./game/boardLogic";
import { startAuction, handleBid, handleDrop } from "./game/auction";
import { handleSpecialCellEffects } from "./game/specialCells";

type BalanceResolveAction = 'END_TURN' | 'MR' | null;

const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
initDb().catch(console.error);

const JWT_SECRET = "secret_key";
const rooms = new Map<string, Room>();
export const TURN_TIME_MS = 90000;
const CONTRACT_RESPONSE_MS = 30000;
const MAX_CONTRACTS_PER_TURN = 3;
const MORTGAGE_TURNS_LIMIT = 5;

export function getSafeRoom(room: Room) {
const { engine, turnTimer, phaseTimer, pendingContracts, pausedTurnRemaining, auctionTimer, ...s } = room;
return s;
}

function performMrMonopolyEffect(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  const gs = room.gameState;
  const c = gs.players[gs.currentPlayerIndex];
  if (!c || c.isBankrupt) return;

  gs.pendingMrEffect = false;

  let targetPos: number | null = findNextUnownedProperty(room, c.position);

  if (targetPos === null) {
    targetPos = findNextOpponentProperty(room, c.position, c.userId);
  }

  if (targetPos !== null) {
    const dist = (targetPos - c.position + room.board.length) % room.board.length;
    const addRes = room.engine.calculateMove(c.position, dist);

    c.position = addRes.newPosition;
    c.money += addRes.moneyChange;
    gs.effectiveDiceSum = dist;

    const pName = room.players.find(p => p.userId === c.userId)?.displayName || 'Игрок';
    io.to(roomId).emit("game_log", {
      text: `${pName} (Mr. Monopoly) перемещается на ${room.board[targetPos].name}.`,
      isSystem: true
    });

    if (checkBankruptcy(c)) {
      handleBankruptcy(roomId, c.userId, "UNABLE_TO_PAY");
      return;
    }

    startPhaseTimer(roomId, "POST_MOVE");
  } else {
    endCurrentPlayerTurn(roomId);
  }
}

function calculateTotalCapital(board: BoardCellState[], player: PlayerState): number {
  const propertyValue = board
    .filter(c => c.ownerId === player.userId && !c.isMortgaged)
    .reduce((sum, c) => {
      const houseValue = (c.houseCost || 0) * (c.houses || 0);
      return sum + (c.price || 0) + houseValue;
    }, 0);
  return player.money + Math.floor(propertyValue / 2);
}

function handleBankruptcy(roomId: string, userId: string, reason: string, creditorId?: string, debtAmount?: number) {
const room = rooms.get(roomId);
if (!room) return;
const ps = room.gameState.players.find(p => p.userId === userId);
if (!ps) return;
if (creditorId && debtAmount && debtAmount > 0) {
  const creditor = room.gameState.players.find(p => p.userId === creditorId);
  if (creditor) {
    const totalCapital = calculateTotalCapital(room.board, ps);
    const transferAmount = Math.min(totalCapital, debtAmount);
    creditor.money += transferAmount;
    const debtorName = room.players.find(p => p.userId === userId)?.displayName || 'Игрок';
    const creditorName = room.players.find(p => p.userId === creditorId)?.displayName || 'Игрок';
    io.to(roomId).emit("game_log", { text: `${debtorName} сдался и выплатил $${transferAmount} игроку ${creditorName}.`, isSystem: true });
  }
}
ps.isBankrupt = true; ps.money = 0;
room.board.forEach(c => {
if (c.ownerId === userId) {
c.ownerId = undefined; c.houses = 0; c.isMortgaged = false; c.mortgageTurnsRemaining = undefined;
if (c.type === 'STATION') c.hasDepot = false;
}
});
const rp = room.players.find(p => p.userId === userId);
if (rp) rp.isOnline = false;
const active = room.gameState.players.filter(p => !p.isBankrupt);
if (active.length <= 1) finishGame(roomId);
else if (room.gameState.players[room.gameState.currentPlayerIndex].userId === userId) endCurrentPlayerTurn(roomId);
else { io.to(roomId).emit("state_update", room.gameState); io.to(roomId).emit("room_updated", getSafeRoom(room)); }
}

async function finishGame(roomId: string) {
const room = rooms.get(roomId);
if (!room) return;
if (room.turnTimer) clearTimeout(room.turnTimer);
if (room.phaseTimer) clearTimeout(room.phaseTimer);
const active = room.gameState.players.filter(p => !p.isBankrupt);
let winnerId = active.length === 1 ? active[0].userId : room.gameState.players.reduce((m, p) => p.money > m.money ? p : m).userId;
try {
await db.insert(matchesTable).values({ id: uuidv4(), winnerId, startTime: new Date(room.createdAt), endTime: new Date() });
for (const p of room.gameState.players) {
await db.update(usersTable).set({ gamesPlayed: sql`${usersTable.gamesPlayed} + 1`, wins: p.userId === winnerId ? sql`${usersTable.wins} + 1` : usersTable.wins }).where(eq(usersTable.id, p.userId));
}
} catch (e) { console.error("[DB]", e); }
rooms.delete(roomId);
io.to(roomId).emit("game_finished", { winnerId });
}

function handlePlayerRemoval(roomId: string, userId: string) {
const room = rooms.get(roomId);
if (!room) return;
const pi = room.players.findIndex(p => p.userId === userId);
if (pi === -1) return;
room.players.splice(pi, 1);
const gi = room.gameState.players.findIndex(p => p.userId === userId);
if (gi !== -1) {
room.gameState.players.splice(gi, 1);
if (room.gameState.currentPlayerIndex >= room.gameState.players.length) room.gameState.currentPlayerIndex = 0;
}
if (room.players.length === 0) { rooms.delete(roomId); }
else {
const h = room.players.find(p => p.isOnline);
room.hostId = h ? h.socketId : (room.players.length > 0 ? room.players[0].socketId : "");
io.to(roomId).emit("room_updated", getSafeRoom(room));
io.to(roomId).emit("state_update", room.gameState);
}
}

function resolveCurrentCell(room: Room, io: Server): CellResolveResult {
const gs = room.gameState;
const curr = gs.players[gs.currentPlayerIndex];
const cell = room.board[curr.position];

const isSpecial =
cell.type === "TAX" ||
cell.type === "CHANCE" ||
cell.type === "CHEST" ||
(cell.type === "SPECIAL" && !!cell.action);

if (isSpecial) {
const result = handleSpecialCellEffects(room, io);

if (result === "PAY") {
return { type: "WAIT_ACTION", action: room.gameState.activeAction };
}

if (result === "JAIL") {
return { type: "END_TURN" };
}

if (
room.gameState.activeAction?.type === "CHOOSE_AUCTION" ||
room.gameState.activeAction?.type === "CHOOSE_BIRTHDAY"
) {
return { type: "WAIT_ACTION", action: room.gameState.activeAction };
}

return { type: "CONTINUE" };
}

if (
(cell.type === "PROPERTY" ||
cell.type === "STATION" ||
cell.type === "UTILITY") &&
!cell.ownerId &&
cell.price &&
!cell.isMortgaged
) {
return {
type: "WAIT_ACTION",
action: { type: "BUY", data: { price: cell.price } },
};
}

if (cell.ownerId && cell.ownerId !== curr.userId && !cell.isMortgaged) {
const rent = calculateRent(cell, room.board, gs.effectiveDiceSum ?? 7);
return {
type: "WAIT_ACTION",
action: { type: "PAY", data: { amount: rent, targetUserId: cell.ownerId } },
};
}

return { type: "END_TURN" };
}

function applyPendingSecondMove(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  const gs = room.gameState;
  const c = gs.players[gs.currentPlayerIndex];
  if (!c || c.isBankrupt) return;

  if (gs.pendingMrEffect) {
    performMrMonopolyEffect(roomId);
    return;
  }

  if (gs.pendingBusExtraMove) {
    gs.pendingBusExtraMove = false;

    let nextPos = -1;
    for (let i = 1; i < room.board.length; i++) {
      const pos = (c.position + i) % room.board.length;
      if (room.board[pos].type === "CHANCE" || room.board[pos].type === "CHEST") {
        nextPos = pos;
        break;
      }
    }

    if (nextPos !== -1) {
      const dist = (nextPos - c.position + room.board.length) % room.board.length;
      const res = room.engine.calculateMove(c.position, dist);

      c.position = res.newPosition;
      c.money += res.moneyChange;
      gs.effectiveDiceSum = dist;

      const pName = room.players.find(p => p.userId === c.userId)?.displayName || 'Игрок';
      io.to(roomId).emit("game_log", {
        text: `${pName} перемещается на ближайший Шанс/Сундук: ${room.board[nextPos].name}.`,
        isSystem: true
      });

      if (checkBankruptcy(c)) {
        handleBankruptcy(roomId, c.userId, "UNABLE_TO_PAY");
        return;
      }
    }

    startPhaseTimer(roomId, "POST_MOVE");
    return;
  }

  endCurrentPlayerTurn(roomId);
}

function startPhaseTimer(roomId: string, phase: RoomPhase) {
const room = rooms.get(roomId);
if (!room || room.status !== "PLAYING") return;
if (room.turnTimer) clearTimeout(room.turnTimer);
if (room.phaseTimer) clearTimeout(room.phaseTimer);
const curr = room.gameState.players[room.gameState.currentPlayerIndex];
if (curr.isBankrupt) { endCurrentPlayerTurn(roomId); return; }
room.gameState.turnStartTime = Date.now();
room.gameState.currentPhase = phase;
room.gameState.isPaused = false;
room.gameState.buildLimitsThisTurn = {};
room.gameState.forcedBalanceGroupId = checkForcedBalance(room.board, curr.userId);

if (phase === "ACTIONS") {
if (curr.inJail) {
room.gameState.activeAction = { type: "JAIL" };
} else {
room.gameState.activeAction = { type: "ROLL" };
}
room.phaseTimer = setTimeout(() => handleBankruptcy(roomId, curr.userId, "PHASE1_TIMEOUT"), TURN_TIME_MS);
io.to(roomId).emit("state_update", room.gameState);
io.to(roomId).emit("room_updated", getSafeRoom(room));
}
else if (phase === "POST_MOVE") {
room.gameState.activeAction = null;

const result = resolveCurrentCell(room, io);

if (result.type === "CONTINUE" || result.type === "END_TURN") {
    io.to(roomId).emit("state_update", room.gameState);
    io.to(roomId).emit("room_updated", getSafeRoom(room));

    // Если попали в тюрьму — НЕ выполняем pending MR/BUS и сразу заканчиваем ход
    if (room.gameState.players[room.gameState.currentPlayerIndex]?.inJail) {
        endCurrentPlayerTurn(roomId);
    } else if (room.gameState.pendingMrEffect || room.gameState.pendingBusExtraMove) {
        applyPendingSecondMove(roomId);
    } else {
        endCurrentPlayerTurn(roomId);
    }
    return;
}

if (result.type === "WAIT_ACTION") {
room.gameState.activeAction = result.action;
io.to(roomId).emit("state_update", room.gameState);
io.to(roomId).emit("room_updated", getSafeRoom(room));
room.phaseTimer = setTimeout(
() => handleBankruptcy(roomId, curr.userId, "PHASE3_TIMEOUT"),
TURN_TIME_MS
);
return;
}
}
}

export function endCurrentPlayerTurn(roomId: string) {
const room = rooms.get(roomId);
if (!room) return;
const gs = room.gameState;

const wasDoubles = !!gs.thisRollWasDoubles;
if (wasDoubles) {
const consec = (gs.consecutiveDoubles || 0) + 1;
if (consec >= 3) {
const currPlayer = gs.players[gs.currentPlayerIndex];
if (currPlayer) {
currPlayer.position = 13;
currPlayer.inJail = true;
currPlayer.jailTurns = 0;
io.to(roomId).emit("game_log", {
text: `${room.players.find(p=>p.userId===currPlayer.userId)?.displayName} выбросил три дубля подряд и отправляется в тюрьму!`,
isSystem: true
});
}
gs.consecutiveDoubles = 0; gs.thisRollWasDoubles = false; nextTurn(roomId); return;
} else { gs.consecutiveDoubles = consec; gs.thisRollWasDoubles = false; startPhaseTimer(roomId, "ACTIONS"); return; }
} else { gs.consecutiveDoubles = 0; gs.thisRollWasDoubles = false; nextTurn(roomId); }
}

function nextTurn(roomId: string) {
const room = rooms.get(roomId);
if (!room) return;
const curr = room.gameState.players[room.gameState.currentPlayerIndex];
if (curr && !curr.isBankrupt) {
room.board.forEach(cell => {
if (cell.ownerId === curr.userId && cell.isMortgaged && cell.mortgageTurnsRemaining !== undefined) {
cell.mortgageTurnsRemaining -= 1;
if (cell.mortgageTurnsRemaining <= 0) {
cell.ownerId = undefined; cell.isMortgaged = false; cell.mortgageTurnsRemaining = undefined;
cell.houses = 0; cell.hasDepot = false;
}
}
});
}
room.gameState.contractsUsedThisTurn = 0;
room.gameState.effectiveDiceSum = undefined;
room.gameState.buildLimitsThisTurn = {};
room.pausedTurnRemaining = undefined;
room.gameState.isPaused = false;
room.gameState.pendingMrEffect = false;
room.gameState.thisRollWasDoubles = false;
room.gameState.consecutiveDoubles = 0;
room.gameState.forcedBalanceGroupId = null;
room.gameState.pendingBalanceResolveAction = null;
room.gameState.pendingBusChoice = false;
room.gameState.pendingBusBaseMove = undefined;
room.gameState.pendingBusExtraMove = false;
let ni = (room.gameState.currentPlayerIndex + 1) % room.gameState.players.length, loops = 0;
while (room.gameState.players[ni].isBankrupt && loops < room.gameState.players.length) { ni = (ni + 1) % room.gameState.players.length; loops++; }
room.gameState.currentPlayerIndex = ni;
startPhaseTimer(roomId, "ACTIONS");
}

export function resumeTurnTimer(room: Room) {
if (room.pausedTurnRemaining !== undefined) {
room.gameState.isPaused = false;
if (room.pausedTurnRemaining > 0) {
room.gameState.turnStartTime = Date.now() - (TURN_TIME_MS - room.pausedTurnRemaining);
const curr = room.gameState.players[room.gameState.currentPlayerIndex];
room.phaseTimer = setTimeout(() => handleBankruptcy(room.id, curr.userId, "PHASE1_TIMEOUT"), room.pausedTurnRemaining);
}
room.pausedTurnRemaining = undefined;
io.to(room.id).emit("state_update", room.gameState);
}
}

app.post("/register", async (req, res) => {
const { username, password } = req.body;
if (!username || !password) return res.status(400).json({ error: "Required" });
if (await db.query.usersTable.findFirst({ where: eq(usersTable.username, username) })) return res.status(409).json({ error: "Exists" });
try { await db.insert(usersTable).values({ id: uuidv4(), username, passwordHash: await bcrypt.hash(password, 10), displayName: username }); res.status(201).json({ message: "Created" }); } catch { res.status(500).json({ error: "DB" }); }
});
app.post("/login", async (req, res) => {
const { username, password } = req.body;
const u = await db.query.usersTable.findFirst({ where: eq(usersTable.username, username) });
if (!u || !(await bcrypt.compare(password, u.passwordHash))) return res.status(401).json({ error: "Invalid" });
res.json({ token: jwt.sign({ userId: u.id, username: u.username }, JWT_SECRET, { expiresIn: "1h" }) });
});
app.get("/me", async (req, res) => {
const t = req.headers.authorization?.split(" ")[1];
if (!t) return res.status(401).json({ error: "No token" });
try {
const d = jwt.verify(t, JWT_SECRET) as any;
const u = await db.query.usersTable.findFirst({ where: eq(usersTable.id, d.userId), columns: { id: true, username: true, displayName: true, avatarUrl: true, gamesPlayed: true, wins: true } });
if (!u) return res.status(404).json({ error: "Not found" });
res.json(u);
} catch { res.status(401).json({ error: "Invalid" }); }
});
app.get("/profile/:id", async (req, res) => {
const u = await db.query.usersTable.findFirst({ where: eq(usersTable.id, req.params.id), columns: { id: true, username: true, displayName: true, avatarUrl: true, gamesPlayed: true, wins: true } });
if (!u) return res.status(404).json({ error: "Not found" });
res.json(u);
});
app.patch("/profile", async (req, res) => {
const t = req.headers.authorization?.split(" ")[1];
if (!t) return res.status(401).json({ error: "No token" });
try {
const d = jwt.verify(t, JWT_SECRET) as any;
const { displayName, avatarUrl } = req.body;
const ud: any = {};
if (displayName) ud.displayName = displayName; if (avatarUrl) ud.avatarUrl = avatarUrl;
if (Object.keys(ud).length) await db.update(usersTable).set(ud).where(eq(usersTable.id, d.userId));
res.json({ message: "Updated" });
} catch { res.status(401).json({ error: "Invalid" }); }
});
app.get("/rooms", (req, res) => {
res.json(Array.from(rooms.values()).map(r => ({ id: r.id, playerCount: r.players.length, maxPlayers: r.settings.maxPlayers, mode: r.settings.mode, status: r.status, playersPreview: r.players.map(p => ({ displayName: p.displayName, avatarUrl: p.avatarUrl })) })));
});

io.use((socket, next) => {
const t = socket.handshake.auth.token;
if (!t) return next(new Error("No token"));
try { const d = jwt.verify(t, JWT_SECRET) as any; socket.data.userId = d.userId; socket.data.username = d.username; next(); } catch { next(new Error("Invalid token")); }
});

io.on("connection", async (socket) => {
const up = await db.query.usersTable.findFirst({ where: eq(usersTable.id, socket.data.userId), columns: { displayName: true, avatarUrl: true } });
if (!up) { socket.disconnect(true); return; }
socket.data.profile = { displayName: up.displayName || socket.data.username, avatarUrl: up.avatarUrl || "https://cdn-icons-png.flaticon.com/512/847/847969.png" };
socket.emit("your_id", socket.id);

socket.on("create_room", (settings?: { mode?: "CLASSIC" | "MEGA"; maxPlayers?: number }) => {
const rid = crypto.randomUUID();
const fs = { mode: settings?.mode || "MEGA", maxPlayers: settings?.mode === "CLASSIC" ? 4 : (settings?.maxPlayers || 8) };
const bb = fs.mode === "MEGA" ? MEGA_BOARD_CONFIG : CLASSIC_BOARD_CONFIG;
const r: Room = {
id: rid,
players: [{ userId: socket.data.userId, socketId: socket.id, displayName: socket.data.profile.displayName, avatarUrl: socket.data.profile.avatarUrl, isOnline: true }],
gameState: { players: [{ userId: socket.data.userId, position: 0, money: 2500, isBankrupt: false, busTickets: 0 }], currentPlayerIndex: 0, currentPhase: "ACTIONS", activeAction: { type: "ROLL" }, contractsUsedThisTurn: 0, pendingMrEffect: false, thisRollWasDoubles: false, consecutiveDoubles: 0, forcedBalanceGroupId: null, pendingBalanceResolveAction: null, pendingBusChoice: false, pendingBusBaseMove: undefined, pendingBusExtraMove: false },
status: "LOBBY", hostId: socket.id, settings: fs, engine: createEngine(fs.mode), createdAt: Date.now(),
board: bb.map((c, idx) => ({ ...c, position: idx, ownerId: undefined, houses: 0, isMortgaged: false })),
pendingContracts: [], busTicketsDeck: 100,
cardDeck: { chance: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], chest: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15] },
turnTimer: undefined, phaseTimer: undefined, auctionTimer: undefined,
roomPieces: {}
};
rooms.set(rid, r); socket.join(rid);
socket.emit("room_created", getSafeRoom(r)); io.to(rid).emit("state_update", r.gameState);
});

socket.on("join_room", (rid: string) => {
const r = rooms.get(rid);
if (!r) return socket.emit("join_error", "Not found");
const ex = r.players.find(p => p.userId === socket.data.userId);
if (ex) { ex.socketId = socket.id; ex.isOnline = true; socket.join(rid); socket.emit("room_joined", getSafeRoom(r)); socket.emit("state_update", r.gameState); io.to(rid).emit("room_updated", getSafeRoom(r)); return; }
if (r.status === "PLAYING") return socket.emit("join_error", "Started");
if (r.players.length >= r.settings.maxPlayers) return socket.emit("join_error", "Full");
r.players.push({ userId: socket.data.userId, socketId: socket.id, displayName: socket.data.profile.displayName, avatarUrl: socket.data.profile.avatarUrl, isOnline: true });
r.gameState.players.push({ userId: socket.data.userId, position: 0, money: 2500, isBankrupt: false, busTickets: 0 });
socket.join(rid); socket.emit("room_joined", getSafeRoom(r)); io.to(rid).emit("room_updated", getSafeRoom(r)); io.to(rid).emit("state_update", r.gameState);
if (r.roomPieces && Object.keys(r.roomPieces).length > 0) {
  socket.emit("room_pieces", r.roomPieces);
}
});

socket.on("leave_room", () => {
const e = Array.from(rooms.entries()).find(([, r]) => r.players.some(p => p.userId === socket.data.userId));
if (!e) return;
const [rid, r] = e;
if (r.status === "LOBBY") handlePlayerRemoval(rid, socket.data.userId);
else {
const ps = r.gameState.players.find(p => p.userId === socket.data.userId);
if (ps) { ps.isBankrupt = true; ps.money = 0; const rp = r.players.find(p => p.userId === socket.data.userId); if (rp) rp.isOnline = false;
if (r.gameState.players.filter(p => !p.isBankrupt).length <= 1) finishGame(rid);
else if (r.gameState.players[r.gameState.currentPlayerIndex].userId === socket.data.userId) endCurrentPlayerTurn(rid);
else { io.to(rid).emit("state_update", r.gameState); io.to(rid).emit("room_updated", getSafeRoom(r)); }
}
}
socket.emit("left_room_success");
});

socket.on("start_game", () => {
const r = Array.from(rooms.values()).find(rm => rm.players.some(p => p.socketId === socket.id));
if (!r || r.hostId !== socket.id || r.gameState.players.length < 2) return;
r.status = "PLAYING";

// Рандомизация порядка игроков
const shuffled = [...r.gameState.players];
for (let i = shuffled.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
}
r.gameState.players = shuffled;

// Синхронизировать порядок RoomPlayer с gameState (для правильных цветов)
r.players = shuffled.map(sp =>
  r.players.find(rp => rp.userId === sp.userId)!
).filter(Boolean);

r.gameState.currentPlayerIndex = 0; r.gameState.currentPhase = "ACTIONS"; r.gameState.activeAction = { type: "ROLL" }; r.gameState.contractsUsedThisTurn = 0; r.gameState.pendingMrEffect = false; r.gameState.thisRollWasDoubles = false; r.gameState.consecutiveDoubles = 0; r.gameState.forcedBalanceGroupId = null; r.gameState.pendingBalanceResolveAction = null; r.gameState.pendingBusChoice = false; r.gameState.pendingBusBaseMove = undefined; r.gameState.pendingBusExtraMove = false;
startPhaseTimer(r.id, "ACTIONS"); io.to(r.id).emit("game_started", r.gameState);
});

socket.on("roll_dice", () => {
const r = Array.from(rooms.values()).find(rm => rm.players.some(p => p.socketId === socket.id));
if (!r || r.status !== "PLAYING") return;
const gs = r.gameState; const c = gs.players[gs.currentPlayerIndex];
if (c.userId !== socket.data.userId) return;
if (r.phaseTimer) clearTimeout(r.phaseTimer);

if (c.inJail) {
const d1 = rollDie();
const d2 = rollDie();
const isDoubles = d1 === d2;
io.to(r.id).emit("dice_rolled", { result: `${d1}:${d2}` });
if (isDoubles) {
c.inJail = false; c.jailTurns = 0;
const dist = d1 + d2;
const res = r.engine.calculateMove(c.position, dist);
c.position = res.newPosition; c.money += res.moneyChange;
gs.thisRollWasDoubles = false;
if (checkBankruptcy(c)) { handleBankruptcy(r.id, c.userId, "UNABLE_TO_PAY"); return; }
startPhaseTimer(r.id, "POST_MOVE");
} else {
c.jailTurns = (c.jailTurns || 0) + 1;
const pName = r.players.find(p => p.userId === c.userId)?.displayName || 'Игрок';
io.to(r.id).emit("game_log", { text: `${pName} не выбросил дубль. Остаётся в тюрьме (ход ${c.jailTurns}/3).`, isSystem: true });
if (c.jailTurns >= 3) {
if (c.money >= 50) {
c.money -= 50;
io.to(r.id).emit("game_log", { text: `${pName} принудительно платит $50 за тюрьму.`, isSystem: true });
const dist = d1 + d2;
const res = r.engine.calculateMove(c.position, dist);
c.position = res.newPosition; c.money += res.moneyChange;
c.inJail = false; c.jailTurns = 0;
gs.thisRollWasDoubles = false;
if (checkBankruptcy(c)) { handleBankruptcy(r.id, c.userId, "UNABLE_TO_PAY"); return; }
startPhaseTimer(r.id, "POST_MOVE");
} else {
handleBankruptcy(r.id, c.userId, "UNABLE_TO_PAY");
}
} else {
nextTurn(r.id);
}
}
io.to(r.id).emit("state_update", r.gameState);
io.to(r.id).emit("room_updated", getSafeRoom(r));
return;
}

if (gs.currentPhase !== "ACTIONS") return;
if (gs.forcedBalanceGroupId) return socket.emit("roll_blocked", "Сначала выровняйте застройку!");

const dice = rollThreeDice();
const whiteSum = dice.white1 + dice.white2;
const speedStr = typeof dice.speed === "number" ? dice.speed.toString() : dice.speed;
io.to(r.id).emit("dice_rolled", { result: `${dice.white1}:${dice.white2}:${speedStr}` });
const isDoubles = dice.white1 === dice.white2;
const isTriple = typeof dice.speed === "number" && isDoubles && dice.white1 === dice.speed;

if (isTriple) {
gs.thisRollWasDoubles = false;
gs.consecutiveDoubles = 0;
gs.activeAction = { type: "TRIPLE_CHOICE" };
gs.lastDiceSum = 0; gs.effectiveDiceSum = 0;
if (r.phaseTimer) clearTimeout(r.phaseTimer);
r.phaseTimer = setTimeout(() => handleBankruptcy(r.id, c.userId, "PHASE3_TIMEOUT"), TURN_TIME_MS);
io.to(r.id).emit("state_update", r.gameState); io.to(r.id).emit("room_updated", getSafeRoom(r));
return;
}

const speedValue = typeof dice.speed === "number" ? dice.speed : 0;
const moveAmount = whiteSum + speedValue;

if (dice.speed === "BUS") {
gs.pendingBusBaseMove = moveAmount;
gs.pendingBusChoice = true;
gs.thisRollWasDoubles = false;

gs.activeAction = {
type: "CHOOSE_BUS_ACTION",
data: { ticketsAvailable: r.busTicketsDeck > 0 }
};

if (r.phaseTimer) clearTimeout(r.phaseTimer);
r.phaseTimer = setTimeout(() => handleBankruptcy(r.id, c.userId, "PHASE3_TIMEOUT"), TURN_TIME_MS);

io.to(r.id).emit("state_update", r.gameState);
io.to(r.id).emit("room_updated", getSafeRoom(r));
return;
}

const res = r.engine.calculateMove(c.position, moveAmount);
c.position = res.newPosition; c.money += res.moneyChange;
if (checkBankruptcy(c)) { handleBankruptcy(r.id, c.userId, "UNABLE_TO_PAY"); return; }

if (dice.speed === "MR") {
gs.pendingMrEffect = true;
gs.thisRollWasDoubles = isDoubles;
}
else {
gs.thisRollWasDoubles = isDoubles;
}
gs.lastDiceSum = moveAmount; gs.effectiveDiceSum = moveAmount;
startPhaseTimer(r.id, "POST_MOVE");
io.to(r.id).emit("state_update", r.gameState); io.to(r.id).emit("room_updated", getSafeRoom(r));
});

socket.on("pay_jail_fine", () => {
const r = Array.from(rooms.values()).find(rm => rm.players.some(p => p.socketId === socket.id));
if (!r || r.status !== "PLAYING") return;
const c = r.gameState.players[r.gameState.currentPlayerIndex];
if (c.userId !== socket.data.userId || !c.inJail) return;
if (c.money < 50) return socket.emit("error", "Недостаточно денег.");
c.money -= 50;
c.inJail = false;
c.jailTurns = 0;
const pName = r.players.find(p => p.userId === c.userId)?.displayName || 'Игрок';
io.to(r.id).emit("game_log", { text: `${pName} заплатил $50 и вышел из тюрьмы.`, isSystem: true });
startPhaseTimer(r.id, "ACTIONS");
});

socket.on("use_bus_ticket", () => {
const r = Array.from(rooms.values()).find(rm => rm.players.some(p => p.socketId === socket.id));
if (!r || r.status !== "PLAYING") return;
const c = r.gameState.players[r.gameState.currentPlayerIndex];
if (c.userId !== socket.data.userId || r.gameState.currentPhase !== "ACTIONS" || (c.busTickets || 0) <= 0 || c.inJail) return;
if (r.gameState.forcedBalanceGroupId) return socket.emit("roll_blocked", "Сначала выровняйте застройку!");
if (r.phaseTimer) clearTimeout(r.phaseTimer); c.busTickets--; r.gameState.activeAction = { type: "TICKET_MOVE" };
io.to(r.id).emit("state_update", r.gameState); io.to(r.id).emit("room_updated", getSafeRoom(r));
});

socket.on("ticket_move", ({ position }: { position: number }) => {
const r = Array.from(rooms.values()).find(rm => rm.players.some(p => p.socketId === socket.id));
if (!r || r.status !== "PLAYING") return;
const c = r.gameState.players[r.gameState.currentPlayerIndex];
if (c.userId !== socket.data.userId || r.gameState.activeAction?.type !== "TICKET_MOVE") return;
const valid = getValidTicketTargets(c.position, r.board.length);
if (!valid.includes(position)) return;
const distance = (position - c.position + r.board.length) % r.board.length;
const res = r.engine.calculateMove(c.position, distance);
c.position = res.newPosition; c.money += res.moneyChange; r.gameState.effectiveDiceSum = distance;
if (checkBankruptcy(c)) { handleBankruptcy(r.id, c.userId, "UNABLE_TO_PAY"); return; }
if (r.phaseTimer) clearTimeout(r.phaseTimer); r.gameState.activeAction = null;
startPhaseTimer(r.id, "POST_MOVE"); io.to(r.id).emit("state_update", r.gameState); io.to(r.id).emit("room_updated", getSafeRoom(r));
});

socket.on("triple_move", ({ position }: { position: number }) => {
const r = Array.from(rooms.values()).find(rm => rm.players.some(p => p.socketId === socket.id));
if (!r || r.status !== "PLAYING") return;
const c = r.gameState.players[r.gameState.currentPlayerIndex];
if (c.userId !== socket.data.userId || r.gameState.activeAction?.type !== "TRIPLE_CHOICE") return;
if (r.phaseTimer) clearTimeout(r.phaseTimer);
const distance = (position - c.position + r.board.length) % r.board.length;
const res = r.engine.calculateMove(c.position, distance);
c.position = res.newPosition; c.money += res.moneyChange;
r.gameState.effectiveDiceSum = distance;
r.gameState.activeAction = null;
if (checkBankruptcy(c)) { handleBankruptcy(r.id, c.userId, "UNABLE_TO_PAY"); return; }
io.to(r.id).emit("state_update", r.gameState); io.to(r.id).emit("room_updated", getSafeRoom(r));
startPhaseTimer(r.id, "POST_MOVE");
});

socket.on("buy_property", ({ position }: { position: number }) => {
const r = Array.from(rooms.values()).find(rm => rm.players.some(p => p.socketId === socket.id));
if (!r || r.status !== "PLAYING") return;
const c = r.gameState.players[r.gameState.currentPlayerIndex];
if (c.userId !== socket.data.userId || r.gameState.currentPhase !== "POST_MOVE" || r.gameState.activeAction?.type !== "BUY") return;
const cell = r.board[position];
if (cell.position !== c.position || cell.ownerId || !cell.price || c.money < cell.price || cell.isMortgaged) return;
c.money -= cell.price; cell.ownerId = c.userId;
const balanceGroup = checkForcedBalance(r.board, c.userId);
if (balanceGroup) {
r.gameState.forcedBalanceGroupId = balanceGroup;
r.gameState.pendingBalanceResolveAction = r.gameState.pendingMrEffect ? 'MR' : (r.gameState.pendingBusExtraMove ? 'BUS' : 'END_TURN');
r.gameState.currentPhase = 'ACTIONS';
r.gameState.activeAction = null;
} else {
if (r.phaseTimer) clearTimeout(r.phaseTimer);
applyPendingSecondMove(r.id);
}
io.to(r.id).emit("state_update", r.gameState); io.to(r.id).emit("room_updated", getSafeRoom(r));
});

socket.on("pay_debt", ({ amount, targetUserId }: { amount: number; targetUserId?: string }) => {
const r = Array.from(rooms.values()).find(rm => rm.players.some(p => p.socketId === socket.id));
if (!r || r.status !== "PLAYING") return;
const c = r.gameState.players[r.gameState.currentPlayerIndex];
if (c.userId !== socket.data.userId || r.gameState.currentPhase !== "POST_MOVE" || r.gameState.activeAction?.type !== "PAY") return;
if (c.money < amount) return;
if (r.phaseTimer) clearTimeout(r.phaseTimer);
c.money -= amount;
if (targetUserId) { const cr = r.gameState.players.find(p => p.userId === targetUserId); if (cr) cr.money += amount; }
r.gameState.activeAction = null;
io.to(r.id).emit("state_update", r.gameState); io.to(r.id).emit("room_updated", getSafeRoom(r));
if (r.gameState.pendingMrEffect || r.gameState.pendingBusExtraMove) {
applyPendingSecondMove(r.id);
} else {
endCurrentPlayerTurn(r.id);
}
});

socket.on("skip_action", () => {
const r = Array.from(rooms.values()).find(rm => rm.players.some(p => p.socketId === socket.id));
if (!r || r.status !== "PLAYING" || r.gameState.currentPhase !== "POST_MOVE") return;
const c = r.gameState.players[r.gameState.currentPlayerIndex];
if (c.userId !== socket.data.userId) return;
if (r.gameState.activeAction?.type === "BUY") {
startAuction(r, c.position, false, io);
return;
}
if (r.phaseTimer) clearTimeout(r.phaseTimer);
r.gameState.activeAction = null;
io.to(r.id).emit("state_update", r.gameState); io.to(r.id).emit("room_updated", getSafeRoom(r));
if (r.gameState.pendingMrEffect || r.gameState.pendingBusExtraMove) {
applyPendingSecondMove(r.id);
} else {
endCurrentPlayerTurn(r.id);
}
});

socket.on("choose_auction_target", ({ position }: { position: number }) => {
const r = Array.from(rooms.values()).find(rm => rm.players.some(p => p.socketId === socket.id));
if (!r || r.status !== "PLAYING") return;
const c = r.gameState.players[r.gameState.currentPlayerIndex];
if (c.userId !== socket.data.userId || r.gameState.activeAction?.type !== "CHOOSE_AUCTION") return;
const target = r.board[position];
if (!target || !["PROPERTY", "STATION", "UTILITY"].includes(target.type) || target.ownerId !== undefined) {
return socket.emit("auction_error", "Выберите свободную собственность.");
}
if (r.phaseTimer) clearTimeout(r.phaseTimer);
startAuction(r, position, true, io);
});

socket.on("choose_birthday_gift", ({ choice }: { choice: "money" | "ticket" }) => {
const r = Array.from(rooms.values()).find(rm => rm.players.some(p => p.socketId === socket.id));
if (!r || r.status !== "PLAYING") return;
const c = r.gameState.players[r.gameState.currentPlayerIndex];
const pName = r.players.find(p => p.userId === c.userId)?.displayName || 'Игрок';
if (c.userId !== socket.data.userId || r.gameState.activeAction?.type !== "CHOOSE_BIRTHDAY") return;
if (r.phaseTimer) clearTimeout(r.phaseTimer);
if (choice === "ticket") {
if (r.busTicketsDeck <= 0) {
socket.emit("error", "Билетов больше нет.");
r.gameState.activeAction = null; endCurrentPlayerTurn(r.id);
io.to(r.id).emit("state_update", r.gameState); io.to(r.id).emit("room_updated", getSafeRoom(r)); return;
}
c.busTickets++; r.busTicketsDeck--;
io.to(r.id).emit("game_log", { text: `${pName} взял билет на автобус! (Осталось: ${r.busTicketsDeck})`, isSystem: true });
} else {
c.money += 100;
io.to(r.id).emit("game_log", { text: `${pName} получил $100 от банка!`, isSystem: true });
}
r.gameState.activeAction = null;
endCurrentPlayerTurn(r.id);
io.to(r.id).emit("state_update", r.gameState); io.to(r.id).emit("room_updated", getSafeRoom(r));
});

socket.on("choose_bus_action", ({ choice }: { choice: "ticket" | "move" }) => {
const r = Array.from(rooms.values()).find(rm => rm.players.some(p => p.socketId === socket.id));
if (!r || r.status !== "PLAYING") return;
const c = r.gameState.players[r.gameState.currentPlayerIndex];
const pName = r.players.find(p => p.userId === c.userId)?.displayName || 'Игрок';
if (c.userId !== socket.data.userId || r.gameState.activeAction?.type !== "CHOOSE_BUS_ACTION") return;
if (r.phaseTimer) clearTimeout(r.phaseTimer);

if (choice === "ticket") {
if (r.busTicketsDeck <= 0) {
socket.emit("error", "Билетов больше нет. Перемещаемся на Шанс/Сундук.");
choice = "move";
} else {
c.busTickets = (c.busTickets || 0) + 1;
r.busTicketsDeck--;
io.to(r.id).emit("game_log", { text: `${pName} взял билет на автобус! (Осталось: ${r.busTicketsDeck})`, isSystem: true });
}
}

const baseMove = r.gameState.pendingBusBaseMove ?? 0;
r.gameState.pendingBusBaseMove = undefined;
r.gameState.pendingBusChoice = false;

const res = r.engine.calculateMove(c.position, baseMove);
c.position = res.newPosition;
c.money += res.moneyChange;
r.gameState.effectiveDiceSum = baseMove;

if (checkBankruptcy(c)) { handleBankruptcy(r.id, c.userId, "UNABLE_TO_PAY"); return; }

if (choice === "move") {
r.gameState.pendingBusExtraMove = true;
}

startPhaseTimer(r.id, "POST_MOVE");
io.to(r.id).emit("state_update", r.gameState);
io.to(r.id).emit("room_updated", getSafeRoom(r));
});

socket.on("auction_bid", () => {
const r = Array.from(rooms.values()).find(rm => rm.players.some(p => p.socketId === socket.id));
if (!r || r.status !== "PLAYING") return;
handleBid(r, socket.data.userId, io);
});

socket.on("auction_drop", () => {
const r = Array.from(rooms.values()).find(rm => rm.players.some(p => p.socketId === socket.id));
if (!r || r.status !== "PLAYING") return;
handleDrop(r, socket.data.userId, io);
});

socket.on("build_building", ({ position, targetHouses }: { position: number; targetHouses: number }) => {
const r = Array.from(rooms.values()).find(rm => rm.players.some(p => p.socketId === socket.id));
if (!r || r.status !== "PLAYING") return;
const c = r.gameState.players[r.gameState.currentPlayerIndex];
if (c.userId !== socket.data.userId || r.gameState.currentPhase !== "ACTIONS") return;
const cell = r.board[position];
if (cell.ownerId !== c.userId || cell.isMortgaged) return;
const groupKey = getGroupKey(cell);
const isForcedBalancing = r.gameState.forcedBalanceGroupId === cell.group;
if (!isForcedBalancing) {
if (r.gameState.buildLimitsThisTurn?.[groupKey]) return socket.emit("build_error", "Лимит группы за ход");
const buildInfo = canBuildOnGroup(r.board, c.userId, cell.group || '');
if (!buildInfo.canBuild) return socket.emit("build_error", buildInfo.reason);
const currentHouses = cell.houses || 0;
if (targetHouses <= currentHouses || targetHouses > buildInfo.maxHouses) return socket.emit("build_error", "Неверное количество домов");
} else {
const ownedInGroup = r.board.filter(b => b.group === cell.group && b.ownerId === c.userId);
const maxInGroup = Math.max(...ownedInGroup.map(b => b.houses || 0));
if (targetHouses > maxInGroup) return socket.emit("build_error", "При выравнивании нельзя превышать текущий максимум в группе");
}
if (targetHouses === 6) {
const groupSkyscrapers = r.board.filter(b => b.group === cell.group && b.type === 'PROPERTY' && b.ownerId === c.userId && (b.houses || 0) === 6 && b.position !== position).length;
if (groupSkyscrapers > 0) return socket.emit("build_error", "Только один небоскрёб на группу");
}
const cost = getBuildingCost(cell, targetHouses);
if (c.money < cost) return socket.emit("build_error", "Недостаточно денег");
c.money -= cost; cell.houses = targetHouses;
if (!isForcedBalancing) r.gameState.buildLimitsThisTurn = { ...r.gameState.buildLimitsThisTurn, [groupKey]: true };
const balanceGroup = checkForcedBalance(r.board, c.userId);
if (!balanceGroup && r.gameState.forcedBalanceGroupId) {
r.gameState.forcedBalanceGroupId = null;
const action = r.gameState.pendingBalanceResolveAction;
r.gameState.pendingBalanceResolveAction = null;
if (action === 'MR') performMrMonopolyEffect(r.id);
else if (action === 'BUS') applyPendingSecondMove(r.id);
else if (action === 'END_TURN') endCurrentPlayerTurn(r.id);
} else {
r.gameState.forcedBalanceGroupId = balanceGroup;
}
io.to(r.id).emit("state_update", r.gameState); io.to(r.id).emit("room_updated", getSafeRoom(r));
});

socket.on("sell_building", ({ position, housesToSell }: { position: number; housesToSell: number }) => {
const r = Array.from(rooms.values()).find(rm => rm.players.some(p => p.socketId === socket.id));
if (!r || r.status !== "PLAYING") return;
const c = r.gameState.players[r.gameState.currentPlayerIndex];
const isDebtRelief = r.gameState.currentPhase === "POST_MOVE" && r.gameState.activeAction?.type === "PAY";
if (c.userId !== socket.data.userId || (r.gameState.currentPhase !== "ACTIONS" && !isDebtRelief)) return;
const cell = r.board[position];
if (cell.ownerId !== c.userId || cell.isMortgaged) return;
const currentHouses = cell.houses || 0;
if (housesToSell <= 0 || housesToSell > currentHouses) return socket.emit("sell_error", "Неверное количество");
const refund = getSellValue(cell, housesToSell);
c.money += refund; cell.houses = currentHouses - housesToSell;
const balanceGroup = checkForcedBalance(r.board, c.userId);
if (!balanceGroup && r.gameState.forcedBalanceGroupId) {
r.gameState.forcedBalanceGroupId = null;
const action = r.gameState.pendingBalanceResolveAction;
r.gameState.pendingBalanceResolveAction = null;
if (action === 'MR') performMrMonopolyEffect(r.id);
else if (action === 'BUS') applyPendingSecondMove(r.id);
else if (action === 'END_TURN') endCurrentPlayerTurn(r.id);
} else {
r.gameState.forcedBalanceGroupId = balanceGroup;
}
io.to(r.id).emit("state_update", r.gameState); io.to(r.id).emit("room_updated", getSafeRoom(r));
});

socket.on("toggle_depot", ({ position }: { position: number }) => {
const r = Array.from(rooms.values()).find(rm => rm.players.some(p => p.socketId === socket.id));
if (!r || r.status !== "PLAYING") return;
const c = r.gameState.players[r.gameState.currentPlayerIndex];
const isDebtRelief = r.gameState.currentPhase === "POST_MOVE" && r.gameState.activeAction?.type === "PAY";
if (c.userId !== socket.data.userId || (r.gameState.currentPhase !== "ACTIONS" && !isDebtRelief)) return;
const cell = r.board[position];
if (cell.type !== 'STATION' || cell.ownerId !== c.userId || cell.isMortgaged) return;
const groupKey = getGroupKey(cell);
const isForcedBalancing = r.gameState.forcedBalanceGroupId === 'station';
if (cell.hasDepot) { c.money += 50; cell.hasDepot = false; }
else {
if (!isForcedBalancing && r.gameState.buildLimitsThisTurn?.[groupKey]) return socket.emit("build_error", "Лимит группы за ход");
if (c.money < 100) return socket.emit("build_error", "Недостаточно денег");
c.money -= 100; cell.hasDepot = true;
if (!isForcedBalancing) r.gameState.buildLimitsThisTurn = { ...r.gameState.buildLimitsThisTurn, [groupKey]: true };
}
io.to(r.id).emit("state_update", r.gameState); io.to(r.id).emit("room_updated", getSafeRoom(r));
});

socket.on("mortgage_property", ({ position }: { position: number }) => {
const r = Array.from(rooms.values()).find(rm => rm.players.some(p => p.socketId === socket.id));
if (!r || r.status !== "PLAYING") return;
const c = r.gameState.players[r.gameState.currentPlayerIndex];
const isDebtRelief = r.gameState.currentPhase === "POST_MOVE" && r.gameState.activeAction?.type === "PAY";
if (c.userId !== socket.data.userId || (r.gameState.currentPhase !== "ACTIONS" && !isDebtRelief)) return;
const cell = r.board[position];
if (cell.ownerId !== c.userId || cell.isMortgaged || cell.hasDepot) return;
if (cell.type === 'PROPERTY' && (cell.houses || 0) > 0 && r.gameState.forcedBalanceGroupId !== cell.group) return socket.emit("mortgage_error", "Сначала продайте дома");
if (cell.group && r.gameState.forcedBalanceGroupId !== cell.group) {
const anyHasHouses = r.board.some(b => b.group === cell.group && b.type === 'PROPERTY' && b.ownerId === c.userId && (b.houses || 0) > 0);
if (anyHasHouses) return socket.emit("mortgage_error", "Нельзя заложить: в группе есть постройки");
}
const mortgageValue = Math.floor((cell.price || 0) * 0.5);
c.money += mortgageValue; cell.isMortgaged = true; cell.mortgageTurnsRemaining = MORTGAGE_TURNS_LIMIT;
const balanceGroup = checkForcedBalance(r.board, c.userId);
if (!balanceGroup && r.gameState.forcedBalanceGroupId) {
r.gameState.forcedBalanceGroupId = null;
const action = r.gameState.pendingBalanceResolveAction;
r.gameState.pendingBalanceResolveAction = null;
if (action === 'MR') performMrMonopolyEffect(r.id);
else if (action === 'BUS') applyPendingSecondMove(r.id);
else if (action === 'END_TURN') endCurrentPlayerTurn(r.id);
} else {
r.gameState.forcedBalanceGroupId = balanceGroup;
}
io.to(r.id).emit("state_update", r.gameState); io.to(r.id).emit("room_updated", getSafeRoom(r));
});

socket.on("unmortgage_property", ({ position }: { position: number }) => {
const r = Array.from(rooms.values()).find(rm => rm.players.some(p => p.socketId === socket.id));
if (!r || r.status !== "PLAYING") return;
const c = r.gameState.players[r.gameState.currentPlayerIndex];
const isDebtRelief = r.gameState.currentPhase === "POST_MOVE" && r.gameState.activeAction?.type === "PAY";
if (c.userId !== socket.data.userId || (r.gameState.currentPhase !== "ACTIONS" && !isDebtRelief)) return;
const cell = r.board[position];
if (cell.ownerId !== c.userId || !cell.isMortgaged) return;
const unmortgageCost = Math.floor((cell.price || 0) * 0.6);
if (c.money < unmortgageCost) return socket.emit("unmortgage_error", "Недостаточно денег");
c.money -= unmortgageCost; cell.isMortgaged = false; cell.mortgageTurnsRemaining = undefined;
const balanceGroup = checkForcedBalance(r.board, c.userId);
if (!balanceGroup && r.gameState.forcedBalanceGroupId) {
r.gameState.forcedBalanceGroupId = null;
const action = r.gameState.pendingBalanceResolveAction;
r.gameState.pendingBalanceResolveAction = null;
if (action === 'MR') performMrMonopolyEffect(r.id);
else if (action === 'BUS') applyPendingSecondMove(r.id);
else if (action === 'END_TURN') endCurrentPlayerTurn(r.id);
} else {
r.gameState.forcedBalanceGroupId = balanceGroup;
}
io.to(r.id).emit("state_update", r.gameState); io.to(r.id).emit("room_updated", getSafeRoom(r));
});

socket.on("propose_contract", (payload: { targetUserId: string; offeredMoney: number; offeredProperties: number[]; requestedMoney: number; requestedProperties: number[]; }) => {
const r = Array.from(rooms.values()).find(rm => rm.players.some(p => p.socketId === socket.id));
if (!r || r.status !== "PLAYING") return;
const c = r.gameState.players[r.gameState.currentPlayerIndex];
const isDebtRelief = r.gameState.currentPhase === "POST_MOVE" && r.gameState.activeAction?.type === "PAY";
if (c.userId !== socket.data.userId || (r.gameState.currentPhase !== "ACTIONS" && !isDebtRelief)) return;
if (r.pendingContracts.length > 0) return socket.emit("contract_error", "Есть активный контракт");
if (r.gameState.contractsUsedThisTurn >= MAX_CONTRACTS_PER_TURN) return socket.emit("contract_error", "Лимит контрактов");
for (const p of payload.offeredProperties) { const cell = r.board[p]; if (!cell || cell.ownerId !== c.userId || !isPropertyTradable(cell)) return socket.emit("contract_error", "Недопустимое имущество"); }
for (const p of payload.requestedProperties) { const cell = r.board[p]; if (!cell || cell.ownerId !== payload.targetUserId || !isPropertyTradable(cell)) return socket.emit("contract_error", "Цель не владеет имуществом"); }
const targetPlayer = r.gameState.players.find(p => p.userId === payload.targetUserId);
if (!targetPlayer) return socket.emit("contract_error", "Цель не найдена");
if (payload.requestedMoney > targetPlayer.money) return socket.emit("contract_error", "Недостаточно денег у цели");
const remaining = Math.max(0, TURN_TIME_MS - (Date.now() - (r.gameState.turnStartTime || Date.now())));
r.pausedTurnRemaining = remaining; r.gameState.isPaused = true;
if (r.phaseTimer) clearTimeout(r.phaseTimer);
io.to(r.id).emit("state_update", r.gameState);
const cid = uuidv4();
const prop: ContractProposal = { id: cid, proposerId: c.userId, targetId: payload.targetUserId, offeredMoney: payload.offeredMoney, offeredProperties: payload.offeredProperties, requestedMoney: payload.requestedMoney, requestedProperties: payload.requestedProperties, createdAt: Date.now() };
r.pendingContracts.push(prop); r.gameState.contractsUsedThisTurn++;
setTimeout(() => { const i = r.pendingContracts.findIndex(c => c.id === cid); if (i !== -1) { r.pendingContracts.splice(i, 1); io.to(r.id).emit("contract_expired", { contractId: cid }); resumeTurnTimer(r); } }, CONTRACT_RESPONSE_MS);
io.to(r.id).emit("contract_proposed", { contractId: cid, proposerId: c.userId, targetId: payload.targetUserId, offeredMoney: payload.offeredMoney, offeredProperties: payload.offeredProperties, requestedMoney: payload.requestedMoney, requestedProperties: payload.requestedProperties });
io.to(r.id).emit("room_updated", getSafeRoom(r));
});

socket.on("respond_contract", ({ contractId, accept }: { contractId: string; accept: boolean }) => {
const r = Array.from(rooms.values()).find(rm => rm.players.some(p => p.socketId === socket.id));
if (!r || r.status !== "PLAYING") return;
const ci = r.pendingContracts.findIndex(c => c.id === contractId);
if (ci === -1) return;
const c = r.pendingContracts[ci];
if (socket.data.userId !== c.targetId) return;
if (accept) {
const pr = r.gameState.players.find(p => p.userId === c.proposerId);
const tg = r.gameState.players.find(p => p.userId === c.targetId);
if (pr && tg) {
pr.money = pr.money - c.offeredMoney + c.requestedMoney;
tg.money = tg.money + c.offeredMoney - c.requestedMoney;
for (const p of c.offeredProperties) if (r.board[p]) r.board[p].ownerId = c.targetId;
for (const p of c.requestedProperties) if (r.board[p]) r.board[p].ownerId = c.proposerId;
}
r.gameState.forcedBalanceGroupId = checkForcedBalance(r.board, r.gameState.players[r.gameState.currentPlayerIndex].userId);
if (r.gameState.forcedBalanceGroupId) {
r.gameState.pendingBalanceResolveAction = 'END_TURN';
r.gameState.currentPhase = 'ACTIONS';
}
}
r.pendingContracts.splice(ci, 1); resumeTurnTimer(r);
io.to(r.id).emit("contract_resolved", { contractId, accepted: accept });
io.to(r.id).emit("state_update", r.gameState); io.to(r.id).emit("room_updated", getSafeRoom(r));
});

socket.on("finish_game", () => { const r = Array.from(rooms.values()).find(rm => rm.players.some(p => p.socketId === socket.id)); if (r && r.hostId === socket.id) finishGame(r.id); });

socket.on("surrender", () => {
  const r = Array.from(rooms.values()).find(rm => rm.players.some(p => p.socketId === socket.id));
  if (!r || r.status !== "PLAYING") return;
  const userId = socket.data.userId;
  const ps = r.gameState.players.find(p => p.userId === userId);
  if (!ps || ps.isBankrupt) return;
  const gs = r.gameState;
  // При сдаче во время долга за ренту — передать деньги кредитору
  if (gs.currentPhase === "POST_MOVE" && gs.activeAction?.type === "PAY" && gs.activeAction.data?.targetUserId) {
    const creditorId = gs.activeAction.data.targetUserId;
    const debtAmount = gs.activeAction.data.amount || 0;
    handleBankruptcy(r.id, userId, "SURRENDER", creditorId, debtAmount);
  } else {
    handleBankruptcy(r.id, userId, "SURRENDER");
  }
});

socket.on("disconnect", () => { for (const [rid, r] of rooms.entries()) { const p = r.players.find(pl => pl.socketId === socket.id); if (p) { p.isOnline = false; io.to(rid).emit("room_updated", getSafeRoom(r)); break; } } });

socket.on("select_piece", ({ piece }: { piece: string }) => {
  const r = Array.from(rooms.values()).find(rm =>
    rm.players.some(p => p.socketId === socket.id)
  );
  if (!r || r.status !== "LOBBY") return;
  if (!r.roomPieces) r.roomPieces = {};
  r.roomPieces[socket.data.userId] = piece;
  io.to(r.id).emit("piece_selected", { userId: socket.data.userId, piece });
});
});

server.listen(3000, () => console.log("Server started on 3000"));