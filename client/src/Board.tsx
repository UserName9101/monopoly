import React, { useEffect, useState } from "react";
import { PieceToken, type PieceId } from "./components/PieceSelector";

const CORNER = 100;
const CELL = 55;
const GAP = 2;
const BOARD_SIZE = 2 * CORNER + 12 * CELL + 13 * GAP;
const OFFSET = CORNER + GAP;
const EDGE = BOARD_SIZE - CORNER;
const STEP = CELL + GAP;
const STRIP_SIZE = 20;

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
if (index === 0) return { position: "absolute", top: 0, left: 0, width: CORNER, height: CORNER };
if (index === 13) return { position: "absolute", top: 0, left: EDGE, width: CORNER, height: CORNER };
if (index === 26) return { position: "absolute", top: EDGE, left: EDGE, width: CORNER, height: CORNER };
if (index === 39) return { position: "absolute", top: EDGE, left: 0, width: CORNER, height: CORNER };
// сторона 0→13: верхняя, слева направо
if (index >= 1 && index <= 12) return { position: "absolute", top: 0, left: OFFSET + (index - 1) * STEP, width: CELL, height: CORNER };
// сторона 13→26: правая, сверху вниз
if (index >= 14 && index <= 25) return { position: "absolute", top: OFFSET + (index - 14) * STEP, left: EDGE, width: CORNER, height: CELL };
// сторона 26→39: нижняя, справа налево
if (index >= 27 && index <= 38) return { position: "absolute", top: EDGE, left: OFFSET + (38 - index) * STEP, width: CELL, height: CORNER };
// сторона 39→0: левая, снизу вверх
return { position: "absolute", top: OFFSET + (51 - index) * STEP, left: 0, width: CORNER, height: CELL };
}

function getStripStyle(index: number, color: string): React.CSSProperties {
if (index >= 1 && index <= 12) return { position: "absolute", top: 0, left: 0, right: 0, height: STRIP_SIZE, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: "bold", color: "#fff", textShadow: "0 0 2px rgba(0,0,0,0.8)", whiteSpace: "pre-line", lineHeight: "1.1" };
if (index >= 14 && index <= 25) return { position: "absolute", right: 0, top: 0, bottom: 0, width: STRIP_SIZE, background: color, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: "bold", color: "#fff", textShadow: "0 0 2px rgba(0,0,0,0.8)", writingMode: "vertical-rl", whiteSpace: "pre-line", lineHeight: "1.1" };
if (index >= 27 && index <= 38) return { position: "absolute", bottom: 0, left: 0, right: 0, height: STRIP_SIZE, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: "bold", color: "#fff", textShadow: "0 0 2px rgba(0,0,0,0.8)", whiteSpace: "pre-line", lineHeight: "1.1" };
return { position: "absolute", left: 0, top: 0, bottom: 0, width: STRIP_SIZE, background: color, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: "bold", color: "#fff", textShadow: "0 0 2px rgba(0,0,0,0.8)", writingMode: "vertical-rl", whiteSpace: "pre-line", lineHeight: "1.1" };
}

function getInnerEdgeStyle(index: number): React.CSSProperties {
  // Ребро смотрящее ВНУТРЬ поля — противоположно полоске группы
  // Звёзды сдвинуты так, что половина выходит за клетку (ребро проходит через середину звезды)
  // Верхняя сторона (1–12): полоска top, внутрь = bottom
  if (index >= 1 && index <= 12) return {
    position: "absolute", bottom: -9, left: 0, right: 0, height: 14,
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 2, zIndex: 10, pointerEvents: "none",
  };
  // Правая сторона (14–25): полоска right, внутрь = left
  if (index >= 14 && index <= 25) return {
    position: "absolute", left: -9, top: 0, bottom: 0, width: 14,
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", gap: 2, zIndex: 10, pointerEvents: "none",
  };
  // Нижняя сторона (27–38): полоска bottom, внутрь = top
  if (index >= 27 && index <= 38) return {
    position: "absolute", top: -9, left: 0, right: 0, height: 14,
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 2, zIndex: 10, pointerEvents: "none",
  };
  // Левая сторона (40–51): полоска left, внутрь = right
  return {
    position: "absolute", right: -9, top: 0, bottom: 0, width: 14,
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", gap: 2, zIndex: 10, pointerEvents: "none",
  };
}

const getGroupColor = (group?: string) => {
switch(group) {
case 'a': return '#8B4513'; case 'b': return '#87CEEB'; case 'c': return '#FF69B4'; case 'd': return '#FFA500';
case 'e': return '#FF0000'; case 'f': return '#FFD700'; case 'g': return '#008000'; case 'h': return '#00008B';
case 'station': return '#333'; case 'utility': return '#666'; default: return '#CCC';
}
};

function formatStripText(priceValue: number, displayValue: string): string {
if (!displayValue && !priceValue) return '';
if (displayValue) return displayValue;
if (priceValue) return String(priceValue);
return '';
}

function getPlayerGradient(color: string): string {
  // Создаем градиент от цвета к немного более темному оттенку того же цвета
  // Это добавляет визуальную глубину, но вся клетка остается в цвете игрока
  return `linear-gradient(135deg, ${color} 0%, ${adjustColorBrightness(color, -15)} 100%)`;
}

function adjustColorBrightness(hex: string, percent: number): string {
  // Убираем # и парсим RGB компоненты
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  // Затемняем или осветляем на процент
  const factor = percent / 100;
  const newR = Math.max(0, Math.min(255, Math.round(r + (r * factor))));
  const newG = Math.max(0, Math.min(255, Math.round(g + (g * factor))));
  const newB = Math.max(0, Math.min(255, Math.round(b + (b * factor))));
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

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
return String(cell.hasDepot ? baseRent * 2 : baseRent);
}
if (cell.type === 'UTILITY') {
const count = board.filter(c => c.group === 'utility' && c.ownerId === ownerId && !c.isMortgaged).length;
const mult = count === 1 ? cell.utilityMultiplier1 : count === 2 ? cell.utilityMultiplier2 : (cell.utilityMultiplier3 ?? 10);
return `x${mult}`;
}
return '';
}

const STAR = "M12 2l2.09 6.26h6.63l-5.45 3.87 2.09 6.26L12 14.5l-5.36 3.89 2.09-6.26L3.28 8.26h6.63z";

function BuildingStars({ houses, hasDepot }: { houses?: number; hasDepot?: boolean }) {
  const h = houses || 0;

  if (h === 0 && !hasDepot) return null;

  // Небоскрёб — одна крупная аметистовая звезда (увеличена в 3 раза: 18*3=54)
  if (h >= 6) return (
    <svg width={54} height={54} viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 0 4px #9B30FF)', flexShrink: 0 }}>
      <path d={STAR} fill="#9B30FF" />
    </svg>
  );

  // Отель или депо — одна золотая звезда (увеличена в 3 раза: 11*3=33)
  if (h === 5 || hasDepot) return (
    <svg width={33} height={33} viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 0 3px #FFD700)', flexShrink: 0 }}>
      <path d={STAR} fill="#FFD700" />
    </svg>
  );

  // 1–4 дома — маленькие серые звёзды (увеличены в 3 раза: 6*3=18)
  return (
    <div style={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      {Array.from({ length: h }).map((_, i) => (
        <svg key={i} width={18} height={18} viewBox="0 0 24 24">
          <path d={STAR} fill="#777" />
        </svg>
      ))}
    </div>
  );
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
const ownerGradient = ownerColor ? getPlayerGradient(ownerColor) : null;
const isSpecialMoveMode = !!validMoveTargets;
const isValidTarget = !isSpecialMoveMode || validMoveTargets!.includes(cell.position);
const hasImprovements = (cell.houses || 0) > 0 || cell.hasDepot;
const isContractDarkened = isContractOpen && hasImprovements;
const contentPadding = hasStrip ? (i >= 1 && i <= 12 ? `${STRIP_SIZE + 2}px 2px 0` : i >= 14 && i <= 25 ? `2px ${STRIP_SIZE + 2}px 2px 2px` : i >= 27 && i <= 38 ? `2px 2px ${STRIP_SIZE + 2}px` : `2px 2px 2px ${STRIP_SIZE + 2}px`) : "2px";
const displayValue = calculateRentDisplay(cell, board, cell.ownerId || '');
const priceValue = cell.price ?? 0;
const stripText = formatStripText(priceValue, displayValue);
return (
<div
key={cell.position ?? i}
onClick={() => !isContractDarkened && onCellClick?.(cell)}
onContextMenu={(e) => { e.preventDefault(); onCellRightClick?.(cell); }}
style={{
...getCellStyle(i),
background: isOffered ? '#FFD700' : isRequested ? '#00BFFF' : (ownerGradient || '#fff'),
border: isOffered ? '2px solid #B8860B' : isRequested ? '2px solid #007BFF' : (ownerColor ? `2px solid ${ownerColor}` : '1px solid #ccc'),
boxSizing: "border-box",
display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
padding: contentPadding, textAlign: "center", overflow: "hidden",
cursor: onCellClick ? (isContractDarkened ? 'not-allowed' : (isSpecialMoveMode && !isValidTarget ? 'default' : 'pointer')) : 'default',
filter: isContractDarkened ? 'grayscale(1) brightness(0.4)' : ((isSpecialMoveMode && !isValidTarget) || cell.isMortgaged ? 'grayscale(60%)' : 'none'),
opacity: isContractDarkened ? 0.3 : (isSpecialMoveMode && !isValidTarget ? 0.5 : (cell.isMortgaged ? 0.7 : 1)),
pointerEvents: isContractDarkened || (isSpecialMoveMode && !isValidTarget) ? 'none' : 'auto',
transition: 'all 0.15s ease', zIndex: (isOffered || isRequested) ? 5 : 1,
backgroundImage: cell.isMortgaged ? 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(220,53,69,0.15) 8px, rgba(220,53,69,0.15) 16px)' : (ownerGradient || 'none')
}}
>
{hasStrip && <div style={getStripStyle(i, getGroupColor(cell.group))}>{stripText}</div>}
{hasStrip && !isCorner && (cell.houses || cell.hasDepot) && (
  <div style={getInnerEdgeStyle(i)}>
    <BuildingStars houses={cell.houses} hasDepot={cell.hasDepot} />
  </div>
)}
<div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", flex: 1 }}>
<div style={{ fontWeight: 600, fontSize: isCorner ? 10 : 8, lineHeight: 1.1, wordBreak: "break-word", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: ownerColor && ['h','g','e','d'].includes(ownerColor?.toLowerCase()) ? '#fff' : '#333' }}>{cell.name}</div>
{cell.isMortgaged && (
  <span style={{ fontSize: 8, color: '#dc3545', fontWeight: 'bold', marginTop: 1 }}>
    🔒 {cell.mortgageTurnsRemaining ?? ''}
  </span>
)}
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
const pieceId = (roomPieces[player.userId] as PieceId) || "hat";
const TOKEN_SIZE = 32;
const displayName = players.find(p => p.userId === player.userId)?.displayName;
return (
<div
key={`token-${player.userId}`}
style={{
position: "absolute",
left: center.x - TOKEN_SIZE / 2,
top: center.y - TOKEN_SIZE / 2,
width: TOKEN_SIZE,
height: TOKEN_SIZE,
zIndex: 100,
transition: "left 0.6s cubic-bezier(0.25, 0.1, 0.25, 1), top 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)",
pointerEvents: "none",
}}
>
<PieceToken
pieceId={pieceId}
color={color}
size={TOKEN_SIZE}
label={displayName}
/>
</div>
);
})}
</div>
);
}
