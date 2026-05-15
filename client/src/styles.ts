import React from "react";

export const styles: Record<string, React.CSSProperties> = {
  appContainer: { fontFamily: "sans-serif", backgroundColor: "#121212", height: "100vh", width: "100vw", overflow: "visible", display: 'flex', flexDirection: 'column', margin: 0, padding: 0, boxSizing: 'border-box' },
  header: { height: 60, backgroundColor: "#1e1e1e", borderBottom: "1px solid #333", display: "flex", justifyContent: 'center', alignItems: "center", padding: "0 20px", width: '100%', flexShrink: 0 },
  headerInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  mainContent: { flex: 1, width: '100%', boxSizing: 'border-box', overflow: 'visible', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  gameCanvasContainer: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible', padding: 0, boxSizing: 'border-box' },
  gameCanvasInner: { width: 1378, height: 886, display: 'flex', gap: 24, boxSizing: 'border-box' },
  sideColumn: { width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, height: '100%', boxSizing: 'border-box', overflow: 'visible' },
  centerPanel: { width: 886, height: 886, flexShrink: 0, backgroundColor: 'transparent', borderRadius: 0, overflow: 'visible', padding: 0, boxShadow: '0 8px 30px rgba(0,0,0,0.3)', boxSizing: 'border-box', position: 'relative' },
  boardWrapper: { width: '100%', height: '100%', position: 'relative', overflow: 'visible', boxSizing: 'border-box' },
  centerChatOverlay: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 430, height: 500, backgroundColor: '#222', borderRadius: 16, boxShadow: '0 8px 30px rgba(0,0,0,0.3)', zIndex: 20, padding: '18px 16px', display: 'flex', flexDirection: 'column', overflow: 'visible', border: '1px solid #333' },
  contractModal: { position: 'absolute', inset: 0, backgroundColor: '#2a2a2a', borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'visible', zIndex: 35, border: '1px solid #444' },
  contractHeader: { padding: '12px 16px', borderBottom: '1px solid #444', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, fontSize: 14 },
  contractColumns: { display: 'flex', padding: '12px 16px', gap: 16, flex: 1, overflowY: 'visible' },
  contractColumn: { flex: 1, display: 'flex', flexDirection: 'column', gap: 10, padding: 10, backgroundColor: '#1e1e1e', borderRadius: 10 },
  contractPlayerInfo: { display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, borderBottom: '1px solid #333' },
  contractAvatar: { width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' },
  contractOfferSection: { display: 'flex', flexDirection: 'column', gap: 6 },
  contractLabel: { fontSize: 11, color: '#999', fontWeight: 500 },
  contractInput: { padding: '6px 10px', borderRadius: 6, border: '1px solid #444', fontSize: 13, appearance: 'textfield', MozAppearance: 'textfield', backgroundColor: '#111', color: '#eee' },
  contractStaticValue: { padding: '6px 10px', backgroundColor: '#111', borderRadius: 6, border: '1px solid #333', fontSize: 13, fontWeight: 600, color: '#eee' },
  contractPropertiesList: { display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 100, overflowY: 'auto' },
  contractPropertyItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', backgroundColor: '#111', borderRadius: 6, fontSize: 12 },
  contractTotal: { marginTop: 'auto', paddingTop: 10, borderTop: '1px solid #333', fontWeight: 600, fontSize: 13, textAlign: 'right', color: '#eee' },
  contractButtons: { padding: '12px 16px', borderTop: '1px solid #444', display: 'flex', gap: 10, justifyContent: 'flex-end' },
  buildModal: { position: 'absolute', inset: 0, backgroundColor: '#2a2a2a', borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'visible', zIndex: 35, border: '1px solid #444' },
  rentBlock: { display: 'flex', flexDirection: 'column', gap: 2, padding: 4, backgroundColor: '#1a1a1a', borderRadius: 4 },
  rentRow: { display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '1px 0' },
  rentRowActive: { display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '2px 4px', backgroundColor: '#2d5016', borderRadius: 4, fontWeight: 600, border: '1px solid #4a8f29' },
  actionPanel: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#2a2a2a', borderBottom: '1px solid #444', padding: '10px 14px', zIndex: 25, borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column', gap: 8 },
  actionPanelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#eee', fontWeight: 600 },
  actionPanelContent: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  chatMessages: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5, paddingRight: 4, marginTop: 10 },
  playerCard: { backgroundColor: '#2c2c2e', padding: '10px', borderRadius: 10, boxShadow: '0 2px 6px rgba(0,0,0,0.2)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.2s ease' },
  playerMenu: { position: 'absolute', width: '180px', backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '10px', boxShadow: '0 8px 25px rgba(0,0,0,0.3)', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 100 },
  menuBtn: { padding: '8px 12px', fontSize: '13px', backgroundColor: '#333', border: '1px solid #444', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', color: '#eee', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '6px' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal: { backgroundColor: '#1e1e1e', padding: '24px', borderRadius: '16px', width: '320px', border: '1px solid #333' },
  formGroup: { marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' },
  container: { maxWidth: "400px", margin: "100px auto", padding: "20px", backgroundColor: "#1e1e1e", borderRadius: "12px", color: '#eee' },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  input: { padding: "10px", borderRadius: "6px", border: "1px solid #444", backgroundColor: '#222', color: '#eee' },
  buttonGroup: { display: "flex", gap: "10px" },
  error: { color: "#dc3545", textAlign: "center" },
  lobbyWrapper: { maxWidth: '820px', margin: '40px auto', width: '100%', padding: '0 20px', boxSizing: 'border-box' },
  createCard: { backgroundColor: '#1e1e1e', padding: '32px 40px', borderRadius: 16, marginBottom: 32, boxShadow: '0 6px 25px rgba(0,0,0,0.2)', textAlign: 'center', border: '1px solid #333' },
  select: { padding: "14px 18px", fontSize: "17px", borderRadius: "10px", border: "1px solid #444", backgroundColor: "#222", color: '#eee', flex: 1, minWidth: 0 },
  lobbyList: { backgroundColor: '#1e1e1e', padding: '32px 40px', borderRadius: 16, boxShadow: '0 6px 25px rgba(0,0,0,0.2)', border: '1px solid #333' },
  roomList: { display: 'flex', flexDirection: 'column', gap: 14 },
  roomItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', backgroundColor: '#252525', borderRadius: 12, transition: 'all 0.2s' },
  badge: { fontSize: 12, padding: '6px 12px', borderRadius: 8, color: '#fff', marginRight: 10 },
  btnPrimary: { padding: "12px 28px", backgroundColor: "#0071e3", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: 600 },
  btnSecondary: { padding: "12px 24px", backgroundColor: "#333", color: '#eee', border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "15px" },
  btnSuccess: { padding: "12px 28px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px" },
  btnAction: { padding: "14px 36px", color: "white", border: "none", borderRadius: "30px", fontWeight: 'bold', cursor: "pointer", fontSize: "18px" },
  btnSmall: { padding: "6px 12px", fontSize: "12px", backgroundColor: "transparent", color: "#0071e3", border: "none", cursor: "pointer" },
    auctionOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 40, borderRadius: 16 },
  auctionModal: { width: 420, backgroundColor: '#141414', borderRadius: 22, border: '1px solid #3a3a3a', overflow: 'visible', boxShadow: '0 32px 100px rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', gap: 16, padding: 24, position: 'relative', zIndex: 100000 },
  auctionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 16, fontWeight: 700, color: '#eee', borderBottom: '1px solid #444', paddingBottom: 10 },
  auctionInfo: { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' },
  auctionProp: { fontSize: 14, color: '#aaa' },
  auctionPrice: { fontSize: 22, color: '#eee' },
  auctionTurn: { fontSize: 14, color: '#888' },
  auctionActions: { display: 'flex', gap: 12, marginTop: 8 },
};

export const GLOBAL_STYLES = `
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
    40% { transform: scale(1.15); }
    100% { transform: scale(1); }
  }
  @keyframes timerPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.55; }
  }
  .btn-hover:hover:not(:disabled) {
    transform: translateY(-1px);
    filter: brightness(1.12);
  }
  .btn-hover:active:not(:disabled) {
    transform: scale(0.97);
  }
  .btn-hover:disabled {
    opacity: 0.42 !important;
    cursor: not-allowed !important;
  }
  .btn-buy:hover:not(:disabled) {
    background-color: #1f9c48 !important;
    box-shadow: 0 4px 14px rgba(26,122,58,0.45);
  }
  .btn-pay:hover:not(:disabled) {
    background-color: #b83228 !important;
    box-shadow: 0 4px 14px rgba(192,57,43,0.4);
  }
  .btn-ticket:hover:not(:disabled) {
    background-color: #0e6b7a !important;
    box-shadow: 0 4px 14px rgba(23,162,184,0.4);
  }
  .btn-roll:hover:not(:disabled) {
    box-shadow: 0 0 14px 4px rgba(253,126,20,0.55);
    transform: translateY(-1px);
  }
`;
