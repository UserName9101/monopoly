import React, { useEffect, useState } from "react";

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

// Звёзды для построек
const STAR_PATH = "M12 2 L14.09 8.26 L20.72 8.27 L15.27 12.14 L17.36 18.39 L12 14.5 L6.64 18.39 L8.73 12.14 L3.28 8.27 L9.91 8.26 Z";

function StarIcon({ size, color, glow }: { size: number; color: string; glow?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ filter: glow ? `drop-shadow(0 0 3px ${glow})` : undefined, flexShrink: 0 }}>
      <path d={STAR_PATH} fill={color} />
    </svg>
  );
}

function BuildingIndicator({ houses, hasDepot, cellIndex }: { houses?: number; hasDepot?: boolean; cellIndex: number }) {
  const h = houses || 0;
  if (hasDepot) {
    // Депо = как отель, золотая звезда
    return <StarIcon size={11} color="#FFD700" glow="#FFD700" />;
  }
  if (h === 0) return null;
  if (h >= 6) return <StarIcon size={17} color="#9B30FF" glow="#9B30FF" />;
  if (h === 5) return <StarIcon size={11} color="#FFD700" glow="#FFD700" />;
  // 1-4 дома — серые маленькие звёзды
  return (
    <div style={{ display: "flex", gap: 1, alignItems: "center" }}>
      {Array.from({ length: h }).map((_, i) => (
        <StarIcon key={i} size={6} color="#888" />
      ))}
    </div>
  );
}

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
  roomPieces?: Record<string, string>;
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

// Полоска — теперь занимает STRIP_SIZE=20px, содержит текст цены/ренты
function getStripStyle(index: number, color: string): React.CSSProperties {
  const base: React.CSSProperties = { position: "absolute", background: color, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" };
  if (index >= 1 && index <= 12) return { ...base, bottom: 0, left: 0, right: 0, height: STRIP_SIZE };
  if (index >= 14 && index <= 25) return { ...base, left: 0, top: 0, bottom: 0, width: STRIP_SIZE };
  if (index >= 27 && index <= 38) return { ...base, top: 0, left: 0, right: 0, height: STRIP_SIZE };
  return { ...base, right: 0, top: 0, bottom: 0, width: STRIP_SIZE };
}

// Грань, смотрящая внутрь поля — туда кладём постройки
function getInnerEdgeStyle(index: number): React.CSSProperties {
  const base: React.CSSProperties = { position: "absolute", display: "flex", alignItems: "center", justifyContent: "center", gap: 1, zIndex: 3 };
  if (index >= 1 && index <= 12) return { ...base, top: 0, left: 0, right: 0, height: 14 };
  if (index >= 14 && index <= 25) return { ...base, right: 0, top: 0, bottom: 0, width: 14, flexDirection: "column" };
  if (index >= 27 && index <= 38) return { ...base, bottom: 0, left: 0, right: 0, height: 14 };  // нижняя строна = внутрь
  return { ...base, left: 0, top: 0, bottom: 0, width: 14, flexDirection: "column" };
}

// Текст полоски: горизонтальный для верх/низ, повёрнутый для левой/правой стороны
function getStripTextStyle(index: number): React.CSSProperties {
  const base: React.CSSProperties = { color: "#fff", fontWeight: 700, fontSize: 7, lineHeight: 1, whiteSpace: "nowrap", letterSpacing: 0.3 };
  if (index >= 14 && index <= 25) return { ...base, writingMode: "vertical-rl", transform: "rotate(180deg)" };
  if (index >= 40 && index <= 51) return { ...base, writingMode: "vertical-rl" };
  return base;
}

const getGroupColor = (group?: string): string => {
  switch (group) {
    case 'a': return '#8B4513';
    case 'b': return '#5BACD8';
    case 'c': return '#E8548A';
    case 'd': return '#E8880A';
    case 'e': return '#D63030';
    case 'f': return '#C8A800';
    case 'g': return '#2A7A2A';
    case 'h': return '#1A1A8C';
    case 'station': return '#2a2a2a';
    case 'utility': return '#4a5568';
    default: return '#888';
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
  if (!ownerId && cell.price) return `$${cell.price}`;
  if (!ownerId) return '';
  if (cell.isMortgaged) return 'ИПОТЕКА';
  if (cell.type === 'PROPERTY') {
    const status = getMonopolyStatus(board, ownerId, cell.group || '');
    const houses = cell.houses || 0;
    if (houses === 0) {
      if (status === 'full') return `$${cell.monopolyRent ?? cell.baseRent ?? 0}`;
      if (status === 'partial') return `$${cell.partialMonopolyRent ?? (cell.baseRent ? cell.baseRent * 2 : 0)}`;
      return `$${cell.baseRent ?? 0}`;
    }
    if (houses === 1) return `$${cell.house1Rent ?? 0}`;
    if (houses === 2) return `$${cell.house2Rent ?? 0}`;
    if (houses === 3) return `$${cell.house3Rent ?? 0}`;
    if (houses === 4) return `$${cell.house4Rent ?? 0}`;
    if (houses === 5) return `$${cell.hotelRent ?? 0}`;
    if (houses >= 6) return `$${cell.skyscraperRent ?? 0}`;
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

// SVG-фишки игроков
const PIECE_PATHS: Record<string, string> = {
  hat: "M12 4C9 4 6 5.5 6 7v1c0 .6.4 1 1 1h10c.6 0 1-.4 1-1V7c0-1.5-3-3-6-3zM5 9h14l1 9H4L5 9z",
  car: "M3 12l2-6h14l2 6M3 12v4h18v-4M3 12h18M7 16v2M17 16v2M6 12l1-4h10l1 4",
  dog: "M4 14c0-4 3-7 7-7 2 0 4 .8 5.5 2L18 7l1 3-2 1c.3.9.5 1.9.5 3v3H4v-3zM4 17h14M8 17v2M14 17v2",
  ship: "M12 3v10M12 3l-5 5M12 3l5 5M4 17c0 0 2-4 8-4s8 4 8 4M3 17l1 3h16l1-3",
  iron: "M5 18h14l1-8H5L5 18zM5 10c0-2 2-4 7-4M5 18v-2",
  boot: "M6 5v10l-2 4h14l-1-4H9V5H6zM9 15h7",
  thimble: "M8 18h8l1-9c0-3-2-5-4.5-5S8 6 8 9l1 9zM7 18h10M8 9h8",
  wheelbarrow: "M4 18l3-8h10l2 5H7M7 10V7l3-3h4M17 15l2 3M5 18a2 2 0 1 0 4 0 2 2 0 0 0-4 0",
};

function PlayerToken({ pieceId, color, x, y }: { pieceId: string; color: string; x: number; y: number }) {
  const path = PIECE_PATHS[pieceId] || PIECE_PATHS.hat;
  const SIZE = 26;
  return (
    <div
      style={{
        position: "absolute",
        left: x - SIZE / 2 - 2,
        top: y - SIZE / 2 - 2,
        width: SIZE + 4,
        height: SIZE + 4,
        borderRadius: "50%",
        backgroundColor: color,
        border: "2.5px solid rgba(255,255,255,0.9)",
        boxShadow: `0 3px 10px ${color}99, 0 1px 3px rgba(0,0,0,0.5)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        transition: "left 0.6s cubic-bezier(0.25, 0.1, 0.25, 1), top 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)",
        pointerEvents: "none",
      }}
    >
      <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d={path} />
      </svg>
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
  }, [gameState?.players]);

  const getPlayerVisualPosition = (player: any) => animatedPlayers[player.userId] ?? player.position;

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
        const groupColor = getGroupColor(cell.group);
        const displayValue = calculateRentDisplay(cell, board, cell.ownerId || '');

        // Padding с учётом полоски
        const stripPad = STRIP_SIZE + 2;
        const contentPadding = hasStrip
          ? (i >= 1 && i <= 12 ? `2px 2px ${stripPad}px` : i >= 14 && i <= 25 ? `2px 2px 2px ${stripPad}px` : i >= 27 && i <= 38 ? `${stripPad}px 2px 2px` : `2px ${stripPad}px 2px 2px`)
          : "2px";

        // Фон: белый + градиент владельца если есть
        const bgColor = isOffered ? '#FFF8DC' : isRequested ? '#E6F3FF' : '#f8f8f8';
        const bgGradient = ownerColor && !isOffered && !isRequested
          ? `linear-gradient(to top, ${ownerColor}28 0%, transparent 60%)`
          : 'none';

        return (
          <div
            key={cell.position ?? i}
            onClick={() => !isContractDarkened && onCellClick?.(cell)}
            onContextMenu={(e) => { e.preventDefault(); onCellRightClick?.(cell); }}
            style={{
              ...getCellStyle(i),
              background: bgColor,
              backgroundImage: cell.isMortgaged
                ? 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(220,53,69,0.12) 8px, rgba(220,53,69,0.12) 16px)'
                : bgGradient,
              border: isOffered ? '2px solid #C8A800' : isRequested ? '2px solid #3A7BDB' : '1px solid #d0d0d0',
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: contentPadding,
              textAlign: "center",
              overflow: "hidden",
              cursor: onCellClick ? (isContractDarkened ? 'not-allowed' : (isSpecialMoveMode && !isValidTarget ? 'default' : 'pointer')) : 'default',
              filter: isContractDarkened ? 'grayscale(1) brightness(0.4)' : ((isSpecialMoveMode && !isValidTarget) || cell.isMortgaged ? 'grayscale(50%) brightness(0.9)' : 'none'),
              opacity: isContractDarkened ? 0.3 : (isSpecialMoveMode && !isValidTarget ? 0.45 : 1),
              pointerEvents: isContractDarkened || (isSpecialMoveMode && !isValidTarget) ? 'none' : 'auto',
              transition: 'all 0.15s ease',
              zIndex: (isOffered || isRequested) ? 5 : 1,
            }}
          >
            {/* Цветная полоска с ценой/рентой */}
            {hasStrip && (
              <div style={getStripStyle(i, groupColor)}>
                <span style={getStripTextStyle(i)}>
                  {displayValue || (cell.price ? `$${cell.price}` : '')}
                </span>
              </div>
            )}

            {/* Постройки на внутренней грани */}
            {hasStrip && !isCorner && (
              <div style={getInnerEdgeStyle(i)}>
                <BuildingIndicator houses={cell.houses} hasDepot={cell.hasDepot} cellIndex={i} />
              </div>
            )}

            {/* Основной контент клетки */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", width: "100%", flex: 1 }}>
              <div style={{
                fontWeight: 600,
                fontSize: isCorner ? 10 : 7,
                lineHeight: 1.15,
                wordBreak: "break-word",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical" as any,
                color: '#1a1a1a',
                maxWidth: "100%",
              }}>
                {cell.name}
              </div>

              {/* Для угловых и спецклеток — показываем цену если нет полоски */}
              {!hasStrip && cell.price && !cell.ownerId && (
                <div style={{ fontSize: 8, color: '#555', marginTop: 2 }}>${cell.price}</div>
              )}

              {/* Ипотека */}
              {cell.isMortgaged && (
                <div style={{ fontSize: 7, color: '#dc3545', fontWeight: 700, marginTop: 2 }}>
                  🔒 {cell.mortgageTurnsRemaining}х
                </div>
              )}
            </div>

            {/* Фишки игроков на клетке (маленькие кружки) */}
            <div style={{ position: "absolute", bottom: hasStrip ? STRIP_SIZE + 2 : 3, left: 3, display: "flex", gap: 1, flexWrap: "wrap", zIndex: 4 }}>
              {occupants.map((p: any) => {
                const idx = players.findIndex((pl: any) => pl.userId === p.userId);
                return (
                  <div
                    key={p.userId}
                    title={players[idx]?.displayName || p.userId}
                    style={{
                      width: 10, height: 10, borderRadius: "50%",
                      background: PLAYER_COLORS[idx % PLAYER_COLORS.length],
                      border: "1px solid white",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.4)",
                    }}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Центральная зелёная область */}
      <div style={{
        position: "absolute",
        top: CORNER, left: CORNER,
        width: BOARD_SIZE - CORNER * 2,
        height: BOARD_SIZE - CORNER * 2,
        pointerEvents: "none",
        background: "linear-gradient(135deg, #2d5a27 0%, #3a7a32 40%, #2d5a27 100%)",
        borderRadius: 0,
      }} />

      {/* Анимированные SVG-фишки */}
      {gameState?.players?.map((player: any, idx: number) => {
        const visualPos = getPlayerVisualPosition(player);
        const center = getCellCenter(visualPos);
        const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
        const pieceId = roomPieces[player.userId] || 'hat';

        // Смещение если несколько игроков на одной клетке
        const sameCell = gameState.players.filter((p: any) => (animatedPlayers[p.userId] ?? p.position) === visualPos);
        const myIdxInCell = sameCell.findIndex((p: any) => p.userId === player.userId);
        const total = sameCell.length;
        const offsetX = total > 1 ? (myIdxInCell - (total - 1) / 2) * 14 : 0;
        const offsetY = total > 2 && myIdxInCell >= 2 ? 12 : 0;

        return (
          <PlayerToken
            key={`token-${player.userId}`}
            pieceId={pieceId}
            color={color}
            x={center.x + offsetX}
            y={center.y + offsetY}
          />
        );
      })}
    </div>
  );
}