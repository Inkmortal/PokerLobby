import { 
  Position, 
  ActionType, 
  Street,
  PlayerAction, 
  PlayerState, 
  BettingRoundState,
  ActionNode 
} from '../types/PokerState';
import { RangeData, TableConfig } from '../RangeBuilder';

export class PokerGameEngine {
  private positions: Position[];
  private tableConfig: TableConfig;

  constructor(positions: Position[], tableConfig: TableConfig) {
    this.positions = positions;
    this.tableConfig = tableConfig;
  }

  // Create initial game state
  public createInitialState(): BettingRoundState {
    const players = new Map<Position, PlayerState>();
    
    this.positions.forEach((pos, index) => {
      const isSB = pos === 'SB';
      const isBB = pos === 'BB';
      
      players.set(pos, {
        position: pos,
        stack: this.tableConfig.stackSize - (isSB ? 0.5 : isBB ? 1 : 0),
        betInRound: isSB ? 0.5 : isBB ? 1 : 0,
        totalInPot: isSB ? 0.5 : isBB ? 1 : 0,
        isFolded: false,
        isAllIn: false,
        hasActedThisPass: false
      });
    });

    return {
      players,
      pot: 1.5, // SB + BB
      amountToCall: 1, // BB
      lastAggressor: null,
      street: 'preflop',
      boardCards: []
    };
  }

  // Check if betting round is complete
  public isBettingRoundOver(state: BettingRoundState): boolean {
    const allPlayers = Array.from(state.players.values());
    const notFoldedPlayers = allPlayers.filter(p => !p.isFolded);
    const activeNonAllInPlayers = notFoldedPlayers.filter(p => !p.isAllIn);

    // If only one player remains not folded, hand is over
    if (notFoldedPlayers.length <= 1) {
      return true;
    }

    // If no one can act anymore (everyone is all-in or folded)
    if (activeNonAllInPlayers.length === 0) {
      return true;
    }

    // If only one player can still act, check if they've matched the bet
    if (activeNonAllInPlayers.length === 1) {
      const lastActive = activeNonAllInPlayers[0];
      // They need to at least match the current bet or have acted if no bet
      return lastActive.betInRound >= state.amountToCall && lastActive.hasActedThisPass;
    }

    // Multiple players can still act - check if they've all acted and matched bets
    const allHaveActed = activeNonAllInPlayers.every(p => p.hasActedThisPass);
    if (!allHaveActed) {
      return false;
    }

    // Are all active players' bets equal?
    const allBetsEqual = activeNonAllInPlayers.every(p => p.betInRound === state.amountToCall);
    
    return allBetsEqual;
  }

  // Get players who still need to act
  public getPlayersStillToAct(state: BettingRoundState, lastActor?: Position): Position[] {
    const pending: Position[] = [];
    
    // Special case: no one has acted yet (start of hand)
    if (!lastActor) {
      // Preflop: start from first position after blinds (HJ in 6-max, UTG in 9-max)
      // Postflop: start from first position (SB if still in)
      if (state.street === 'preflop') {
        // Find first non-blind position and include all positions from there
        for (const pos of this.positions) {
          if (pos !== 'SB' && pos !== 'BB') {
            const player = state.players.get(pos);
            if (player && !player.isFolded && !player.isAllIn) {
              pending.push(pos);
            }
          }
        }
        // Then add the blinds at the end
        for (const pos of ['SB', 'BB'] as Position[]) {
          const player = state.players.get(pos);
          if (player && !player.isFolded && !player.isAllIn) {
            pending.push(pos);
          }
        }
      } else {
        // Postflop: action starts from earliest position
        for (const pos of this.positions) {
          const player = state.players.get(pos);
          if (player && !player.isFolded && !player.isAllIn) {
            pending.push(pos);
          }
        }
      }
      return pending;
    }
    
    // Normal case: continue from last actor
    const startIndex = this.positions.indexOf(lastActor);
    
    // Check each position in order after the last actor
    for (let i = 1; i <= this.positions.length; i++) {
      const pos = this.positions[(startIndex + i) % this.positions.length];
      const player = state.players.get(pos);
      
      // Skip the last aggressor if we've come full circle and they don't need to act again
      if (pos === state.lastAggressor && player && player.betInRound >= state.amountToCall) {
        // The aggressor already has the right amount in, action is complete
        break;
      }
      
      if (player && !player.isFolded && !player.isAllIn) {
        // Player needs to act if:
        // 1. They haven't acted this pass, OR
        // 2. They need to match a bet
        if (!player.hasActedThisPass || player.betInRound < state.amountToCall) {
          pending.push(pos);
        }
      }
    }
    
    return pending;
  }

  // Determine all valid actions for a player
  public getAvailableActions(state: BettingRoundState, position: Position): PlayerAction[] {
    const player = state.players.get(position);
    if (!player || player.isFolded || player.isAllIn) return [];

    const available: PlayerAction[] = [];
    const isPreflop = state.street === 'preflop';
    const hasAggressor = state.lastAggressor !== null;
    const hasBet = state.amountToCall > (isPreflop ? 1 : 0);
    
    // Always can fold (unless checking is free)
    if (player.betInRound < state.amountToCall) {
      available.push({ action: 'fold', label: 'Fold' });
    }

    // Check - when bet is matched or no bet to call
    if (player.betInRound === state.amountToCall) {
      available.push({ action: 'check', label: 'Check' });
    }

    // Call/Limp
    if (player.betInRound < state.amountToCall) {
      const toCall = state.amountToCall - player.betInRound;
      
      // Special case: Limp in preflop
      if (isPreflop && state.amountToCall === 1 && !hasAggressor) {
        available.push({ 
          action: 'call', 
          label: 'Limp 1BB' 
        });
      } else {
        // Show the total amount to match, not the additional chips needed
        available.push({ 
          action: 'call', 
          label: `Call ${state.amountToCall.toFixed(1)}BB` 
        });
      }
    }

    // Bet/Raise options
    if (!hasAggressor && isPreflop) {
      // Opening bet
      const openSize = this.tableConfig.preflop.openSize;
      available.push({ 
        action: 'open', 
        amount: openSize, 
        label: `Open ${openSize}BB` 
      });
      
      // Alternative open sizes
      if (openSize !== 2.5) {
        available.push({ action: 'open', amount: 2.5, label: 'Open 2.5BB' });
      }
      if (openSize !== 3) {
        available.push({ action: 'open', amount: 3, label: 'Open 3BB' });
      }
    } else if (!hasAggressor && !isPreflop) {
      // Postflop bet
      const betSizes = this.getBetSizesForStreet(state.street);
      betSizes.forEach(size => {
        const betAmount = (state.pot * size) / 100;
        available.push({
          action: 'bet',  // Use 'bet' for postflop instead of 'open'
          amount: betAmount,
          label: `Bet ${betAmount.toFixed(1)}BB`  // Show in BBs
        });
      });
    } else {
      // Raise
      if (isPreflop) {
        const raiseMultiplier = this.getRaiseMultiplier(state);
        const raiseAmount = state.amountToCall * raiseMultiplier;
        
        available.push({ 
          action: 'raise', 
          amount: raiseAmount, 
          label: `Raise to ${raiseAmount.toFixed(1)}BB` 
        });
        
        // Alternative raise size
        const altRaise = state.amountToCall * 2.5;
        if (Math.abs(altRaise - raiseAmount) > 0.1) {
          available.push({ 
            action: 'raise', 
            amount: altRaise, 
            label: `Raise to ${altRaise.toFixed(1)}BB` 
          });
        }
      } else {
        // Postflop raises - calculate based on pot
        const raiseSizes = [2.5, 3];  // Standard raise multipliers
        raiseSizes.forEach(multiplier => {
          const raiseAmount = state.amountToCall * multiplier;
          available.push({ 
            action: 'raise', 
            amount: raiseAmount, 
            label: `Raise to ${raiseAmount.toFixed(1)}BB` 
          });
        });
      }
    }

    // All-in
    if (player.stack > 0) {
      const allinTotal = player.stack + player.betInRound;
      available.push({ 
        action: 'allin', 
        amount: allinTotal, 
        label: `All-in ${allinTotal.toFixed(1)}BB` 
      });
    }

    return available;
  }

  // Apply an action and return the NEW state
  public applyAction(
    initialState: BettingRoundState,
    position: Position,
    action: ActionType,
    amount?: number
  ): BettingRoundState {
    // Deep clone the state
    const newState: BettingRoundState = {
      players: new Map(),
      pot: initialState.pot,
      amountToCall: initialState.amountToCall,
      lastAggressor: initialState.lastAggressor,
      street: initialState.street,
      boardCards: [...initialState.boardCards]
    };

    // Clone all players
    initialState.players.forEach((player, pos) => {
      newState.players.set(pos, { ...player });
    });

    const player = newState.players.get(position);
    if (!player) return initialState;

    // Apply the action
    switch (action) {
      case 'fold':
        player.isFolded = true;
        player.hasActedThisPass = true;
        break;

      case 'check':
        player.hasActedThisPass = true;
        break;

      case 'call':
        const toCall = newState.amountToCall - player.betInRound;
        const actualCall = Math.min(toCall, player.stack);
        player.stack -= actualCall;
        player.betInRound += actualCall;
        player.totalInPot += actualCall;
        player.hasActedThisPass = true;
        newState.pot += actualCall;
        
        if (player.stack === 0) {
          player.isAllIn = true;
        }
        break;

      case 'open':
      case 'bet':
      case 'raise':
        if (amount !== undefined) {
          const betAmount = amount - player.betInRound;
          const actualBet = Math.min(betAmount, player.stack);
          player.stack -= actualBet;
          player.betInRound += actualBet;
          player.totalInPot += actualBet;
          player.hasActedThisPass = true;
          newState.pot += actualBet;
          newState.amountToCall = player.betInRound;
          newState.lastAggressor = position;
          
          if (player.stack === 0) {
            player.isAllIn = true;
          }
          
          // Reset hasActedThisPass for all OTHER active players
          newState.players.forEach((p, pos) => {
            if (pos !== position && !p.isFolded && !p.isAllIn) {
              p.hasActedThisPass = false;
            }
          });
        }
        break;

      case 'allin':
        const allinAmount = player.stack;
        player.betInRound += allinAmount;
        player.totalInPot += allinAmount;
        player.stack = 0;
        player.isAllIn = true;
        player.hasActedThisPass = true;
        newState.pot += allinAmount;
        
        if (player.betInRound > newState.amountToCall) {
          newState.amountToCall = player.betInRound;
          newState.lastAggressor = position;
          
          // Reset hasActedThisPass for all OTHER active players
          newState.players.forEach((p, pos) => {
            if (pos !== position && !p.isFolded && !p.isAllIn) {
              p.hasActedThisPass = false;
            }
          });
        }
        break;
    }

    // NOTE: We do NOT automatically advance streets here
    // Street advancement should be handled explicitly by the UI
    // This prevents confusion where completing a betting round
    // automatically shows next street's actions

    return newState;
  }

  // Create root node
  public createRootNode(): ActionNode {
    const initialState = this.createInitialState();
    const firstToAct = this.positions.find(p => p !== 'SB' && p !== 'BB') || this.positions[0];
    
    return {
      id: 'root',
      position: 'SB' as Position, // Placeholder
      action: 'start',
      amount: undefined,
      stateBefore: initialState,
      availableActions: this.getAvailableActions(initialState, firstToAct),
      ranges: {},
      children: [],
      parent: null,
      depth: 0
    };
  }

  // Create child node
  public createChildNode(
    parent: ActionNode,
    position: Position,
    action: ActionType,
    amount?: number
  ): ActionNode {
    // The state after parent's action becomes the state before this action
    const stateAfterParent = parent.action === 'start' ? 
      parent.stateBefore : 
      this.applyAction(parent.stateBefore, parent.position, parent.action, parent.amount);
    
    const child: ActionNode = {
      id: `${parent.id}_${position}_${action}_${amount || ''}`,
      position,
      action,
      amount,
      stateBefore: stateAfterParent,
      availableActions: this.getAvailableActions(stateAfterParent, position),
      ranges: { ...parent.ranges },
      children: [],
      parent,
      depth: parent.depth + 1
    };
    
    parent.children.push(child);
    return child;
  }

  // Advance to next street (call this explicitly when betting round is complete)
  public advanceToNextStreet(state: BettingRoundState): BettingRoundState {
    const newState: BettingRoundState = {
      players: new Map(),
      pot: state.pot,
      amountToCall: 0,
      lastAggressor: null,
      street: this.getNextStreet(state.street),
      boardCards: [...state.boardCards]
    };

    // Clone all players and reset for new street
    state.players.forEach((player, pos) => {
      newState.players.set(pos, { 
        ...player,
        betInRound: 0,
        hasActedThisPass: false
      });
    });

    // Add board cards based on new street
    if (newState.street === 'flop') {
      // Would add 3 cards
    } else if (newState.street === 'turn' || newState.street === 'river') {
      // Would add 1 card  
    }

    return newState;
  }

  // Helper methods
  private getNextStreet(current: Street): Street {
    switch (current) {
      case 'preflop': return 'flop';
      case 'flop': return 'turn';
      case 'turn': return 'river';
      default: return 'river';
    }
  }

  private getBetSizesForStreet(street: Street): number[] {
    switch (street) {
      case 'flop': return this.tableConfig.betSizes.flop;
      case 'turn': return this.tableConfig.betSizes.turn;
      case 'river': return this.tableConfig.betSizes.river;
      default: return [50, 75];
    }
  }

  private getRaiseMultiplier(state: BettingRoundState): number {
    if (state.street === 'preflop') {
      // Count how many raises have happened
      const raiseCount = state.lastAggressor ? 1 : 0; // Simplified
      
      if (raiseCount === 0) return this.tableConfig.preflop.threebet;
      if (raiseCount === 1) return this.tableConfig.preflop.fourbet;
      return 2.5; // Default for 5-bet+
    }
    
    // Postflop: typically 2.5-3x
    return 2.5;
  }
}