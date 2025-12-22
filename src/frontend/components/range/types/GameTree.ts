import { Position, RangeData, TableConfig } from '../RangeBuilder';
import { DecisionNode } from './PokerState';

// Legacy interface - kept for compatibility
export interface GameState {
  pot: number;
  effectiveStacks: number;
  toAct: Position | null;
  lastRaise: number;
  lastPosition: Position | null;
  street: 'preflop' | 'flop' | 'turn' | 'river';
  boardCards: string[];
  isComplete: boolean;
  playersInHand: Position[]; // Track who's still in the hand
  lastToAct: Position | null; // Track who needs to act last this round
}

// Legacy interface - kept for compatibility
export interface GameNode {
  id: string;
  position: Position;
  action: string;
  amount?: number;
  gameState: GameState;
  ranges: { [position: string]: RangeData };
  children: GameNode[];
  parent: GameNode | null;
  depth: number;
}

// Updated to use DecisionNode
export interface GameTree {
  root: DecisionNode;
  currentNode: DecisionNode;
  selectedNode: DecisionNode;
  tableConfig: TableConfig;
  positions: Position[];
}

export class PokerGameEngine {
  private tableConfig: TableConfig;
  private positions: Position[];

  constructor(tableConfig: TableConfig, positions: Position[]) {
    this.tableConfig = tableConfig;
    this.positions = positions;
  }

  createInitialGameState(): GameState {
    return {
      pot: 1.5, // SB (0.5BB) + BB (1BB) = 1.5BB starting pot
      effectiveStacks: this.tableConfig.stackSize,
      toAct: this.positions[0], // First position to act (UTG/HJ)
      lastRaise: 1, // BB is the current bet to match
      lastPosition: 'BB', // BB posted the last "bet"
      street: 'preflop',
      boardCards: [],
      isComplete: false,
      playersInHand: [...this.positions], // Everyone starts in the hand
      lastToAct: this.positions[this.positions.length - 1] // BB acts last preflop
    };
  }

  calculateNewGameState(
    currentState: GameState, 
    position: Position, 
    action: string, 
    amount?: number
  ): GameState {
    const newState = { 
      ...currentState,
      playersInHand: [...currentState.playersInHand]
    };
    
    switch (action) {
      case 'fold':
        // Remove player from hand
        newState.playersInHand = newState.playersInHand.filter(p => p !== position);
        break;
        
      case 'call':
        // Call matches the current bet
        const toCall = currentState.lastRaise;
        newState.pot += toCall;
        newState.effectiveStacks -= toCall;
        break;
        
      case 'check':
        // No bet, just pass
        break;
        
      case 'open':
        // Opening the pot (first voluntary bet beyond blinds)
        if (amount) {
          newState.pot += amount;
          newState.effectiveStacks -= amount;
          newState.lastRaise = amount;
          newState.lastPosition = position;
          newState.lastToAct = position; // Reset who acts last
        }
        break;
        
      case 'raise':
        // Re-raising an existing bet
        if (amount) {
          // Amount is the total bet, not just the raise portion
          newState.pot += amount;
          newState.effectiveStacks -= amount;
          newState.lastRaise = amount;
          newState.lastPosition = position;
          newState.lastToAct = position; // Reset who acts last
        }
        break;
        
      case 'allin':
        // All-in with remaining stack
        newState.pot += currentState.effectiveStacks;
        newState.effectiveStacks = 0;
        newState.lastRaise = currentState.effectiveStacks;
        newState.lastPosition = position;
        newState.lastToAct = position; // Reset who acts last
        break;
    }

    // Find next player to act (must be in the hand)
    let nextPosIndex = (this.positions.indexOf(position) + 1) % this.positions.length;
    let attempts = 0;
    while (attempts < this.positions.length) {
      const nextPos = this.positions[nextPosIndex];
      if (newState.playersInHand.includes(nextPos)) {
        newState.toAct = nextPos;
        break;
      }
      nextPosIndex = (nextPosIndex + 1) % this.positions.length;
      attempts++;
    }

    // Check if betting round is complete
    const isRoundComplete = this.isRoundComplete(newState, position, action);
    
    if (isRoundComplete) {
      // Move to next street or end hand
      if (newState.playersInHand.length === 1) {
        // Only one player left - hand is over
        newState.isComplete = true;
        newState.toAct = null;
      } else if (newState.street === 'river') {
        // River betting complete - showdown
        newState.isComplete = true;
        newState.toAct = null;
      } else {
        // Move to next street
        newState.street = this.getNextStreet(newState.street);
        newState.lastRaise = 0; // Reset bet for new street
        newState.lastPosition = null;
        
        // First to act postflop is first remaining player after blinds
        const postflopOrder = this.positions.filter(p => newState.playersInHand.includes(p));
        newState.toAct = postflopOrder[0];
        newState.lastToAct = postflopOrder[postflopOrder.length - 1];
      }
    }

    return newState;
  }
  
  private isRoundComplete(state: GameState, lastActor: Position, lastAction: string): boolean {
    // Round is complete if:
    // 1. Only one player left
    if (state.playersInHand.length <= 1) return true;
    
    // 2. Everyone has acted and last person didn't raise
    if (lastActor === state.lastToAct && lastAction !== 'raise' && lastAction !== 'open') {
      return true;
    }
    
    // 3. Everyone checked (no bet to call)
    if (state.lastRaise === 0 && lastActor === state.lastToAct) {
      return true;
    }
    
    return false;
  }
  
  private getNextStreet(current: string): 'preflop' | 'flop' | 'turn' | 'river' {
    switch (current) {
      case 'preflop': return 'flop';
      case 'flop': return 'turn';
      case 'turn': return 'river';
      default: return 'river';
    }
  }

  createRootNode(): GameNode {
    return {
      id: 'root',
      position: 'SB', // Arbitrary starting position
      action: 'start',
      gameState: this.createInitialGameState(),
      ranges: this.createInitialRanges(),
      children: [],
      parent: null,
      depth: 0
    };
  }

  private createInitialRanges(): { [position: string]: RangeData } {
    const ranges: { [position: string]: RangeData } = {};
    
    // Initialize all positions with empty ranges
    this.positions.forEach(position => {
      ranges[position] = {};
    });
    
    return ranges;
  }

  createChildNode(
    parent: GameNode,
    position: Position,
    action: string,
    amount?: number
  ): GameNode {
    const newGameState = this.calculateNewGameState(
      parent.gameState,
      position,
      action,
      amount
    );

    const childNode: GameNode = {
      id: `${parent.id}_${position}_${action}_${amount || ''}`,
      position,
      action,
      amount,
      gameState: newGameState,
      ranges: { ...parent.ranges }, // Copy parent ranges by default
      children: [],
      parent,
      depth: parent.depth + 1
    };

    parent.children.push(childNode);
    return childNode;
  }

  findNodeByPath(root: GameNode, positions: Position[], actions: string[]): GameNode | null {
    let currentNode = root;
    
    for (let i = 0; i < positions.length; i++) {
      const child = currentNode.children.find(
        child => child.position === positions[i] && child.action === actions[i]
      );
      
      if (!child) {
        return null;
      }
      
      currentNode = child;
    }
    
    return currentNode;
  }
}