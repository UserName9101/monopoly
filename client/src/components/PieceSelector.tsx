import React from "react";

export type PieceId = "hat" | "car" | "dog" | "ship" | "iron" | "boot" | "thimble" | "wheelbarrow";

export const PIECES: { id: PieceId; label: string }[] = [
  { id: "hat",         label: "Цилиндр"   },
  { id: "car",         label: "Машина"    },
  { id: "dog",         label: "Собака"    },
  { id: "ship",        label: "Корабль"   },
  { id: "iron",        label: "Утюг"      },
  { id: "boot",        label: "Ботинок"   },
  { id: "thimble",     label: "Напёрсток" },
  { id: "wheelbarrow", label: "Тачка"     },
];

export const PLAYER_COLORS = [
  "#FF5733", "#33FF57", "#3357FF", "#F333FF",
  "#FF33A8", "#33FFF5", "#F5FF33", "#FF8C33",
];

export function PieceSVG({
  pieceId,
  fill,
  stroke = "#000",
  strokeWidth = 2,
  size = 60,
}: {
  pieceId: PieceId;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  size?: number;
}) {
  const sw = strokeWidth;
  const f = fill;
  const s = stroke;

  const shapes: Record<PieceId, React.ReactNode> = {
    hat: (
      <>
        <rect x="5" y="38" width="50" height="9" rx="2" fill={f} stroke={s} strokeWidth={sw} />
        <rect x="16" y="14" width="28" height="26" rx="4" fill={f} stroke={s} strokeWidth={sw} />
        <ellipse cx="30" cy="14" rx="14" ry="4" fill={f} stroke={s} strokeWidth={sw} />
        <rect x="18" y="42" width="24" height="4" rx="1" fill={`${f}88`} stroke="none" />
      </>
    ),
    car: (
      <>
        <rect x="2" y="28" width="56" height="20" rx="4" fill={f} stroke={s} strokeWidth={sw} />
        <path d="M10 28 L17 14 L43 14 L52 28Z" fill={f} stroke={s} strokeWidth={sw} strokeLinejoin="round" />
        <rect x="19" y="16" width="22" height="10" rx="2" fill={`${f}99`} stroke={s} strokeWidth={sw * 0.6} />
        <circle cx="15" cy="48" r="7" fill="#222" stroke={s} strokeWidth={sw} />
        <circle cx="45" cy="48" r="7" fill="#222" stroke={s} strokeWidth={sw} />
        <circle cx="15" cy="48" r="3" fill="#555" stroke="none" />
        <circle cx="45" cy="48" r="3" fill="#555" stroke="none" />
      </>
    ),
    dog: (
      <>
        <ellipse cx="30" cy="36" rx="18" ry="13" fill={f} stroke={s} strokeWidth={sw} />
        <circle cx="30" cy="20" r="12" fill={f} stroke={s} strokeWidth={sw} />
        <path d="M19 15 Q12 5 10 12" fill={f} stroke={s} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M41 15 Q48 5 50 12" fill={f} stroke={s} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="26" cy="19" r="2" fill={s} />
        <circle cx="34" cy="19" r="2" fill={s} />
        <path d="M27 27 Q30 30 33 27" fill="none" stroke={s} strokeWidth={1.5} strokeLinecap="round" />
        <path d="M13 40 Q7 44 9 50" fill={f} stroke={s} strokeWidth={sw} strokeLinecap="round" />
        <path d="M47 40 Q53 44 51 50" fill={f} stroke={s} strokeWidth={sw} strokeLinecap="round" />
      </>
    ),
    ship: (
      <>
        <path d="M6 38 Q30 48 54 38 L48 22 L12 22 Z" fill={f} stroke={s} strokeWidth={sw} strokeLinejoin="round" />
        <rect x="27" y="6" width="5" height="18" fill={f} stroke={s} strokeWidth={sw * 0.8} />
        <path d="M32 6 L48 18 L32 18 Z" fill={f} stroke={s} strokeWidth={sw} strokeLinejoin="round" />
        <path d="M4 38 Q30 50 56 38" fill="none" stroke={s} strokeWidth={sw} strokeLinecap="round" />
      </>
    ),
    iron: (
      <>
        <path d="M4 42 L56 42 L52 22 Q42 10 22 16 L4 42Z" fill={f} stroke={s} strokeWidth={sw} strokeLinejoin="round" />
        <rect x="26" y="8" width="8" height="12" rx="3" fill={f} stroke={s} strokeWidth={sw} />
        <path d="M6 36 L54 36" fill="none" stroke={`${f}66`} strokeWidth={1.5} />
      </>
    ),
    boot: (
      <>
        <path d="M10 50 L10 16 Q10 8 18 8 L26 8 L26 30 L46 30 Q54 30 54 40 L54 50 Z"
          fill={f} stroke={s} strokeWidth={sw} strokeLinejoin="round" />
        <path d="M10 32 L26 32" fill="none" stroke={s} strokeWidth={sw * 0.8} strokeLinecap="round" />
        <path d="M46 30 Q56 30 56 42" fill="none" stroke={s} strokeWidth={sw} strokeLinecap="round" />
      </>
    ),
    thimble: (
      <>
        <path d="M14 46 L14 24 Q14 8 30 8 Q46 8 46 24 L46 46 Z"
          fill={f} stroke={s} strokeWidth={sw} strokeLinejoin="round" />
        <ellipse cx="30" cy="46" rx="16" ry="5" fill={f} stroke={s} strokeWidth={sw} />
        <ellipse cx="30" cy="10" rx="9" ry="4" fill={`${f}cc`} stroke={s} strokeWidth={sw * 0.8} />
        <path d="M16 30 L44 30" fill="none" stroke={s} strokeWidth={1} strokeLinecap="round" />
        <path d="M16 37 L44 37" fill="none" stroke={s} strokeWidth={1} strokeLinecap="round" />
        <circle cx="22" cy="20" r="1.5" fill={s} opacity={0.4} />
        <circle cx="30" cy="18" r="1.5" fill={s} opacity={0.4} />
        <circle cx="38" cy="20" r="1.5" fill={s} opacity={0.4} />
      </>
    ),
    wheelbarrow: (
      <>
        <path d="M8 38 L30 22 L52 22 L52 36 L30 36 Z"
          fill={f} stroke={s} strokeWidth={sw} strokeLinejoin="round" />
        <path d="M8 38 L2 50" fill="none" stroke={s} strokeWidth={sw + 0.5} strokeLinecap="round" />
        <path d="M30 36 L30 50" fill="none" stroke={s} strokeWidth={sw} strokeLinecap="round" />
        <circle cx="30" cy="52" r="6" fill={f} stroke={s} strokeWidth={sw} />
        <circle cx="30" cy="52" r="2" fill={s} />
        <path d="M48 22 L56 12" fill="none" stroke={s} strokeWidth={sw} strokeLinecap="round" />
        <path d="M52 22 L60 12" fill="none" stroke={s} strokeWidth={sw} strokeLinecap="round" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", overflow: "visible" }}
    >
      {shapes[pieceId]}
    </svg>
  );
}

// Токен на игровом поле
export function PieceToken({
  pieceId,
  color,
  size = 28,
  label,
}: {
  pieceId: PieceId;
  color: string;
  size?: number;
  label?: string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        filter: `drop-shadow(0 2px 4px ${color}99)`,
        flexShrink: 0,
      }}
      title={label}
    >
      <PieceSVG
        pieceId={pieceId}
        fill={color}
        stroke="rgba(0,0,0,0.85)"
        strokeWidth={2.5}
        size={size}
      />
    </div>
  );
}

// Selector для лобби
type SelectorProps = {
  selectedPiece: PieceId;
  playerIndex: number;
  onChange: (piece: PieceId) => void;
  takenPieces?: PieceId[];
};

export default function PieceSelector({
  selectedPiece,
  playerIndex,
  onChange,
  takenPieces = [],
}: SelectorProps) {
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
                width: 52,
                height: 52,
                borderRadius: 10,
                border: isSelected ? `2px solid ${color}` : "1px solid #333",
                background: isSelected ? `${color}22` : "#1a1a1a",
                cursor: isTaken ? "not-allowed" : "pointer",
                opacity: isTaken ? 0.3 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
                padding: 4,
              }}
            >
              <PieceSVG
                pieceId={piece.id}
                fill={isSelected ? color : "#666"}
                stroke={isSelected ? "rgba(0,0,0,0.7)" : "#444"}
                strokeWidth={2}
                size={40}
              />
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: 12, color: "#666" }}>
        Выбрано:{" "}
        <span style={{ color }}>
          {PIECES.find((p) => p.id === selectedPiece)?.label}
        </span>
      </div>
    </div>
  );
}
