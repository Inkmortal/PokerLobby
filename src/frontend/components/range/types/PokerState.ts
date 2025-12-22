import { RangeData } from '../RangeBuilder';

export type Position = 'UTG' | 'UTG+1' | 'HJ' | 'LJ' | 'CO' | 'BTN' | 'SB' | 'BB';
export type ActionType = 'fold' | 'check' | 'call' | 'open' | 'bet' | 'raise' | 'allin' | 'start' | 'advance';
export type Street = 'preflop' | 'flop' | 'turn' | 'river';

export interface PlayerAction {
  action: string;  // Allow string for flexibility with UI
  label: string;
  amount?: number;
}

export interface PlayerState {
  position: Position;
  stack: number;
  betInRound: number; // Amount bet in the current betting round
  totalInPot: number; // Total committed to pot across all streets
  isFolded: boolean;
  isAllIn: boolean;
  hasActedThisPass: boolean; // Resets on a raise
}

export interface BettingRoundState {
  players: Map<Position, PlayerState>;
  pot: number;
  amountToCall: number;
  lastAggressor: Position | null;
  street: Street;
  boardCards: string[];
  raiseCount: number; // Track number of raises/bets this street (0 = no raises yet)
}


/**
 * DecisionNode represents a decision point for a specific position
 * This is where a player needs to make a strategic decision
 */
export interface DecisionNode {
  id: string;                      // Unique identifier
  position: Position;               // Who makes the decision HERE
  gameState: BettingRoundState;    // Game state when decision is made
  range: RangeData;                // This position's strategy/frequencies
  edges: ActionEdge[];             // Available actions from here
  parent: DecisionNode | null;     // Parent decision node
  depth: number;                   // Depth in tree
  boardCards: string[];            // Board cards (empty = wildcard)
}

/**
 * ActionEdge represents an action taken from a decision point
 * Links one DecisionNode to the next
 */
export interface ActionEdge {
  action: ActionType;              // The action taken
  rawAmount?: number;              // Actual BB amount (e.g., 7.5)
  
  // Sizing information for flexible display
  sizeType?: 'multiplier' | 'percentage' | 'fixed';
  sizeValue?: number;              // 2.5 for "2.5x", 75 for "75%"
  
  // Display label (can be dynamic based on UI toggle)
  label: string;                   // "Raise to 7.5" or "Raise 2.5x"
  
  // Navigation
  toNode?: DecisionNode;           // Where this action leads (optional until created)
  
  // Optional strategy info (for future solver integration)
  frequency?: number;              // How often this action is taken (0-1)
  ev?: number;                     // Expected value of this action
}

/**
 * Game tree using clean architecture
 */
export interface GameTree {
  root: DecisionNode;
  currentNode: DecisionNode;       // Current position in tree
  selectedNode: DecisionNode;      // Node being viewed/edited
  tableConfig: any;
  positions: Position[];
}