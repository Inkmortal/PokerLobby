// Shared types used across frontend, API, and solver

// Card types
export type Suit = 'h' | 'd' | 'c' | 's';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';
export type Card = `${Rank}${Suit}`;

// Position types
export type Position = 'UTG' | 'UTG+1' | 'HJ' | 'LJ' | 'CO' | 'BTN' | 'SB' | 'BB';

// Game configuration
export interface GameConfig {
  type: 'Cash' | 'MTT' | 'SNG';
  stakes: string;
  tableSize: number;
  stackDepth: number; // in BBs
  rake: {
    percentage: number;
    cap: number;
  };
  ante?: number;
  straddle?: boolean;
}

// Solver configuration
export interface SolverConfig {
  game: GameConfig;
  board?: Card[];
  ranges: {
    [position: string]: Range;
  };
  betSizes: {
    flop?: number[];
    turn?: number[];
    river?: number[];
  };
  accuracy: number;
  iterations?: number;
  nodeList?: NodeLocking[];
}

// Range representation
export interface Range {
  name: string;
  position: Position;
  action: 'RFI' | '3BET' | 'CALL' | '4BET' | 'SQUEEZE' | 'LIMP' | 'DEFEND';
  hands: string; // e.g., "AA-TT,AKs-AJs,AKo-AQo"
  frequency?: number; // Overall frequency
  weights?: { [hand: string]: number }; // Individual hand weights
}

// Solution representation
export interface Solution {
  id: string;
  config: SolverConfig;
  tree: GameTree;
  exploitability: number;
  iterations: number;
  solveTime: number;
  timestamp: Date;
}

// Game tree representation
export interface GameTree {
  root: GameNode;
  size: number;
}

export interface GameNode {
  id: string;
  type: 'decision' | 'chance' | 'terminal';
  player?: number;
  pot: number;
  stacks: number[];
  board?: Card[];
  actions?: Action[];
  strategy?: number[]; // Probabilities for each action
  ev?: number;
  children?: GameNode[];
}

export interface Action {
  type: 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'allin';
  amount?: number;
}

// Player profiles
export interface PlayerProfile {
  id: string;
  name: string;
  category: 'Nit' | 'TAG' | 'LAG' | 'Fish' | 'Reg' | 'Whale' | 'Custom';
  stakes: string;
  
  // Preflop tendencies
  preflop: {
    frequencies: {
      [key: string]: number; // e.g., UTG_RFI_FREQ: 15
    };
    ranges: {
      [key: string]: string; // e.g., UTG_RFI: "AA-TT,AKs..."
    };
  };
  
  // Postflop tendencies
  postflop: {
    flop: {
      cbet_dry: number;
      cbet_wet: number;
      check_raise: number;
      donk: number;
    };
    turn: {
      barrel: number;
      delayed_cbet: number;
      check_raise: number;
    };
    river: {
      triple_barrel: number;
      bluff_frequency: number;
      thin_value: number;
    };
    sizing: {
      flop_cbet: number;
      turn_barrel: number;
      river_bet: number;
    };
  };
  
  // Exploits (numerical values)
  exploits: {
    folds_to_3bet: number;
    folds_to_cbet_flop: number;
    folds_to_cbet_turn: number;
    river_bluff_percent: number;
    [key: string]: number;
  };
}

// Node locking for exploitative solving
export interface NodeLocking {
  nodeId: string;
  player: number;
  action: string;
  frequency: number;
}

// Hand history
export interface Hand {
  id: string;
  timestamp: Date;
  site: string;
  gameType: string;
  stakes: string;
  tableSize: number;
  hero: string;
  heroPosition: Position;
  holeCards: [Card, Card];
  board: Card[];
  actions: HandAction[];
  pot: number;
  rake: number;
  result: number; // Won/lost amount
}

export interface HandAction {
  street: 'preflop' | 'flop' | 'turn' | 'river';
  player: string;
  position: Position;
  action: string;
  amount?: number;
}

// Training/Practice modes
export interface DrillConfig {
  name: string;
  description: string;
  position: Position;
  situation: string; // e.g., "BTN vs BB 3bet pot"
  difficulty: 'easy' | 'medium' | 'hard';
  profiles?: PlayerProfile[]; // Opponent profiles
  hands?: number; // Number of hands to play
}

export interface DrillResult {
  drillId: string;
  userId: string;
  score: number;
  mistakes: Mistake[];
  evLost: number;
  handsPlayed: number;
  timestamp: Date;
}

export interface Mistake {
  handId: string;
  street: string;
  action: string;
  optimalAction: string;
  evLost: number;
  explanation: string;
}

// Campaign mode
export interface CampaignLevel {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  completed: boolean;
  stars: number; // 0-3
  objectives: Objective[];
  rewards: Reward[];
}

export interface Objective {
  id: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
}

export interface Reward {
  type: 'range' | 'profile' | 'solution' | 'achievement';
  item: string;
  unlocked: boolean;
}

// Settings
export interface Settings {
  theme: 'dark' | 'light' | 'auto';
  colorScheme: 'catppuccin' | 'nord' | 'dracula';
  fourColorDeck: boolean;
  animations: boolean;
  sounds: boolean;
  autoSave: boolean;
  defaultStakes: string;
  defaultTableSize: number;
  hotkeyBindings: { [action: string]: string };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// WebSocket events for multiplayer
export interface GameEvent {
  type: 'action' | 'state' | 'result' | 'chat';
  gameId: string;
  playerId: string;
  data: any;
  timestamp: Date;
}

// Export all types
export type {
  SolverAdapter,
  StorageAdapter,
  ApiAdapter,
} from './interfaces';

// Type guards
export const isCard = (value: any): value is Card => {
  return typeof value === 'string' && /^[2-9TJQKA][hdcs]$/.test(value);
};

export const isPosition = (value: any): value is Position => {
  return ['UTG', 'UTG+1', 'HJ', 'LJ', 'CO', 'BTN', 'SB', 'BB'].includes(value);
};

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;