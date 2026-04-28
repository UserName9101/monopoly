import React, { useEffect, useState } from "react";

type Props = {
  winnerId: string | null;
  players: { userId: string; displayName: string; avatarUrl: string }[];
  onLeave: () => void;
};

export default function WinScreen({ winnerId, players, onLeave }: Props) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 50); }, []);
  const winner = players.find(p => p.userId === winnerId);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.85)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 99999,
        backdropFilter: "blur(6px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.4s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          padding: "48px 56px",
          background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          borderRadius: 24,
          border: "1px solid #ffffff22",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
          textAlign: "center",
          transform: visible ? "scale(1)" : "scale(0.85)",
          transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          maxWidth: 420,
        }}
      >
        {/* Конфетти-иконка */}
        <div style={{ fontSize: 56, lineHeight: 1 }}>🎉</div>

        {/* Аватарка победителя */}
        {winner && (
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                border: "3px solid #ffd700",
                overflow: "hidden",
                boxShadow: "0 0 32px #ffd70066",
              }}
            >
              <img
                src={winner.avatarUrl}
                alt={winner.displayName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div
              style={{
                position: "absolute",
                bottom: -4,
                right: -4,
                background: "#ffd700",
                borderRadius: "50%",
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              👑
            </div>
          </div>
        )}

        {/* Текст победителя */}
        <div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#ffd700",
              letterSpacing: -0.5,
              textShadow: "0 0 40px #ffd70088",
              lineHeight: 1.2,
            }}
          >
            {winner?.displayName || "Победитель"}
          </div>
          <div
            style={{
              fontSize: 16,
              color: "#aaa",
              marginTop: 8,
            }}
          >
            победил! Поздравляем!
          </div>
        </div>

        {/* Разделитель */}
        <div
          style={{
            width: "100%",
            height: 1,
            background: "linear-gradient(90deg, transparent, #ffffff22, transparent)",
          }}
        />

        {/* Кнопка выхода */}
        <button
          onClick={onLeave}
          style={{
            padding: "14px 40px",
            background: "linear-gradient(135deg, #ffd700, #ff9500)",
            color: "#1a1a2e",
            border: "none",
            borderRadius: 50,
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: 0.3,
            boxShadow: "0 8px 24px #ffd70033",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={e => {
            (e.target as HTMLButtonElement).style.transform = "translateY(-2px)";
            (e.target as HTMLButtonElement).style.boxShadow = "0 12px 32px #ffd70055";
          }}
          onMouseLeave={e => {
            (e.target as HTMLButtonElement).style.transform = "translateY(0)";
            (e.target as HTMLButtonElement).style.boxShadow = "0 8px 24px #ffd70033";
          }}
        >
          Выйти из комнаты
        </button>
      </div>
    </div>
  );
}
