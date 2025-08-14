import React, { useState, useEffect, useRef } from 'react';
import { Position } from './RangeBuilder';
import { PositionDisplayState } from './types/PositionState';
import { ActionNode, BettingRoundState } from './types/PokerState';
import { PokerGameEngine } from './engine/PokerGameEngine';

interface ActionSequenceBarProps {
  sequence: ActionNode[];
  currentBettingState: BettingRoundState;
  gameEngine: PokerGameEngine;
  onActionSelect: (position: Position, action: string, amount?: number, cardIndex?: number, status?: string) => void;
  onPositionClick: (position: Position, cardIndex?: number) => void;
  tableSize: '6max' | '9max' | 'HU';
  tableConfig: any;
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
  currentBettingState,
  gameEngine,
  onActionSelect,
  onPositionClick,
  tableSize,
  tableConfig
}) => {
  const [boardCards, setBoardCards] = useState({
    flop: ['', '', ''],
    turn: '',
    river: ''
  });

  const positions = tableSize === '6max' ? POSITIONS_6MAX : 
                   tableSize === '9max' ? POSITIONS_9MAX : 
                   POSITIONS_HU;
  
  const [positionStates, setPositionStates] = useState<PositionDisplayState[]>([]);
  
  // Drag navigation refs
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  

  useEffect(() => {
    console.log('ActionSequenceBar received sequence:', sequence);
    
    // Build display states array
    const states: PositionDisplayState[] = [];
    let cardIndex = 0;  // Unique index for each card
    
    // Process the action sequence - just read from saved states!
    sequence.forEach((actionNode) => {
      const playerBefore = actionNode.stateBefore.players.get(actionNode.position);
      if (!playerBefore) return;

      // Use the SAVED available actions from the node!
      const availableActions = actionNode.availableActions;

      // Add the display state for this past action
      states.push({
        index: cardIndex++,  // Assign unique index
        position: actionNode.position,
        status: playerBefore.isFolded ? 'inactive' : 'past',
        selectedAction: actionNode.action,
        selectedAmount: actionNode.amount,
        availableActions,
        gameState: {
          pot: actionNode.stateBefore.pot,
          stack: playerBefore.stack
        }
      });
    });

    // Only add cards for pending players if betting round is NOT over
    const isBettingRoundComplete = gameEngine.isBettingRoundOver(currentBettingState);
    
    if (!isBettingRoundComplete) {
      // Get all players who still need to act
      const lastActor = sequence.length > 0 ? 
        sequence[sequence.length - 1].position : 
        undefined;
      
      const pendingPlayers = gameEngine.getPlayersStillToAct(currentBettingState, lastActor);

      // Build cards for pending players
      pendingPlayers.forEach((pos, idx) => {
        const player = currentBettingState.players.get(pos);
        if (!player) return;

        // Use the game engine to get available actions
        const availableActions = gameEngine.getAvailableActions(currentBettingState, pos);

        states.push({
          index: cardIndex++,  // Continue unique indexing
          position: pos,
          status: idx === 0 ? 'current' : 'future',
          selectedAction: null,
          selectedAmount: undefined,
          availableActions,
          gameState: {
            pot: currentBettingState.pot,
            stack: player.stack
          }
        });
      });
    } else {
      // Betting round is complete - show indicator that action moves to next street
      console.log('Betting round complete, street:', currentBettingState.street);
    }

    setPositionStates(states);
  }, [sequence, positions, tableConfig]);

  const handleActionClick = (state: PositionDisplayState, action: string, amount?: number) => {
    onActionSelect(state.position, action, amount, state.index, state.status);
  };
  
  const handlePositionClick = (state: PositionDisplayState) => {
    onPositionClick(state.position, state.index);
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
    const walk = (x - startX.current) * 2;
    containerRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'fold': return catppuccin.red;
      case 'call': return catppuccin.green;
      case 'check': return catppuccin.sapphire;
      case 'open': return catppuccin.blue;
      case 'bet': return catppuccin.blue;  // Same color as open for consistency
      case 'raise': return catppuccin.mauve;
      case 'allin': return catppuccin.yellow;
      default: return catppuccin.text;
    }
  };

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
                handlePositionClick(state);
              }}
            >
              {/* Position header */}
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

              {/* Actions area */}
              <div style={{
                flex: 1,
                padding: '0.3rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1px',
                justifyContent: 'flex-start'
              }}>
                {state.availableActions.map((actionInfo) => {
                  let isSelected = false;
                  if (state.selectedAction === actionInfo.action) {
                    if (!actionInfo.amount && !state.selectedAmount) {
                      isSelected = true;
                    } else if (actionInfo.amount && state.selectedAmount) {
                      isSelected = Number(actionInfo.amount) === Number(state.selectedAmount);
                    }
                  }
                  
                  return (
                    <button
                      key={`${actionInfo.action}-${actionInfo.amount || 'default'}`}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleActionClick(state, actionInfo.action, actionInfo.amount);
                      }}
                      style={{
                        padding: '0.15rem 0.25rem',
                        background: isSelected ? getActionColor(actionInfo.action) : catppuccin.surface1,
                        color: isSelected ? catppuccin.base : catppuccin.text,
                        border: `1px solid ${getActionColor(actionInfo.action)}`,
                        borderRadius: '2px',
                        cursor: 'pointer',
                        fontSize: '0.65rem',
                        fontWeight: isSelected ? '600' : '400',
                        textAlign: 'center',
                        transition: 'all 0.2s',
                        minHeight: '22px',
                        opacity: 1, // Always full opacity - no greying out
                        whiteSpace: 'nowrap',
                        borderWidth: isSelected ? '2px' : '1px'
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
        
        {/* Show continuation indicator if there are multiple cycles */}
        {positionStates.filter(s => s.status === 'past').length > positions.length && (
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