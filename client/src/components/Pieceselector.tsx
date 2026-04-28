import React from "react";

export type PieceId = "hat" | "car" | "dog" | "ship" | "iron" | "boot" | "thimble" | "wheelbarrow";

export const PIECES: { id: PieceId; label: string; path: string }[] = [
  {
    id: "hat",
    label: "Цилиндр",
    path: "M12 4C9 4 6 5.5 6 7v1c0 .6.4 1 1 1h10c.6 0 1-.4 1-1V7c0-1.5-3-3-6-3zM5 9h14l1 9H4L5 9z M8 9v9M16 9v9",
  },
  {
    id: "car",
    label: "Автомобиль",
    path: "M3 12l2-6h14l2 6M3 12v4h18v-4M3 12h18M7 16v2M17 16v2M6 12l1-4h10l1 4",
  },
  {
    id: "dog",
    label: "Собака",
    path: "M4 14c0-4 3-7 7-7 2 0 4 .8 5.5 2L18 7l1 3-2 1c.3.9.5 1.9.5 3v3H4v-3zM4 17h14M8 17v2M14 17v2M7 11c0 0 2 1 5 0",
  },
  {
    id: "ship",
    label: "Корабль",
    path: "M12 3v10M12 3l-5 5M12 3l5 5M4 17c0 0 2-4 8-4s8 4 8 4M3 17l1 3h16l1-3",
  },
  {
    id: "iron",
    label: "Утюг",
    path: "M5 18h14l1-8H5L5 18zM5 10c0-2 2-4 7-4M5 18v-2",
  },
  {
    id: "boot",
    label: "Ботинок",
    path: "M6 5v10l-2 4h14l-1-4H9V5H6zM9 15h7",
  },
  {
    id: "thimble",
    label: "Напёрсток",
    path: "M8 18h8l1-9c0-3-2-5-4.5-5S8 6 8 9l1 9zM7 18h10M8 9h8",
  },
  {
    id: "wheelbarrow",
    label: "Тачка",
    path: "M4 18l3-8h10l2 5H7M7 10V7l3-3h4M17 15l2 3M5 18a2 2 0 1 0 4 0 2 2 0 0 0-4 0",
  },
];

const PLAYER_COLORS = [
  "#FF5733", "#33FF57", "#3357FF", "#F333FF",
  "#FF33A8", "#33FFF5", "#F5FF33", "#FF8C33",
];

type Props = {
  selectedPiece: PieceId;
  playerIndex: number;
  onChange: (piece: PieceId) => void;
  takenPieces?: PieceId[];
};

export default function PieceSelector({ selectedPiece, playerIndex, onChange, takenPieces = [] }: Props) {
  const color = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 11, color: "#999", fontWeight: 500, textTransform: "uppercase", letterSpacing: 1 }}>
        Выбор фишки
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {PIECES.map((piece) => {
          const isTaken = takenPieces.includes(piece.id) && piece.id !== selectedPiece;
          const isSelected = piece.id === selectedPiece;
          return (
            <button
              key={piece.id}
              title={piece.label}
              disabled={isTaken}
              onClick={() => onChange(piece.id)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                border: isSelected ? `2px solid ${color}` : "1px solid #333",
                background: isSelected ? `${color}22` : "#1a1a1a",
                cursor: isTaken ? "not-allowed" : "pointer",
                opacity: isTaken ? 0.3 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
                padding: 0,
              }}
            >
              <svg
                width={24}
                height={24}
                viewBox="0 0 24 24"
                fill="none"
                stroke={isSelected ? color : "#888"}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={piece.path} />
              </svg>
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: 12, color: "#666" }}>
        Выбрано: <span style={{ color }}>{PIECES.find(p => p.id === selectedPiece)?.label}</span>
      </div>
    </div>
  );
}

export function PieceToken({
  pieceId,
  color,
  size = 20,
}: {
  pieceId: PieceId;
  color: string;
  size?: number;
}) {
  const piece = PIECES.find((p) => p.id === pieceId);
  if (!piece) return null;
  const scale = size / 24;
  return (
    <div
      style={{
        width: size + 6,
        height: size + 6,
        borderRadius: "50%",
        background: color,
        border: "2px solid rgba(255,255,255,0.8)",
        boxShadow: `0 2px 6px ${color}88`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg
        width={size * scale * 14}
        height={size * scale * 14}
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: size * 0.65, height: size * 0.65 }}
      >
        <path d={piece.path} />
      </svg>
    </div>
  );
}
