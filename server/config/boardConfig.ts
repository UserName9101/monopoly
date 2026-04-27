export type CellType =
  | 'PROPERTY'
  | 'STATION'
  | 'UTILITY'
  | 'TAX'
  | 'SPECIAL'
  | 'CHEST'
  | 'CHANCE';

export interface CellData {
  position: number;
  name: string;
  type: CellType;
  
  price?: number;
  group?: string;
  houseCost?: number;
  hasDepot?: boolean;

  baseRent?: number;
  partialMonopolyRent?: number;
  monopolyRent?: number;
  house1Rent?: number;
  house2Rent?: number;
  house3Rent?: number;
  house4Rent?: number;
  hotelRent?: number;
  skyscraperRent?: number;

  utilityMultiplier1?: number;
  utilityMultiplier2?: number;
  utilityMultiplier3?: number;

  stationRent1?: number;
  stationRent2?: number;
  stationRent3?: number;
  stationRent4?: number;

  action?: 'start' | 'jail' | 'parking' | 'goToJail' | 'auction' | 'busTicket' | 'birthdayGift' | 'bankDeposit';
  corner?: boolean;
  special?: boolean;
  line?: number;
}

export const getGroupColor = (group?: string): string => {
  switch(group) {
    case 'a': return '#8B4513'; case 'b': return '#87CEEB'; case 'c': return '#FF69B4';
    case 'd': return '#FFA500'; case 'e': return '#FF0000'; case 'f': return '#FFD700';
    case 'g': return '#008000'; case 'h': return '#00008B';
    case 'station': return '#000000'; case 'utility': return '#A9A9A9';
    default: return '#CCCCCC';
  }
};

import { CLASSIC_BOARD_CONFIG } from './classicBoardConfig';
import { MEGA_BOARD_CONFIG } from './megaBoardConfig';
export { CLASSIC_BOARD_CONFIG, MEGA_BOARD_CONFIG };