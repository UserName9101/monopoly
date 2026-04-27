// server/config/megaBoardConfig.ts
import { CellData } from './boardConfig';

export const MEGA_BOARD_CONFIG: CellData[] = [
  // === CORNER: GO ===
  { position: 0, name: 'Go', type: 'SPECIAL', action: 'start', corner: true },

  // === BROWN GROUP (a) ===
  { position: 1, name: 'Mediterranean Avenue', type: 'PROPERTY', price: 60, group: 'a', houseCost: 50, baseRent: 2, partialMonopolyRent: 4, monopolyRent: 6, house1Rent: 10, house2Rent: 30, house3Rent: 90, house4Rent: 160, hotelRent: 250, skyscraperRent: 750, line: 0 },
  { position: 2, name: 'Community Chest', type: 'CHEST', special: true, line: 0 },
  { position: 3, name: 'Baltic Avenue', type: 'PROPERTY', price: 60, group: 'a', houseCost: 50, baseRent: 4, partialMonopolyRent: 8, monopolyRent: 12, house1Rent: 20, house2Rent: 60, house3Rent: 180, house4Rent: 320, hotelRent: 450, skyscraperRent: 950, line: 0 },
  { position: 4, name: 'Arctic Avenue', type: 'PROPERTY', price: 80, group: 'a', houseCost: 50, baseRent: 4, partialMonopolyRent: 8, monopolyRent: 12, house1Rent: 20, house2Rent: 60, house3Rent: 180, house4Rent: 320, hotelRent: 450, skyscraperRent: 950, line: 0 },
  { position: 5, name: 'Income Tax', type: 'TAX', special: true, line: 0 },
  { position: 6, name: 'Reading Railroad', type: 'STATION', price: 200, group: 'station', hasDepot: false, stationRent1: 25, stationRent2: 50, stationRent3: 100, stationRent4: 200, line: 0 },
  { position: 7, name: 'Massachusetts Avenue', type: 'PROPERTY', price: 100, group: 'b', houseCost: 50, baseRent: 6, partialMonopolyRent: 12, monopolyRent: 18, house1Rent: 30, house2Rent: 90, house3Rent: 270, house4Rent: 400, hotelRent: 550, skyscraperRent: 1050, line: 0 },
  { position: 8, name: 'Oriental Avenue', type: 'PROPERTY', price: 100, group: 'b', houseCost: 50, baseRent: 6, partialMonopolyRent: 12, monopolyRent: 18, house1Rent: 30, house2Rent: 90, house3Rent: 270, house4Rent: 400, hotelRent: 550, skyscraperRent: 1050, line: 0 },
  { position: 9, name: 'Chance', type: 'CHANCE', special: true, line: 0 },
  { position: 10, name: 'Gas Company', type: 'UTILITY', price: 150, group: 'utility', utilityMultiplier1: 4, utilityMultiplier2: 10, utilityMultiplier3: 20, line: 0 },
  { position: 11, name: 'Vermont Avenue', type: 'PROPERTY', price: 100, group: 'b', houseCost: 50, baseRent: 6, partialMonopolyRent: 12, monopolyRent: 18, house1Rent: 30, house2Rent: 90, house3Rent: 270, house4Rent: 400, hotelRent: 550, skyscraperRent: 1050, line: 0 },
  { position: 12, name: 'Connecticut Avenue', type: 'PROPERTY', price: 120, group: 'b', houseCost: 50, baseRent: 8, partialMonopolyRent: 16, monopolyRent: 24, house1Rent: 40, house2Rent: 100, house3Rent: 300, house4Rent: 450, hotelRent: 600, skyscraperRent: 1100, line: 0 },

  // === CORNER: JAIL / JUST VISITING ===
  { position: 13, name: 'Jail / Just Visiting', type: 'SPECIAL', action: 'jail', corner: true },
  { position: 14, name: 'Auction', type: 'SPECIAL', action: 'auction', line: 1 },

  // === PINK GROUP (c) ===
  { position: 15, name: 'Maryland Avenue', type: 'PROPERTY', price: 140, group: 'c', houseCost: 100, baseRent: 10, partialMonopolyRent: 20, monopolyRent: 30, house1Rent: 50, house2Rent: 150, house3Rent: 450, house4Rent: 625, hotelRent: 750, skyscraperRent: 1250, line: 1 },
  { position: 16, name: 'St. Charles Place', type: 'PROPERTY', price: 140, group: 'c', houseCost: 100, baseRent: 10, partialMonopolyRent: 20, monopolyRent: 30, house1Rent: 50, house2Rent: 150, house3Rent: 450, house4Rent: 625, hotelRent: 750, skyscraperRent: 1250, line: 1 },
  { position: 17, name: 'Electric Company', type: 'UTILITY', price: 150, group: 'utility', utilityMultiplier1: 4, utilityMultiplier2: 10, utilityMultiplier3: 20, line: 1 },
  { position: 18, name: 'States Avenue', type: 'PROPERTY', price: 140, group: 'c', houseCost: 100, baseRent: 12, partialMonopolyRent: 24, monopolyRent: 36, house1Rent: 60, house2Rent: 180, house3Rent: 500, house4Rent: 700, hotelRent: 900, skyscraperRent: 1400, line: 1 },
  { position: 19, name: 'Virginia Avenue', type: 'PROPERTY', price: 160, group: 'c', houseCost: 100, baseRent: 12, partialMonopolyRent: 24, monopolyRent: 36, house1Rent: 60, house2Rent: 180, house3Rent: 500, house4Rent: 700, hotelRent: 900, skyscraperRent: 1400, line: 1 },
  { position: 20, name: 'Pennsylvania Railroad', type: 'STATION', price: 200, group: 'station', hasDepot: false, stationRent1: 25, stationRent2: 50, stationRent3: 100, stationRent4: 200, line: 1 },
  { position: 21, name: 'St. James Place', type: 'PROPERTY', price: 180, group: 'd', houseCost: 100, baseRent: 14, partialMonopolyRent: 28, monopolyRent: 42, house1Rent: 70, house2Rent: 200, house3Rent: 550, house4Rent: 750, hotelRent: 950, skyscraperRent: 1450, line: 1 },
  { position: 22, name: 'Community Chest', type: 'CHEST', special: true, line: 1 },
  { position: 23, name: 'Tennessee Avenue', type: 'PROPERTY', price: 180, group: 'd', houseCost: 100, baseRent: 14, partialMonopolyRent: 28, monopolyRent: 42, house1Rent: 70, house2Rent: 200, house3Rent: 550, house4Rent: 750, hotelRent: 950, skyscraperRent: 1450, line: 1 },
  { position: 24, name: 'New York Avenue', type: 'PROPERTY', price: 200, group: 'd', houseCost: 100, baseRent: 16, partialMonopolyRent: 32, monopolyRent: 48, house1Rent: 80, house2Rent: 220, house3Rent: 600, house4Rent: 800, hotelRent: 1000, skyscraperRent: 1500, line: 1 },
  { position: 25, name: 'New Jersey Avenue', type: 'PROPERTY', price: 200, group: 'd', houseCost: 100, baseRent: 16, partialMonopolyRent: 32, monopolyRent: 48, house1Rent: 80, house2Rent: 220, house3Rent: 600, house4Rent: 800, hotelRent: 1000, skyscraperRent: 1500, line: 1 },

  // === CORNER: FREE PARKING ===
  { position: 26, name: 'Free Parking', type: 'SPECIAL', action: 'parking', corner: true },

  // === RED GROUP (e) ===
  { position: 27, name: 'Kentucky Avenue', type: 'PROPERTY', price: 220, group: 'e', houseCost: 150, baseRent: 18, partialMonopolyRent: 36, monopolyRent: 54, house1Rent: 90, house2Rent: 250, house3Rent: 700, house4Rent: 875, hotelRent: 1050, skyscraperRent: 2050, line: 2 },
  { position: 28, name: 'Chance', type: 'CHANCE', special: true, line: 2 },
  { position: 29, name: 'Indiana Avenue', type: 'PROPERTY', price: 220, group: 'e', houseCost: 150, baseRent: 18, partialMonopolyRent: 36, monopolyRent: 54, house1Rent: 90, house2Rent: 250, house3Rent: 700, house4Rent: 875, hotelRent: 1050, skyscraperRent: 2050, line: 2 },
  { position: 30, name: 'Illinois Avenue', type: 'PROPERTY', price: 240, group: 'e', houseCost: 150, baseRent: 20, partialMonopolyRent: 40, monopolyRent: 60, house1Rent: 100, house2Rent: 300, house3Rent: 750, house4Rent: 925, hotelRent: 1100, skyscraperRent: 2100, line: 2 },
  { position: 31, name: 'Michigan Avenue', type: 'PROPERTY', price: 240, group: 'e', houseCost: 150, baseRent: 20, partialMonopolyRent: 40, monopolyRent: 60, house1Rent: 100, house2Rent: 300, house3Rent: 750, house4Rent: 925, hotelRent: 1100, skyscraperRent: 2100, line: 2 },
  { position: 32, name: 'Bus Ticket', type: 'SPECIAL', action: 'busTicket', line: 2 },
  { position: 33, name: 'B. & O. Railroad', type: 'STATION', price: 200, group: 'station', hasDepot: false, stationRent1: 25, stationRent2: 50, stationRent3: 100, stationRent4: 200, line: 2 },
  { position: 34, name: 'Atlantic Avenue', type: 'PROPERTY', price: 260, group: 'f', houseCost: 150, baseRent: 22, partialMonopolyRent: 44, monopolyRent: 66, house1Rent: 110, house2Rent: 330, house3Rent: 800, house4Rent: 975, hotelRent: 1150, skyscraperRent: 2150, line: 2 },
  { position: 35, name: 'Ventnor Avenue', type: 'PROPERTY', price: 260, group: 'f', houseCost: 150, baseRent: 22, partialMonopolyRent: 44, monopolyRent: 66, house1Rent: 110, house2Rent: 330, house3Rent: 800, house4Rent: 975, hotelRent: 1150, skyscraperRent: 2150, line: 2 },
  { position: 36, name: 'Water Works', type: 'UTILITY', price: 150, group: 'utility', utilityMultiplier1: 4, utilityMultiplier2: 10, utilityMultiplier3: 20, line: 2 },
  { position: 37, name: 'Marvin Gardens', type: 'PROPERTY', price: 280, group: 'f', houseCost: 150, baseRent: 24, partialMonopolyRent: 48, monopolyRent: 60, house1Rent: 120, house2Rent: 360, house3Rent: 850, house4Rent: 1025, hotelRent: 1200, skyscraperRent: 2200, line: 2 },
  { position: 38, name: 'California Avenue', type: 'PROPERTY', price: 280, group: 'f', houseCost: 150, baseRent: 24, partialMonopolyRent: 48, monopolyRent: 60, house1Rent: 120, house2Rent: 360, house3Rent: 850, house4Rent: 1025, hotelRent: 1200, skyscraperRent: 2200, line: 2 },

  // === CORNER: GO TO JAIL ===
  { position: 39, name: 'Go to Jail', type: 'SPECIAL', action: 'goToJail', corner: true },

  // === GREEN GROUP (g) ===
  { position: 40, name: 'Pacific Avenue', type: 'PROPERTY', price: 300, group: 'g', houseCost: 200, baseRent: 26, partialMonopolyRent: 52, monopolyRent: 78, house1Rent: 130, house2Rent: 390, house3Rent: 900, house4Rent: 1100, hotelRent: 1275, skyscraperRent: 2275, line: 3 },
  { position: 41, name: 'South Carolina Avenue', type: 'PROPERTY', price: 300, group: 'g', houseCost: 200, baseRent: 26, partialMonopolyRent: 52, monopolyRent: 78, house1Rent: 130, house2Rent: 390, house3Rent: 900, house4Rent: 1100, hotelRent: 1275, skyscraperRent: 2275, line: 3 },
  { position: 42, name: 'North Carolina Avenue', type: 'PROPERTY', price: 300, group: 'g', houseCost: 200, baseRent: 28, partialMonopolyRent: 56, monopolyRent: 84, house1Rent: 150, house2Rent: 450, house3Rent: 1000, house4Rent: 1200, hotelRent: 1400, skyscraperRent: 2400, line: 3 },
  { position: 43, name: 'Community Chest', type: 'CHEST', special: true, line: 3 },
  { position: 44, name: 'Pennsylvania Avenue', type: 'PROPERTY', price: 320, group: 'g', houseCost: 200, baseRent: 28, partialMonopolyRent: 56, monopolyRent: 84, house1Rent: 150, house2Rent: 450, house3Rent: 1000, house4Rent: 1200, hotelRent: 1400, skyscraperRent: 2400, line: 3 },
  { position: 45, name: 'Short Line', type: 'STATION', price: 200, group: 'station', hasDepot: false, stationRent1: 25, stationRent2: 50, stationRent3: 100, stationRent4: 200, line: 3 },
  { position: 46, name: 'Chance', type: 'CHANCE', special: true, line: 3 },
  { position: 47, name: 'Birthday Gift', type: 'SPECIAL', action: 'birthdayGift', line: 3 },
  { position: 48, name: 'Florida Avenue', type: 'PROPERTY', price: 350, group: 'h', houseCost: 200, baseRent: 35, partialMonopolyRent: 70, monopolyRent: 105, house1Rent: 175, house2Rent: 500, house3Rent: 1100, house4Rent: 1300, hotelRent: 1500, skyscraperRent: 2500, line: 3 },
  { position: 49, name: 'Park Place', type: 'PROPERTY', price: 350, group: 'h', houseCost: 200, baseRent: 35, partialMonopolyRent: 70, monopolyRent: 105, house1Rent: 175, house2Rent: 500, house3Rent: 1100, house4Rent: 1300, hotelRent: 1500, skyscraperRent: 2500, line: 3 },
  { position: 50, name: 'Bank Deposit', type: 'SPECIAL', action: 'bankDeposit', line: 3 },
  { position: 51, name: 'Boardwalk', type: 'PROPERTY', price: 400, group: 'h', houseCost: 200, baseRent: 50, partialMonopolyRent: 100, monopolyRent: 150, house1Rent: 200, house2Rent: 600, house3Rent: 1400, house4Rent: 1700, hotelRent: 2000, skyscraperRent: 3000, line: 3 }
];