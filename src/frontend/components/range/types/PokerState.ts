import { RangeData } from '../RangeBuilder';

export type Position = 'UTG' | 'UTG+1' | 'HJ' | 'LJ' | 'CO' | 'BTN' | 'SB' | 'BB';
export type ActionType = 'fold' | 'check' | 'call' | 'open' | 'bet' | 'raise' | 'allin' | 'start';
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
}

// This is the new, critical structure for our timeline
export interface ActionNode {
  id: string; // e.g., "root_HJ_open_2.5_BTN_call_2.5"
  
  // The action that LED to this state
  position: Position;
  action: ActionType;
  amount?: number;

  // The complete state of the game BEFORE this action was taken
  stateBefore: BettingRoundState;

  // The actions that WERE available at this decision point
  availableActions: PlayerAction[];
  
  // Range data at this node
  ranges: { [position: string]: RangeData };
  
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