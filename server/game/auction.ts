import { Server } from "socket.io";
import { Room } from "./types";
import { getSafeRoom, resumeTurnTimer, endCurrentPlayerTurn, TURN_TIME_MS } from "../index";

export function startAuction(room: Room, cellPosition: number, includeInitiator: boolean, io: Server) {
  const cell = room.board[cellPosition];
  if (!cell || !["PROPERTY", "STATION", "UTILITY"].includes(cell.type) || cell.ownerId !== undefined) {
    return io.to(room.id).emit("auction_error", "Невозможно начать аукцион для этой клетки.");
  }

  const basePrice = cell.price || 0;
  const activePlayers = room.gameState.players.filter(p => !p.isBankrupt);
  if (activePlayers.length < 2) {
    return io.to(room.id).emit("auction_error", "Нужно минимум 2 активных игрока.");
  }

  const initiatorId = room.gameState.players[room.gameState.currentPlayerIndex].userId;
  const allActiveIds = activePlayers.map(p => p.userId);
  const initiatorIdx = allActiveIds.indexOf(initiatorId);

  let queue: string[];
  if (includeInitiator) {
    queue = [...allActiveIds];
  } else {
    queue = [...allActiveIds.slice(initiatorIdx + 1), ...allActiveIds.slice(0, initiatorIdx)];
  }

  if (queue.length === 0) {
    io.to(room.id).emit("auction_message", { message: "Аукцион отменен: нет участников." });
    endAuction(room, io, false);
    return;
  }

  room.gameState.auctionState = {
    isAuction: true,
    cellPosition,
    basePrice,
    currentBid: basePrice,
    queue,
    currentIdx: 0,
    hasIncreasedBid: {},
    lastBidderId: undefined,
    deadline: Date.now() + 10000,
  };

  const remaining = room.gameState.turnStartTime
    ? Math.max(0, TURN_TIME_MS - (Date.now() - room.gameState.turnStartTime))
    : TURN_TIME_MS;
  room.pausedTurnRemaining = remaining;
  room.gameState.isPaused = true;
  if (room.phaseTimer) clearTimeout(room.phaseTimer);

  io.to(room.id).emit("auction_started", {
    cellPosition, basePrice, currentBid: basePrice, queue,
    currentBidderId: queue[0], deadline: room.gameState.auctionState.deadline,
  });
  io.to(room.id).emit("state_update", room.gameState);
  io.to(room.id).emit("room_updated", getSafeRoom(room));

  setupAuctionTimer(room, io);
}

export function handleBid(room: Room, userId: string, io: Server) {
  const state = room.gameState.auctionState;
  if (!state || state.queue[0] !== userId) return;

  const player = room.gameState.players.find(p => p.userId === userId);
  if (!player || player.money < state.currentBid + 10) {
    return io.to(userId).emit("auction_error", "Недостаточно денег.");
  }

  state.currentBid += 10;
  state.hasIncreasedBid[userId] = true;
  state.lastBidderId = userId;
  state.deadline = Date.now() + 10000;

  // Если это последний участник и он повысил ставку -> мгновенная победа
  if (state.queue.length === 1) {
    resolveAuction(room, io);
    return;
  }

  io.to(room.id).emit("auction_update", { currentBid: state.currentBid, deadline: state.deadline });
  nextAuctionTurn(room, io);
}

export function handleDrop(room: Room, userId: string, io: Server) {
  const state = room.gameState.auctionState;
  if (!state) return;
  if (room.auctionTimer) clearTimeout(room.auctionTimer);

  const idx = state.queue.indexOf(userId);
  if (idx === -1) return;

  state.queue.splice(idx, 1);

  // Если очередь пуста -> все отказались
  if (state.queue.length === 0) {
    io.to(room.id).emit("auction_message", { message: "Аукцион отменен: все отказались." });
    endAuction(room, io, false);
    return;
  }

  // Если остался 1 игрок
  if (state.queue.length === 1) {
    const remainingPlayerId = state.queue[0];
    // Если он уже повышал ставку -> побеждает сразу
    if (state.hasIncreasedBid[remainingPlayerId]) {
      resolveAuction(room, io);
      return;
    } 
    // Если НЕ повышал -> даем шанс сделать первую ставку
    else {
      state.deadline = Date.now() + 10000;
      io.to(room.id).emit("auction_update", {
        queue: state.queue,
        currentBidderId: remainingPlayerId,
        deadline: state.deadline
      });
      setupAuctionTimer(room, io);
      return;
    }
  }

  // Игроков > 1, передаем ход следующему
  state.deadline = Date.now() + 10000;
  io.to(room.id).emit("auction_update", {
    queue: state.queue,
    currentBidderId: state.queue[0],
    deadline: state.deadline
  });
  setupAuctionTimer(room, io);
}

export function handleAutoDrop(room: Room, io: Server) {
  const state = room.gameState.auctionState;
  if (!state || state.queue.length === 0) return;
  const currentBidder = state.queue[0];
  io.to(room.id).emit("auction_message", { userId: currentBidder, message: "Время вышло! Автоматический отказ." });
  handleDrop(room, currentBidder, io);
}

function nextAuctionTurn(room: Room, io: Server) {
  const state = room.gameState.auctionState;
  if (!state || state.queue.length === 0) return;
  
  if (state.queue.length === 1) {
    resolveAuction(room, io);
    return;
  }
  
  const currentBidder = state.queue.shift();
  if (currentBidder) state.queue.push(currentBidder);
  
  state.deadline = Date.now() + 10000;
  io.to(room.id).emit("auction_update", { currentBidderId: state.queue[0], deadline: state.deadline });
  setupAuctionTimer(room, io);
}

function setupAuctionTimer(room: Room, io: Server) {
  const state = room.gameState.auctionState;
  if (!state || state.queue.length === 0) return;
  if (room.auctionTimer) clearTimeout(room.auctionTimer);
  const delay = Math.max(50, state.deadline - Date.now());
  room.auctionTimer = setTimeout(() => handleAutoDrop(room, io), delay);
}

function resolveAuction(room: Room, io: Server) {
  const state = room.gameState.auctionState;
  if (!state) return;
  if (room.auctionTimer) clearTimeout(room.auctionTimer);

  if (state.queue.length === 0) {
    endAuction(room, io, false);
    return;
  }

  const winnerId = state.queue[0];
  const winner = room.gameState.players.find(p => p.userId === winnerId);
  const cell = room.board[state.cellPosition];

  if (!winner || !cell) { endAuction(room, io, false); return; }

  // Проверка: нельзя выиграть, если не повышал ставку (страховка)
  if (!state.hasIncreasedBid[winnerId] && state.currentBid === state.basePrice) {
    io.to(room.id).emit("auction_message", { message: "Аукцион отменен: никто не повышал ставку." });
    endAuction(room, io, false);
    return;
  }

  if (winner.money < state.currentBid) {
    io.to(room.id).emit("auction_error", "У победителя недостаточно средств.");
    endAuction(room, io, false);
    return;
  }

  winner.money -= state.currentBid;
  cell.ownerId = winnerId;
  endAuction(room, io, true);
}

function endAuction(room: Room, io: Server, success: boolean) {
  const state = room.gameState.auctionState;
  
  if (room.auctionTimer) {
    clearTimeout(room.auctionTimer);
    room.auctionTimer = undefined;
  }

  io.to(room.id).emit("auction_ended", {
    winnerId: state?.queue?.[0],
    price: state?.currentBid || 0,
    cellPosition: state?.cellPosition,
    success
  });

  room.gameState.auctionState = undefined;
  room.gameState.isPaused = false;
  
  resumeTurnTimer(room);
  endCurrentPlayerTurn(room.id);

  io.to(room.id).emit("state_update", room.gameState);
  io.to(room.id).emit("room_updated", getSafeRoom(room));
}