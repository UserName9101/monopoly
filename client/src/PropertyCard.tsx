import React from "react";

type BoardCell = {
  position: number;
  name: string;
  type: string;
  price?: number;
  baseRent?: number;
  group?: string;
  ownerId?: string;
  houses?: number;
  hasDepot?: boolean;
  isMortgaged?: boolean;
  mortgageTurnsRemaining?: number;
  houseCost?: number;
};

type Props = {
  cell: BoardCell;
  isMyTurn: boolean;
  isOwner: boolean;
  onClose: () => void;
  onBuild: (target: number) => void;
  onSell: (count: number) => void;
  onMortgage: () => void;
  onUnmortgage: () => void;
  onToggleDepot: () => void;
};

export default function PropertyCard({
  cell,
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
      zIndex: 999
    }}>
      <h3>{cell.name}</h3>

      <div>Тип: {cell.type}</div>
      <div>Цена: {cell.price ?? "-"}</div>
      <div>Рента: {cell.baseRent ?? "-"}</div>
      <div>Дома: {cell.houses ?? 0}</div>
      <div>Заложена: {cell.isMortgaged ? "Да" : "Нет"}</div>

      {cell.type === "PROPERTY" && (
        <>
          <button disabled={disabled || cell.isMortgaged} onClick={() => onBuild((cell.houses || 0) + 1)}>
            Построить
          </button>
          <button disabled={disabled || (cell.houses || 0) === 0} onClick={() => onSell(1)}>
            Продать дом
          </button>
        </>
      )}

      {cell.type === "STATION" && (
        <>
          <button
            disabled={disabled || cell.isMortgaged}
            onClick={onToggleDepot}
          >
            {cell.hasDepot ? "Продать депо" : "Купить депо"}
          </button>

          <button
            disabled={disabled || cell.isMortgaged}
            onClick={onMortgage}
          >
            Заложить
          </button>
        </>
      )}

      {cell.isMortgaged && (
        <button
          disabled={disabled}
          onClick={onUnmortgage}
        >
          Выкупить
        </button>
      )}

      <button onClick={onClose}>Закрыть</button>
    </div>
  );
}