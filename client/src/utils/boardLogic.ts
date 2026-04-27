export function getValidTicketTargets(pos: number, boardLength: number = 52): number[] {
  if (pos < 0 || pos >= boardLength) return [pos];
  const validSet = new Set<number>(); validSet.add(pos);
  if (pos >= 0 && pos < 13) for (let i = pos; i <= 13; i++) validSet.add(i);
  else if (pos >= 13 && pos < 26) for (let i = pos; i <= 26; i++) validSet.add(i);
  else if (pos >= 26 && pos < 39) for (let i = pos; i <= 39; i++) validSet.add(i);
  else if (pos >= 39 && pos <= 51) { for (let i = pos; i <= 51; i++) validSet.add(i); validSet.add(0); }
  return Array.from(validSet).sort((a, b) => a - b);
}

export function validateBuild(selectedCell: any, board: any[], myProfileId: string, isMyProperty: boolean, gameState: any, currentPlayerMoney: number | undefined) {
  if (!selectedCell || !selectedCell.group || !myProfileId || !isMyProperty) return { canBuild: false, reason: 'Не ваша собственность' };
  const group = selectedCell.group;
  if (gameState?.buildLimitsThisTurn?.[group] && gameState?.forcedBalanceGroupId !== group) return { canBuild: false, reason: 'Лимит группы за ход' };
  const cellsInGroup = board.filter(c => c.group === group && c.ownerId === myProfileId && !c.isMortgaged && c.type === 'PROPERTY');
  if (cellsInGroup.length === 0) return { canBuild: false, reason: 'Нет монополии' };
  const mortgagedCount = board.filter(c => c.group === group && c.ownerId === myProfileId && c.isMortgaged).length;
  if (mortgagedCount > 0 && gameState?.forcedBalanceGroupId !== group) return { canBuild: false, reason: 'Заложены клетки в группе' };
  const allInGroup = board.filter(c => c.group === group && c.type === 'PROPERTY');
  const ownedCount = cellsInGroup.length;
  const minForPartial = (group === 'a' || group === 'h') ? 2 : 3;
  const status = ownedCount === allInGroup.length ? 'full' : (ownedCount >= minForPartial ? 'partial' : 'none');
  if (status === 'none') return { canBuild: false, reason: 'Нужна частичная монополия' };
  if (gameState?.forcedBalanceGroupId !== group) {
    const currentHouses = cellsInGroup.map(c => c.position === selectedCell.position ? (selectedCell.houses || 0) + 1 : (c.houses || 0));
    if (Math.max(...currentHouses) - Math.min(...currentHouses) > 1) return { canBuild: false, reason: 'Равномерная застройка' };
  }
  const maxHouses = status === 'full' && cellsInGroup.every(c => (c.houses || 0) >= 5) ? 6 : 5;
  if (gameState?.forcedBalanceGroupId === group) {
    if ((selectedCell.houses || 0) >= Math.max(...cellsInGroup.map(c => c.houses || 0))) return { canBuild: false, reason: 'Нельзя превышать максимум при выравнивании' };
  } else {
    if ((selectedCell.houses || 0) >= maxHouses) return { canBuild: false, reason: 'Максимум домов' };
    if ((selectedCell.houses || 0) === 5 && maxHouses === 6 && cellsInGroup.filter(c => (c.houses || 0) === 6).length >= 1) return { canBuild: false, reason: 'Только 1 небоскрёб' };
  }
  if ((currentPlayerMoney || 0) < (selectedCell.houseCost || 0)) return { canBuild: false, reason: 'Нет денег' };
  return { canBuild: true, reason: '' };
}

export function validateSell(selectedCell: any, board: any[], myProfileId: string, isMyProperty: boolean, forcedBalanceGroupId?: string | null) {
  if (!selectedCell || !selectedCell.group || !myProfileId || !isMyProperty) return { canSell: false, reason: '' };
  if ((selectedCell.houses || 0) <= 0) return { canSell: false, reason: '' };
  if (forcedBalanceGroupId === selectedCell.group) return { canSell: true, reason: '' };
  const cellsInGroup = board.filter(c => c.group === selectedCell.group && c.ownerId === myProfileId && !c.isMortgaged && c.type === 'PROPERTY');
  const newHouses = (selectedCell.houses || 0) - 1;
  const projectedHouses = cellsInGroup.map(c => c.position === selectedCell.position ? newHouses : (c.houses || 0));
  const diff = Math.max(...projectedHouses) - Math.min(...projectedHouses);
  return { canSell: diff <= 1, reason: diff <= 1 ? '' : 'Равномерная продажа' };
}

export function validateMortgage(selectedCell: any, board: any[], myProfileId: string, isMyProperty: boolean, forcedBalanceGroupId?: string | null) {
  if (!selectedCell || !myProfileId || !isMyProperty) return { canMortgage: false, reason: 'Не ваша собственность' };
  if (selectedCell.isMortgaged || selectedCell.hasDepot) return { canMortgage: false, reason: '' };
  if (selectedCell.type === 'PROPERTY' && (selectedCell.houses || 0) > 0 && forcedBalanceGroupId !== selectedCell.group) return { canMortgage: false, reason: 'Продайте дома' };
  if (selectedCell.group && forcedBalanceGroupId !== selectedCell.group) {
    if (board.some(c => c.group === selectedCell.group && c.type === 'PROPERTY' && c.ownerId === myProfileId && (c.houses || 0) > 0)) return { canMortgage: false, reason: 'В группе есть постройки' };
  }
  return { canMortgage: true, reason: '' };
}

export function validateUnmortgage(selectedCell: any, myProfileId: string, isMyProperty: boolean, currentPlayerMoney: number | undefined) {
  if (!selectedCell || !myProfileId || !isMyProperty) return { canUnmortgage: false, reason: '' };
  if (!selectedCell.isMortgaged) return { canUnmortgage: false, reason: '' };
  const cost = Math.floor((selectedCell.price || 0) * 0.6);
  if ((currentPlayerMoney || 0) < cost) return { canUnmortgage: false, reason: 'Нет денег' };
  return { canUnmortgage: true, reason: '' };
}

export function calculateTotalCapital(board: any[], player: { userId: string; money: number }): number {
  const propertyValue = board
    .filter(c => c.ownerId === player.userId && !c.isMortgaged)
    .reduce((sum, c) => {
      const houseValue = (c.houseCost || 0) * (c.houses || 0);
      return sum + (c.price || 0) + houseValue;
    }, 0);
  return player.money + Math.floor(propertyValue / 2);
}