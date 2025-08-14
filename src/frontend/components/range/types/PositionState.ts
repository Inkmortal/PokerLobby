import { Position, RangeData } from '../RangeBuilder';

export interface PositionDisplayState {
  index: number;  // Unique index for this card in the timeline
  position: Position;
  status: 'past' | 'current' | 'future' | 'inactive';
  selectedAction: string | null;
  selectedAmount?: number;
  availableActions: Array<{
    action: string;
    amount?: number;
    label: string;
  }>;
  gameState: {
    pot: number;
    stack: number;
  };
  range?: RangeData;
}

export function buildPositionStates(
  positions: Position[],
  currentPath: Array<{ position: Position; action: string; amount?: number }>,
  currentTurnIndex: number,
  gameState: any,
  tableConfig: any
): PositionDisplayState[] {
  const states: PositionDisplayState[] = [];
  
  // Check if anyone has opened
  const hasOpened = currentPath.some(node => node.action === 'open' || node.action === 'raise');
  const currentBet = gameState?.lastRaise || 1;
  
  // Find the next position that should act
  const actedPositions = new Set(currentPath.map(node => node.position));
  let nextToActIndex = positions.findIndex(pos => !actedPositions.has(pos));
  if (nextToActIndex === -1) nextToActIndex = positions.length; // All have acted
  
  positions.forEach((position, index) => {
    // Find if this position has already acted
    const actionNode = currentPath.find(node => node.position === position);
    
    let status: 'past' | 'current' | 'future' | 'inactive';
    if (actionNode) {
      // Position has already acted - always mark as past
      status = 'past';
    } else if (index === nextToActIndex) {
      // This is the next position to act
      status = 'current';
    } else if (index > nextToActIndex) {
      // Future turn
      status = 'future';
    } else {
      // Should have acted but didn't (was skipped/folded via gap-filling)
      status = 'inactive';
    }
    
    // Build available actions based on game state
    const availableActions = [];
    
    // Always have fold
    availableActions.push({ action: 'fold', label: 'Fold' });
    
    if (!hasOpened) {
      // No one has opened yet
      if (tableConfig?.preflop?.limping) {
        availableActions.push({ action: 'call', label: 'Limp 1BB' });
      }
      
      const openSize = tableConfig?.preflop?.openSize || 2.5;
      availableActions.push({ action: 'open', amount: openSize, label: `Open ${openSize}BB` });
      
      if (openSize !== 2.5) {
        availableActions.push({ action: 'open', amount: 2.5, label: 'Open 2.5BB' });
      }
      if (openSize !== 3) {
        availableActions.push({ action: 'open', amount: 3, label: 'Open 3BB' });
      }
    } else {
      // Someone has bet/raised
      availableActions.push({ action: 'call', label: `Call ${currentBet}BB` });
      
      const raiseMultiplier = tableConfig?.preflop?.threebet || 3;
      const raiseAmount = currentBet * raiseMultiplier;
      availableActions.push({ action: 'raise', amount: raiseAmount, label: `Raise to ${raiseAmount}BB` });
      
      const altRaise = currentBet * 2.5;
      if (altRaise !== raiseAmount) {
        availableActions.push({ action: 'raise', amount: altRaise, label: `Raise to ${altRaise}BB` });
      }
    }
    
    // Always have all-in
    const stackSize = gameState?.effectiveStacks || 100;
    availableActions.push({ action: 'allin', amount: stackSize, label: `All-in ${stackSize}BB` });
    
    // Debug logging for action tracking
    if (actionNode) {
      console.log(`Position ${position} has acted: action=${actionNode.action}, amount=${actionNode.amount}`);
    }
    
    states.push({
      position,
      status,
      selectedAction: actionNode?.action || null,
      selectedAmount: actionNode?.amount,
      availableActions,
      gameState: {
        pot: gameState?.pot || 1.5,
        stack: gameState?.effectiveStacks || 100
      }
    });
  });
  
  return states;
}