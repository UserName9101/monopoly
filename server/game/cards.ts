import { CardEffect, CardDeck } from "./types";

export const CHANCE_CARDS: CardEffect[] = [
  { id: 0, text: "Advance to Go. Collect $200", action: 'move_to', targetPosition: 0 },
  { id: 1, text: "Advance to Illinois Ave", action: 'move_to', targetPosition: 30 },
  { id: 2, text: "Advance to St. Charles Place", action: 'move_to', targetPosition: 16 },
  { id: 3, text: "Advance to nearest Utility. Pay 10x dice roll if owned", action: 'move_to_nearest', targetType: 'UTILITY' },
  { id: 4, text: "Advance to nearest Railroad. Pay double rent if owned", action: 'move_to_nearest', targetType: 'RAILROAD' },
  { id: 5, text: "Bank pays you dividend of $50", action: 'collect_money', amount: 50 },
  { id: 6, text: "Get Out of Jail Free", action: 'get_out_of_jail' },
  { id: 7, text: "Go Back 3 Spaces", action: 'move_to', moveDirection: 'backward', moveSteps: 3 },
  { id: 8, text: "Go to Jail. Do not pass Go, do not collect $200", action: 'go_to_jail' },
  { id: 9, text: "Make general repairs: $25 per house, $100 per hotel", action: 'repair_properties', perHouse: 25, perHotel: 100 },
  { id: 10, text: "Pay poor tax of $15", action: 'pay_money', amount: 15 },
  { id: 11, text: "Take a trip to Reading Railroad", action: 'move_to', targetPosition: 6 },
  { id: 12, text: "Take a walk on the Boardwalk", action: 'move_to', targetPosition: 51 },
  { id: 13, text: "You have been elected Chairman. Pay each player $50", action: 'pay_each', amount: 50 },
  { id: 14, text: "Your building loan matures. Collect $150", action: 'collect_money', amount: 150 },
  { id: 15, text: "You have won a crossword competition. Collect $100", action: 'collect_money', amount: 100 },
];

export const CHEST_CARDS: CardEffect[] = [
  { id: 0, text: "Advance to Go. Collect $200", action: 'move_to', targetPosition: 0 },
  { id: 1, text: "Bank error in your favor. Collect $200", action: 'collect_money', amount: 200 },
  { id: 2, text: "Doctor's fee. Pay $50", action: 'pay_money', amount: 50 },
  { id: 3, text: "From sale of stock you get $50", action: 'collect_money', amount: 50 },
  { id: 4, text: "Get Out of Jail Free", action: 'get_out_of_jail' },
  { id: 5, text: "Holiday fund matures. Receive $100", action: 'collect_money', amount: 100 },
  { id: 6, text: "Income tax refund. Collect $20", action: 'collect_money', amount: 20 },
  { id: 7, text: "It is your birthday. Collect $10 from each player", action: 'collect_from_each', amount: 10 },
  { id: 8, text: "Life insurance matures. Collect $100", action: 'collect_money', amount: 100 },
  { id: 9, text: "Pay hospital fees of $100", action: 'pay_money', amount: 100 },
  { id: 10, text: "Pay school fees of $50", action: 'pay_money', amount: 50 },
  { id: 11, text: "Receive $25 consultancy fee", action: 'collect_money', amount: 25 },
  { id: 12, text: "You are assessed for street repairs: $40 per house, $115 per hotel", action: 'repair_properties', perHouse: 40, perHotel: 115 },
  { id: 13, text: "You have won second prize in a beauty contest. Collect $10", action: 'collect_money', amount: 10 },
  { id: 14, text: "You inherit $100", action: 'collect_money', amount: 100 },
  { id: 15, text: "Go to Jail. Do not pass Go, do not collect $200", action: 'go_to_jail' },
];

export function drawCard(deck: 'chance' | 'chest', cardDeck: CardDeck): { cardId: number; reshuffled: boolean } | null {
  const deckArr = cardDeck[deck];
  if (deckArr.length === 0) {
    cardDeck[deck] = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
    return { cardId: Math.floor(Math.random() * 16), reshuffled: true };
  }
  const randomIdx = Math.floor(Math.random() * deckArr.length);
  const cardId = deckArr.splice(randomIdx, 1)[0];
  return { cardId, reshuffled: false };
}

export function getCard(deck: 'chance' | 'chest', cardId: number): CardEffect | undefined {
  const cards = deck === 'chance' ? CHANCE_CARDS : CHEST_CARDS;
  return cards.find(c => c.id === cardId);
}