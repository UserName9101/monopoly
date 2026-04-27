// config/gameConfig.ts

export const GAME_CONFIG = {
  // Тайминги (в миллисекундах)
  timers: {
    ACTIONS_PHASE: 90_000,      // Фаза 1: действия игрока
    POST_MOVE_PHASE: 90_000,    // Фаза 3: пост-ход (если нужно действие)
    CONTRACT_SIGN_TIMEOUT: 30_000, // Время на подписание контракта
    TURN_CHECK_INTERVAL: 1_000, // Интервал проверки таймера
  },
  
  // Экономика
  economy: {
    STARTING_MONEY: 2500,
    BANKRUPTCY_RESET_MONEY: 0,
    MAX_CONTRACTS_PER_TURN: 3,
  },
  
  // Лимиты
  limits: {
    MAX_PLAYERS_CLASSIC: 4,
    MAX_PLAYERS_MEGA: 8,
  },
  
  // Типы клеток, требующих активного действия в Фазе 3
  cellsRequiringAction: ['PROPERTY_UNOWNED', 'PROPERTY_OWNED_OTHER', 'TAX_INSUFFICIENT', 'CHEST_CHOICE', 'CHANCE_CHOICE'] as const,
} as const;

export type GameConfig = typeof GAME_CONFIG;
export type TurnPhase = 'ACTIONS' | 'ROLL_PENDING' | 'POST_MOVE' | 'IDLE';
export type CellTypeRequiringAction = typeof GAME_CONFIG.cellsRequiringAction[number];