export type UserProfile = {
id: string;
username: string;
displayName: string;
avatarUrl: string;
gamesPlayed: number;
wins: number;
};

export type RoomPlayer = {
userId: string;
socketId: string;
displayName: string;
avatarUrl: string;
isOnline: boolean;
};

export type PlayerState = {
userId: string;
position: number;
money: number;
isBankrupt: boolean;
busTickets: number;
inJail?: boolean;
jailTurns?: number;
animatedPosition?: number;
isMoving?: boolean;
};

export type GameState = {
players: PlayerState[];
currentPlayerIndex: number;
turnStartTime?: number;
currentPhase: "ACTIONS" | "POST_MOVE" | "ENDED";
activeAction: { type: "ROLL" | "BUY" | "PAY" | "TICKET_MOVE" | "TRIPLE_CHOICE" | "CHOOSE_AUCTION" | "CHOOSE_BIRTHDAY" | "CHOOSE_BUS_ACTION" | "JAIL"; data?: { price?: number; amount?: number; targetUserId?: string; ticketsAvailable?: boolean } } | null;
contractsUsedThisTurn: number;
isPaused?: boolean;
pendingMrEffect?: boolean;
thisRollWasDoubles?: boolean;
consecutiveDoubles?: number;
effectiveDiceSum?: number;
buildLimitsThisTurn?: Record<string, boolean>;
forcedBalanceGroupId?: string | null;
pendingBalanceResolveAction?: 'END_TURN' | 'MR' | 'BUS' | null;
pendingBusChoice?: boolean;
pendingBusBaseMove?: number;
pendingBusExtraMove?: boolean;
};

export type AuctionState = {
isAuction: boolean;
cellPosition: number;
basePrice: number;
currentBid: number;
queue: string[];
currentIdx: number;
hasIncreasedBid: Record<string, boolean>;
lastBidderId?: string;
deadline: number;
currentBidderId?: string;
};

export type BoardCell = {
position: number;
name: string;
type: string;
price?: number;
baseRent?: number;
group?: string;
ownerId?: string;
action?: string;
corner?: boolean;
special?: boolean;
line?: number;
houses?: number;
hasDepot?: boolean;
isMortgaged?: boolean;
mortgageTurnsRemaining?: number;
houseCost?: number;
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
};

export type ContractProposal = {
contractId: string;
proposerId: string;
targetId: string;
offeredMoney: number;
offeredProperties: number[];
requestedMoney: number;
requestedProperties: number[];
};

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

export type RoomPayload = {
id: string;
players: RoomPlayer[];
hostId: string;
status: string;
settings: any;
board: BoardCell[];
gameState?: GameState;
};

export type RoomSummary = {
id: string;
playerCount: number;
maxPlayers: number;
mode: string;
status: string;
playersPreview: any[];
};

export type ChatMessage = {
id: string;
text: string;
isSystem?: boolean;
timestamp: number;
};