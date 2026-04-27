import React, { useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMonopoly } from '../hooks/useMonopoly';

const PLAYER_COLORS = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FF33A8', '#33FFF5', '#F5FF33', '#FF8C33'];
const getGroupColor = (group?: string) => {
  switch(group) {
    case 'a': return '#8B4513'; case 'b': return '#87CEEB'; case 'c': return '#FF69B4';
    case 'd': return '#FFA500'; case 'e': return '#FF0000'; case 'f': return '#FFD700';
    case 'g': return '#008000'; case 'h': return '#00008B'; case 'station': return '#333';
    case 'utility': return '#666'; default: return '#CCC';
  }
};

const GamePage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  // true = сокет подключается
  const { 
    myProfile, roomId: currentRoomId, players, hostId, roomStatus, gameState, board, messages,
    handleLogout, startGame, rollDice, finishGame,
    isMyTurn, isHost, isInRoom, socket, joinRoom
  } = useMonopoly(true);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // АВТО-ВХОД: Когда сокет подключился и у нас есть roomId из URL, входим в комнату
  useEffect(() => {
    if (socket && roomId && !isInRoom) {
      console.log("[GAME PAGE] Attempting to join room:", roomId);
      joinRoom(roomId);
    }
  }, [socket, roomId, isInRoom, joinRoom]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLeave = () => {
    if (socket) socket.disconnect();
    navigate('/');
  };

  if (!isInRoom) {
    return (
      <div style={{padding: 20, textAlign: 'center', fontFamily: 'sans-serif'}}>
        <h2>Connecting to room...</h2>
        <p>Room ID: {roomId}</p>
        <button onClick={() => navigate('/')} style={{padding: '10px 20px', cursor: 'pointer'}}>Back to Lobby</button>
      </div>
    );
  }

  const leftPlayers = players.slice(0, 4);
  const rightPlayers = players.slice(4, 8);

  return (
    <div style={styles.gameContainer}>
      <header style={styles.header}>
        <div style={styles.profilePreview}>
          <img src={myProfile?.avatarUrl} alt="" style={styles.avatarSmall} />
          <span>{myProfile?.displayName}</span>
        </div>
        <div>
           <span style={{marginRight: 10, fontSize: 12, color: '#666'}}>Room: {currentRoomId?.substring(0,6)}</span>
           <button onClick={handleLeave} style={styles.btnSmall}>Leave Game</button>
        </div>
      </header>

      <div style={styles.gameLayout}>
        <div style={styles.sideColumn}>
          {leftPlayers.map((p, i) => (
            <PlayerCard key={p.userId} player={p} index={i} gameState={gameState} isCurrent={gameState?.players[gameState.currentPlayerIndex]?.userId === p.userId} />
          ))}
        </div>

        <div style={styles.centerColumn}>
          <div style={styles.boardView}>
             {board.map(cell => {
               const occupants = gameState?.players.filter(p => p.position === cell.position) || [];
               return (
                 <div key={cell.position} style={{...styles.cellRow, borderLeft: `4px solid ${getGroupColor(cell.group)}`}}>
                   <div style={{flex:1}}>
                     <strong>{cell.position}. {cell.name}</strong>
                     {cell.price && <span style={{fontSize:12, marginLeft:5}}>${cell.price}</span>}
                   </div>
                   <div style={{display:'flex', gap:2}}>
                     {occupants.map(p => {
                       const idx = players.findIndex(pl => pl.userId === p.userId);
                       return <div key={p.userId} style={{width:12, height:12, borderRadius:'50%', backgroundColor: PLAYER_COLORS[idx % PLAYER_COLORS.length]}} />
                     })}
                   </div>
                 </div>
               )
             })}
          </div>

          <div style={styles.chatBox}>
            <div style={styles.chatMessages}>
              {messages.map(m => (
                <div key={m.id} style={{fontSize:12, color: m.isSystem ? '#888' : '#333', fontStyle: m.isSystem?'italic':'normal'}}>
                  {m.text}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            
            <div style={styles.controlsArea}>
              {roomStatus === 'LOBBY' && isHost && <button onClick={startGame} style={styles.btnSuccess}>Start Game</button>}
              {roomStatus === 'PLAYING' && isMyTurn && <button onClick={rollDice} style={styles.btnAction}>Roll Dice 🎲</button>}
              {roomStatus === 'PLAYING' && isHost && <button onClick={finishGame} style={{...styles.btnSmall, color:'red'}}>End Game</button>}
              {roomStatus === 'PLAYING' && !isMyTurn && <span style={{fontSize:12, color:'#666'}}>Waiting for turn...</span>}
            </div>
          </div>
        </div>

        <div style={styles.sideColumn}>
          {rightPlayers.map((p, i) => (
            <PlayerCard key={p.userId} player={p} index={i + 4} gameState={gameState} isCurrent={gameState?.players[gameState.currentPlayerIndex]?.userId === p.userId} />
          ))}
        </div>
      </div>
    </div>
  );
};

const PlayerCard = ({ player, index, gameState, isCurrent }: any) => {
  const playerState = gameState?.players.find((p: any) => p.userId === player.userId);
  const isBankrupt = playerState?.isBankrupt;

  return (
    <div style={{
      ...styles.playerCard, 
      borderColor: isCurrent && !isBankrupt ? PLAYER_COLORS[index % PLAYER_COLORS.length] : 'transparent', 
      borderWidth: (isCurrent && !isBankrupt) ? 3 : 0,
      opacity: isBankrupt ? 0.4 : 1,
      filter: isBankrupt ? 'grayscale(100%)' : 'none',
      borderStyle: 'solid',
      backgroundColor: isBankrupt ? '#f0f0f0' : '#fff'
    }}>
      <div style={{display:'flex', alignItems:'center', gap:8}}>
        <div style={{width:10, height:10, borderRadius:'50%', backgroundColor: PLAYER_COLORS[index % PLAYER_COLORS.length], opacity: isBankrupt?0.3:1}} />
        <img src={player.avatarUrl} style={styles.avatarTiny} alt="" />
        <span style={{fontWeight:600, fontSize:14, textDecoration: isBankrupt ? 'line-through' : 'none'}}>{player.displayName}</span>
      </div>
      {gameState && (
        <div style={{fontSize:12, color: isBankrupt ? 'red' : '#666', marginTop:4, fontWeight: isBankrupt?'bold':'normal'}}>
          {isBankrupt ? "BANKRUPT" : `$${playerState.money}`}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  gameContainer: { display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f0f2f5' },
  header: { height: 60, backgroundColor: '#fff', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' },
  profilePreview: { display: 'flex', alignItems: 'center', gap: 10 },
  avatarSmall: { width: 32, height: 32, borderRadius: '50%' },
  avatarTiny: { width: 24, height: 24, borderRadius: '50%' },
  gameLayout: { flex: 1, display: 'flex', overflow: 'hidden' },
  sideColumn: { width: 220, padding: 10, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 },
  centerColumn: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fff', borderLeft: '1px solid #ddd', borderRight: '1px solid #ddd' },
  boardView: { flex: 1, overflowY: 'auto', padding: 10, backgroundColor: '#f9f9f9' },
  cellRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, backgroundColor: '#fff', marginBottom: 4, borderRadius: 4, fontSize: 13 },
  chatBox: { height: 250, borderTop: '1px solid #ddd', display: 'flex', flexDirection: 'column', backgroundColor: '#fff' },
  chatMessages: { flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 4 },
  controlsArea: { padding: 10, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, minHeight: 60 },
  playerCard: { backgroundColor: '#fff', padding: 10, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  btnSuccess: { padding: '10px 20px', backgroundColor: '#34c759', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
  btnAction: { padding: '12px 24px', backgroundColor: '#ff9500', color: '#fff', border: 'none', borderRadius: 20, fontSize: 16, fontWeight: 'bold', cursor: 'pointer' },
  btnSmall: { padding: '6px 12px', fontSize: 12, backgroundColor: 'transparent', color: '#0071e3', border: 'none', cursor: 'pointer' },
};

export default GamePage;