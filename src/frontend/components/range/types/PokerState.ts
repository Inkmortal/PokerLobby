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

// Node represents a DECISION POINT for a specific position
export interface ActionNode {
  id: string; // Unique identifier
  
  // WHO needs to make a decision at this node
  position: Position;  // The position that needs to act at this decision point
  
  // The game state when this position needs to decide
  stateBefore: BettingRoundState;
  
  // The STRATEGY for this position at this decision point
  // This is the range/strategy for the position that needs to act
  ranges: { [position: string]: RangeData };
  
  // What actions are available at this decision point
  availableActions: PlayerAction[];
  
  // How we got to this node (action taken by PREVIOUS position)
  // For root node: action = 'start'
  // For others: the action taken by the parent node's position
  action: ActionType;      // Action that led here (for display)
  amount?: number;         // Amount if applicable
  
  // Board cards for this node (empty = wildcard/any board)
  boardCards: string[];
  
  // Tree structure
  children: ActionNode[];
  parent: ActionNode | null;
  depth: number;
}

export interface GameTree {
  root: ActionNode;
  currentNode: ActionNode;
  tableConfig: any;
  positions: Position[];
}