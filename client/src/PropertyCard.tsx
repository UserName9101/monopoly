import React from "react";

type BoardCell = {
  position: number;
  name: string;
  type: string;
  price?: number;
  baseRent?: number;
  partialMonopolyRent?: number;
  monopolyRent?: number;
  house1Rent?: number;
  house2Rent?: number;
  house3Rent?: number;
  house4Rent?: number;
  hotelRent?: number;
  skyscraperRent?: number;
  group?: string;
  ownerId?: string;
  houses?: number;
  hasDepot?: boolean;
  isMortgaged?: boolean;
  mortgageTurnsRemaining?: number;
  houseCost?: number;
  utilityMultiplier1?: number;
  utilityMultiplier2?: number;
  utilityMultiplier3?: number;
};

type Props = {
  cell: BoardCell;
  board: BoardCell[];
  isMyTurn: boolean;
  isOwner: boolean;
  onClose: () => void;
  onBuild: (target: number) => void;
  onSell: (count: number) => void;
  onMortgage: () => void;
  onUnmortgage: () => void;
  onToggleDepot: () => void;
};

function getMonopolyStatus(board: BoardCell[], ownerId: string, group: string): 'none' | 'partial' | 'full' {
  const allInGroup = board.filter(c => c.group === group && c.type === 'PROPERTY');
  if (allInGroup.length === 0) return 'none';
  const ownedInGroup = allInGroup.filter(c => c.ownerId === ownerId && !c.isMortgaged).length;
  const minForPartial = (group === 'a' || group === 'h') ? 2 : 3;
  if (ownedInGroup === allInGroup.length) return 'full';
  if (ownedInGroup >= minForPartial) return 'partial';
  return 'none';
}

function calculateCurrentRent(cell: BoardCell, board: BoardCell[], ownerId: string): string {
  if (!ownerId && cell.price) return `$${cell.price}`;
  if (!ownerId) return '-';
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
    return '-';
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
  return '-';
}

export default function PropertyCard({
  cell,
  board,
  isMyTurn,
  isOwner,
  onClose,
  onBuild,
  onSell,
  onMortgage,
  onUnmortgage,
  onToggleDepot
}: Props) {

  const disabled = !isMyTurn || !isOwner;
  const currentRent = calculateCurrentRent(cell, board, cell.ownerId || '');
  const rentColor = cell.isMortgaged ? '#dc3545' : isOwner ? '#28a745' : '#6c757d';

  return (
    <div style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "#fff",
      padding: 16,
      borderRadius: 10,
      width: 320,
      zIndex: 999,
      boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
    }}>
      <h3 style={{ margin: "0 0 12px 0", fontSize: 18 }}>{cell.name}</h3>

      <div style={{ marginBottom: 8 }}>Тип: {cell.type}</div>
      <div style={{ marginBottom: 8 }}>Цена: {cell.price ?? "-"}</div>
      <div style={{ marginBottom: 8, fontWeight: 700, color: rentColor, fontSize: 16 }}>
        Текущая рента: {currentRent}
      </div>
      <div style={{ marginBottom: 8 }}>Дома: {cell.houses ?? 0}</div>
      <div style={{ marginBottom: 12 }}>Заложена: {cell.isMortgaged ? "Да" : "Нет"}</div>

      {cell.type === "PROPERTY" && (
        <>
          <button 
            className="btn-hover"
            disabled={disabled || cell.isMortgaged} 
            onClick={() => onBuild((cell.houses || 0) + 1)}
            style={{ marginRight: 8, marginBottom: 8, padding: "6px 12px", cursor: disabled || cell.isMortgaged ? 'not-allowed' : 'pointer', opacity: disabled || cell.isMortgaged ? 0.5 : 1 }}
          >
            Построить
          </button>
          <button 
            className="btn-hover"
            disabled={disabled || (cell.houses || 0) === 0} 
            onClick={() => onSell(1)}
            style={{ marginRight: 8, marginBottom: 8, padding: "6px 12px", cursor: disabled || (cell.houses || 0) === 0 ? 'not-allowed' : 'pointer', opacity: disabled || (cell.houses || 0) === 0 ? 0.5 : 1 }}
          >
            Продать дом
          </button>
        </>
      )}

      {cell.type === "STATION" && (
        <>
          <button
            className="btn-hover"
            disabled={disabled || cell.isMortgaged}
            onClick={onToggleDepot}
            style={{ marginRight: 8, marginBottom: 8, padding: "6px 12px", cursor: disabled || cell.isMortgaged ? 'not-allowed' : 'pointer', opacity: disabled || cell.isMortgaged ? 0.5 : 1 }}
          >
            {cell.hasDepot ? "Продать депо" : "Купить депо"}
          </button>

          <button
            className="btn-hover"
            disabled={disabled || cell.isMortgaged}
            onClick={onMortgage}
            style={{ marginRight: 8, marginBottom: 8, padding: "6px 12px", cursor: disabled || cell.isMortgaged ? 'not-allowed' : 'pointer', opacity: disabled || cell.isMortgaged ? 0.5 : 1 }}
          >
            Заложить
          </button>
        </>
      )}

      {cell.isMortgaged && (
        <button
          className="btn-hover"
          disabled={disabled}
          onClick={onUnmortgage}
          style={{ marginRight: 8, marginBottom: 8, padding: "6px 12px", cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}
        >
          Выкупить
        </button>
      )}

      <button 
        className="btn-hover"
        onClick={onClose}
        style={{ padding: "6px 12px", cursor: 'pointer' }}
      >
        Закрыть
      </button>
    </div>
  );
}