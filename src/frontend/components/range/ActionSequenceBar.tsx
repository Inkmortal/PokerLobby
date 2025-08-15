import React, { useState, useEffect, useRef } from 'react';
import { Position } from './RangeBuilder';
import { PositionDisplayState } from './types/PositionState';
import { ActionNode, BettingRoundState } from './types/PokerState';
import { PokerGameEngine } from './engine/PokerGameEngine';
import { BoardSelector } from './BoardSelector';

interface ActionSequenceBarProps {
  sequence: ActionNode[];
  currentBettingState: BettingRoundState;
  gameEngine: PokerGameEngine;
  selectedNode?: ActionNode;  // The node whose range is currently being viewed
  currentNode?: ActionNode;   // The current node in the tree building
  onActionSelect: (position: Position, action: string, amount?: number, cardIndex?: number, status?: string, isViewOnly?: boolean) => void;
  onPositionClick: (position: Position, cardIndex?: number, isCurrentNode?: boolean) => void;
  onBoardSelect?: (street: 'flop' | 'turn' | 'river', cards: string[]) => void;
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
  selectedNode,
  currentNode,
  onActionSelect,
  onPositionClick,
  onBoardSelect,
  tableSize,
  tableConfig
}) => {
  const [boardCards, setBoardCards] = useState({
    flop: ['', '', ''],
    turn: '',
    river: ''
  });
  
  const [boardSelector, setBoardSelector] = useState<{
    isOpen: boolean;
    street: 'flop' | 'turn' | 'river' | null;
    position: { x: number; y: number };
  }>({ isOpen: false, street: null, position: { x: 0, y: 0 } });

  const positions = tableSize === '6max' ? POSITIONS_6MAX : 
                   tableSize === '9max' ? POSITIONS_9MAX : 
                   POSITIONS_HU;
  
  const [positionStates, setPositionStates] = useState<PositionDisplayState[]>([]);
  
  // Scrollbar ref
  const containerRef = useRef<HTMLDivElement>(null);
  

  useEffect(() => {
    console.log('ActionSequenceBar received sequence:', sequence);
    
    // Build display states array
    const states: PositionDisplayState[] = [];
    let cardIndex = 0;  // Unique index for each card
    let lastStreet = 'preflop';
    
    // Process the action sequence - just read from saved states!
    sequence.forEach((actionNode, idx) => {
      // Special handling for advance nodes - create street separator
      if (actionNode.action === 'advance') {
        const currentStreet = actionNode.stateBefore.street;
        states.push({
          index: -1, // Special marker for street separator
          position: 'SB' as Position, // Dummy position
          status: 'separator' as any,
          selectedAction: null,
          selectedAmount: undefined,
          availableActions: [],
          gameState: {
            pot: 0,
            stack: 0
          },
          street: currentStreet, // Store which street this is
          boardCards: actionNode.boardCards || [], // Board cards from the advance node
          nodeId: actionNode.id // Store node ID for board click handling
        } as any);
        lastStreet = currentStreet;
        return; // Skip adding this node as an action
      }
      
      // For regular action nodes, check for street change (backwards compatibility)
      const currentStreet = actionNode.stateBefore.street;
      if (currentStreet !== lastStreet && actionNode.action !== 'advance') {
        // This shouldn't happen with advance nodes, but keep for safety
        states.push({
          index: -1,
          position: 'SB' as Position,
          status: 'separator' as any,
          selectedAction: null,
          selectedAmount: undefined,
          availableActions: [],
          gameState: {
            pot: 0,
            stack: 0
          },
          street: currentStreet,
          boardCards: [], // No board cards if no advance node
          nodeId: actionNode.id
        } as any);
        lastStreet = currentStreet;
      }
      
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
      // Filter out advance nodes when finding last actor
      const nonAdvanceActions = sequence.filter(n => n.action !== 'advance');
      const lastActor = nonAdvanceActions.length > 0 ? 
        nonAdvanceActions[nonAdvanceActions.length - 1].position : 
        undefined;
      
      // Check if we're at the start of a new street
      const isNewStreet = sequence.length > 0 && sequence[sequence.length - 1].action === 'advance';
      
      const pendingPlayers = gameEngine.getPlayersStillToAct(
        currentBettingState, 
        isNewStreet ? undefined : lastActor
      );

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
    // When clicking an action button, it's an edit (not view-only)
    onActionSelect(state.position, action, amount, state.index, state.status, false);
  };
  
  const handlePositionClick = (state: PositionDisplayState) => {
    // Don't allow clicking on future nodes (can't select what hasn't happened yet)
    if (state.status === 'future') {
      return;
    }
    
    // When clicking a past action card (not on a button), it's view-only
    if (state.status === 'past' && state.selectedAction) {
      // Call onActionSelect with isViewOnly = true to just view the range
      onActionSelect(state.position, state.selectedAction, state.selectedAmount, state.index, state.status, true);
    } else if (state.status === 'current') {
      // Clicking on the current node should select it to view its range
      // Pass a special flag to indicate we want to select the current node
      onPositionClick(state.position, state.index, true);
    }
  };
  
  const handleBoardClick = (street: 'flop' | 'turn' | 'river', event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setBoardSelector({
      isOpen: true,
      street,
      position: { x: rect.left, y: rect.bottom + 5 }
    });
  };
  
  const handleBoardSelect = (cards: string[]) => {
    if (boardSelector.street && onBoardSelect) {
      onBoardSelect(boardSelector.street, cards);
    }
    setBoardSelector({ isOpen: false, street: null, position: { x: 0, y: 0 } });
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
        padding: '0.75rem 1rem 0.5rem 1rem',
        overflowX: 'auto',
        minHeight: `${dynamicHeight + 30}px`,
        position: 'relative'
      }}
      className="action-sequence-scrollbar">
      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: '1px',
        minWidth: 'max-content',
        height: `${dynamicHeight}px`
      }}>
        {/* Position columns */}
        {positionStates.map((state, index) => {
          // Render street separator with board cards
          if (state.status === 'separator') {
            const streetState = state as any;
            const boardCards = streetState.boardCards || [];
            // Has cards if the array exists with proper length (including wildcards)
            const expectedCards = streetState.street === 'flop' ? 3 : 1;
            const hasCards = boardCards.length === expectedCards;
            
            // Determine number of card slots based on street
            let cardSlots = 0;
            if (streetState.street === 'flop') cardSlots = 3;
            else if (streetState.street === 'turn') cardSlots = 1;
            else if (streetState.street === 'river') cardSlots = 1;
            
            return (
              <React.Fragment key={`street-${index}`}>
                {/* Add vertical divider before street transition */}
                <div
                  style={{
                    width: '2px',
                    background: catppuccin.surface2,
                    margin: '0 0.5rem',
                    height: '100%'
                  }}
                />
                
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: '80px',
                    background: catppuccin.mantle,
                    border: `2px solid ${catppuccin.surface1}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={(e) => {
                    handleBoardClick(streetState.street.toLowerCase() as 'flop' | 'turn' | 'river', e);
                  }}
                >
                {/* Street label */}
                <div style={{
                  padding: '0.25rem 0.5rem',
                  background: catppuccin.surface0,
                  borderBottom: `1px solid ${catppuccin.surface1}`,
                  textAlign: 'center'
                }}>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: '600',
                    color: catppuccin.blue,
                    textTransform: 'uppercase'
                  }}>
                    {streetState.street}
                  </span>
                </div>
                
                {/* Cards area */}
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.5rem',
                  gap: '3px'
                }}>
                  {hasCards ? (
                    // Show actual cards and wildcards
                    boardCards.map((card: string, i: number) => {
                      if (!card || card.length === 0) {
                        // Show wildcard placeholder
                        return (
                          <div
                            key={i}
                            style={{
                              background: catppuccin.surface0,
                              border: `2px dashed ${catppuccin.surface2}`,
                              borderRadius: '3px',
                              padding: '0.3rem 0.4rem',
                              minWidth: '28px',
                              minHeight: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <span style={{
                              color: catppuccin.overlay0,
                              fontSize: '0.875rem'
                            }}>?</span>
                          </div>
                        );
                      }
                      // Determine suit and color based on card string
                      let suitColor = catppuccin.text;
                      let bgColor = catppuccin.surface0;
                      
                      if (card.includes('♥')) {
                        suitColor = '#ff0000';
                        bgColor = '#ffe0e0';
                      } else if (card.includes('♦')) {
                        suitColor = '#0066ff';
                        bgColor = '#e0e8ff';
                      } else if (card.includes('♣')) {
                        suitColor = '#00aa00';
                        bgColor = '#e0ffe0';
                      } else if (card.includes('♠')) {
                        suitColor = '#000000';
                        bgColor = '#e8e8e8';
                      }
                      
                      return (
                        <div
                          key={i}
                          style={{
                            background: bgColor,
                            border: `2px solid ${suitColor}`,
                            borderRadius: '3px',
                            padding: '0.3rem 0.4rem',
                            fontFamily: 'monospace',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            color: suitColor,
                            minWidth: '28px',
                            textAlign: 'center'
                          }}
                        >
                          {card}
                        </div>
                      );
                    })
                  ) : (
                    // Show empty card placeholders
                    Array.from({ length: cardSlots }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          background: catppuccin.surface0,
                          border: `1px dashed ${catppuccin.surface2}`,
                          borderRadius: '3px',
                          padding: '0.3rem 0.4rem',
                          minWidth: '28px',
                          minHeight: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <span style={{
                          color: catppuccin.overlay0,
                          fontSize: '0.8rem'
                        }}>?</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              </React.Fragment>
            );
          }
          
          const isCurrent = state.status === 'current';
          const isPast = state.status === 'past';
          const isFuture = state.status === 'future';
          
          // Check if this card represents the selected node
          const visibleNodes = sequence.filter(n => n.action !== 'advance');
          const cardNode = visibleNodes[state.index];
          const isSelectedNode = selectedNode && cardNode && cardNode.id === selectedNode.id;
          
          // Determine background and border colors
          let bgColor = catppuccin.mantle;
          let borderColor = catppuccin.surface1;
          
          // Only show purple highlight when viewing a PAST node's range
          // If selected node is the current node, just show blue
          const showPurpleSelection = isSelectedNode && selectedNode?.id !== currentNode?.id;
          
          if (isCurrent) {
            // Latest decision in the tree - blue highlight
            bgColor = catppuccin.blue + '20';
            borderColor = catppuccin.blue;
          } else if (showPurpleSelection) {
            // Viewing a past node's range - mauve highlight
            bgColor = catppuccin.mauve + '30';
            borderColor = catppuccin.mauve;
          } else if (isPast && state.selectedAction) {
            // Past action that was taken
            borderColor = catppuccin.surface2;
          }
          
          return (
            <div
              key={`${state.position}-${index}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                minWidth: '75px',
                background: bgColor,
                border: `2px solid ${borderColor}`,
                borderRadius: '4px',
                cursor: 'pointer',
                opacity: state.status === 'inactive' ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
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
                  color: showPurpleSelection ? catppuccin.mauve :
                         isCurrent ? catppuccin.blue : 
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

      </div>
      
      {/* Custom scrollbar styles */}
      <style>{`
        .action-sequence-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: ${catppuccin.blue} ${catppuccin.surface1};
        }
        
        .action-sequence-scrollbar::-webkit-scrollbar {
          height: 12px;
          margin-top: 4px;
        }
        
        .action-sequence-scrollbar::-webkit-scrollbar-track {
          background: ${catppuccin.surface1};
          border-radius: 6px;
          margin: 0 8px;
        }
        
        .action-sequence-scrollbar::-webkit-scrollbar-thumb {
          background: ${catppuccin.blue};
          border-radius: 6px;
          border: 2px solid ${catppuccin.surface1};
          transition: background 0.2s;
        }
        
        .action-sequence-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${catppuccin.sapphire};
          border-color: ${catppuccin.surface2};
        }
        
        .action-sequence-scrollbar::-webkit-scrollbar-thumb:active {
          background: ${catppuccin.mauve};
        }
        
        /* Firefox scrollbar styling */
        @supports (scrollbar-width: thin) {
          .action-sequence-scrollbar {
            scrollbar-width: auto;
            scrollbar-color: ${catppuccin.blue} ${catppuccin.surface1};
            padding-bottom: 4px;
          }
        }
      `}</style>
      
      {/* Board Selector Modal */}
      {boardSelector.isOpen && boardSelector.street && (
        <BoardSelector
          street={boardSelector.street}
          existingCards={(() => {
            // Find the advance node for this specific street
            const streetNode = sequence.find(node => 
              node.action === 'advance' && 
              node.stateBefore.street === boardSelector.street
            );
            
            // Get the board cards for this street
            const streetCards = streetNode?.boardCards || [];
            
            // Also collect all OTHER board cards to prevent duplicates
            const otherBoardCards: string[] = [];
            sequence.forEach(node => {
              if (node.action === 'advance' && 
                  node.stateBefore.street !== boardSelector.street &&
                  node.boardCards && node.boardCards.length > 0) {
                node.boardCards.forEach(card => {
                  if (!otherBoardCards.includes(card)) {
                    otherBoardCards.push(card);
                  }
                });
              }
            });
            
            // Convert cards from "A♠" format to "As" format for BoardSelector
            const convertCard = (card: string) => {
              if (!card || card.length < 2) return '';
              const rank = card[0];
              let suit = '';
              if (card.includes('♠')) suit = 's';
              else if (card.includes('♥')) suit = 'h';
              else if (card.includes('♦')) suit = 'd';
              else if (card.includes('♣')) suit = 'c';
              else return card; // Already in correct format
              return rank + suit;
            };
            
            const convertedStreetCards = streetCards.map(convertCard);
            const convertedOtherCards = otherBoardCards.map(convertCard);
            
            // Put the street-specific cards first (up to maxCards)
            // Then add padding with empty strings if needed
            // Then add other cards for duplicate checking
            const maxCards = boardSelector.street === 'flop' ? 3 : 1;
            const paddedStreetCards = [...convertedStreetCards];
            while (paddedStreetCards.length < maxCards) {
              paddedStreetCards.push('');
            }
            
            // Return: [street cards (padded to maxCards), other cards]
            return [...paddedStreetCards, ...convertedOtherCards];
          })()}
          onSelect={handleBoardSelect}
          onClose={() => setBoardSelector({ isOpen: false, street: null, position: { x: 0, y: 0 } })}
          position={boardSelector.position}
        />
      )}
    </div>
  );
};