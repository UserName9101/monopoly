import { CellData } from "../config/boardConfig";

export type TurnResult = {
newPosition: number;
moneyChange: number;
message?: string;
};

export interface IGameEngine {
mode: "CLASSIC" | "MEGA";
calculateMove(currentPosition: number, diceSum: number): TurnResult;
onCellLanded?(position: number): { moneyChange: number; message?: string } | null;
}

export type RoomSettings = { mode: "CLASSIC" | "MEGA"; maxPlayers: number; };

export type BoardCellState = CellData & {
ownerId?: string;
houses?: number;
isMortgaged?: boolean;
mortgageTurnsRemaining?: number;
hasDepot?: boolean;
};

export type RoomPlayer = { userId: string; socketId: string; displayName: string; avatarUrl: string; isOnline: boolean; };

export type PlayerState = {
userId: string;
position: number;
money: number;
isBankrupt: boolean;
busTickets: number;
inJail?: boolean;
jailTurns?: number;
};

export type RoomPhase = "ACTIONS" | "POST_MOVE" | "ENDED";

export type ActiveAction = {
type: "ROLL" | "BUY" | "PAY" | "TICKET_MOVE" | "TRIPLE_CHOICE" | "CHOOSE_AUCTION" | "CHOOSE_BIRTHDAY" | "CHOOSE_BUS_ACTION" | "JAIL";
data?: { price?: number; amount?: number; targetUserId?: string; ticketsAvailable?: boolean }
} | null;

export type ContractProposal = {
id: string;
proposerId: string;
targetId: string;
offeredMoney: number;
offeredProperties: number[];
requestedMoney: number;
requestedProperties: number[];
createdAt: number;
};

export type BuildLimitState = Record<string, boolean>;
export type BalanceResolveAction = 'END_TURN' | 'MR' | 'BUS' | null;

export type CardEffect = {
id: number;
text: string;
action: 'collect_money' | 'pay_money' | 'move_to' | 'move_to_nearest' | 'go_to_jail' | 'get_out_of_jail' | 'pay_each' | 'collect_from_each' | 'repair_properties' | 'nothing';
amount?: number;
targetPosition?: number;
targetType?: 'PROPERTY' | 'STATION' | 'UTILITY' | 'RAILROAD';
moveDirection?: 'forward' | 'backward';
moveSteps?: number;
perHouse?: number;
perHotel?: number;
};

export type CardDeck = {
chance: number[];
chest: number[];
};

export type CellResolveResult =
  | { type: "WAIT_ACTION"; action: any }
  | { type: "CONTINUE" }
  | { type: "END_TURN" };

export type GameState = {
players: PlayerState[];
currentPlayerIndex: number;
turnStartTime?: number;
currentPhase: RoomPhase;
activeAction: ActiveAction;
contractsUsedThisTurn: number;
isPaused?: boolean;
pendingMrEffect?: boolean;
thisRollWasDoubles?: boolean;
consecutiveDoubles?: number;
lastDiceSum?: number;
effectiveDiceSum?: number;
buildLimitsThisTurn?: BuildLimitState;
forcedBalanceGroupId?: string | null;
pendingBalanceResolveAction?: BalanceResolveAction;
pendingBusChoice?: boolean;
pendingBusBaseMove?: number;
pendingBusExtraMove?: boolean;
auctionState?: {
isAuction: boolean;
cellPosition: number;
basePrice: number;
currentBid: number;
queue: string[];
currentIdx: number;
hasIncreasedBid: Record<string, boolean>;
lastBidderId?: string;
deadline: number;
};
};

export type Room = {
id: string;
players: RoomPlayer[];
gameState: GameState;
status: "LOBBY" | "PLAYING";
hostId: string;
settings: RoomSettings;
engine: IGameEngine;
createdAt: number;
board: BoardCellState[];
turnTimer?: NodeJS.Timeout;
phaseTimer?: NodeJS.Timeout;
auctionTimer?: NodeJS.Timeout;
pendingContracts: ContractProposal[];
pausedTurnRemaining?: number;
busTicketsDeck: number;
cardDeck: CardDeck;
roomPieces?: Record<string, string>;
};