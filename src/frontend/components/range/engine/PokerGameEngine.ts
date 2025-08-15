import { 
  Position, 
  ActionType, 
  Street,
  PlayerAction, 
  PlayerState, 
  BettingRoundState,
  ActionNode 
} from '../types/PokerState';
import { RangeData } from '../RangeBuilder';
import { SolverConfig } from '../TableSettings';

export class PokerGameEngine {
  private positions: Position[];
  private tableConfig: SolverConfig;

  constructor(positions: Position[], tableConfig: SolverConfig) {
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
      boardCards: [],
      raiseCount: 1 // Blinds count as the first bet
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
        // Add SB
        const sbPlayer = state.players.get('SB');
        if (sbPlayer && !sbPlayer.isFolded && !sbPlayer.isAllIn) {
          pending.push('SB');
        }
        
        // BB is NOT added initially - they only appear after someone acts
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
        // Special handling for BB in preflop first cycle
        if (pos === 'BB' && state.street === 'preflop' && !player.hasActedThisPass) {
          // BB only appears in timeline after someone limps/raises (not just folds)
          // Check if anyone (including SB) has put money in
          const someoneActed = Array.from(state.players.values()).some(p => {
            if (p.position === 'BB') return false; // BB doesn't count
            if (p.position === 'SB') {
              // SB counts if they completed/raised (put in more than 0.5BB)
              return p.betInRound > 0.5;
            }
            // Other positions count if they put any money in
            return p.betInRound > 0;
          });
          
          if (!someoneActed) {
            continue; // Don't add BB to timeline yet
          }
        }
        
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

  // Get effective setting for a position (with inheritance)
  private getEffectivePreflopSetting(position: Position, setting: keyof typeof this.tableConfig.preflop.all) {
    const override = this.tableConfig.preflop.overrides?.[position]?.[setting];
    return override !== undefined ? override : this.tableConfig.preflop.all[setting];
  }

  // Helper to format BB amounts (no .0, keep .5)
  private formatBB(amount: number): string {
    if (amount % 1 === 0) {
      return amount.toString();
    }
    return amount.toFixed(1);
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
      
      // If calling requires our entire stack or more, it's still just a call
      if (toCall >= player.stack) {
        const callAmount = player.stack + player.betInRound;
        available.push({ 
          action: 'call', 
          amount: callAmount,
          label: `Call ${this.formatBB(callAmount)}` 
        });
      } else {
        // Special case: Limp in preflop
        if (isPreflop && state.amountToCall === 1 && !hasAggressor) {
          // Check if limping is allowed for this position
          const allowLimping = this.getEffectivePreflopSetting(position, 'allowLimping') as boolean;
          if (allowLimping) {
            available.push({ 
              action: 'call', 
              label: 'Limp 1' 
            });
          }
        } else {
          // Show the total amount to match
          available.push({ 
            action: 'call', 
            label: `Call ${this.formatBB(state.amountToCall)}` 
          });
        }
      }
    }

    // Bet/Raise options - only show amounts that don't exceed total stack
    const totalStack = player.stack + player.betInRound; // Total available including what's already bet
    
    // Array to collect all bet/raise options before applying thresholds
    const betRaiseOptions: PlayerAction[] = [];
    
    if (!hasAggressor && isPreflop) {
      // Opening bet - get position-specific or default sizes
      const openSizes = this.getEffectivePreflopSetting(position, 'openSizes') as number[];
      
      // Show all configured open sizes that don't exceed stack
      openSizes.forEach(size => {
        if (size <= totalStack) {
          betRaiseOptions.push({ 
            action: 'open', 
            amount: size, 
            label: `Open ${this.formatBB(size)}` 
          });
        }
      });
    } else if (!hasAggressor && !isPreflop) {
      // Postflop bet - determine if IP or OOP
      const isIP = this.isInPositionPostflop(position, state);
      const betSizes = this.getBetSizesForStreet(state.street, isIP);
      betSizes.forEach(size => {
        const betAmount = (state.pot * size) / 100;
        // Only show if doesn't exceed total stack
        if (betAmount <= totalStack) {
          betRaiseOptions.push({
            action: 'bet',
            amount: betAmount,
            label: `Bet ${this.formatBB(betAmount)}`
          });
        }
      });
      
      // Check for donk betting (OOP betting into previous aggressor)
      if (!isIP && state.lastAggressor && state.lastAggressor !== position) {
        const streetConfig = this.tableConfig.postflop[state.street as 'flop' | 'turn' | 'river'];
        if (streetConfig?.enableDonk && streetConfig.donkSizes) {
          streetConfig.donkSizes.forEach(size => {
            const donkAmount = (state.pot * size) / 100;
            if (donkAmount <= totalStack) {
              betRaiseOptions.push({
                action: 'bet',
                amount: donkAmount,
                label: `Donk ${this.formatBB(donkAmount)}`
              });
            }
          });
        }
      }
    } else {
      // Raise
      if (isPreflop) {
        const raiseMultipliers = this.getPreflopRaiseMultipliers(state, position);
        
        // Show all configured raise sizes
        raiseMultipliers.forEach(multiplier => {
          const raiseAmount = state.amountToCall * multiplier;
          if (raiseAmount <= totalStack) {
            betRaiseOptions.push({ 
              action: 'raise', 
              amount: raiseAmount, 
              label: `Raise to ${this.formatBB(raiseAmount)}` 
            });
          }
        });
      } else {
        // Postflop raises - determine if IP or OOP
        const isIP = this.isInPositionPostflop(position, state);
        const raiseSizes = this.getRaiseSizesForStreet(state.street, isIP);
        raiseSizes.forEach(multiplier => {
          const raiseAmount = state.amountToCall * multiplier;
          // Only show if doesn't exceed total stack
          if (raiseAmount <= totalStack) {
            betRaiseOptions.push({ 
              action: 'raise', 
              amount: raiseAmount, 
              label: `Raise to ${this.formatBB(raiseAmount)}` 
            });
          }
        });
      }
    }
    
    // Apply solver thresholds to bet/raise options
    let filteredOptions = this.applyMergingThreshold(betRaiseOptions);
    filteredOptions = this.applyForceAllInThreshold(filteredOptions, player.stack, player.betInRound, state.pot);
    
    // Add filtered options to available actions
    available.push(...filteredOptions);

    // All-in handling - check if we should add all-in based on config
    if (player.stack > 0) {
      const allinTotal = player.stack + player.betInRound;
      let shouldAddAllIn = false;
      
      // Check configuration for automatic all-in
      if (isPreflop && hasAggressor) {
        const bettingLevel = this.getBettingLevel(state);
        
        if (bettingLevel === 4) {
          // Next action would be 4-bet - check if all-in is enabled
          const fourBet = this.getEffectivePreflopSetting(position, 'fourBet') as any;
          shouldAddAllIn = fourBet.useAllIn;
        } else if (bettingLevel === 5) {
          // Next action would be 5-bet - check if all-in is enabled
          const fiveBet = this.getEffectivePreflopSetting(position, 'fiveBet') as any;
          if (fiveBet.useAllIn) {
            // Check threshold if set
            if (fiveBet.allInThreshold && player.stack < fiveBet.allInThreshold) {
              shouldAddAllIn = true;
            } else if (!fiveBet.allInThreshold) {
              shouldAddAllIn = true;
            }
          }
        } else if (bettingLevel >= 6) {
          // 6-bet and beyond - always allow all-in
          shouldAddAllIn = true;
        }
      }
      
      // Check addAllInThreshold - add all-in when it exceeds X% of pot
      if (!shouldAddAllIn && this.tableConfig.addAllInThreshold) {
        const allinBetAmount = allinTotal - player.betInRound;
        const potPercentage = (allinBetAmount / state.pot) * 100;
        if (potPercentage >= this.tableConfig.addAllInThreshold) {
          shouldAddAllIn = true;
        }
      }
      
      // Check if all-in is already effectively covered by another action
      const alreadyHasAllin = available.some(action => 
        action.amount && Math.abs(action.amount - allinTotal) < 0.01
      );
      
      // Add all-in if configured or not already present
      if (!alreadyHasAllin && shouldAddAllIn) {
        available.push({ 
          action: 'allin', 
          amount: allinTotal, 
          label: 'All-in' 
        });
      }
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
      boardCards: [...initialState.boardCards],
      raiseCount: initialState.raiseCount
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
          newState.raiseCount++; // Increment raise count
          
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
          newState.raiseCount++; // All-in raise counts as a raise
          
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
      boardCards: [...state.boardCards],
      raiseCount: 0 // Reset raise count for new street
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

  private getBetSizesForStreet(street: Street, isInPosition: boolean): number[] {
    const streetConfig = this.tableConfig.postflop[street as 'flop' | 'turn' | 'river'];
    if (!streetConfig) return [50, 75];
    
    return isInPosition ? 
      (streetConfig.ipBetSizes || []) : 
      (streetConfig.oopBetSizes || []);
  }

  private getRaiseSizesForStreet(street: Street, isInPosition: boolean): number[] {
    const streetConfig = this.tableConfig.postflop[street as 'flop' | 'turn' | 'river'];
    if (!streetConfig) return [2.5, 3];
    
    return isInPosition ? 
      (streetConfig.ipRaiseSizes || []) : 
      (streetConfig.oopRaiseSizes || []);
  }
  
  private isInPositionPostflop(position: Position, state: BettingRoundState): boolean {
    // In postflop, position is relative to the button
    // Players closer to the button act later and are "in position"
    // This is a simplified version - in reality it depends on who's still in the hand
    const positionOrder = ['SB', 'BB', 'UTG', 'UTG+1', 'HJ', 'LJ', 'CO', 'BTN'];
    const playerIndex = positionOrder.indexOf(position);
    
    // Find the latest position still in the hand
    let latestPosition = -1;
    state.players.forEach((player, pos) => {
      if (!player.isFolded) {
        const idx = positionOrder.indexOf(pos);
        if (idx > latestPosition) latestPosition = idx;
      }
    });
    
    // You're in position if you're the latest position or close to it
    // This is simplified - proper implementation would track actual betting order
    return playerIndex >= latestPosition - 1;
  }

  private getPreflopRaiseMultipliers(state: BettingRoundState, position: Position): number[] {
    // Get betting level - this tells us what the NEXT bet would be
    const bettingLevel = this.getBettingLevel(state);
    
    if (bettingLevel === 2) {
      // Next action would be 2-bet (open)
      const openSizes = this.getEffectivePreflopSetting(position, 'openSizes') as number[];
      return openSizes;
    } else if (bettingLevel === 3) {
      // Next action would be 3-bet
      const threeBet = this.getEffectivePreflopSetting(position, 'threeBet') as number[];
      return threeBet;
    } else if (bettingLevel === 4) {
      // Next action would be 4-bet
      const fourBet = this.getEffectivePreflopSetting(position, 'fourBet') as any;
      // If all-in is enabled, return empty array (all-in will be added separately)
      if (fourBet.useAllIn) {
        return [];
      }
      return fourBet.sizes || [];
    } else if (bettingLevel === 5) {
      // Next action would be 5-bet
      const fiveBet = this.getEffectivePreflopSetting(position, 'fiveBet') as any;
      // If all-in is enabled, return empty array (all-in will be added separately)
      if (fiveBet.useAllIn) {
        return [];
      }
      return fiveBet.sizes || [];
    } else if (bettingLevel >= 6) {
      // 6-bet and beyond - usually just all-in
      return [];
    }
    
    return []; // No default sizing for 6-bet+
  }


  private getBettingLevel(state: BettingRoundState): number {
    // Use the actual raise count to determine betting level
    // Preflop: raiseCount starts at 1 (blinds = 1st bet)
    //   1 = blinds only (can open/2-bet)
    //   2 = 2-bet/open happened (can 3-bet)
    //   3 = 3-bet happened (can 4-bet)
    //   4 = 4-bet happened (can 5-bet)
    //   5+ = 5-bet+ happened
    // Postflop: raiseCount starts at 0
    //   0 = no bets yet (can bet)
    //   1 = bet happened (can raise/2-bet)
    //   2 = raise happened (can 3-bet)
    //   etc.
    
    // Return what bet level the NEXT action would be
    return state.raiseCount + 1;
  }
  
  // Apply merging threshold - combine similar bet sizes
  private applyMergingThreshold(options: PlayerAction[]): PlayerAction[] {
    if (!this.tableConfig.mergingThreshold || options.length <= 1) {
      return options;
    }
    
    const threshold = this.tableConfig.mergingThreshold;
    const merged: PlayerAction[] = [];
    const sorted = [...options].sort((a, b) => (a.amount || 0) - (b.amount || 0));
    
    sorted.forEach(option => {
      const lastMerged = merged[merged.length - 1];
      if (lastMerged && option.amount && lastMerged.amount) {
        const percentDiff = ((option.amount - lastMerged.amount) / lastMerged.amount) * 100;
        if (percentDiff <= threshold) {
          // Skip this option, it's too close to the previous one
          return;
        }
      }
      merged.push(option);
    });
    
    return merged;
  }
  
  // Apply force all-in threshold - replace large bets with all-in
  private applyForceAllInThreshold(options: PlayerAction[], stack: number, betInRound: number, currentPot: number): PlayerAction[] {
    if (!this.tableConfig.forceAllInThreshold) {
      return options;
    }
    
    const threshold = this.tableConfig.forceAllInThreshold / 100; // Convert to decimal
    const totalAvailable = stack + betInRound;
    
    return options.map(option => {
      if (option.amount) {
        // This is the SPR-based calculation per the PioSOLVER formula
        // We need to check if the opponent's SPR after calling would be below threshold
        // SPR after call = remaining stack / new pot
        
        // Calculate the pot after this bet is made
        const betAmount = option.amount;
        const potAfterBet = currentPot + (betAmount - betInRound);
        
        // Assume opponent calls with same amount (simplified - in reality depends on opponent's stack)
        const potAfterCall = potAfterBet + betAmount;
        
        // Opponent's remaining stack after calling (assuming they have similar stack)
        const opponentStackAfterCall = stack - (betAmount - betInRound);
        
        // Calculate SPR after the call
        const sprAfterCall = opponentStackAfterCall / potAfterCall;
        
        if (sprAfterCall <= threshold) {
          // Replace with all-in (total available)
          return {
            action: 'allin',
            amount: totalAvailable,
            label: 'All-in'
          };
        }
      }
      return option;
    });
  }
}