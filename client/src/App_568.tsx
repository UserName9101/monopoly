import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import Board from "./Board";
import type {
UserProfile, RoomPlayer, PlayerState, GameState, BoardCell,
ContractProposal, RoomPayload, RoomSummary, ChatMessage, AuctionState
} from "./types";
import TimerDisplay from "./components/TimerDisplay";
import PlayerCard from "./components/PlayerCard";
import { getValidTicketTargets, validateBuild, validateSell, validateMortgage, validateUnmortgage } from "./utils/boardLogic";
import { styles } from "./styles";

const PLAYER_COLORS = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FF33A8', '#33FFF5', '#F5FF33', '#FF8C33'];
const TURN_TIME_MS = 90000; const CONTRACT_RESPONSE_MS = 30000;
const CELL_SIZE = 55; const CELL_GAP = 2; const CORNER_CELL_SIZE = 100;
const SIDE_LENGTH = 2 * CORNER_CELL_SIZE + 12 * CELL_SIZE + 13 * CELL_GAP;
const IDEAL_BOARD_SIZE = SIDE_LENGTH; const IDEAL_SIDE_WIDTH = 220; const IDEAL_GAP = 24;
const IDEAL_FULL_WIDTH = IDEAL_SIDE_WIDTH * 2 + IDEAL_BOARD_SIZE + IDEAL_GAP * 2; const IDEAL_FULL_HEIGHT = IDEAL_BOARD_SIZE;
const GROUP_COLORS: Record<string, string> = {
'a': '#8B4513', 'b': '#87CEEB', 'c': '#FF69B4', 'd': '#FFA500',
'e': '#FF0000', 'f': '#FFD700', 'g': '#008000', 'h': '#00008B',
'station': '#333', 'utility': '#666'
};

function App() {
const [token, setToken] = useState<string>(() => localStorage.getItem("token") || "");
const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
const [usernameInput, setUsernameInput] = useState(""); const [passwordInput, setPasswordInput] = useState("");
const [authError, setAuthError] = useState(""); const [isEditModalOpen, setIsEditModalOpen] = useState(false);
const [editDisplayName, setEditDisplayName] = useState(""); const [editAvatarUrl, setEditAvatarUrl] = useState("");
const [viewingProfile, setViewingProfile] = useState<UserProfile | null>(null); const [viewProfileModalOpen, setViewProfileModalOpen] = useState(false);
const [socket, setSocket] = useState<Socket | null>(null); const [socketId, setSocketId] = useState<string>("");
const [roomId, setRoomId] = useState<string>(""); const [players, setPlayers] = useState<RoomPlayer[]>([]);
const [hostId, setHostId] = useState<string>(""); const [roomStatus, setRoomStatus] = useState("LOBBY");
const [gameState, setGameState] = useState<GameState | null>(null); const [board, setBoard] = useState<BoardCell[]>([]);
const [availableRooms, setAvailableRooms] = useState<RoomSummary[]>([]); const [createMode, setCreateMode] = useState<"CLASSIC" | "MEGA">("MEGA");
const [messages, setMessages] = useState<ChatMessage[]>([]); const chatEndRef = useRef<HTMLDivElement>(null);
const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null); const [scale, setScale] = useState(1);
const gameCanvasRef = useRef<HTMLDivElement>(null);
const [activeContract, setActiveContract] = useState<ContractProposal | null>(null); const [contractTimer, setContractTimer] = useState<number | null>(null);
const [selectedProperties, setSelectedProperties] = useState<{ offered: number[]; requested: number[] }>({ offered: [], requested: [] });
const [contractOfferedMoney, setContractOfferedMoney] = useState(0); const [contractRequestedMoney, setContractRequestedMoney] = useState(0);
const [showActionPanel, setShowActionPanel] = useState(false);
const [selectedCellPositionForBuild, setSelectedCellPositionForBuild] = useState<number | null>(null);
const [isContractPendingByMe, setIsContractPendingByMe] = useState(false);
const [auctionState, setAuctionState] = useState<AuctionState | null>(null);
const [auctionTimer, setAuctionTimer] = useState<number>(10);
const selectedCell = selectedCellPositionForBuild !== null ? board.find(c => c.position === selectedCellPositionForBuild) : null;
const isMyProperty = selectedCell?.ownerId === myProfile?.id;
const isBalancing = !!gameState?.forcedBalanceGroupId;
const balanceGroupId = gameState?.forcedBalanceGroupId || null;
const balanceMessage = useMemo(() => {
if (!balanceGroupId || !board || !myProfile) return "";
const groupCells = board.filter(c => c.group === balanceGroupId && c.type === 'PROPERTY');
if (groupCells.length === 0) return "Требуется выравнивание застройки.";
const ownedCells = groupCells.filter(c => c.ownerId === myProfile.id);
const mortgaged = ownedCells.some(c => c.isMortgaged); const hasBuildings = ownedCells.some(c => (c.houses || 0) > 0);
const groupName = groupCells[0]?.name?.split(' ')[0] || balanceGroupId.toUpperCase();
if (mortgaged && hasBuildings) return `⚠️ Вы получили монополию с постройками! Снимите ипотеку с "${groupName}" и выровняйте дома, чтобы продолжить ход.`;
if (mortgaged) return `⚠️ Снимите ипотеку с "${groupName}" для завершения выравнивания.`;
return `⚠️ Выровняйте количество домов в наборе "${groupName}" перед ходом.`;
}, [balanceGroupId, board, myProfile]);

useEffect(() => { document.documentElement.style.margin = "0"; document.documentElement.style.padding = "0"; document.documentElement.style.overflow = "hidden"; document.body.style.margin = "0"; document.body.style.padding = "0"; document.body.style.overflow = "hidden"; return () => { document.documentElement.style.overflow = ""; document.body.style.overflow = ""; }; }, []);
useEffect(() => { const calculateScale = () => { if (!gameCanvasRef.current) return; setScale(Math.min(gameCanvasRef.current.clientWidth / IDEAL_FULL_WIDTH, gameCanvasRef.current.clientHeight / IDEAL_FULL_HEIGHT, 1.1)); }; window.addEventListener("resize", calculateScale); const t = setTimeout(calculateScale, 50); return () => { window.removeEventListener("resize", calculateScale); clearTimeout(t); }; }, []);
useEffect(() => { if (!token) { setSocket(null); return; } const s = io("http://localhost:3000", { auth: { token } }); setSocket(s); s.on("connect_error", (e) => { if (e.message === "Invalid token") handleLogout(); }); return () => s.disconnect(); }, [token]);
useEffect(() => { if (token) { fetchMyProfile(); fetchRooms(); } }, [token]);
useEffect(() => { if (!token) return; const i = setInterval(fetchRooms, 3000); return () => clearInterval(i); }, [token]);
useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
useEffect(() => {
if (selectedCellPositionForBuild !== null) {
const handleOutsideClick = (e: MouseEvent) => { const target = e.target as HTMLElement; if (!target.closest('.build-modal')) setSelectedCellPositionForBuild(null); };
document.addEventListener('mousedown', handleOutsideClick);
return () => document.removeEventListener('mousedown', handleOutsideClick);
}
}, [selectedCellPositionForBuild]);

const fetchMyProfile = async () => { try { const r = await fetch("http://localhost:3000/me", { headers: { Authorization: `Bearer ${token}` } }); if (r.ok) { const d = await r.json(); setMyProfile(d); setEditDisplayName(d.displayName); setEditAvatarUrl(d.avatarUrl); } } catch { console.error("Profile fetch failed"); } };
const fetchRooms = async () => { try { const r = await fetch("http://localhost:3000/rooms"); if (r.ok) setAvailableRooms(await r.json()); } catch { console.error("Rooms fetch failed"); } };
const addLog = (text: string, isSystem = true) => setMessages(p => [...p, { id: Math.random().toString(), text, isSystem, timestamp: Date.now() }]);
const isHost = socketId && hostId && socketId === hostId;
const isGameStarted = roomStatus === "PLAYING";
const isInRoom = roomId !== "";
const isMyTurn = gameState && myProfile ? gameState.players[gameState.currentPlayerIndex]?.userId === myProfile.id : false;
const isTripleChoice = gameState?.activeAction?.type === "TRIPLE_CHOICE";
const isChooseAuction = gameState?.activeAction?.type === "CHOOSE_AUCTION";
const isChooseBirthday = gameState?.activeAction?.type === "CHOOSE_BIRTHDAY";
const isChooseBus = gameState?.activeAction?.type === "CHOOSE_BUS_ACTION";
const isInJail = isMyTurn && gameState?.players[gameState.currentPlayerIndex]?.inJail;
const getValidTicketTargetsFn = useCallback(getValidTicketTargets, []);
const validMoveTargets = useMemo(() => {
if (!gameState || !myProfile || !isMyTurn) return null;
if (gameState.activeAction?.type === "TICKET_MOVE") return getValidTicketTargetsFn(gameState.players[gameState.currentPlayerIndex].position, board.length);
if (gameState.activeAction?.type === "TRIPLE_CHOICE") return board.map(c => c.position);
if (gameState.activeAction?.type === "CHOOSE_AUCTION") return board.filter(c => ["PROPERTY", "STATION", "UTILITY"].includes(c.type) && !c.ownerId && !c.isMortgaged).map(c => c.position);
return null;
}, [gameState, board, myProfile, isMyTurn, getValidTicketTargetsFn]);

const handleBoardCellClick = useCallback((cell: BoardCell) => {
if (validMoveTargets && validMoveTargets.includes(cell.position)) {
if (gameState?.activeAction?.type === "TICKET_MOVE") socket?.emit("ticket_move", { position: cell.position });
else if (gameState?.activeAction?.type === "TRIPLE_CHOICE") socket?.emit("triple_move", { position: cell.position });
else if (gameState?.activeAction?.type === "CHOOSE_AUCTION") socket?.emit("choose_auction_target", { position: cell.position });
return;
}
if (!activeContract || !myProfile || activeContract.proposerId !== myProfile.id || !cell.ownerId) return;
if ((cell.houses || 0) > 0 || cell.hasDepot) return;
if (cell.ownerId === myProfile.id) setSelectedProperties(p => ({ ...p, offered: p.offered.includes(cell.position) ? p.offered.filter(x => x !== cell.position) : [...p.offered, cell.position] }));
else if (cell.ownerId === activeContract.targetId) setSelectedProperties(p => ({ ...p, requested: p.requested.includes(cell.position) ? p.requested.filter(x => x !== cell.position) : [...p.requested, cell.position] }));
}, [validMoveTargets, activeContract, myProfile, gameState, socket]);

useEffect(() => {
if (!socket) return;
socket.on("connect", () => { const s = localStorage.getItem("lastRoomId"); if (s && !roomId) socket.emit("join_room", s); });
const onYourId = (id: string) => setSocketId(id);
const onRoomCreated = (room: RoomPayload) => { setRoomId(room.id); setPlayers(room.players); setHostId(room.hostId); setRoomStatus(room.status); setBoard(room.board); if (room.gameState) setGameState(room.gameState); setMessages([]); addLog(`Room: ${room.settings.mode}`); localStorage.setItem("lastRoomId", room.id); fetchRooms(); };
const onRoomJoined = (room: RoomPayload) => { setRoomId(room.id); setPlayers(room.players); setHostId(room.hostId); setRoomStatus(room.status); setBoard(room.board); if (room.gameState) setGameState(room.gameState); setMessages([]); addLog("Joined."); localStorage.setItem("lastRoomId", room.id); fetchRooms(); };
const onRoomUpdated = (room: RoomPayload) => { setPlayers(room.players); setHostId(room.hostId); setRoomStatus(room.status); if (room.board) setBoard(room.board); if (room.gameState) setGameState(room.gameState); };
const onStateUpdate = (state: GameState) => { setGameState(state); const isMyCurrentTurn = myProfile && state.players[state.currentPlayerIndex]?.userId === myProfile.id; if (isMyCurrentTurn && (state.activeAction || !!state.forcedBalanceGroupId)) { setShowActionPanel(true); } else { setShowActionPanel(false); } if (gameState && state.currentPlayerIndex !== gameState.currentPlayerIndex) { const n = players.find(p => p.userId === state.players[state.currentPlayerIndex]?.userId); if (n) addLog(`${n.displayName} turn. ${state.currentPhase}`); } };
const onGameStarted = (state: GameState) => { setGameState(state); setRoomStatus("PLAYING"); addLog("Started!"); };
const onJoinError = (m: string) => { alert(m); localStorage.removeItem("lastRoomId"); setRoomId(""); };
const onGameFinished = () => { alert("Finished!"); setRoomId(""); setPlayers([]); setGameState(null); setBoard([]); setMessages([]); setIsContractPendingByMe(false); localStorage.removeItem("lastRoomId"); fetchMyProfile(); fetchRooms(); };
const onLeftSuccess = () => { localStorage.removeItem("lastRoomId"); setRoomId(""); setPlayers([]); setGameState(null); setBoard([]); setMessages([]); setIsContractPendingByMe(false); };
const onContractError = (msg: string) => { addLog(msg, false); setActiveContract(null); setContractTimer(null); setSelectedProperties({ offered: [], requested: [] }); };
const onContractProposed = (p: ContractProposal) => { if (!myProfile || p.proposerId === myProfile.id) return; if (p.targetId === myProfile.id) { setActiveContract(p); setSelectedProperties({ offered: p.offeredProperties, requested: p.requestedProperties }); setContractOfferedMoney(p.offeredMoney); setContractRequestedMoney(p.requestedMoney); setContractTimer(CONTRACT_RESPONSE_MS / 1000); const i = setInterval(() => setContractTimer(t => t === null || t <= 1 ? (clearInterval(i), null) : t - 1), 1000); return () => clearInterval(i); } };
const onContractResolved = ({ contractId, accepted }: { contractId: string; accepted: boolean }) => { if (activeContract?.contractId === contractId) { addLog(`Contract ${accepted ? "accepted" : "declined"}`); setActiveContract(null); setContractTimer(null); setSelectedProperties({ offered: [], requested: [] }); } setIsContractPendingByMe(false); };
const onContractExpired = ({ contractId }: { contractId: string }) => { if (activeContract?.contractId === contractId) { addLog("Contract expired"); setActiveContract(null); setContractTimer(null); setSelectedProperties({ offered: [], requested: [] }); } setIsContractPendingByMe(false); };
const onDiceRolled = ({ result }: { result: string }) => { addLog(`🎲 Бросок: ${result}`, false); };
const onBuildError = (msg: string) => { addLog(`Build: ${msg}`, false); };
const onSellError = (msg: string) => { addLog(`Sell: ${msg}`, false); };
const onGameLog = ({ text, isSystem }: { text: string; isSystem: boolean }) => addLog(text, isSystem);
const onAuctionStarted = (data: any) => { setAuctionState(data); setAuctionTimer(Math.max(0, Math.ceil((data.deadline - Date.now()) / 1000))); };
const onAuctionUpdate = (data: any) => { setAuctionState(prev => prev ? { ...prev, ...data } : null); if (data.deadline) setAuctionTimer(Math.max(0, Math.ceil((data.deadline - Date.now()) / 1000))); };
const onAuctionEnded = (data: any) => { setAuctionState(null); setAuctionTimer(10); if (data.success) { addLog(`Аукцион завершен! ${data.winnerId === myProfile?.id ? "Вы выиграли" : `Победил ${players.find(p=>p.userId===data.winnerId)?.displayName || '???'}`} за $${data.price}`, false); } };
const onAuctionError = (msg: string) => { setAuctionState(null); setAuctionTimer(10); addLog(msg, false); };
const onAuctionMessage = ({ message }: any) => addLog(message, false);

socket.on("your_id", onYourId); socket.on("room_created", onRoomCreated); socket.on("room_joined", onRoomJoined); socket.on("room_updated", onRoomUpdated); socket.on("state_update", onStateUpdate); socket.on("game_started", onGameStarted); socket.on("join_error", onJoinError); socket.on("game_finished", onGameFinished); socket.on("left_room_success", onLeftSuccess); socket.on("contract_error", onContractError); socket.on("contract_proposed", onContractProposed); socket.on("contract_resolved", onContractResolved); socket.on("contract_expired", onContractExpired); socket.on("dice_rolled", onDiceRolled); socket.on("build_error", onBuildError); socket.on("sell_error", onSellError);
socket.on("game_log", onGameLog);
socket.on("auction_started", onAuctionStarted); socket.on("auction_update", onAuctionUpdate); socket.on("auction_ended", onAuctionEnded); socket.on("auction_error", onAuctionError); socket.on("auction_message", onAuctionMessage);

return () => { socket.off("your_id", onYourId); socket.off("room_created", onRoomCreated); socket.off("room_joined", onRoomJoined); socket.off("room_updated", onRoomUpdated); socket.off("state_update", onStateUpdate); socket.off("game_started", onGameStarted); socket.off("join_error", onJoinError); socket.off("game_finished", onGameFinished); socket.off("left_room_success", onLeftSuccess); socket.off("contract_error", onContractError); socket.off("contract_proposed", onContractProposed); socket.off("contract_resolved", onContractResolved); socket.off("contract_expired", onContractExpired); socket.off("dice_rolled", onDiceRolled); socket.off("build_error", onBuildError); socket.off("sell_error", onSellError); socket.off("game_log", onGameLog); socket.off("auction_started", onAuctionStarted); socket.off("auction_update", onAuctionUpdate); socket.off("auction_ended", onAuctionEnded); socket.off("auction_error", onAuctionError); socket.off("auction_message", onAuctionMessage); };
}, [socket, gameState, players, roomId, myProfile, activeContract]);

useEffect(() => { if (!auctionState) return; const i = setInterval(() => { if (auctionState.deadline) { const rem = Math.max(0, Math.ceil((auctionState.deadline - Date.now()) / 1000)); setAuctionTimer(rem); if (rem === 0) clearInterval(i); } }, 200); return () => clearInterval(i); }, [auctionState]);

const handleLogin = async (e: React.FormEvent) => { e.preventDefault(); try { const r = await fetch("http://localhost:3000/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: usernameInput, password: passwordInput }) }); const d = await r.json(); if (r.ok) { setToken(d.token); localStorage.setItem("token", d.token); setUsernameInput(""); setPasswordInput(""); setAuthError(""); } else setAuthError(d.error); } catch { setAuthError("Error"); } };
const handleRegister = async (e: React.FormEvent) => { e.preventDefault(); try { const r = await fetch("http://localhost:3000/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: usernameInput, password: passwordInput }) }); const d = await r.json(); if (r.ok) setAuthError("Registered."); else setAuthError(d.error); } catch { setAuthError("Error"); } };
const handleLogout = () => { setToken(""); localStorage.removeItem("token"); setMyProfile(null); localStorage.removeItem("lastRoomId"); };
const handleSaveProfile = async () => { try { await fetch("http://localhost:3000/profile", { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ displayName: editDisplayName, avatarUrl: editAvatarUrl }) }); setIsEditModalOpen(false); fetchMyProfile(); } catch { console.error("Save failed"); } };
const handleOpenEditProfile = () => { if (myProfile) { setEditDisplayName(myProfile.displayName); setEditAvatarUrl(myProfile.avatarUrl); setIsEditModalOpen(true); } };
const handleViewOtherProfile = async (u: string) => { try { const r = await fetch(`http://localhost:3000/profile/${u}`); if (r.ok) { setViewingProfile(await r.json()); setViewProfileModalOpen(true); } else alert("Failed"); } catch { alert("Error"); } };
const handleLeaveFromMenu = () => { if (confirm("Leave room?")) handleLeaveRoom(); };
const handleEndGameFromMenu = () => { if (confirm("End game?")) handleFinishGame(); };
const handleCreateRoom = () => socket?.emit("create_room", { mode: createMode, maxPlayers: createMode === "CLASSIC" ? 4 : 8 });
const handleJoinRoom = (id: string) => socket?.emit("join_room", id);
const handleStartGame = () => socket?.emit("start_game");
const handleRollDice = () => { socket?.emit("roll_dice"); addLog("Rolling...", false); };
const handleUseTicket = () => { socket?.emit("use_bus_ticket"); addLog("Используем Bus Ticket...", false); };
const handleFinishGame = () => socket?.emit("finish_game");
const handleLeaveRoom = () => { localStorage.removeItem("lastRoomId"); setRoomId(""); setPlayers([]); setGameState(null); setBoard([]); setMessages([]); setActiveCardIndex(null); setIsContractPendingByMe(false); socket?.emit("leave_room"); };
const handleCardClick = (i: number) => setActiveCardIndex(p => p === i ? null : i);
const getCurrentPlayerState = () => { if (!gameState || !myProfile) return null; return gameState.players[gameState.currentPlayerIndex].userId === myProfile.id ? gameState.players[gameState.currentPlayerIndex] : null; };
const handleBuyProperty = () => { const curr = getCurrentPlayerState(); if (!curr || !gameState || gameState.activeAction?.type !== "BUY") return; const cell = board[gameState.players[gameState.currentPlayerIndex].position]; if (!cell.price || curr.money < cell.price) return; socket?.emit("buy_property", { position: cell.position }); setShowActionPanel(false); addLog("Bought.", false); };
const handlePayDebt = () => { const curr = getCurrentPlayerState(); if (!curr || !gameState || gameState.activeAction?.type !== "PAY") return; const amount = gameState.activeAction.data?.amount || 0; if (curr.money < amount) return; socket?.emit("pay_debt", { amount, targetUserId: gameState.activeAction.data?.targetUserId }); setShowActionPanel(false); addLog("Paid.", false); };
const handleSkipAction = () => { socket?.emit("skip_action"); setShowActionPanel(false); addLog("Skipped.", false); };

const handleProposeContract = () => { if (!activeContract || !myProfile) return; const curr = getCurrentPlayerState(); if (!curr) return; const targetPlayer = gameState?.players.find((p: PlayerState) => p.userId === activeContract.targetId); if (contractOfferedMoney > curr.money) return addLog("Not enough money", false); if (contractRequestedMoney > (targetPlayer?.money || 0)) return addLog("Target doesn't have enough money", false); if (contractOfferedMoney === 0 && selectedProperties.offered.length === 0 && contractRequestedMoney === 0 && selectedProperties.requested.length === 0) return addLog("Empty offer", false); setIsContractPendingByMe(true); socket?.emit("propose_contract", { targetUserId: activeContract.targetId, offeredMoney: contractOfferedMoney, offeredProperties: selectedProperties.offered, requestedMoney: contractRequestedMoney, requestedProperties: selectedProperties.requested }); setActiveContract(null); setContractTimer(null); setSelectedProperties({ offered: [], requested: [] }); addLog("Proposed.", false); };
const handleCancelContract = () => { setActiveContract(null); setContractTimer(null); setSelectedProperties({ offered: [], requested: [] }); setIsContractPendingByMe(false); };
const handleRespondContract = (accept: boolean) => { if (!activeContract) return; socket?.emit("respond_contract", { contractId: activeContract.contractId, accept }); setActiveContract(null); setContractTimer(null); setSelectedProperties({ offered: [], requested: [] }); setIsContractPendingByMe(false); };

const handleOpenContractModal = (targetUserId: string) => { if (!myProfile || !gameState) return; if (gameState.players[gameState.currentPlayerIndex].userId !== myProfile.id) return; if (gameState.contractsUsedThisTurn >= 3) { addLog("Max contracts.", false); return; } setActiveContract({ contractId: "new", proposerId: myProfile.id, targetId: targetUserId, offeredMoney: 0, offeredProperties: [], requestedMoney: 0, requestedProperties: [] }); setSelectedProperties({ offered: [], requested: [] }); setContractOfferedMoney(0); setContractRequestedMoney(0); };

const handleOpenBuildPanel = (cell: BoardCell) => { setSelectedCellPositionForBuild(cell.position); };
const handleChooseBirthdayGift = (choice: "money" | "ticket") => { socket?.emit("choose_birthday_gift", { choice }); };
const handleChooseBusAction = (choice: "ticket" | "move") => { socket?.emit("choose_bus_action", { choice }); };

const currentPlayerMoney = getCurrentPlayerState()?.money;
const auctionBidderState = auctionState ? gameState?.players.find(p => p.userId === auctionState.currentBidderId) : null;
const bidderMoney = auctionBidderState?.money || 0;
const canBid = auctionState?.currentBidderId === myProfile?.id && bidderMoney >= ((auctionState?.currentBid || 0) + 10);
const buildValidation = useMemo(() => validateBuild(selectedCell, board, myProfile?.id || '', isMyProperty, gameState, currentPlayerMoney), [selectedCell, board, myProfile, isMyProperty, gameState, currentPlayerMoney]);
const sellValidation = useMemo(() => validateSell(selectedCell, board, myProfile?.id || '', isMyProperty, gameState?.forcedBalanceGroupId), [selectedCell, board, myProfile, isMyProperty, gameState?.forcedBalanceGroupId]);
const mortgageValidation = useMemo(() => validateMortgage(selectedCell, board, myProfile?.id || '', isMyProperty, gameState?.forcedBalanceGroupId), [selectedCell, board, myProfile, isMyProperty, gameState?.forcedBalanceGroupId]);
const unmortgageValidation = useMemo(() => validateUnmortgage(selectedCell, myProfile?.id || '', isMyProperty, currentPlayerMoney), [selectedCell, myProfile, isMyProperty, currentPlayerMoney]);

const handleBuild = () => { if (!selectedCell || !gameState || !buildValidation.canBuild || !isMyTurn) return; socket?.emit("build_building", { position: selectedCell.position, targetHouses: (selectedCell.houses || 0) + 1 }); };
const handleSell = () => { if (!selectedCell || !gameState || !sellValidation.canSell || !isMyTurn) return; socket?.emit("sell_building", { position: selectedCell.position, housesToSell: 1 }); };
const handleToggleDepot = () => { if (!selectedCell || !gameState || !isMyTurn) return; socket?.emit("toggle_depot", { position: selectedCell.position }); };
const handleMortgage = () => { if (!selectedCell || !gameState || !isMyTurn) return; socket?.emit("mortgage_property", { position: selectedCell.position }); };
const handleUnmortgage = () => { if (!selectedCell || !gameState || !isMyTurn) return; socket?.emit("unmortgage_property", { position: selectedCell.position }); };

useEffect(() => { if (activeCardIndex !== null) { const cm = (e: MouseEvent) => { const t = e.target as HTMLElement; if (!t.closest('.player-card') && !t.closest('.player-menu')) setActiveCardIndex(null); }; document.addEventListener('click', cm); return () => document.removeEventListener('click', cm); } }, [activeCardIndex]);

const targetPlayer = activeContract ? gameState?.players.find((p: PlayerState) => p.userId === activeContract.targetId) : null;
const currentCell = currentPlayerMoney !== undefined && gameState ? board[gameState.players[gameState.currentPlayerIndex].position] : null;
const canAffordBuy = currentCell?.price && currentPlayerMoney !== undefined ? currentPlayerMoney >= currentCell.price : false;
const canAffordPay = gameState?.activeAction?.type === "PAY" && currentPlayerMoney !== undefined ? currentPlayerMoney >= (gameState.activeAction.data?.amount || 0) : true;
const offeredTotal = contractOfferedMoney + selectedProperties.offered.reduce((a, p) => a + (board[p]?.price || 0), 0);
const requestedTotal = contractRequestedMoney + selectedProperties.requested.reduce((a, p) => a + (board[p]?.price || 0), 0);
const isContractValid = activeContract && myProfile ? (offeredTotal > 0 || requestedTotal > 0) && contractOfferedMoney <= (currentPlayerMoney || 0) && contractRequestedMoney <= (targetPlayer?.money || 0) : false;
const hasTickets = currentPlayerMoney !== undefined ? (gameState?.players[gameState.currentPlayerIndex]?.busTickets || 0) > 0 : false;
const isActionsDisabled = isBalancing || isContractPendingByMe || !!gameState?.pendingContracts?.length || gameState?.isPaused;
const shouldShowJail = isMyTurn && showActionPanel && gameState?.activeAction?.type === "JAIL";
const shouldShowBirthday = isMyTurn && showActionPanel && isChooseBirthday;
const shouldShowBus = isMyTurn && showActionPanel && isChooseBus;
const shouldShowActions = isMyTurn && 
  gameState?.currentPhase === "ACTIONS" && 
  !isTripleChoice && 
  !isChooseAuction && 
  !isInJail && 
  !shouldShowBirthday && 
  !shouldShowBus;

const shouldShowForcedBalance = isMyTurn && 
  gameState?.currentPhase === "ACTIONS" && 
  !!gameState.forcedBalanceGroupId;
const shouldShowPostMove = isMyTurn && showActionPanel && gameState?.currentPhase === "POST_MOVE" && (gameState.activeAction?.type === "BUY" || gameState.activeAction?.type === "PAY");
const buildCost = selectedCell?.houseCost || 0;
const sellRefund = selectedCell ? Math.floor((selectedCell.houseCost || 0) * 0.5) : 0;
const unmortgageCost = selectedCell ? Math.floor((selectedCell.price || 0) * 0.6) : 0;

if (!token) return (<div style={styles.container}><h1>Login</h1><form onSubmit={handleLogin} style={styles.form}><input placeholder="User" value={usernameInput} onChange={e => setUsernameInput(e.target.value)} style={styles.input} /><input type="password" placeholder="Pass" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} style={styles.input} /><div style={styles.buttonGroup}><button type="submit" style={styles.btnPrimary}>Login</button><button type="button" onClick={handleRegister} style={styles.btnSecondary}>Register</button></div></form>{authError && <p style={styles.error}>{authError}</p>}</div>);

return (
<div style={styles.appContainer}>
{(!isInRoom || roomStatus !== "PLAYING") && (
<header style={styles.header}>
<div style={{ ...styles.headerInner, maxWidth: isInRoom ? `${IDEAL_FULL_WIDTH}px` : '860px' }}>
<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
{myProfile && <img src={myProfile.avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />}
<span style={{ fontWeight: 700, color: '#eee' }}>{myProfile?.displayName}</span>
{isInRoom && (
<div style={{ marginLeft: '20px', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 14px', backgroundColor: '#333', borderRadius: '9999px', fontSize: '14px', fontWeight: 600, color: '#eee' }}>
Room: {roomId.substring(0, 8)}...
<button onClick={handleLeaveRoom} style={styles.btnSmall}>Leave</button>
</div>
)}
</div>
<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
{isInRoom ? (
!isGameStarted ? (
<>
<span style={{ fontSize: '14px', color: '#aaa' }}>LOBBY ({players.length})</span>
{isHost ? <button onClick={handleStartGame} style={styles.btnSuccess}>Start</button> : <span style={{ color: '#aaa', fontSize: '14px' }}>Waiting...</span>}
</>
) : (
<>
<span style={{ fontSize: '14px', color: '#aaa' }}>PLAYING</span>
{isHost && <button onClick={handleFinishGame} style={{ ...styles.btnSmall, color: '#ff6b6b', padding: '4px 12px' }}>End</button>}
</>
)
) : null}
<button onClick={() => setIsEditModalOpen(true)} style={styles.btnSmall}>Profile</button>
<button onClick={handleLogout} style={styles.btnSmall}>Logout</button>
</div>
</div>
</header>
)}
<div style={{ ...styles.mainContent, height: isGameStarted && isInRoom ? '100vh' : 'calc(100vh - 60px)' }}>
{!isInRoom && (
<div style={styles.lobbyWrapper}>
<div style={styles.createCard}>
<h3 style={{ margin: '0 0 20px 0', textAlign: 'center', fontSize: '26px', color: '#eee' }}>Create</h3>
<div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
<select value={createMode} onChange={e => setCreateMode(e.target.value as any)} style={{ ...styles.select, color: '#222' }}>
<option value="MEGA">Mega (8)</option>
<option value="CLASSIC">Classic (4)</option>
</select>
<button onClick={handleCreateRoom} style={styles.btnPrimary}>Create</button>
</div>
</div>
<div style={styles.lobbyList}>
<h3 style={{ margin: '0 0 20px 0', fontSize: '24px', color: '#eee' }}>Rooms</h3>
{availableRooms.filter(r => r.id !== roomId).length === 0 ? (
<p style={{ color: '#888', textAlign: 'center', padding: '60px 0', fontSize: '17px' }}>None.<br />Create one!</p>
) : (
<div style={styles.roomList}>
{availableRooms.filter(r => r.id !== roomId).map(r => (
<div key={r.id} style={styles.roomItem}>
<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
<span style={{ ...styles.badge, backgroundColor: r.mode === 'MEGA' ? '#ff9500' : '#0071e3' }}>{r.mode}</span>
<span style={{ fontSize: '16px', fontWeight: 600, color: '#eee' }}>{r.playerCount}/{r.maxPlayers}</span>
</div>
<button onClick={() => handleJoinRoom(r.id)} disabled={r.status === 'PLAYING'} style={styles.btnSecondary}>
{r.status === 'PLAYING' ? 'In' : 'Join'}
</button>
</div>
))}
</div>
)}
</div>
</div>
)}
{isInRoom && isGameStarted && (
<div ref={gameCanvasRef} style={styles.gameCanvasContainer}>
<div style={{ ...styles.gameCanvasInner, transform: `scale(${scale})`, transformOrigin: 'center center' }}>
<div style={{ ...styles.sideColumn, ...(isTripleChoice || isChooseAuction ? { filter: 'brightness(0.65) saturate(0.7)' } : {}) }}>
{[0,1,2,3].map(i => {
const p = players[i] || null;
const ic = !!p && gameState?.players[gameState?.currentPlayerIndex]?.userId === p.userId;
const im = p && myProfile ? p.userId === myProfile.id : false;
return <PlayerCard key={p ? p.userId : `el${i}`} player={p} index={i} gameState={gameState} isCurrent={ic} isMyCard={im} isHost={isHost} isActive={activeCardIndex === i} isPaused={gameState?.isPaused} onClick={() => p && handleCardClick(i)} onProfile={handleOpenEditProfile} onViewProfile={handleViewOtherProfile} onLeave={handleLeaveFromMenu} onEndGame={handleEndGameFromMenu} onContract={() => p && handleOpenContractModal(p.userId)} roomStatus={roomStatus} />;
})}
</div>
<div style={styles.centerPanel}>
<div style={styles.boardWrapper}>
<Board board={board} players={players} gameState={gameState} onCellClick={(validMoveTargets || activeContract || isMyTurn) ? handleBoardCellClick : undefined} onCellRightClick={handleOpenBuildPanel} highlightOffered={selectedProperties.offered} highlightRequested={selectedProperties.requested} validMoveTargets={validMoveTargets} currentPlayerPosition={gameState?.players[gameState.currentPlayerIndex]?.position} isContractOpen={!!activeContract} />
</div>
<div style={styles.centerChatOverlay}>
{activeContract && myProfile && (
<div style={styles.contractModal}>
<div style={styles.contractHeader}><span style={{color: '#eee'}}>Contract</span>{contractTimer !== null && <span style={{ color: contractTimer <= 5 ? '#dc3545' : '#999', fontWeight: 'bold' }}>{contractTimer}s</span>}</div>
<div style={styles.contractColumns}>
{[activeContract.proposerId, activeContract.targetId].map((tid) => {
const pr = players.find(x => x.userId === tid);
const isPr = activeContract.proposerId === tid;
const total = isPr ? offeredTotal : requestedTotal;
const props = isPr ? selectedProperties.offered : selectedProperties.requested;
return (
<div key={tid} style={styles.contractColumn}>
<div style={styles.contractPlayerInfo}><img src={pr?.avatarUrl} style={styles.contractAvatar} alt="" /><div><div style={{ fontWeight: 600, color: '#eee' }}>{pr?.displayName}</div><div style={{ fontSize: 12, color: '#888' }}>{isPr ? 'Offering' : 'Requesting'}</div></div></div>
<div style={styles.contractOfferSection}>
<label style={styles.contractLabel}>Money</label>
{activeContract.proposerId === myProfile.id ? (
<input type="number" value={isPr ? contractOfferedMoney : contractRequestedMoney} onChange={e => { const v = Math.max(0, parseInt(e.target.value) || 0); isPr ? setContractOfferedMoney(v) : setContractRequestedMoney(v); }} style={styles.contractInput} min={0} />
) : (<div style={styles.contractStaticValue}>${isPr ? activeContract.offeredMoney : activeContract.requestedMoney}</div>)}
</div>
<div style={styles.contractOfferSection}>
<label style={styles.contractLabel}>Properties</label>
<div style={styles.contractPropertiesList}>
{props.map(pos => { const c = board[pos]; return <div key={pos} style={styles.contractPropertyItem}><span style={{color:'#eee'}}>{c?.name}</span></div>; })}
{activeContract.proposerId === myProfile.id && props.length === 0 && <div style={{ fontSize: 11, color: '#888' }}>Click board</div>}
</div>
</div>
<div style={styles.contractTotal}>Total: ${total}</div>
</div>
);
})}
</div>
<div style={styles.contractButtons}>
{activeContract.proposerId === myProfile.id ? (
<>
<button onClick={handleProposeContract} style={{ ...styles.btnPrimary, opacity: isContractValid ? 1 : 0.6, cursor: isContractValid ? 'pointer' : 'not-allowed' }} disabled={!isContractValid}>Propose</button>
<button onClick={handleCancelContract} style={styles.btnSecondary}>Cancel</button>
</>
) : (
<>
<button onClick={() => handleRespondContract(true)} style={styles.btnSuccess}>Accept</button>
<button onClick={() => handleRespondContract(false)} style={styles.btnSecondary}>Decline</button>
</>
)}
</div>
</div>
)}
{selectedCell && (
<div className="build-modal" style={styles.buildModal}>
<div style={{ backgroundColor: selectedCell.group ? GROUP_COLORS[selectedCell.group] || '#555' : '#555', padding: '12px 16px', color: '#fff' }}>
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
<span style={{ fontWeight: 700, fontSize: 16 }}>{selectedCell.name}</span>
<button onClick={() => setSelectedCellPositionForBuild(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>×</button>
</div>
{selectedCell.group && <div style={{ fontSize: 12, marginTop: 2, opacity: 0.8 }}>GROUP {selectedCell.group.toUpperCase()}</div>}
{isMyProperty && isMyTurn ? (
<div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
{selectedCell.type === 'PROPERTY' && !selectedCell.isMortgaged && (
<>
<button onClick={handleBuild} disabled={!buildValidation.canBuild} style={{ ...styles.btnPrimary, flex: 1, fontSize: 11, padding: '6px 4px', opacity: buildValidation.canBuild ? 1 : 0.5, cursor: buildValidation.canBuild ? 'pointer' : 'not-allowed' }}>Buy House<br/><span style={{fontSize:10}}>${buildCost}</span>{!buildValidation.canBuild && <div style={{fontSize:9, marginTop:2, color:'#ffcccc'}}>{buildValidation.reason}</div>}</button>
<button onClick={selectedCell.houses === 0 ? handleMortgage : handleSell} disabled={selectedCell.houses === 0 ? !mortgageValidation.canMortgage : !sellValidation.canSell} style={{ ...styles.btnSecondary, flex: 1, fontSize: 11, padding: '6px 4px', opacity: (selectedCell.houses === 0 ? mortgageValidation.canMortgage : sellValidation.canSell) ? 1 : 0.5, cursor: (selectedCell.houses === 0 ? mortgageValidation.canMortgage : sellValidation.canSell) ? 'pointer' : 'not-allowed' }}>{selectedCell.houses === 0 ? 'Mortgage' : 'Sell House'}<br/><span style={{fontSize:10}}>${selectedCell.houses === 0 ? Math.floor((selectedCell.price || 0) * 0.5) : sellRefund}</span>{selectedCell.houses !== 0 && !sellValidation.canSell && <div style={{fontSize:9, marginTop:2, color:'#ffcccc'}}>{sellValidation.reason}</div>}{selectedCell.houses === 0 && !mortgageValidation.canMortgage && <div style={{fontSize:9, marginTop:2, color:'#ffcccc'}}>{mortgageValidation.reason}</div>}</button>
</>
)}
{selectedCell.type === 'STATION' && !selectedCell.isMortgaged && (
<>
<button onClick={handleToggleDepot} disabled={selectedCell.hasDepot ? false : (currentPlayerMoney || 0) < 100 || (!!gameState?.buildLimitsThisTurn?.['station'] && gameState?.forcedBalanceGroupId !== 'station')} style={{ ...styles.btnPrimary, flex: 1, fontSize: 12, padding: '6px', opacity: (selectedCell.hasDepot || ((currentPlayerMoney || 0) >= 100 && !(!!gameState?.buildLimitsThisTurn?.['station'] && gameState?.forcedBalanceGroupId !== 'station'))) ? 1 : 0.5, cursor: (selectedCell.hasDepot || ((currentPlayerMoney || 0) >= 100 && !(!!gameState?.buildLimitsThisTurn?.['station'] && gameState?.forcedBalanceGroupId !== 'station'))) ? 'pointer' : 'not-allowed' }}>{selectedCell.hasDepot ? 'Sell Depot (+$50)' : 'Build Depot ($100)'}</button>
<button onClick={selectedCell.hasDepot ? () => {} : handleMortgage} disabled={selectedCell.hasDepot ? false : !mortgageValidation.canMortgage} style={{ ...styles.btnSecondary, flex: 1, fontSize: 12, padding: '6px', opacity: (selectedCell.hasDepot || mortgageValidation.canMortgage) ? 1 : 0.5, cursor: (selectedCell.hasDepot || mortgageValidation.canMortgage) ? 'pointer' : 'not-allowed' }}>{selectedCell.hasDepot ? 'Depo Active' : 'Mortgage'}<br/><span style={{fontSize:10}}>{selectedCell.hasDepot ? '' : `+${Math.floor((selectedCell.price || 0) * 0.5)}`}</span>{!selectedCell.hasDepot && !mortgageValidation.canMortgage && <div style={{fontSize:9, marginTop:2, color:'#ffcccc'}}>{mortgageValidation.reason}</div>}</button>
</>
)}
{selectedCell.type === 'UTILITY' && !selectedCell.isMortgaged && (
<button onClick={handleMortgage} disabled={!mortgageValidation.canMortgage} style={{ ...styles.btnSecondary, flex: 1, fontSize: 12, padding: '6px 4px', opacity: mortgageValidation.canMortgage ? 1 : 0.5, cursor: mortgageValidation.canMortgage ? 'pointer' : 'not-allowed' }}>Mortgage<br/><span style={{fontSize:10}}>${Math.floor((selectedCell.price || 0) * 0.5)}</span>{!mortgageValidation.canMortgage && <div style={{fontSize:9, marginTop:2, color:'#ffcccc'}}>{mortgageValidation.reason}</div>}</button>
)}
{selectedCell.isMortgaged && (
<button onClick={handleUnmortgage} disabled={!unmortgageValidation.canUnmortgage} style={{ ...styles.btnSuccess, width: '100%', fontSize: 12, padding: '6px', opacity: unmortgageValidation.canUnmortgage ? 1 : 0.5, cursor: unmortgageValidation.canUnmortgage ? 'pointer' : 'not-allowed' }}>Unmortgage (${unmortgageCost})</button>
)}
</div>
) : !isMyProperty && (
<div style={{ fontSize: 12, color: '#aaa', marginTop: 8, textAlign: 'center' }}>
{selectedCell.ownerId ? `Владелец: ${players.find(p => p.userId === selectedCell.ownerId)?.displayName || '???'}` : 'Свободно'}
</div>
)}
</div>
<div style={{ padding: '8px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
{selectedCell.type === 'PROPERTY' && (
<>
<div style={{fontSize:10, color:'#aaa', fontStyle:'italic'}}>Стройте филиалы, чтобы увеличить ренту.</div>
<div style={styles.rentBlock}><div style={styles.rentRow}><span style={{color:'#888'}}>Base:</span><span style={{color:'#eee'}}>${selectedCell.baseRent || 0}</span></div>{selectedCell.partialMonopolyRent && <div style={styles.rentRow}><span style={{color:'#888'}}>Partial:</span><span style={{color:'#eee'}}>${selectedCell.partialMonopolyRent}</span></div>}{selectedCell.monopolyRent && <div style={styles.rentRow}><span style={{color:'#888'}}>Monopoly:</span><span style={{color:'#eee'}}>${selectedCell.monopolyRent}</span></div>}</div>
<div style={styles.rentBlock}>{[1,2,3,4].map(n => <div key={n} style={styles.rentRow}><span style={{color:'#888'}}>{n} house:</span><span style={{color:'#eee'}}>${(selectedCell as any)[`house${n}Rent`] || 0}</span></div>)}<div style={styles.rentRow}><span style={{color:'#888'}}>Hotel:</span><span style={{color:'#eee'}}>${selectedCell.hotelRent || 0}</span></div><div style={styles.rentRow}><span style={{color:'#888'}}>Skyscraper:</span><span style={{color:'#eee'}}>${selectedCell.skyscraperRent || 0}</span></div></div>
</>
)}
{selectedCell.type === 'STATION' && (<>
<div style={{fontSize:10, color:'#aaa', fontStyle:'italic'}}>Рента зависит от кол-ва Ж/Д станций. Депо удваивает ренту.</div>
<div style={styles.rentBlock}>{[1,2,3,4].map(n => <div key={n} style={styles.rentRow}><span style={{color:'#888'}}>{n} station:</span><span style={{color:'#eee'}}>${(selectedCell as any)[`stationRent${n}`] || 0}</span></div>)}</div>
</>)}
{selectedCell.type === 'UTILITY' && (<>
<div style={{fontSize:10, color:'#aaa', fontStyle:'italic'}}>Рента зависит от суммы кубиков и кол-ва Коммуналок.</div>
<div style={styles.rentBlock}><div style={styles.rentRow}><span style={{color:'#888'}}>1 utility:</span><span style={{color:'#eee'}}>x{selectedCell.utilityMultiplier1 || 4}</span></div><div style={styles.rentRow}><span style={{color:'#888'}}>2 utilities:</span><span style={{color:'#eee'}}>x{selectedCell.utilityMultiplier2 || 10}</span></div><div style={styles.rentRow}><span style={{color:'#888'}}>3 utilities:</span><span style={{color:'#eee'}}>x{selectedCell.utilityMultiplier3 || 20}</span></div></div>
</>)}
<div style={{marginTop:'auto', padding:6, backgroundColor:'#1a1a1a', borderRadius:4, textAlign:'center', fontSize:11, color:'#888'}}><span>Mortgage: ${Math.floor((selectedCell.price || 0) * 0.5)}</span> | <span>Unmortgage: ${unmortgageCost}</span></div>
{selectedCell.isMortgaged && (<div style={{textAlign:'center', color:'#dc3545', fontSize:12, marginTop:6}}>Заложено на {selectedCell.mortgageTurnsRemaining} ходов</div>)}
</div>
</div>
)}
{shouldShowJail && (
<div style={styles.actionPanel}>
<div style={styles.actionPanelHeader}><span style={{color:'#eee'}}>🔒 Тюрьма (Ход {gameState?.players[gameState.currentPlayerIndex]?.jailTurns || 0}/3)</span>{gameState.turnStartTime && <TimerDisplay startTime={gameState.turnStartTime} isPaused={gameState.isPaused} />}</div>
<div style={styles.actionPanelContent}>
<button onClick={() => socket?.emit("pay_jail_fine")} disabled={(currentPlayerMoney || 0) < 50 || isActionsDisabled} style={{...styles.btnSuccess, flex:1, opacity: (currentPlayerMoney || 0) >= 50 && !isActionsDisabled ? 1 : 0.5, cursor: (currentPlayerMoney || 0) >= 50 && !isActionsDisabled ? 'pointer' : 'not-allowed'}}>Заплатить $50</button>
<button onClick={handleRollDice} disabled={isActionsDisabled} style={{...styles.btnAction, flex:1, backgroundColor: '#fd7e14', opacity: isActionsDisabled ? 0.5 : 1, cursor: isActionsDisabled ? 'not-allowed' : 'pointer'}}>Бросить кубики (дубль)</button>
</div>
</div>
)}
{shouldShowBirthday && (
<div style={styles.actionPanel}>
<div style={styles.actionPanelHeader}><span style={{color:'#eee'}}>🎁 Подарок на день рождения</span>{gameState.turnStartTime && <TimerDisplay startTime={gameState.turnStartTime} isPaused={gameState.isPaused} />}</div>
<div style={styles.actionPanelContent}>
<button onClick={() => handleChooseBirthdayGift("money")} style={styles.btnSuccess}>Получить $100</button>
<button onClick={() => handleChooseBirthdayGift("ticket")} disabled={!gameState.activeAction?.data?.ticketsAvailable} style={{...styles.btnAction, backgroundColor: '#28a745', opacity: gameState.activeAction?.data?.ticketsAvailable ? 1 : 0.5, cursor: gameState.activeAction?.data?.ticketsAvailable ? 'pointer' : 'not-allowed'}}>Взять билет</button>
</div>
</div>
)}
{shouldShowBus && (
<div style={styles.actionPanel}>
<div style={styles.actionPanelHeader}><span style={{color:'#eee'}}>🚌 Выпал BUS</span>{gameState.turnStartTime && <TimerDisplay startTime={gameState.turnStartTime} isPaused={gameState.isPaused} />}</div>
<div style={styles.actionPanelContent}>
<button onClick={() => handleChooseBusAction("ticket")} disabled={!gameState.activeAction?.data?.ticketsAvailable}
style={{...styles.btnAction, backgroundColor: '#17a2b8', opacity: gameState.activeAction?.data?.ticketsAvailable ? 1 : 0.5, cursor: gameState.activeAction?.data?.ticketsAvailable ? 'pointer' : 'not-allowed'}}>
Взять билет
</button>
<button onClick={() => handleChooseBusAction("move")} style={styles.btnSuccess}>Перенестись на Шанс/Сундук</button>
</div>
</div>
)}
{(shouldShowActions || shouldShowForcedBalance) && (
  <div style={styles.actionPanel}>
    <div style={styles.actionPanelHeader}>
      <span style={{ 
        color: isBalancing ? '#ff6b6b' : '#eee',
        fontWeight: isBalancing ? 700 : 400 
      }}>
        {isBalancing 
          ? "⛔ Требуется выравнивание застройки" 
          : "Turn - Actions"}
      </span>
      {gameState.turnStartTime && <TimerDisplay startTime={gameState.turnStartTime} isPaused={gameState.isPaused} />}
    </div>

    {isBalancing && (
      <div style={{
        color: '#ffcc00', 
        fontSize: 13, 
        marginBottom: 10, 
        padding: '10px 12px',
        backgroundColor: 'rgba(255, 204, 0, 0.15)', 
        border: '1px solid rgba(255, 204, 0, 0.4)',
        borderRadius: 6, 
        lineHeight: 1.45
      }}>
        {balanceMessage}
      </div>
    )}

    <div style={styles.actionPanelContent}>
      <button 
        onClick={handleRollDice} 
        disabled={isActionsDisabled || isBalancing}
        style={{ 
          ...styles.btnAction, 
          backgroundColor: '#fd7e14', 
          opacity: (isActionsDisabled || isBalancing) ? 0.5 : 1, 
          cursor: (isActionsDisabled || isBalancing) ? 'not-allowed' : 'pointer' 
        }}
      >
        Roll
      </button>

      {hasTickets && !isBalancing && (
        <button 
          onClick={handleUseTicket} 
          disabled={isActionsDisabled}
          style={{ ...styles.btnAction, backgroundColor: '#28a745', opacity: isActionsDisabled ? 0.5 : 1 }}
        >
          Use Ticket
        </button>
      )}
    </div>
  </div>
)}
{shouldShowPostMove && (
<div style={styles.actionPanel}>
<div style={styles.actionPanelHeader}><span style={{color:'#eee'}}>Turn - Post-move</span>{gameState.turnStartTime && <TimerDisplay startTime={gameState.turnStartTime} isPaused={gameState.isPaused} />}</div>
<div style={styles.actionPanelContent}>
{gameState.activeAction?.type === "BUY" && (<><span style={{color:'#eee'}}>Buy?</span><button onClick={handleBuyProperty} disabled={!canAffordBuy} style={{ ...styles.btnSuccess, opacity: canAffordBuy ? 1 : 0.6, cursor: canAffordBuy ? 'pointer' : 'not-allowed' }}>Buy</button><button onClick={handleSkipAction} style={styles.btnSecondary}>Skip</button></>)}
{gameState.activeAction?.type === "PAY" && (<><span style={{color:'#eee'}}>Pay?</span><button onClick={handlePayDebt} disabled={!canAffordPay} style={{ ...styles.btnSuccess, opacity: canAffordPay ? 1 : 0.6, cursor: canAffordPay ? 'pointer' : 'not-allowed' }}>Pay</button><button onClick={handleSkipAction} style={styles.btnSecondary}>Skip</button></>)}
</div>
</div>
)}
{isTripleChoice && isMyTurn && !activeContract && (
<div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(17,17,17,0.95)', color: '#ff0', fontSize: '24px', fontWeight: 700, textAlign: 'center', padding: '40px 20px', borderRadius: 16, boxShadow: '0 0 30px rgba(255, 220, 0, 0.6)', textShadow: '0 0 15px #ff0', zIndex: 40, pointerEvents: 'none' }}>ТРОЙНОЙ ДУБЛЬ!<br />Выберите любую клетку</div>
)}
{isChooseAuction && isMyTurn && !activeContract && (
<div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(17,17,17,0.95)', color: '#00d4ff', fontSize: '24px', fontWeight: 700, textAlign: 'center', padding: '40px 20px', borderRadius: 16, boxShadow: '0 0 30px rgba(0, 212, 255, 0.6)', textShadow: '0 0 15px #00d4ff', zIndex: 40, pointerEvents: 'none' }}>ВЫБЕРИТЕ СОБСТВЕННОСТЬ ДЛЯ АУКЦИОНА</div>
)}
{!activeContract && !isTripleChoice && !isChooseAuction && !selectedCell && !shouldShowJail && !shouldShowBirthday && !shouldShowBus && (
<div style={styles.chatMessages}>{messages.map(m => <div key={m.id} style={{ fontSize: 12, color: m.isSystem ? '#888' : '#eee' }}>{m.text}</div>)}<div ref={chatEndRef} /></div>
)}
</div>
</div>
<div style={{ ...styles.sideColumn, ...(isTripleChoice || isChooseAuction ? { filter: 'brightness(0.65) saturate(0.7)' } : {}) }}>
{[4,5,6,7].map(i => {
const p = players[i] || null;
const ic = !!p && gameState?.players[gameState?.currentPlayerIndex]?.userId === p.userId;
const im = p && myProfile ? p.userId === myProfile.id : false;
return <PlayerCard key={p ? p.userId : `er${i}`} player={p} index={i} gameState={gameState} isCurrent={ic} isMyCard={im} isHost={isHost} isActive={activeCardIndex === i} isPaused={gameState?.isPaused} onClick={() => p && handleCardClick(i)} onProfile={handleOpenEditProfile} onViewProfile={handleViewOtherProfile} onLeave={handleLeaveFromMenu} onEndGame={handleEndGameFromMenu} onContract={() => p && handleOpenContractModal(p.userId)} roomStatus={roomStatus} />;
})}
</div>
</div>
</div>
)}
</div>
{auctionState && (
<div style={{
position: 'fixed',
top: 0, left: 0, right: 0, bottom: 0,
backgroundColor: 'rgba(0,0,0,0.85)',
display: 'flex', justifyContent: 'center', alignItems: 'center',
zIndex: 99999, borderRadius: 0, pointerEvents: 'auto'
}}>
<div style={styles.auctionModal}>
<div style={styles.auctionHeader}>
<span style={{color:'#eee'}}>🔨 Аукцион</span>
<span style={{ color: auctionTimer <= 3 ? '#dc3545' : '#999', fontWeight: 'bold' }}>{auctionTimer}s</span>
</div>
<div style={styles.auctionInfo}>
<div style={styles.auctionProp}>{board[auctionState.cellPosition]?.name}</div>
<div style={styles.auctionPrice}>Текущая ставка: <strong style={{color:'#28a745'}}>${auctionState.currentBid}</strong></div>
<div style={styles.auctionTurn}>Ход: <span style={{color:'#fd7e14'}}>{players.find(p=>p.userId===auctionState.currentBidderId)?.displayName || '...'}</span></div>
</div>
{auctionState.currentBidderId === myProfile?.id ? (
<div style={styles.auctionActions}>
<button onClick={() => socket?.emit("auction_bid")} disabled={!canBid}
style={{...styles.btnSuccess, flex:1, opacity: canBid ? 1 : 0.5, cursor: canBid ? 'pointer' : 'not-allowed'}}>+10</button>
<button onClick={() => socket?.emit("auction_drop")} style={{...styles.btnSecondary, flex:1, color:'#dc3545'}}>Отказаться</button>
</div>
) : (
<div style={{textAlign:'center', color:'#888', fontSize:13, padding:12}}>Ожидание хода...</div>
)}
</div>
</div>
)}
{isEditModalOpen && myProfile && (
<div style={styles.modalOverlay}><div style={styles.modal}><h2 style={{ marginTop: 0, marginBottom: 16, color:'#eee' }}>{myProfile.displayName}</h2><div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}><img src={myProfile.avatarUrl} alt="" style={{ width: 100, height: 100, borderRadius: '50%', border: '3px solid #0071e3', objectFit: 'cover' }} /></div><div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, padding: '16px', backgroundColor: '#2a2a2a', borderRadius: 10 }}><div style={{ display: 'flex', justifyContent: 'space-between', color:'#ccc' }}><span>Games:</span><strong>{myProfile.gamesPlayed}</strong></div><div style={{ display: 'flex', justifyContent: 'space-between', color:'#ccc' }}><span>Wins:</span><strong>{myProfile.wins}</strong></div><div style={{ display: 'flex', justifyContent: 'space-between', color:'#ccc' }}><span>Rate:</span><strong>{myProfile.gamesPlayed > 0 ? Math.round((myProfile.wins / myProfile.gamesPlayed) * 100) : 0}%</strong></div></div><div style={{ marginBottom: 20 }}><div style={styles.formGroup}><label style={{ fontSize: 13, color: '#aaa', marginBottom: 4 }}>Name</label><input value={editDisplayName} onChange={e => setEditDisplayName(e.target.value)} style={styles.input} /></div><div style={styles.formGroup}><label style={{ fontSize: 13, color: '#aaa', marginBottom: 4 }}>Avatar</label><input value={editAvatarUrl} onChange={e => setEditAvatarUrl(e.target.value)} style={styles.input} /></div></div><div style={styles.buttonGroup}><button onClick={handleSaveProfile} style={{ ...styles.btnPrimary, flex: 1 }}>Save</button><button onClick={() => setIsEditModalOpen(false)} style={{ ...styles.btnSecondary, flex: 1 }}>Cancel</button></div></div></div>
)}
{viewProfileModalOpen && viewingProfile && (
<div style={styles.modalOverlay} onClick={() => setViewProfileModalOpen(false)}><div style={styles.modal} onClick={e => e.stopPropagation()}><h2 style={{ marginTop: 0, marginBottom: 16, color:'#eee' }}>{viewingProfile.displayName}</h2><div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}><img src={viewingProfile.avatarUrl} alt="" style={{ width: 100, height: 100, borderRadius: '50%', border: '3px solid #0071e3', objectFit: 'cover' }} /></div><div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, padding: '16px', backgroundColor: '#2a2a2a', borderRadius: 10 }}><div style={{ display: 'flex', justifyContent: 'space-between', color:'#ccc' }}><span>Games:</span><strong>{viewingProfile.gamesPlayed}</strong></div><div style={{ display: 'flex', justifyContent: 'space-between', color:'#ccc' }}><span>Wins:</span><strong>{viewingProfile.wins}</strong></div><div style={{ display: 'flex', justifyContent: 'space-between', color:'#ccc' }}><span>Rate:</span><strong>{viewingProfile.gamesPlayed > 0 ? Math.round((viewingProfile.wins / viewingProfile.gamesPlayed) * 100) : 0}%</strong></div></div><button onClick={() => setViewProfileModalOpen(false)} style={{ ...styles.btnSecondary, width: '100%' }}>Close</button></div></div>
)}
</div>
);
}
export default App;