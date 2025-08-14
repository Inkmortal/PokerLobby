import React, { useState, useEffect, useRef } from 'react';
import { Position, ActionNode } from './RangeBuilder';
import { PositionDisplayState } from './types/PositionState';

interface ActionSequenceBarProps {
  sequence: ActionNode[];
  currentNode: ActionNode | null;
  onActionSelect: (position: Position, action: string, amount?: number) => void;
  onPositionClick: (position: Position) => void;
  tableSize: '6max' | '9max' | 'HU';
  currentNodeIndex: number;
  tableConfig: any;
  gameState: any;
}

const catppuccin = {
  base: '#1e1e2e',
  mantle: '#181825',
  surface0: '#313244',
  surface1: '#45475a',
  surface2: '#585b70',
  overlay1: '#7f849c',
  subtext0: '#a6adc8',
  text: '#cdd6f4',
  green: '#a6e3a1',
  blue: '#89b4fa',
  red: '#f38ba8',
  yellow: '#f9e2af',
  mauve: '#cba6f7',
  sapphire: '#74c7ec'
};

const POSITIONS_6MAX: Position[] = ['HJ', 'LJ', 'CO', 'BTN', 'SB', 'BB'];
const POSITIONS_9MAX: Position[] = ['UTG', 'UTG+1', 'HJ', 'LJ', 'CO', 'BTN', 'SB', 'BB'];
const POSITIONS_HU: Position[] = ['BTN', 'BB'];

export const ActionSequenceBar: React.FC<ActionSequenceBarProps> = ({
  sequence,
  currentNode,
  onActionSelect,
  onPositionClick,
  tableSize,
  currentNodeIndex,
  tableConfig,
  gameState
}) => {
  const [boardCards, setBoardCards] = useState({
    flop: ['', '', ''],
    turn: '',
    river: ''
  });

  const positions = tableSize === '6max' ? POSITIONS_6MAX : 
                   tableSize === '9max' ? POSITIONS_9MAX : 
                   POSITIONS_HU;
  
  // Build position states from the current sequence
  const [positionStates, setPositionStates] = useState<PositionDisplayState[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  
  // Drag navigation refs
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  
  useEffect(() => {
    console.log('ActionSequenceBar received sequence:', sequence);
    
    const states: PositionDisplayState[] = [];
    
    // Track game state as we go
    let runningGameState = {
      pot: 1.5,
      effectiveStacks: tableConfig?.stackSize || 100,
      lastRaise: 1,
      lastPosition: 'BB' as Position
    };
    
    // Track who has folded and who has acted
    const foldedPlayers = new Set<Position>();
    const actedPositions = new Set<Position>();
    
    // Process sequence to track folds and current game state
    sequence.forEach(action => {
      actedPositions.add(action.position);
      if (action.action === 'fold') {
        foldedPlayers.add(action.position);
      } else if (action.action === 'call') {
        runningGameState.pot += runningGameState.lastRaise;
        runningGameState.effectiveStacks -= runningGameState.lastRaise;
      } else if (action.action === 'open' && action.amount) {
        runningGameState.pot += action.amount;
        runningGameState.effectiveStacks -= action.amount;
        runningGameState.lastRaise = action.amount;
        runningGameState.lastPosition = action.position;
      } else if (action.action === 'raise' && action.amount) {
        runningGameState.pot += action.amount;
        runningGameState.effectiveStacks -= action.amount;
        runningGameState.lastRaise = action.amount;
        runningGameState.lastPosition = action.position;
      }
    });
    
    // Determine who's next to act
    const playersInHand = positions.filter(p => !foldedPlayers.has(p));
    
    // Find next player to act
    let nextToAct: Position | null = null;
    for (const pos of positions) {
      if (!foldedPlayers.has(pos) && !actedPositions.has(pos)) {
        nextToAct = pos;
        break;
      }
    }
    
    // If everyone has acted at least once, check if betting is complete
    if (!nextToAct && playersInHand.length > 1) {
      // Check if we need another round of betting
      // Find the last raiser/opener
      let lastRaiser: Position | null = null;
      let lastRaiseIndex = -1;
      for (let i = sequence.length - 1; i >= 0; i--) {
        if (sequence[i].action === 'open' || sequence[i].action === 'raise') {
          lastRaiser = sequence[i].position;
          lastRaiseIndex = i;
          break;
        }
      }
      
      if (lastRaiser && lastRaiseIndex >= 0) {
        // Get all actions after the last raise
        const actionsAfterRaise = sequence.slice(lastRaiseIndex + 1);
        const actedAfterRaise = new Set(actionsAfterRaise.map(a => a.position));
        
        // Check who still needs to act on this raise
        // Start from the position after the raiser and go around
        const raiserIndex = positions.indexOf(lastRaiser);
        for (let i = 1; i < positions.length; i++) {
          const checkIndex = (raiserIndex + i) % positions.length;
          const pos = positions[checkIndex];
          
          // This player needs to act if they're still in the hand and haven't acted since the raise
          if (!foldedPlayers.has(pos) && !actedAfterRaise.has(pos)) {
            nextToAct = pos;
            break;
          }
        }
      }
    }
    
    // Check if we've completed a full cycle (everyone has acted at least once)
    const everyoneHasActed = positions.every(pos => 
      foldedPlayers.has(pos) || actedPositions.has(pos)
    );
    
    // For the first cycle, always show ALL positions so users can skip ahead
    if (!everyoneHasActed) {
      // Show all positions in order
      positions.forEach((position, index) => {
        const actionNode = sequence.find(s => s.position === position);
        const hasFolded = foldedPlayers.has(position);
        
        // Determine status
        let status: 'past' | 'current' | 'future' | 'inactive';
        if (hasFolded) {
          status = 'inactive';
        } else if (actionNode) {
          status = 'past';
        } else if (position === nextToAct) {
          status = 'current';
        } else {
          status = 'future';
        }
        
        // Calculate game state for this position
        let positionGameState = { ...runningGameState };
        
        // If position has acted, calculate state BEFORE their action
        if (actionNode) {
          positionGameState = {
            pot: 1.5,
            effectiveStacks: tableConfig?.stackSize || 100,
            lastRaise: 1,
            lastPosition: 'BB' as Position
          };
          
          const actionIndex = sequence.findIndex(s => s.position === position);
          for (let i = 0; i < actionIndex; i++) {
            const prevAction = sequence[i];
            if (prevAction.action === 'call') {
              positionGameState.pot += positionGameState.lastRaise;
              positionGameState.effectiveStacks -= positionGameState.lastRaise;
            } else if (prevAction.action === 'open' && prevAction.amount) {
              positionGameState.pot += prevAction.amount;
              positionGameState.effectiveStacks -= prevAction.amount;
              positionGameState.lastRaise = prevAction.amount;
              positionGameState.lastPosition = prevAction.position;
            } else if (prevAction.action === 'raise' && prevAction.amount) {
              positionGameState.pot += prevAction.amount;
              positionGameState.effectiveStacks -= prevAction.amount;
              positionGameState.lastRaise = prevAction.amount;
              positionGameState.lastPosition = prevAction.position;
            }
          }
        }
        
        // Build available actions
        const availableActions = [];
        const hasOpened = positionGameState.lastRaise > 1;
      
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
          const callAmount = positionGameState.lastRaise % 1 === 0 ? 
            positionGameState.lastRaise : positionGameState.lastRaise.toFixed(1);
          availableActions.push({ action: 'call', label: `Call ${callAmount}BB` });
          
          const raiseMultiplier = tableConfig?.preflop?.threebet || 3;
          const raiseAmount = positionGameState.lastRaise * raiseMultiplier;
          const raiseLabel = raiseAmount % 1 === 0 ? 
            `Raise to ${raiseAmount}BB` : `Raise to ${raiseAmount.toFixed(1)}BB`;
          availableActions.push({ action: 'raise', amount: raiseAmount, label: raiseLabel });
          
          const altRaise = positionGameState.lastRaise * 2.5;
          if (altRaise !== raiseAmount) {
            const altLabel = altRaise % 1 === 0 ? 
              `Raise to ${altRaise}BB` : `Raise to ${altRaise.toFixed(1)}BB`;
            availableActions.push({ action: 'raise', amount: altRaise, label: altLabel });
          }
        }
        
        // Always have all-in
        const allinAmount = positionGameState.effectiveStacks % 1 === 0 ? 
          positionGameState.effectiveStacks : positionGameState.effectiveStacks.toFixed(1);
        availableActions.push({ action: 'allin', amount: positionGameState.effectiveStacks, label: `All-in ${allinAmount}BB` });
        
        states.push({
          position,
          status,
          selectedAction: actionNode?.action || null,
          selectedAmount: actionNode?.amount,
          availableActions,
          gameState: {
            pot: status === 'past' ? positionGameState.pot : runningGameState.pot,
            stack: status === 'past' ? positionGameState.effectiveStacks : runningGameState.effectiveStacks
          }
        });
      });
    } else {
      // Everyone has acted - we're in continuation mode
      // Show ALL players who are still in the hand for the next cycle
      const remainingPlayers = positions.filter(p => playersInHand.includes(p));
      
      // First add cards for actions that have already happened in this cycle
      sequence.forEach((action, idx) => {
        const position = action.position;
        const hasFolded = action.action === 'fold';
        
        // Calculate game state BEFORE this action
        let positionGameState = {
          pot: 1.5,
          effectiveStacks: tableConfig?.stackSize || 100,
          lastRaise: 1,
          lastPosition: 'BB' as Position
        };
        
        // Replay all actions before this one
        for (let i = 0; i < idx; i++) {
          const prevAction = sequence[i];
          if (prevAction.action === 'call') {
            positionGameState.pot += positionGameState.lastRaise;
            positionGameState.effectiveStacks -= positionGameState.lastRaise;
          } else if (prevAction.action === 'open' && prevAction.amount) {
            positionGameState.pot += prevAction.amount;
            positionGameState.effectiveStacks -= prevAction.amount;
            positionGameState.lastRaise = prevAction.amount;
            positionGameState.lastPosition = prevAction.position;
          } else if (prevAction.action === 'raise' && prevAction.amount) {
            positionGameState.pot += prevAction.amount;
            positionGameState.effectiveStacks -= prevAction.amount;
            positionGameState.lastRaise = prevAction.amount;
            positionGameState.lastPosition = prevAction.position;
          }
        }
        
        // Build available actions based on game state BEFORE this action
        const availableActions = [];
        const hasOpened = positionGameState.lastRaise > 1;
        
        availableActions.push({ action: 'fold', label: 'Fold' });
        if (!hasOpened) {
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
          const callAmount = positionGameState.lastRaise % 1 === 0 ? 
            positionGameState.lastRaise : positionGameState.lastRaise.toFixed(1);
          availableActions.push({ action: 'call', label: `Call ${callAmount}BB` });
          
          const raiseMultiplier = tableConfig?.preflop?.threebet || 3;
          const raiseAmount = positionGameState.lastRaise * raiseMultiplier;
          const raiseLabel = raiseAmount % 1 === 0 ? 
            `Raise to ${raiseAmount}BB` : `Raise to ${raiseAmount.toFixed(1)}BB`;
          availableActions.push({ action: 'raise', amount: raiseAmount, label: raiseLabel });
          
          const altRaise = positionGameState.lastRaise * 2.5;
          if (altRaise !== raiseAmount) {
            const altLabel = altRaise % 1 === 0 ? 
              `Raise to ${altRaise}BB` : `Raise to ${altRaise.toFixed(1)}BB`;
            availableActions.push({ action: 'raise', amount: altRaise, label: altLabel });
          }
        }
        
        const allinAmount = positionGameState.effectiveStacks % 1 === 0 ? 
          positionGameState.effectiveStacks : positionGameState.effectiveStacks.toFixed(1);
        availableActions.push({ action: 'allin', amount: positionGameState.effectiveStacks, label: `All-in ${allinAmount}BB` });
        
        states.push({
          position,
          status: hasFolded ? 'inactive' : 'past',
          selectedAction: action.action,
          selectedAmount: action.amount,
          availableActions,
          gameState: {
            pot: positionGameState.pot,
            stack: positionGameState.effectiveStacks
          }
        });
      });
      
      // Now add future cards for all remaining players who need to act
      if (nextToAct && playersInHand.length > 1) {
        // We need to show cards for everyone who needs to act after the last raise
        // This includes everyone except the last raiser (unless someone else raised after them)
        
        // Find the last raiser
        let lastRaiser: Position | null = null;
        let lastRaiseIndex = -1;
        for (let i = sequence.length - 1; i >= 0; i--) {
          if (sequence[i].action === 'open' || sequence[i].action === 'raise') {
            lastRaiser = sequence[i].position;
            lastRaiseIndex = i;
            break;
          }
        }
        
        if (lastRaiser && lastRaiseIndex >= 0) {
          // Get who has already acted after the raise
          const actionsAfterRaise = sequence.slice(lastRaiseIndex + 1);
          const actedAfterRaise = new Set(actionsAfterRaise.map(a => a.position));
          
          // Add cards for all remaining players who haven't acted since the raise
          const startIdx = remainingPlayers.indexOf(nextToAct);
          if (startIdx >= 0) {
            for (let i = 0; i < remainingPlayers.length; i++) {
              const playerIdx = (startIdx + i) % remainingPlayers.length;
              const player = remainingPlayers[playerIdx];
              
              // Skip if this player already acted after the raise
              if (actedAfterRaise.has(player)) {
                continue;
              }
              
              // Skip the raiser unless someone raised after them
              if (player === lastRaiser) {
                continue;
              }
              
              // Build available actions for this player
              const availableActions = [];
              const hasOpened = runningGameState.lastRaise > 1;
              
              availableActions.push({ action: 'fold', label: 'Fold' });
              
              if (!hasOpened) {
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
                const callAmount = runningGameState.lastRaise % 1 === 0 ? 
                  runningGameState.lastRaise : runningGameState.lastRaise.toFixed(1);
                availableActions.push({ action: 'call', label: `Call ${callAmount}BB` });
                
                const raiseMultiplier = tableConfig?.preflop?.threebet || 3;
                const raiseAmount = runningGameState.lastRaise * raiseMultiplier;
                const raiseLabel = raiseAmount % 1 === 0 ? 
                  `Raise to ${raiseAmount}BB` : `Raise to ${raiseAmount.toFixed(1)}BB`;
                availableActions.push({ action: 'raise', amount: raiseAmount, label: raiseLabel });
                
                const altRaise = runningGameState.lastRaise * 2.5;
                if (altRaise !== raiseAmount) {
                  const altLabel = altRaise % 1 === 0 ? 
                    `Raise to ${altRaise}BB` : `Raise to ${altRaise.toFixed(1)}BB`;
                  availableActions.push({ action: 'raise', amount: altRaise, label: altLabel });
                }
              }
              
              const allinAmount = runningGameState.effectiveStacks % 1 === 0 ? 
                runningGameState.effectiveStacks : runningGameState.effectiveStacks.toFixed(1);
              availableActions.push({ action: 'allin', amount: runningGameState.effectiveStacks, label: `All-in ${allinAmount}BB` });
              
              states.push({
                position: player,
                status: player === nextToAct ? 'current' : 'future',
                selectedAction: null,
                selectedAmount: undefined,
                availableActions,
                gameState: {
                  pot: runningGameState.pot,
                  stack: runningGameState.effectiveStacks
                }
              });
            }
          }
        }
      }
    }
    
    setPositionStates(states);
  }, [sequence, positions, tableConfig]);

  const handleActionClick = (position: Position, action: string, amount?: number) => {
    // Just pass the action to parent - gap filling is handled there
    onActionSelect(position, action, amount);
  };
  
  const handlePositionClick = (position: Position) => {
    // Allow clicking on position cards to navigate
    onPositionClick(position);
  };
  
  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - containerRef.current.offsetLeft;
    scrollLeft.current = containerRef.current.scrollLeft;
    containerRef.current.style.cursor = 'grabbing';
  };
  
  const handleMouseLeave = () => {
    isDragging.current = false;
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab';
    }
  };
  
  const handleMouseUp = () => {
    isDragging.current = false;
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab';
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX.current) * 2; // Scroll-fast multiplier
    containerRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'fold': return catppuccin.red;
      case 'call': return catppuccin.green;
      case 'open': return catppuccin.blue;
      case 'raise': return catppuccin.mauve;
      case 'check': return catppuccin.sapphire;
      case 'bet': return catppuccin.blue;
      case 'allin': return catppuccin.yellow;
      default: return catppuccin.text;
    }
  };

  // Calculate dynamic height based on maximum actions (more compact)
  const maxActions = Math.max(5, ...positionStates.map(state => state.availableActions.length));
  const dynamicHeight = Math.max(100, 30 + (maxActions * 24));

  return (
    <div 
      ref={containerRef}
      style={{
        background: catppuccin.surface0,
        borderBottom: `1px solid ${catppuccin.surface1}`,
        padding: '0.75rem 1rem',
        overflowX: 'auto',
        minHeight: `${dynamicHeight + 20}px`,
        cursor: 'grab',
        userSelect: 'none'
      }}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}>
      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: '1px',
        minWidth: 'max-content',
        height: `${dynamicHeight}px`
      }}>
        {/* Position columns */}
        {positionStates.map((state, index) => {
          const isCurrent = state.status === 'current';
          const isPast = state.status === 'past';
          const isFuture = state.status === 'future';
          const isLastCard = index === positionStates.length - 1;
          const showContinuation = isLastCard && state.status === 'current' && positionStates.length > positions.length;
          
          return (
            <div
              key={`${state.position}-${index}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                minWidth: '75px',
                background: isCurrent ? catppuccin.blue + '20' : 
                           isPast ? catppuccin.mantle : 
                           catppuccin.mantle,
                border: `2px solid ${isCurrent ? catppuccin.blue : 
                        isPast && state.selectedAction ? catppuccin.surface2 : 
                        catppuccin.surface1}`,
                borderRadius: '4px',
                cursor: 'pointer',
                opacity: state.status === 'inactive' ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                handlePositionClick(state.position);
              }}
            >
              {/* Position header - compact with stack in corner */}
              <div style={{
                padding: '0.25rem 0.35rem',
                background: catppuccin.surface0,
                borderBottom: `1px solid ${catppuccin.surface1}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  color: isCurrent ? catppuccin.blue : 
                         isPast ? catppuccin.text : 
                         catppuccin.subtext0
                }}>
                  {state.position}
                </span>
                <span style={{
                  fontSize: '0.6rem',
                  color: catppuccin.subtext0
                }}>
                  {state.gameState.stack % 1 === 0 ? state.gameState.stack : state.gameState.stack.toFixed(1)}
                </span>
              </div>

              {/* Actions area - more compact */}
              <div style={{
                flex: 1,
                padding: '0.3rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1px',
                justifyContent: 'flex-start'
              }}>
                {state.availableActions.map((actionInfo) => {
                  // More robust comparison - handle undefined and type conversion
                  let isSelected = false;
                  if (state.selectedAction === actionInfo.action) {
                    if (!actionInfo.amount && !state.selectedAmount) {
                      isSelected = true;
                    } else if (actionInfo.amount && state.selectedAmount) {
                      isSelected = Number(actionInfo.amount) === Number(state.selectedAmount);
                    }
                  }
                  
                  // Past positions should be clickable but visually indicate they're set
                  const isPastUnselected = isPast && !isSelected;
                  
                  return (
                    <button
                      key={`${actionInfo.action}-${actionInfo.amount || 'default'}`}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleActionClick(state.position, actionInfo.action, actionInfo.amount);
                      }}
                      style={{
                        padding: '0.15rem 0.25rem',
                        background: isSelected ? getActionColor(actionInfo.action) : 
                                   isPastUnselected ? catppuccin.surface2 : 
                                   catppuccin.surface1,
                        color: isSelected ? catppuccin.base : 
                               isPastUnselected ? catppuccin.overlay1 : 
                               catppuccin.text,
                        border: 'none',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        fontSize: '0.65rem',
                        fontWeight: isSelected ? '600' : '400',
                        textAlign: 'center',
                        transition: 'all 0.2s',
                        minHeight: '22px',
                        opacity: isPastUnselected ? 0.7 : 1,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {actionInfo.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        {/* Show continuation indicator if betting continues */}
        {positionStates.length > positions.length && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 0.5rem',
            color: catppuccin.blue,
            fontSize: '1.2rem',
            fontWeight: 'bold'
          }}>
            →
          </div>
        )}

        {/* Vertical divider */}
        <div style={{
          width: '2px',
          background: catppuccin.surface2,
          margin: '0 1rem',
          height: '100%'
        }} />

        {/* Board cards sections */}
        {['FLOP', 'TURN', 'RIVER'].map(street => (
          <div key={street} style={{
            display: 'flex',
            flexDirection: 'column',
            minWidth: '90px',
            background: catppuccin.mantle,
            border: `1px solid ${catppuccin.surface1}`,
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          onClick={() => console.log(`Select ${street.toLowerCase()} cards`)}
          >
            <div style={{
              padding: '0.5rem',
              background: catppuccin.surface0,
              borderBottom: `1px solid ${catppuccin.surface1}`,
              textAlign: 'center'
            }}>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: catppuccin.text
              }}>
                {street}
              </span>
              <div style={{
                fontSize: '0.75rem',
                color: catppuccin.subtext0,
                marginTop: '2px'
              }}>
                {street === 'FLOP' ? '5.1' : '97.7'}
              </div>
            </div>
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              padding: '0.5rem'
            }}>
              {street === 'FLOP' ? [0, 1, 2].map(i => (
                <div
                  key={i}
                  style={{
                    width: '20px',
                    height: '28px',
                    background: boardCards.flop[i] ? catppuccin.text : catppuccin.surface2,
                    color: boardCards.flop[i] ? catppuccin.base : catppuccin.overlay1,
                    border: `1px solid ${catppuccin.surface2}`,
                    borderRadius: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: '600'
                  }}
                >
                  {boardCards.flop[i] || '?'}
                </div>
              )) : (
                <div
                  style={{
                    width: '20px',
                    height: '28px',
                    background: (street === 'TURN' ? boardCards.turn : boardCards.river) ? catppuccin.text : catppuccin.surface2,
                    color: (street === 'TURN' ? boardCards.turn : boardCards.river) ? catppuccin.base : catppuccin.overlay1,
                    border: `1px solid ${catppuccin.surface2}`,
                    borderRadius: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: '600'
                  }}
                >
                  {(street === 'TURN' ? boardCards.turn : boardCards.river) || '?'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};