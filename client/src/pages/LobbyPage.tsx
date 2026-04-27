import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMonopoly } from '../hooks/useMonopoly';

const LobbyPage = () => {
  const navigate = useNavigate();
  const { 
    token, myProfile, authError, availableRooms,
    handleLogin, handleRegister, handleLogout, createRoom, fetchRooms 
  } = useMonopoly(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [createMode, setCreateMode] = useState<"CLASSIC" | "MEGA">("MEGA");

  if (!token) {
    return (
      <div style={styles.centerContainer}>
        <h2>Monopoly Login</h2>
        <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={styles.input} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={styles.input} />
        <div style={styles.row}>
          <button onClick={() => handleLogin(username, password)} style={styles.btnPrimary}>Login</button>
          <button onClick={() => handleRegister(username, password)} style={styles.btnSecondary}>Register</button>
        </div>
        {authError && <p style={{color:'red'}}>{authError}</p>}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.profilePreview}>
          <img src={myProfile?.avatarUrl} alt="" style={styles.avatarSmall} />
          <span>{myProfile?.displayName}</span>
        </div>
        <button onClick={handleLogout} style={styles.btnSmall}>Logout</button>
      </header>

      <div style={styles.lobbyContent}>
        <div style={styles.card}>
          <h3>Create Room</h3>
          <select value={createMode} onChange={e => setCreateMode(e.target.value as any)} style={styles.input}>
            <option value="MEGA">Mega Edition</option>
            <option value="CLASSIC">Classic</option>
          </select>
          <button onClick={() => {
            createRoom(createMode);
            // После создания комнаты мы не получаем событие здесь, так как сокет отключен.
            // Поэтому мы просто обновляем список комнат через 1 секунду и просим пользователя войти.
            setTimeout(() => fetchRooms(), 1000);
            alert("Room created! Please refresh and join.");
          }} style={styles.btnSuccess}>Create Room</button>
        </div>

        <div style={styles.card}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <h3>Available Rooms</h3>
            <button onClick={fetchRooms} style={styles.btnSmall}>Refresh 🔄</button>
          </div>
          <div style={styles.roomList}>
            {availableRooms.map(r => (
              <div key={r.id} style={styles.roomItem}>
                <div>
                  <span style={{...styles.badge, backgroundColor: r.mode==='MEGA'?'#ff9500':'#0071e3'}}>{r.mode}</span>
                  <span>{r.playerCount}/{r.maxPlayers} Players</span>
                </div>
                <button onClick={() => {
                  navigate(`/game/${r.id}`);
                }} disabled={r.status==='PLAYING'} style={styles.btnSecondary}>Join</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 800, margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#f5f5f7', minHeight: '100vh' },
  centerContainer: { maxWidth: 400, margin: '100px auto', padding: 20, backgroundColor: '#fff', borderRadius: 12, fontFamily: 'sans-serif' },
  header: { height: 60, backgroundColor: '#fff', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' },
  profilePreview: { display: 'flex', alignItems: 'center', gap: 10 },
  avatarSmall: { width: 32, height: 32, borderRadius: '50%' },
  lobbyContent: { padding: 20, display: 'flex', flexDirection: 'column', gap: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  roomList: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 },
  roomItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, backgroundColor: '#f9f9f9', borderRadius: 8 },
  input: { padding: 10, borderRadius: 6, border: '1px solid #ccc', width: '100%', boxSizing: 'border-box', marginBottom: 10 },
  row: { display: 'flex', gap: 10 },
  btnPrimary: { padding: '10px 20px', backgroundColor: '#0071e3', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
  btnSecondary: { padding: '10px 20px', backgroundColor: '#e2e6ea', border: 'none', borderRadius: 6, cursor: 'pointer' },
  btnSuccess: { padding: '10px 20px', backgroundColor: '#34c759', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
  btnSmall: { padding: '6px 12px', fontSize: 12, backgroundColor: 'transparent', color: '#0071e3', border: 'none', cursor: 'pointer' },
  badge: { fontSize: 10, padding: '2px 6px', borderRadius: 4, color: '#fff', marginRight: 5 },
};

export default LobbyPage;