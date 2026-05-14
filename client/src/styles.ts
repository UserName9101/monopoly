import React from "react";

export const styles: Record<string, React.CSSProperties> = {
  appContainer: { fontFamily: "sans-serif", backgroundColor: "#121212", height: "100vh", width: "100vw", overflow: "hidden", display: 'flex', flexDirection: 'column', margin: 0, padding: 0, boxSizing: 'border-box' },
  header: { height: 60, backgroundColor: "#1a1a1a", borderBottom: "1px solid #2a2a2a", display: "flex", justifyContent: 'center', alignItems: "center", padding: "0 20px", width: '100%', flexShrink: 0 },
  headerInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  mainContent: { flex: 1, width: '100%', boxSizing: 'border-box', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  gameCanvasContainer: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 0, boxSizing: 'border-box' },
  gameCanvasInner: { width: 1378, height: 886, display: 'flex', gap: 24, boxSizing: 'border-box' },
  sideColumn: { width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, height: '100%', boxSizing: 'border-box' },
  centerPanel: { width: 886, height: 886, flexShrink: 0, backgroundColor: 'transparent', borderRadius: 0, overflow: 'hidden', padding: 0, boxShadow: '0 8px 40px rgba(0,0,0,0.5)', boxSizing: 'border-box', position: 'relative' },
  boardWrapper: { width: '100%', height: '100%', position: 'relative', overflow: 'hidden', boxSizing: 'border-box' },
  centerChatOverlay: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 430, height: 500, backgroundColor: '#1e1e1e', borderRadius: 16, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', zIndex: 20, padding: '18px 16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #2e2e2e' },

  // Договор
  contractModal: { position: 'absolute', inset: 0, backgroundColor: '#1e1e1e', borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 35, border: '1px solid #333' },
  contractHeader: { padding: '14px 18px', borderBottom: '1px solid #2e2e2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: 15, color: '#eee', background: '#252525' },
  contractColumns: { display: 'flex', padding: '14px 16px', gap: 0, flex: 1, overflowY: 'auto', alignItems: 'stretch' },
  contractColumn: { flex: 1, display: 'flex', flexDirection: 'column', gap: 10, padding: 12, backgroundColor: '#252525', borderRadius: 10 },
  contractPlayerInfo: { display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, borderBottom: '1px solid #333' },
  contractAvatar: { width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' as any },
  contractOfferSection: { display: 'flex', flexDirection: 'column', gap: 6 },
  contractLabel: { fontSize: 11, color: '#777', fontWeight: 600, textTransform: 'uppercase' as any, letterSpacing: 0.5 },
  contractInput: { padding: '8px 10px', borderRadius: 8, border: '1px solid #3a3a3a', fontSize: 13, appearance: 'textfield' as any, MozAppearance: 'textfield' as any, backgroundColor: '#111', color: '#eee', transition: 'border-color 0.15s' },
  contractStaticValue: { padding: '8px 10px', backgroundColor: '#111', borderRadius: 8, border: '1px solid #2a2a2a', fontSize: 13, fontWeight: 600, color: '#eee' },
  contractPropertiesList: { display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 100, overflowY: 'auto' },
  contractPropertyItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', backgroundColor: '#1a1a1a', borderRadius: 6, fontSize: 12, border: '1px solid #2e2e2e', cursor: 'pointer', transition: 'background 0.1s' },
  contractTotal: { marginTop: 'auto', paddingTop: 10, borderTop: '1px solid #2e2e2e', fontWeight: 700, fontSize: 14, textAlign: 'right' as any, color: '#eee' },
  contractButtons: { padding: '12px 16px', borderTop: '1px solid #2e2e2e', display: 'flex', gap: 10, justifyContent: 'flex-end', background: '#1a1a1a' },

  // Карточка имущества
  buildModal: { position: 'absolute', inset: 0, backgroundColor: '#1e1e1e', borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 35, border: '1px solid #333' },
  rentBlock: { display: 'flex', flexDirection: 'column', gap: 2, padding: '6px 8px', backgroundColor: '#161616', borderRadius: 6, border: '1px solid #2a2a2a' },
  rentRow: { display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '2px 0', color: '#aaa' },

  // Панель действий
  actionPanel: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#1e1e1e', borderBottom: '1px solid #2e2e2e', padding: '12px 16px', zIndex: 25, borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' },
  actionPanelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#eee', fontWeight: 600 },
  actionPanelContent: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as any },
  chatMessages: { flex: 1, overflowY: 'auto' as any, display: 'flex', flexDirection: 'column', gap: 5, paddingRight: 4, marginTop: 10 },

  // Карточки игроков
  playerCard: { backgroundColor: '#1e1e1e', padding: '10px', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.3)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.2s ease', border: '1px solid #2a2a2a' },
  playerMenu: { position: 'absolute', width: '180px', backgroundColor: '#252525', border: '1px solid #3a3a3a', borderRadius: '12px', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 100 },
  menuBtn: { padding: '8px 12px', fontSize: '13px', backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', textAlign: 'left' as any, color: '#eee', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '6px' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, backdropFilter: 'blur(4px)' },
  modal: { backgroundColor: '#1e1e1e', padding: '24px', borderRadius: '16px', width: '320px', border: '1px solid #2e2e2e', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' },
  formGroup: { marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' },
  container: { maxWidth: "400px", margin: "100px auto", padding: "20px", backgroundColor: "#1e1e1e", borderRadius: "12px", color: '#eee' },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  input: { padding: "10px", borderRadius: "8px", border: "1px solid #333", backgroundColor: '#161616', color: '#eee', transition: 'border-color 0.15s' },
  buttonGroup: { display: "flex", gap: "10px" },
  error: { color: "#f87171", textAlign: "center" as any },

  // Лобби
  lobbyWrapper: { maxWidth: '820px', margin: '40px auto', width: '100%', padding: '0 20px', boxSizing: 'border-box' as any },
  createCard: { backgroundColor: '#1e1e1e', padding: '32px 40px', borderRadius: 16, marginBottom: 24, boxShadow: '0 6px 30px rgba(0,0,0,0.3)', textAlign: 'center' as any, border: '1px solid #2a2a2a' },
  select: { padding: "12px 16px", fontSize: "16px", borderRadius: "10px", border: "1px solid #333", backgroundColor: "#161616", color: '#eee', flex: 1, minWidth: 0 },
  lobbyList: { backgroundColor: '#1e1e1e', padding: '32px 40px', borderRadius: 16, boxShadow: '0 6px 30px rgba(0,0,0,0.3)', border: '1px solid #2a2a2a' },
  roomList: { display: 'flex', flexDirection: 'column', gap: 12 },
  roomItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: '#252525', borderRadius: 12, transition: 'all 0.2s', border: '1px solid #2e2e2e' },
  badge: { fontSize: 11, padding: '5px 10px', borderRadius: 20, color: '#fff', fontWeight: 600, letterSpacing: 0.3 },

  // Кнопки — базовые стили, hover добавляется через onMouseEnter/Leave в App.tsx
  btnPrimary: { padding: "11px 24px", backgroundColor: "#0071e3", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "15px", fontWeight: 600, transition: 'all 0.15s ease' },
  btnSecondary: { padding: "11px 22px", backgroundColor: "#252525", color: '#ddd', border: "1px solid #333", borderRadius: "10px", cursor: "pointer", fontSize: "14px", transition: 'all 0.15s ease' },
  btnSuccess: { padding: "11px 24px", backgroundColor: "#1a7a3a", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "15px", fontWeight: 600, transition: 'all 0.15s ease' },
  btnAction: { padding: "12px 28px", color: "white", border: "none", borderRadius: "30px", fontWeight: 700, cursor: "pointer", fontSize: "16px", transition: 'all 0.18s ease', letterSpacing: 0.3 },
  btnSmall: { padding: "6px 12px", fontSize: "12px", backgroundColor: "transparent", color: "#4a9eff", border: "none", cursor: "pointer", transition: 'color 0.15s', borderRadius: 6 },

  // Аукцион — полностью переработан
  auctionOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.88)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 40, borderRadius: 16, backdropFilter: 'blur(2px)' },
  auctionModal: { width: 400, backgroundColor: '#1a1a1a', borderRadius: 20, border: '1px solid #2e2e2e', padding: 24, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 24px 80px rgba(0,0,0,0.7)' },
  auctionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 17, fontWeight: 800, color: '#eee', borderBottom: '1px solid #2a2a2a', paddingBottom: 14, letterSpacing: -0.3 },
  auctionInfo: { display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' },
  auctionProp: { fontSize: 13, color: '#888', fontWeight: 500 },
  auctionPrice: { fontSize: 26, color: '#eee', fontWeight: 800, letterSpacing: -0.5 },
  auctionTurn: { fontSize: 13, color: '#666' },
  auctionActions: { display: 'flex', gap: 12, marginTop: 4 },
};

// CSS для анимаций — инжектируется один раз
export const GLOBAL_STYLES = `
  @keyframes rollGlow {
    0%, 100% { box-shadow: 0 0 0px 0px var(--glow-color, #fd7e14); }
    50% { box-shadow: 0 0 18px 6px var(--glow-color, #fd7e14); }
  }
  @keyframes tripleShine {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes auctionShine {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes raysSpin {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }
  @keyframes bidPop {
    0% { transform: scale(1); }
    40% { transform: scale(1.18); }
    100% { transform: scale(1); }
  }
  @keyframes auctionTimerPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  .btn-hover:hover:not(:disabled) {
    transform: translateY(-1px);
    filter: brightness(1.12);
  }
  .btn-hover:active:not(:disabled) {
    transform: scale(0.97) translateY(0);
  }
  .btn-hover:disabled {
    opacity: 0.42;
    cursor: not-allowed;
  }
  .btn-buy:hover:not(:disabled) {
    background-color: #1f9c48 !important;
    box-shadow: 0 4px 16px rgba(26,122,58,0.5);
    transform: translateY(-1px);
  }
  .btn-pay:hover:not(:disabled) {
    background-color: #c0392b !important;
    box-shadow: 0 4px 16px rgba(192,57,43,0.4);
    transform: translateY(-1px);
  }
  .btn-ticket:hover:not(:disabled) {
    background-color: #117a8b !important;
    box-shadow: 0 4px 16px rgba(23,162,184,0.4);
    transform: translateY(-1px);
  }
  .btn-surrender:hover:not(:disabled) {
    background-color: #7f1d1d !important;
    transform: translateY(-1px);
  }
  .contract-property:hover {
    background-color: #222 !important;
    border-color: #555 !important;
  }
  .room-item:hover {
    background-color: #2d2d2d !important;
    border-color: #3a3a3a !important;
  }
`;