// client/src/components/PlayerCard.tsx
import { useState, useEffect } from "react";
import type { GameState, RoomPlayer, PlayerState } from "../types";
import { styles } from "../styles";
const PLAYER_COLORS = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FF33A8', '#33FFF5', '#F5FF33', '#FF8C33'];
const TURN_TIME_MS = 90000;
interface Props {
player: RoomPlayer | null;
index: number;
gameState: GameState | null;
isCurrent: boolean;
isMyCard: boolean;
isHost: boolean;
isActive: boolean;
isPaused?: boolean;
roomStatus: string;
onClick: () => void;
onProfile: () => void;
onViewProfile: (userId: string) => void;
onLeave: () => void;
onEndGame: () => void;
onContract: (userId: string) => void;
onSurrender: () => void;
}
export default function PlayerCard({
player, index, gameState, isCurrent, isMyCard, isHost, isActive, isPaused, roomStatus,
onClick, onProfile, onViewProfile, onLeave, onEndGame, onContract, onSurrender
}: Props) {
const [tl, setTl] = useState<number | null>(null);
if (!player) return <div style={{ ...styles.playerCard, borderColor: 'transparent', borderWidth: 0, opacity: 0.08, backgroundColor: '#222', boxShadow: 'none', cursor: 'default' }} />;
const ps = gameState?.players.find((x: PlayerState) => x.userId === player.userId);
const bk = ps?.isBankrupt;
useEffect(() => {
if (!isCurrent || !gameState?.turnStartTime) { setTl(null); return; }
if (isPaused) return;
const u = () => setTl(Math.max(0, Math.ceil((TURN_TIME_MS - (Date.now() - gameState.turnStartTime!)) / 1000)));
u();
const i = setInterval(u, 1000);
return () => clearInterval(i);
}, [isCurrent, gameState?.turnStartTime, isPaused]);
const lc = index < 4;
return (
<div className="player-card" onClick={onClick} style={{ ...styles.playerCard, borderColor: isCurrent && !bk ? PLAYER_COLORS[index % PLAYER_COLORS.length] : 'transparent', borderWidth: isCurrent && !bk ? 3 : 0, opacity: bk ? 0.4 : 1, filter: bk ? 'grayscale(100%)' : 'none', borderStyle: 'solid', backgroundColor: bk ? '#2a2a2a' : '#2c2c2e', cursor: 'pointer', position: 'relative', zIndex: isActive ? 10 : 1 }}>
<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
<div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: PLAYER_COLORS[index % PLAYER_COLORS.length], opacity: bk ? 0.3 : 1 }} />
<img src={player.avatarUrl} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} alt="" />
<span style={{ fontWeight: 600, fontSize: 14, textDecoration: bk ? 'line-through' : 'none', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color:'#eee' }}>{player.displayName}</span>
</div>
<div style={{ fontSize: 12, color: bk ? '#dc3545' : '#aaa', marginTop: 8, fontWeight: bk ? 'bold' : 'normal', display: 'flex', justifyContent: 'space-between' }}>
{bk ? "BANKRUPT" : `$${ps?.money.toLocaleString()} | Bus: ${ps?.busTickets || 0}`}
{isCurrent && !bk && tl !== null && <span style={{ color: isPaused ? '#888' : (tl <= 5 ? '#dc3545' : '#eee'), fontWeight: 'bold', backgroundColor: tl <= 5 ? 'rgba(220,53,69,0.1)' : 'transparent', padding: '2px 6px', borderRadius: 4 }}>{isPaused ? 'PAUSED' : `${tl}s`}</span>}
</div>
{isActive && (
<div className="player-menu" style={{ ...styles.playerMenu, [lc ? 'left' : 'right']: 'calc(100% + 10px)', top: 0 }} onClick={e => e.stopPropagation()}>
<div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #444', color: '#eee' }}>{player.displayName}</div>
{isMyCard && (
<>
<button onClick={(e: any) => { e.stopPropagation(); onProfile(); }} style={styles.menuBtn}>Edit</button>
<button onClick={(e: any) => { e.stopPropagation(); onLeave(); }} style={{ ...styles.menuBtn, color: '#dc3545' }}>Leave</button>
{roomStatus === 'PLAYING' && !bk && (
  <button onClick={(e: any) => { e.stopPropagation(); if (window.confirm('Сдаться и стать наблюдателем?')) onSurrender(); }} style={{ ...styles.menuBtn, color: '#ff6b6b', fontWeight: 700, borderColor: '#ff6b6b', border: '1px solid #ff6b6b' }}>Сдаться</button>
)}
</>
)}
{!isMyCard && !bk && (
<>
<button onClick={(e: any) => { e.stopPropagation(); onViewProfile(player.userId); }} style={styles.menuBtn}>Profile</button>
<button onClick={(e: any) => { e.stopPropagation(); onContract(player.userId); }} style={styles.menuBtn}>Contract</button>
</>
)}
</div>
)}
</div>
);
}