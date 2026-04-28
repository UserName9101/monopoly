import React, { useEffect, useState } from "react";
import { PieceToken, type PieceId } from "./components/PieceSelector";

const CORNER = 100;
const CELL = 55;
const GAP = 2;
const BOARD_SIZE = 2 * CORNER + 12 * CELL + 13 * GAP;
const OFFSET = CORNER + GAP;
const EDGE = BOARD_SIZE - CORNER;
const STEP = CELL + GAP;
const STRIP_SIZE = 6;

const PLAYER_COLORS = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FF33A8', '#33FFF5', '#F5FF33', '#FF8C33'];
const CORNER_INDICES = [0, 13, 26, 39];

type BoardCellProps = {
position: number; name: string; type: string; price?: number; group?: string; ownerId?: string; action?: string;
corner?: boolean; special?: boolean; line?: number; houses?: number; hasDepot?: boolean; isMortgaged?: boolean; mortgageTurnsRemaining?: number;
baseRent?: number; partialMonopolyRent?: number; monopolyRent?: number;
house1Rent?: number; house2Rent?: number; house3Rent?: number; house4Rent?: number;
hotelRent?: number; skyscraperRent?: number;
utilityMultiplier1?: number; utilityMultiplier2?: number; utilityMultiplier3?: number;
};

type Props = {
board: BoardCellProps[];
players: any[];
gameState: any;
onCellClick?: (cell: any) => void;
onCellRightClick?: (cell: any) => void;
highlightOffered?: number[];
highlightRequested?: number[];
validMoveTargets?: number[] | null;
currentPlayerPosition?: number;
isContractOpen?: boolean;
roomPieces?: Record<string, PieceId>;
};

function getCellStyle(index: number): React.CSSProperties {
if (index === 0) return { position: "absolute", top: EDGE, left: EDGE, width: CORNER, height: CORNER };
if (index === 13) return { position: "absolute", top: EDGE, left: 0, width: CORNER, height: CORNER };
if (index === 26) return { position: "absolute", top: 0, left: 0, width: CORNER, height: CORNER };
if (index === 39) return { position: "absolute", top: 0, left: EDGE, width: CORNER, height: CORNER };
if (index >= 1 && index <= 12) return { position: "absolute", top: EDGE, left: OFFSET + (12 - index) * STEP, width: CELL, height: CORNER };
if (index >= 14 && index <= 25) return { position: "absolute", top: OFFSET + (25 - index) * STEP, left: 0, width: CORNER, height: CELL };
if (index >= 27 && index <= 38) return { position: "absolute", top: 0, left: OFFSET + (index - 27) * STEP, width: CELL, height: CORNER };
return { position: "absolute", top: OFFSET + (index - 40) * STEP, left: EDGE, width: CORNER, height: CELL };
}

function getStripStyle(index: number, color: string): React.CSSProperties {
if (index >= 1 && index <= 12) return { position: "absolute", bottom: 0, left: 0, right: 0, height: STRIP_SIZE, background: color };
if (index >= 14 && index <= 25) return { position: "absolute", left: 0, top: 0, bottom: 0, width: STRIP_SIZE, background: color };
if (index >= 27 && index <= 38) return { position: "absolute", top: 0, left: 0, right: 0, height: STRIP_SIZE, background: color };
return { position: "absolute", right: 0, top: 0, bottom: 0, width: STRIP_SIZE, background: color };
}

const getGroupColor = (group?: string) => {
switch(group) {
case 'a': return '#8B4513'; case 'b': return '#87CEEB'; case 'c': return '#FF69B4'; case 'd': return '#FFA500';
case 'e': return '#FF0000'; case 'f': return '#FFD700'; case 'g': return '#008000'; case 'h': return '#00008B';
case 'station': return '#333'; case 'utility': return '#666'; default: return '#CCC';
}
};

function getMonopolyStatus(board: BoardCellProps[], ownerId: string, group: string): 'none' | 'partial' | 'full' {
const allInGroup = board.filter(c => c.group === group && c.type === 'PROPERTY');
if (allInGroup.length === 0) return 'none';
const ownedInGroup = allInGroup.filter(c => c.ownerId === ownerId && !c.isMortgaged).length;
const minForPartial = (group === 'a' || group === 'h') ? 2 : 3;
if (ownedInGroup === allInGroup.length) return 'full';
if (ownedInGroup >= minForPartial) return 'partial';
return 'none';
}

function calculateRentDisplay(cell: BoardCellProps, board: BoardCellProps[], ownerId: string): string {
if (cell.isMortgaged) return 'ЗАЛОЖЕНО';
if (!ownerId) return '';
if (cell.type === 'PROPERTY') {
const status = getMonopolyStatus(board, ownerId, cell.group || '');
const houses = cell.houses || 0;
if (houses === 0) {
if (status === 'full') return String(cell.monopolyRent ?? cell.baseRent ?? 0);
if (status === 'partial') return String(cell.partialMonopolyRent ?? (cell.baseRent ? cell.baseRent * 2 : 0));
return String(cell.baseRent ?? 0);
}
if (houses === 1) return String(cell.house1Rent ?? 0);
if (houses === 2) return String(cell.house2Rent ?? 0);
if (houses === 3) return String(cell.house3Rent ?? 0);
if (houses === 4) return String(cell.house4Rent ?? 0);
if (houses === 5) return String(cell.hotelRent ?? 0);
if (houses >= 6) return String(cell.skyscraperRent ?? 0);
return '';
}
if (cell.type === 'STATION') {
const count = board.filter(c => c.group === 'station' && c.ownerId === ownerId && !c.isMortgaged).length;
const rents = [25, 50, 100, 200];
const baseRent = rents[Math.min(count, 4) - 1] ?? 0;
return `$${cell.hasDepot ? baseRent * 2 : baseRent}`;
}
if (cell.type === 'UTILITY') {
const count = board.filter(c => c.group === 'utility' && c.ownerId === ownerId && !c.isMortgaged).length;
const mult = count === 1 ? cell.utilityMultiplier1 : count === 2 ? cell.utilityMultiplier2 : (cell.utilityMultiplier3 ?? 10);
return `x${mult}`;
}
return '';
}

function getCellIndicators(houses?: number, hasDepot?: boolean, isMortgaged?: boolean, mortgageTurns?: number): { building: string; mortgage: string } {
if (isMortgaged) return { building: '', mortgage: mortgageTurns !== undefined ? `🔒 ${mortgageTurns} ходов` : '🔒' };
if (hasDepot) return { building: '🚉', mortgage: '' };
if (!houses || houses === 0) return { building: '', mortgage: '' };
if (houses <= 4) return { building: '🏠'.repeat(houses), mortgage: '' };
if (houses === 5) return { building: '🏨', mortgage: '' };
return { building: '🏙️', mortgage: '' };
}

export default function Board({ board, players, gameState, onCellClick, onCellRightClick, highlightOffered = [], highlightRequested = [], validMoveTargets, currentPlayerPosition, isContractOpen = false, roomPieces = {} }: Props) {
const [animatedPlayers, setAnimatedPlayers] = useState<Record<string, number>>({});

useEffect(() => {
if (!gameState?.players) return;
gameState.players.forEach((player: any) => {
const currentVisual = animatedPlayers[player.userId] ?? player.position;
const target = player.position;
if (currentVisual !== target) {
const timer = setTimeout(() => {
setAnimatedPlayers(prev => ({ ...prev, [player.userId]: target }));
}, 50);
return () => clearTimeout(timer);
}
});
}, [gameState?.players, animatedPlayers]);

const getPlayerVisualPosition = (player: any) => {
return animatedPlayers[player.userId] ?? player.position;
};

const getCellCenter = (index: number) => {
const style = getCellStyle(index);
const w = typeof style.width === 'number' ? style.width : CELL;
const h = typeof style.height === 'number' ? style.height : CELL;
const left = typeof style.left === 'number' ? style.left : 0;
const top = typeof style.top === 'number' ? style.top : 0;
return { x: left + w / 2, y: top + h / 2 };
};

if (!board || board.length === 0) return null;

return (
<div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', boxSizing: 'border-box' }}>
{board.map((cell, i) => {
const occupants = gameState?.players?.filter((p: any) => p.position === cell.position) || [];
const isCorner = CORNER_INDICES.includes(i);
const hasStrip = cell.group && !isCorner;
const isOffered = highlightOffered.includes(cell.position);
const isRequested = highlightRequested.includes(cell.position);
const ownerIdx = cell.ownerId ? players.findIndex((p: any) => p.userId === cell.ownerId) : -1;
const ownerColor = ownerIdx !== -1 ? PLAYER_COLORS[ownerIdx % PLAYER_COLORS.length] : null;
const isSpecialMoveMode = !!validMoveTargets;
const isValidTarget = !isSpecialMoveMode || validMoveTargets!.includes(cell.position);
const hasImprovements = (cell.houses || 0) > 0 || cell.hasDepot;
const isContractDarkened = isContractOpen && hasImprovements;
const contentPadding = hasStrip ? (i >= 1 && i <= 12 ? `0 2px ${STRIP_SIZE + 2}px` : i >= 14 && i <= 25 ? `${STRIP_SIZE + 2}px 2px 2px ${STRIP_SIZE + 2}px` : i >= 27 && i <= 38 ? `${STRIP_SIZE + 2}px 2px 2px` : `2px ${STRIP_SIZE + 2}px 2px 2px`) : "2px";
const displayValue = calculateRentDisplay(cell, board, cell.ownerId || '');
const indicators = getCellIndicators(cell.houses, cell.hasDepot, cell.isMortgaged, cell.mortgageTurnsRemaining);
return (
<div
key={cell.position ?? i}
onClick={() => !isContractDarkened && onCellClick?.(cell)}
onContextMenu={(e) => { e.preventDefault(); onCellRightClick?.(cell); }}
style={{
...getCellStyle(i),
background: isOffered ? '#FFD700' : isRequested ? '#00BFFF' : (ownerColor || '#fff'),
border: isOffered ? '2px solid #B8860B' : isRequested ? '2px solid #007BFF' : (ownerColor ? `2px solid ${ownerColor}` : '1px solid #ccc'),
boxSizing: "border-box",
display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
padding: contentPadding, textAlign: "center", overflow: "hidden",
cursor: onCellClick ? (isContractDarkened ? 'not-allowed' : (isSpecialMoveMode && !isValidTarget ? 'default' : 'pointer')) : 'default',
filter: isContractDarkened ? 'grayscale(1) brightness(0.4)' : ((isSpecialMoveMode && !isValidTarget) || cell.isMortgaged ? 'grayscale(60%)' : 'none'),
opacity: isContractDarkened ? 0.3 : (isSpecialMoveMode && !isValidTarget ? 0.5 : (cell.isMortgaged ? 0.7 : 1)),
pointerEvents: isContractDarkened || (isSpecialMoveMode && !isValidTarget) ? 'none' : 'auto',
transition: 'all 0.15s ease', zIndex: (isOffered || isRequested) ? 5 : 1,
backgroundImage: cell.isMortgaged ? 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(220,53,69,0.15) 8px, rgba(220,53,69,0.15) 16px)' : 'none'
}}
>
{hasStrip && <div style={getStripStyle(i, getGroupColor(cell.group))} />}
<div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", flex: 1 }}>
<div style={{ fontWeight: 600, fontSize: isCorner ? 10 : 8, lineHeight: 1.1, wordBreak: "break-word", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: ownerColor && ['h','g','e','d'].includes(ownerColor?.toLowerCase()) ? '#fff' : '#333' }}>{cell.name}</div>
<div style={{ fontSize: isCorner ? 9 : 7, opacity: 0.8, marginTop: 1, color: ownerColor ? '#fff' : '#333', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
{displayValue && <span>{displayValue}</span>}
{indicators.building && <span style={{ fontSize: 10, letterSpacing: 1 }}>{indicators.building}</span>}
{indicators.mortgage && <span style={{ fontSize: 8, color: '#dc3545', fontWeight: 'bold', marginTop: 1 }}>{indicators.mortgage}</span>}
</div>
</div>
<div style={{ position: "absolute", bottom: 4, left: 4, display: "flex", gap: 2, flexWrap: "wrap", zIndex: 1 }}>
{occupants.map((p: any) => {
const idx = players.findIndex((pl: any) => pl.userId === p.userId);
const pieceId = roomPieces[p.userId] || 'hat';
return <PieceToken key={p.userId} pieceId={pieceId} color={PLAYER_COLORS[idx % PLAYER_COLORS.length]} size={14} />;
})}
</div>
</div>
);
})}
<div style={{ position: "absolute", top: CORNER, left: CORNER, width: BOARD_SIZE - CORNER * 2, height: BOARD_SIZE - CORNER * 2, pointerEvents: "none", backgroundColor: '#cde6d0', borderRadius: 0 }} />
{gameState?.players?.map((player: any, idx: number) => {
const visualPos = getPlayerVisualPosition(player);
const center = getCellCenter(visualPos);
const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
return (
<div
key={`token-${player.userId}`}
style={{
position: "absolute",
left: center.x - 10,
top: center.y - 10,
width: 20,
height: 20,
borderRadius: "50%",
backgroundColor: color,
border: "2px solid white",
boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
display: "flex",
alignItems: "center",
justifyContent: "center",
fontSize: "10px",
fontWeight: "bold",
color: "#111",
zIndex: 100,
transition: "left 0.6s cubic-bezier(0.25, 0.1, 0.25, 1), top 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)",
pointerEvents: "none",
}}
title={players.find(p => p.userId === player.userId)?.displayName}
>
{idx + 1}
</div>
);
})}
</div>
);
}