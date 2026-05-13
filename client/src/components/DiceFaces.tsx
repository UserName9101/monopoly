// DiceFaces.tsx
// SVG-компоненты граней кубиков для Монополии
// Белый кубик (d6): стороны 1–6, белый фон, чёрные точки
// Красный кубик (speed die): стороны 1–3, MR, Bus; красный фон, чёрные точки/текст

import React from "react";

type DiceFaceProps = {
  size?: number;
  style?: React.CSSProperties;
};

// ─── Вспомогательный рендер точки ───────────────────────────────────────────
function Dot({ cx, cy, r = 7, fill = "#111" }: { cx: number; cy: number; r?: number; fill?: string }) {
  return <circle cx={cx} cy={cy} r={r} fill={fill} />;
}

// ─── Белый D6 ───────────────────────────────────────────────────────────────

export function WhiteDie1({ size = 72, style }: DiceFaceProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" style={style}>
      <rect x="2" y="2" width="68" height="68" rx="12" ry="12" fill="#fff" stroke="#ccc" strokeWidth="2" />
      <Dot cx={36} cy={36} />
    </svg>
  );
}

export function WhiteDie2({ size = 72, style }: DiceFaceProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" style={style}>
      <rect x="2" y="2" width="68" height="68" rx="12" ry="12" fill="#fff" stroke="#ccc" strokeWidth="2" />
      <Dot cx={20} cy={20} />
      <Dot cx={52} cy={52} />
    </svg>
  );
}

export function WhiteDie3({ size = 72, style }: DiceFaceProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" style={style}>
      <rect x="2" y="2" width="68" height="68" rx="12" ry="12" fill="#fff" stroke="#ccc" strokeWidth="2" />
      <Dot cx={20} cy={20} />
      <Dot cx={36} cy={36} />
      <Dot cx={52} cy={52} />
    </svg>
  );
}

export function WhiteDie4({ size = 72, style }: DiceFaceProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" style={style}>
      <rect x="2" y="2" width="68" height="68" rx="12" ry="12" fill="#fff" stroke="#ccc" strokeWidth="2" />
      <Dot cx={20} cy={20} />
      <Dot cx={52} cy={20} />
      <Dot cx={20} cy={52} />
      <Dot cx={52} cy={52} />
    </svg>
  );
}

export function WhiteDie5({ size = 72, style }: DiceFaceProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" style={style}>
      <rect x="2" y="2" width="68" height="68" rx="12" ry="12" fill="#fff" stroke="#ccc" strokeWidth="2" />
      <Dot cx={20} cy={20} />
      <Dot cx={52} cy={20} />
      <Dot cx={36} cy={36} />
      <Dot cx={20} cy={52} />
      <Dot cx={52} cy={52} />
    </svg>
  );
}

export function WhiteDie6({ size = 72, style }: DiceFaceProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" style={style}>
      <rect x="2" y="2" width="68" height="68" rx="12" ry="12" fill="#fff" stroke="#ccc" strokeWidth="2" />
      <Dot cx={20} cy={18} />
      <Dot cx={52} cy={18} />
      <Dot cx={20} cy={36} />
      <Dot cx={52} cy={36} />
      <Dot cx={20} cy={54} />
      <Dot cx={52} cy={54} />
    </svg>
  );
}

// ─── Красный Speed Die ───────────────────────────────────────────────────────

export function SpeedDie1({ size = 72, style }: DiceFaceProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" style={style}>
      <rect x="2" y="2" width="68" height="68" rx="12" ry="12" fill="#c0392b" stroke="#922b21" strokeWidth="2" />
      <Dot cx={36} cy={36} fill="#111" />
    </svg>
  );
}

export function SpeedDie2({ size = 72, style }: DiceFaceProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" style={style}>
      <rect x="2" y="2" width="68" height="68" rx="12" ry="12" fill="#c0392b" stroke="#922b21" strokeWidth="2" />
      <Dot cx={20} cy={20} fill="#111" />
      <Dot cx={52} cy={52} fill="#111" />
    </svg>
  );
}

export function SpeedDie3({ size = 72, style }: DiceFaceProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" style={style}>
      <rect x="2" y="2" width="68" height="68" rx="12" ry="12" fill="#c0392b" stroke="#922b21" strokeWidth="2" />
      <Dot cx={20} cy={20} fill="#111" />
      <Dot cx={36} cy={36} fill="#111" />
      <Dot cx={52} cy={52} fill="#111" />
    </svg>
  );
}

export function SpeedDieMR({ size = 72, style }: DiceFaceProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" style={style}>
      <rect x="2" y="2" width="68" height="68" rx="12" ry="12" fill="#c0392b" stroke="#922b21" strokeWidth="2" />
      {/* Иконка: маленький человечек Mr. Monopoly */}
      <text
        x="36"
        y="30"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="20"
        fontWeight="900"
        fontFamily="Georgia, serif"
        fill="#fff"
        letterSpacing="1"
      >
        MR
      </text>
      {/* Шляпа-цилиндр */}
      <rect x="22" y="38" width="28" height="4" rx="2" fill="#fff" opacity="0.85" />
      <rect x="26" y="28" width="20" height="12" rx="3" fill="#fff" opacity="0.85" />
      {/* Трость */}
      <line x1="52" y1="42" x2="52" y2="60" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      <ellipse cx="52" cy="42" rx="4" ry="3" fill="none" stroke="#fff" strokeWidth="2" opacity="0.7" />
    </svg>
  );
}

export function SpeedDieBus({ size = 72, style }: DiceFaceProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" style={style}>
      <rect x="2" y="2" width="68" height="68" rx="12" ry="12" fill="#c0392b" stroke="#922b21" strokeWidth="2" />
      {/* Автобус */}
      <rect x="10" y="24" width="52" height="28" rx="5" fill="#fff" opacity="0.9" />
      <rect x="10" y="24" width="52" height="8" rx="5" fill="#d4e8ff" opacity="0.85" />
      {/* Окна */}
      <rect x="14" y="26" width="10" height="5" rx="2" fill="#5b9bd5" opacity="0.7" />
      <rect x="27" y="26" width="10" height="5" rx="2" fill="#5b9bd5" opacity="0.7" />
      <rect x="40" y="26" width="10" height="5" rx="2" fill="#5b9bd5" opacity="0.7" />
      {/* Колёса */}
      <circle cx="22" cy="52" r="6" fill="#333" />
      <circle cx="22" cy="52" r="3" fill="#888" />
      <circle cx="50" cy="52" r="6" fill="#333" />
      <circle cx="50" cy="52" r="3" fill="#888" />
      {/* Надпись */}
      <text x="36" y="45" textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="700" fontFamily="Arial, sans-serif" fill="#c0392b" letterSpacing="1">BUS</text>
    </svg>
  );
}

// ─── Convenience maps ────────────────────────────────────────────────────────

export const WHITE_DICE_FACES: Record<number, React.FC<DiceFaceProps>> = {
  1: WhiteDie1,
  2: WhiteDie2,
  3: WhiteDie3,
  4: WhiteDie4,
  5: WhiteDie5,
  6: WhiteDie6,
};

// speed: 1 | 2 | 3 | "MR" | "BUS"
export const SPEED_DICE_FACES: Record<string | number, React.FC<DiceFaceProps>> = {
  1: SpeedDie1,
  2: SpeedDie2,
  3: SpeedDie3,
  MR: SpeedDieMR,
  BUS: SpeedDieBus,
};

// ─── Удобный компонент одной грани ───────────────────────────────────────────

export function DieFace({
  type,
  value,
  size = 72,
  style,
}: {
  type: "white" | "speed";
  value: number | "MR" | "BUS";
  size?: number;
  style?: React.CSSProperties;
}) {
  const map = type === "white" ? WHITE_DICE_FACES : SPEED_DICE_FACES;
  const Face = map[value as any];
  if (!Face) return null;
  return <Face size={size} style={style} />;
}

export default DieFace;
