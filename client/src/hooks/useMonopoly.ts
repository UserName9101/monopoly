import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

// --- ТИПЫ ---
type UserProfile = { id: string; username: string; displayName: string; avatarUrl: string; gamesPlayed: number; wins: number; };
type RoomPlayer = { userId: string; socketId: string; displayName: string; avatarUrl: string; isOnline: boolean; };
type PlayerState = { userId: string; position: number; money: number; isBankrupt: boolean; };
type GameState = { players: PlayerState[]; currentPlayerIndex: number; };
type CellType = 'PROPERTY' | 'STATION' | 'UTILITY' | 'TAX' | 'SPECIAL' | 'CHEST' | 'CHANCE';
type BoardCell = { position: number; name: string; type: CellType; price?: number; baseRent?: number; group?: string; ownerId?: string; };
type RoomStatus = "LOBBY" | "PLAYING";
type RoomPayload = { id: string; players: RoomPlayer[]; hostId: string; status: RoomStatus; settings: any; board: BoardCell[]; };
type RoomSummary = { id: string; playerCount: number; maxPlayers: number; mode: string; status: RoomStatus; playersPreview: any[]; };
type ChatMessage = { id: string; text: string; isSystem?: boolean; timestamp: number; };

export function useMonopoly(isGamePage: boolean) {
  const [token, setToken] = useState<string>(() => localStorage.getItem("token") || "");
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState("");

  const [roomId, setRoomId] = useState<string>("");
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [hostId, setHostId] = useState<string>("");
  const [roomStatus, setRoomStatus] = useState<RoomStatus>("LOBBY");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [board, setBoard] = useState<BoardCell[]>([]);
  const [availableRooms, setAvailableRooms] = useState<RoomSummary[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // 1. Управление сокетом
  useEffect(() => {
    if (!token) {
      if (socket) socket.disconnect();
      setSocket(null);
      return;
    }

    // Подключаем сокет ТОЛЬКО если мы на странице игры
    if (!isGamePage) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    console.log("[HOOK] Connecting socket...");
    const newSocket = io("http://localhost:3000", { auth: { token } });
    setSocket(newSocket);

    newSocket.on("connect_error", (err) => {
      console.error("Socket error:", err.message);
      if (err.message === "Invalid token") {
        handleLogout();
        setAuthError("Session expired");
      }
    });

    return () => {
      console.log("[HOOK] Disconnecting socket...");
      newSocket.disconnect();
      setSocket(null);
    };
  }, [token, isGamePage]);

  // 2. Fetch данных (профиль, комнаты)
  useEffect(() => {
    if (token) {
      fetchMyProfile();
      fetchRooms();
      const interval = setInterval(fetchRooms, 5000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // 3. Листенеры событий
  useEffect(() => {
    if (!socket) return;

    const onRoomCreated = (room: RoomPayload) => {
      console.log("[HOOK] Room Created:", room.id);
      setRoomId(room.id);
      setPlayers(room.players);
      setHostId(room.hostId);
      setRoomStatus(room.status);
      setBoard(room.board);
      setMessages([]);
      addLog(`Room created: ${room.settings.mode}`);
    };

    const onRoomJoined = (room: RoomPayload) => {
      console.log("[HOOK] Room Joined:", room.id);
      setRoomId(room.id);
      setPlayers(room.players);
      setHostId(room.hostId);
      setRoomStatus(room.status);
      setBoard(room.board);
      setMessages([]);
      addLog(`Joined room.`);
    };

    const onRoomUpdated = (room: RoomPayload) => {
      setPlayers(room.players);
      setHostId(room.hostId);
      setRoomStatus(room.status);
      // Обновляем доску, если она пришла (например, при реконнекте)
      if (room.board) setBoard(room.board);
    };

    const onStateUpdate = (state: GameState) => setGameState(state);
    
    const onGameStarted = (state: GameState) => {
      setGameState(state);
      setRoomStatus("PLAYING");
      addLog("Game Started!");
    };
    
    const onGameFinished = () => {
      alert("Game Finished!");
      setRoomId("");
      setPlayers([]);
      setGameState(null);
      setBoard([]);
      fetchMyProfile();
    };
    
    const onJoinError = (msg: string) => {
      alert(msg);
      // Если ошибка входа, возможно, стоит вернуться в лобби? Пока просто алерт.
    };

    socket.on("room_created", onRoomCreated);
    socket.on("room_joined", onRoomJoined);
    socket.on("room_updated", onRoomUpdated);
    socket.on("state_update", onStateUpdate);
    socket.on("game_started", onGameStarted);
    socket.on("game_finished", onGameFinished);
    socket.on("join_error", onJoinError);

    return () => {
      socket.off("room_created", onRoomCreated);
      socket.off("room_joined", onRoomJoined);
      socket.off("room_updated", onRoomUpdated);
      socket.off("state_update", onStateUpdate);
      socket.off("game_started", onGameStarted);
      socket.off("game_finished", onGameFinished);
      socket.off("join_error", onJoinError);
    };
  }, [socket]);

  // 4. АВТО-ВХОД В КОМНАТУ ПРИ ПЕРЕХОДЕ НА СТРАНИЦУ ИГРЫ
  useEffect(() => {
    // Мы должны получить roomId извне (через пропсы или контекст), но хук изолирован.
    // Поэтому мы добавим метод joinRoom, который вызовет GamePage.
    // Но чтобы избежать дублирования вызовов, мы можем сделать это здесь, если передадим roomId в хук.
    // Для простоты оставим вызов joinRoom в GamePage, но убедимся, что сокет готов.
  }, [socket]);


  // --- Helpers ---
  const fetchMyProfile = async () => {
    try {
      const res = await fetch("http://localhost:3000/me", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setMyProfile(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchRooms = async () => {
    try {
      const res = await fetch("http://localhost:3000/rooms");
      if (res.ok) setAvailableRooms(await res.json());
    } catch (e) { console.error(e); }
  };

  const addLog = (text: string, isSystem = true) => {
    setMessages(prev => [...prev, { id: Math.random().toString(), text, isSystem, timestamp: Date.now() }]);
  };

  const handleLogin = async (username: string, password: string) => {
    try {
      const res = await fetch("http://localhost:3000/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem("token", data.token);
      setToken(data.token);
    } catch (err: any) { setAuthError(err.message); }
  };

  const handleRegister = async (username: string, password: string) => {
    try {
      const res = await fetch("http://localhost:3000/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert("Registered! Please login.");
    } catch (err: any) { setAuthError(err.message); }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setMyProfile(null);
    setRoomId("");
    setPlayers([]);
    setGameState(null);
    setBoard([]);
    setMessages([]);
    setAvailableRooms([]);
    if (socket) socket.disconnect();
  };

  const updateProfile = async (displayName: string, avatarUrl: string) => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:3000/profile", {
        method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ displayName, avatarUrl })
      });
      if (res.ok) fetchMyProfile();
    } catch (e) { console.error(e); }
  };

  const createRoom = (mode: "CLASSIC" | "MEGA") => {
    const maxPlayers = mode === "CLASSIC" ? 4 : 8;
    socket?.emit("create_room", { mode, maxPlayers });
  };

  const joinRoom = (id: string) => {
    console.log("[HOOK] Emitting join_room:", id);
    socket?.emit("join_room", id);
  };

  const startGame = () => socket?.emit("start_game");
  const rollDice = () => {
    socket?.emit("roll_dice");
    addLog("Rolling dice...", false);
  };
  const finishGame = () => socket?.emit("finish_game");

  return {
    token, myProfile, authError,
    roomId, players, hostId, roomStatus, gameState, board, messages, availableRooms,
    handleLogin, handleRegister, handleLogout, updateProfile,
    createRoom, joinRoom, startGame, rollDice, finishGame, fetchRooms,
    isMyTurn: gameState && myProfile ? gameState.players[gameState.currentPlayerIndex]?.userId === myProfile.id : false,
    isHost: players.some(p => p.userId === myProfile?.id && p.socketId === hostId),
    isInRoom: !!roomId,
    socket
  };
}