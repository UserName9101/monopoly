import { Room, BoardCellState, PlayerState } from "./types";

export function rollDie(): number { return Math.floor(Math.random() * 6) + 1; }

export function rollThreeDice() {
  const white1 = rollDie();
  const white2 = rollDie();
  const speedRand = Math.floor(Math.random() * 6);
  let speed: number | "MR" | "BUS";
  if (speedRand < 3) speed = speedRand + 1;
  else if (speedRand < 5) speed = "MR";
  else speed = "BUS";
  return { white1, white2, speed };
}

export function getGroupKey(cell: BoardCellState): string {
  if (cell.group === 'station') return 'station';
  if (cell.group === 'utility') return 'utility';
  return cell.group || `prop_${cell.position}`;
}

export function isPropertyTradable(cell: BoardCellState): boolean {
  return (cell.houses || 0) === 0 && !cell.hasDepot;
}

export function getMonopolyStatus(board: BoardCellState[], ownerId: string, group: string): 'none' | 'partial' | 'full' {
  const allInGroup = board.filter(c => c.group === group && c.type === 'PROPERTY');
  if (allInGroup.length === 0) return 'none';
  const ownedInGroup = allInGroup.filter(c => c.ownerId === ownerId && !c.isMortgaged).length;
  const minForPartial = (group === 'a' || group === 'h') ? 2 : 3;
  if (ownedInGroup === allInGroup.length) return 'full';
  if (ownedInGroup >= minForPartial) return 'partial';
  return 'none';
}

export function calculateRent(cell: BoardCellState, board: BoardCellState[], diceSum: number = 7): number {
  if (!cell.ownerId || cell.isMortgaged) return 0;
  const ownerId = cell.ownerId;
  if (cell.type === 'PROPERTY') {
    const status = getMonopolyStatus(board, ownerId, cell.group || '');
    const houses = cell.houses || 0;
    if (houses === 0) {
      if (status === 'full') return cell.monopolyRent ?? cell.baseRent ?? 0;
      if (status === 'partial') return cell.partialMonopolyRent ?? (cell.baseRent ? cell.baseRent * 2 : 0);
      return cell.baseRent ?? 0;
    }
    if (houses === 1) return cell.house1Rent ?? 0;
    if (houses === 2) return cell.house2Rent ?? 0;
    if (houses === 3) return cell.house3Rent ?? 0;
    if (houses === 4) return cell.house4Rent ?? 0;
    if (houses === 5) return cell.hotelRent ?? 0;
    if (houses >= 6) return cell.skyscraperRent ?? 0;
    return 0;
  }
  if (cell.type === 'STATION') {
    const count = board.filter(c => c.group === 'station' && c.ownerId === ownerId && !c.isMortgaged).length;
    const rents = [25, 50, 100, 200];
    const baseRent = rents[Math.min(count, 4) - 1] ?? 0;
    return cell.hasDepot ? baseRent * 2 : baseRent;
  }
  if (cell.type === 'UTILITY') {
    const count = board.filter(c => c.group === 'utility' && c.ownerId === ownerId && !c.isMortgaged).length;
    const mult = count === 1 ? cell.utilityMultiplier1 : count === 2 ? cell.utilityMultiplier2 : (cell.utilityMultiplier3 ?? 10);
    return (mult ?? 10) * diceSum;
  }
  return 0;
}

export function canBuildOnGroup(board: BoardCellState[], ownerId: string, group: string): { canBuild: boolean; maxHouses: number; reason?: string; monopolyStatus: 'none' | 'partial' | 'full' } {
  const cellsInGroup = board.filter(c => c.group === group && c.type === 'PROPERTY');
  const owned = cellsInGroup.filter(c => c.ownerId === ownerId);
  if (owned.length === 0) return { canBuild: false, maxHouses: 0, reason: "Нет клеток в группе", monopolyStatus: 'none' };
  const mortgagedCount = owned.filter(c => c.isMortgaged).length;
  if (mortgagedCount > 0) return { canBuild: false, maxHouses: 0, reason: "Нельзя строить, пока есть заложенные клетки", monopolyStatus: 'none' };
  const monopolyStatus = getMonopolyStatus(board, ownerId, group);
  if (monopolyStatus === 'none') return { canBuild: false, maxHouses: 0, reason: "Нужна частичная монополия", monopolyStatus };
  const unmortgagedOwned = owned.filter(c => !c.isMortgaged);
  const minHouses = Math.min(...unmortgagedOwned.map(c => c.houses || 0));
  const maxHouses = Math.max(...unmortgagedOwned.map(c => c.houses || 0));
  if (maxHouses - minHouses > 1) return { canBuild: false, maxHouses, reason: "Нарушено правило равномерной застройки", monopolyStatus };
  const skyscraperCount = unmortgagedOwned.filter(c => (c.houses || 0) === 6).length;
  const canSkyscraper = monopolyStatus === 'full' && skyscraperCount === 0 && unmortgagedOwned.every(c => (c.houses || 0) >= 5);
  return { canBuild: true, maxHouses: canSkyscraper ? 6 : 5, reason: monopolyStatus === 'full' ? "Полная монополия" : "Частичная монополия", monopolyStatus };
}

export function getBuildingCost(cell: BoardCellState, targetHouses: number): number {
  const current = cell.houses || 0;
  if (targetHouses <= current) return 0;
  const houseCost = cell.houseCost || 0;
  if (targetHouses <= 5) return (targetHouses - current) * houseCost;
  if (targetHouses === 6) return houseCost;
  return 0;
}

export function getSellValue(cell: BoardCellState, housesToSell: number): number {
  const houseCost = cell.houseCost || 0;
  if (housesToSell <= 0) return 0;
  return Math.floor(housesToSell * houseCost * 0.5);
}

export function checkBankruptcy(p: PlayerState): boolean {
  if (p.money < 0 && !p.isBankrupt) { p.isBankrupt = true; p.money = 0; return true; }
  return p.isBankrupt;
}

export function checkForcedBalance(board: BoardCellState[], ownerId: string): string | null {
  const groups = [...new Set(board.filter(c => c.type === 'PROPERTY' && c.group).map(c => c.group!))];
  for (const g of groups) {
    const allInGroup = board.filter(c => c.group === g && c.type === 'PROPERTY');
    const ownedInGroup = allInGroup.filter(c => c.ownerId === ownerId);
    if (ownedInGroup.length === allInGroup.length && allInGroup.length > 0) {
      const hasBuildings = ownedInGroup.some(c => (c.houses || 0) > 0);
      if (hasBuildings) {
        const hasMortgage = ownedInGroup.some(c => c.isMortgaged);
        if (hasMortgage) return g;
        const housesList = ownedInGroup.map(c => c.houses || 0);
        if (Math.max(...housesList) - Math.min(...housesList) > 1) return g;
      }
    }
  }
  return null;
}

export function findNextUnownedProperty(room: Room, currentPosition: number): number | null {
  const boardLength = room.board.length;
  for (let i = 1; i < boardLength; i++) {
    const pos = (currentPosition + i) % boardLength;
    const cell = room.board[pos];
    if ((cell.type === "PROPERTY" || cell.type === "STATION" || cell.type === "UTILITY") && !cell.ownerId && !cell.isMortgaged) return pos;
  }
  return null;
}

export function findNextOpponentProperty(room: Room, currentPosition: number, currentUserId: string): number | null {
  const boardLength = room.board.length;
  for (let i = 1; i < boardLength; i++) {
    const pos = (currentPosition + i) % boardLength;
    const cell = room.board[pos];
    if ((cell.type === "PROPERTY" || cell.type === "STATION" || cell.type === "UTILITY") && cell.ownerId && cell.ownerId !== currentUserId && !cell.isMortgaged) return pos;
  }
  return null;
}

export function getValidTicketTargets(position: number, boardLength: number = 52): number[] {
  if (position < 0 || position >= boardLength) return [position];
  const validSet = new Set<number>();
  validSet.add(position);
  if (position >= 0 && position < 13) for (let i = position; i <= 13; i++) validSet.add(i);
  else if (position >= 13 && position < 26) for (let i = position; i <= 26; i++) validSet.add(i);
  else if (position >= 26 && position < 39) for (let i = position; i <= 39; i++) validSet.add(i);
  else if (position >= 39 && position <= 51) { for (let i = position; i <= 51; i++) validSet.add(i); validSet.add(0); }
  return Array.from(validSet).sort((a, b) => a - b);
}

export function findNextChanceOrChest(board: BoardCellState[], currentPos: number): number | null {
  for (let i = 1; i < board.length; i++) {
    const pos = (currentPos + i) % board.length;
    if (board[pos].type === "CHANCE" || board[pos].type === "CHEST") return pos;
  }
  return null;
}