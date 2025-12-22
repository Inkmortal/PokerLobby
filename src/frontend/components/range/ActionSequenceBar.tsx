import React, { useState, useEffect, useRef } from 'react';
import { Position } from './RangeBuilder';
import { PositionDisplayState } from './types/PositionState';
import { DecisionNode, ActionEdge, BettingRoundState } from './types/PokerState';
import { PokerGameEngine } from './engine/PokerGameEngine';
import { BoardSelector } from './BoardSelector';

interface ActionSequenceBarProps {
  sequence: Array<{ node: DecisionNode; edge?: ActionEdge }>;  // Clean architecture: node + edge pairs
  currentBettingState?: BettingRoundState; // Optional - only used for legacy code
  gameEngine: PokerGameEngine;
  selectedNode?: DecisionNode;  // The node whose range is currently being viewed
  currentNode?: DecisionNode;   // The current node in the tree building
  showBBAmounts?: boolean;    // Toggle for showing BB vs configured sizes
  onActionSelect: (position: Position, action: string, amount?: number, nodeIndex?: number, status?: string, isViewOnly?: boolean) => void;
  onPositionClick: (position: Position, nodeIndex?: number, isCurrentNode?: boolean) => void;
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
  showBBAmounts = true,
  onActionSelect,
  onPositionClick,
  onBoardSelect,
  tableSize,
  tableConfig
}) => {
  // Board cards state removed - now stored in DecisionNode.boardCards
  
  const [boardSelector, setBoardSelector] = useState<{
    isOpen: boolean;
    street: 'flop' | 'turn' | 'river' | null;
    position: { x: number; y: number };
  }>({ isOpen: false, street: null, position: { x: 0, y: 0 } });

  const positions = tableSize === '6max' ? POSITIONS_6MAX : 
                   tableSize === '9max' ? POSITIONS_9MAX : 
                   POSITIONS_HU;
  
  const [positionStates, setPositionStates] = useState<(PositionDisplayState | any)[]>([]);
  
  
  // Scrollbar ref
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Helper function to format action labels based on display preference
  // Enhanced to support ActionEdge sizing info for cleaner display
  const formatActionLabel = (
    action: string, 
    amount?: number, 
    state?: BettingRoundState,
    _originalLabel?: string,
    edgeInfo?: { sizeType?: 'multiplier' | 'percentage' | 'fixed'; sizeValue?: number }
  ): string => {
    // If no amount, just return the action (fold, check)
    if (!amount) {
      return action;
    }
    
    // Always show opens, calls, and all-ins in BB (no units shown)
    if (action === 'open' || action === 'call' || action === 'allin') {
      return `${action} ${amount}`;
    }
    
    // When showing BB amounts, everything is in BB
    if (showBBAmounts) {
      return `${action} ${amount}`;
    }
    
    // Use stored edge sizing info if available (new clean architecture)
    if (edgeInfo?.sizeType && edgeInfo?.sizeValue !== undefined) {
      if (edgeInfo.sizeType === 'multiplier') {
        const cleanMultiplier = edgeInfo.sizeValue % 1 === 0 ? 
          edgeInfo.sizeValue.toString() : edgeInfo.sizeValue.toFixed(1);
        return `${action} ${cleanMultiplier}x`;
      } else if (edgeInfo.sizeType === 'percentage') {
        return `${action} ${edgeInfo.sizeValue}%`;
      }
      // For 'fixed' type, fall through to existing logic
    }
    
    // Otherwise, calculate format (backwards compatibility)
    if (action === 'raise' && state) {
      // Calculate the multiplier: raise amount / amount to call (the last bet/raise)
      const lastBet = state.amountToCall;
      if (lastBet > 0) {
        const multiplier = (amount / lastBet).toFixed(1);
        // Remove trailing .0
        const cleanMultiplier = multiplier.endsWith('.0') ? 
          multiplier.slice(0, -2) : multiplier;
        return `${action} ${cleanMultiplier}x`;
      }
      // Fallback to BB if no last bet
      return `${action} ${amount}`;
    }
    
    if (action === 'bet' && state) {
      // Calculate percentage of pot
      const pot = state.pot;
      if (pot > 0) {
        const percentage = Math.round((amount / pot) * 100);
        return `${action} ${percentage}%`;
      }
      // Fallback to BB if no pot
      return `${action} ${amount}`;
    }
    
    // Default to BB for other cases
    return `${action} ${amount}`;
  };

  // Pre-generate all decision points for the current betting round
  const generateBettingRoundSequence = () => {
    if (!currentNode) return [];
    
    const futurePoints: Array<{
      position: Position;
      availableActions: any[];
      gameState: BettingRoundState;
      isSimulated: boolean;
    }> = [];
    
    // Start from current game state
    let simulatedState = { ...currentNode.gameState };
    let currentPosition = currentNode.position;
    
    // Enhanced safeguards
    const MAX_ITERATIONS = 50; // Absolute max iterations
    const MAX_POINTS_PER_ROUND = 30; // Max decision points in one betting round
    let iterations = 0;
    const seenStates = new Set<string>(); // Track states to detect loops
    
    // Keep generating until betting round is complete
    while (!gameEngine.isBettingRoundOver(simulatedState)) {
      iterations++;
      
      // Safety check 1: Max iterations
      if (iterations > MAX_ITERATIONS) {
        console.warn(`generateBettingRoundSequence: Hit max iterations (${MAX_ITERATIONS})`);
        break;
      }
      
      // Safety check 2: Max points
      if (futurePoints.length >= MAX_POINTS_PER_ROUND) {
        console.warn(`generateBettingRoundSequence: Hit max points (${MAX_POINTS_PER_ROUND})`);
        break;
      }
      
      // Safety check 3: Detect state loops
      const stateKey = `${currentPosition}-${simulatedState.amountToCall}-${simulatedState.pot}`;
      if (seenStates.has(stateKey)) {
        console.warn(`generateBettingRoundSequence: Detected state loop at ${stateKey}`);
        break;
      }
      seenStates.add(stateKey);
      
      // Get who still needs to act
      const playersToAct = gameEngine.getPlayersStillToAct(simulatedState, currentPosition);
      
      if (playersToAct.length === 0) {
        // No players to act but round not over - this is an error state
        console.error(`generateBettingRoundSequence: No players to act but round not over`);
        break;
      }
      
      // For each player that will act, add them to the sequence
      for (const position of playersToAct) {
        const availableActions = gameEngine.getAvailableActions(simulatedState, position);
        
        // Safety check 4: Player must have actions
        if (availableActions.length === 0) {
          console.error(`generateBettingRoundSequence: ${position} has no available actions`);
          continue;
        }
        
        futurePoints.push({
          position,
          availableActions,
          gameState: { ...simulatedState },
          isSimulated: true
        });
        
        // For simulation purposes, assume check/fold (minimal action)
        const hasCheck = availableActions.some(a => a.action === 'check');
        const simulatedAction = hasCheck ? 'check' : 'fold';
        
        // Apply the simulated action to get the next state
        const prevPot = simulatedState.pot;
        simulatedState = gameEngine.applyAction(simulatedState, position, simulatedAction as any);
        currentPosition = position;
        
        // Safety check 5: State must change
        if (simulatedState.pot === prevPot && simulatedAction === 'check') {
          // Check shouldn't change pot, but make sure we're progressing
          const prevHasActed = simulatedState.players.get(position)?.hasActedThisPass;
          if (!prevHasActed) {
            console.error(`generateBettingRoundSequence: State didn't progress after ${position} ${simulatedAction}`);
          }
        }
        
        // If betting round ends after this action, stop
        if (gameEngine.isBettingRoundOver(simulatedState)) {
          break;
        }
      }
    }
    
    return futurePoints;
  };

  useEffect(() => {
    
    const states: PositionDisplayState[] = [];
    let cardIndex = 0;
    
    // Step 1: Add all past actions from the sequence
    // FIXED: Correctly process edges as actions taken AT the node, not from previous node
    sequence.forEach((item) => {
      const decisionNode = item.node;
      const actionEdge = item.edge;
      
      // Handle street advances
      if (actionEdge && actionEdge.action === 'advance') {
        states.push({
          index: -1,
          position: 'SB' as Position,
          status: 'separator' as any,
          street: decisionNode.gameState.street,
          boardCards: decisionNode.boardCards || [],
          nodeId: decisionNode.id
        } as any);
        return;
      }
      
      // If there's an edge, it represents an action taken AT this node
      // This is the key fix: edges belong to the node they're attached to
      if (actionEdge) {
        const actorPosition = decisionNode.position; // Who acted at this node
        const player = decisionNode.gameState.players.get(actorPosition);
        
        if (player) {
          states.push({
            index: cardIndex++,
            position: actorPosition,
            status: player.isFolded ? 'inactive' : 'past',
            selectedAction: actionEdge.action,
            selectedAmount: actionEdge.rawAmount,
            availableActions: gameEngine.getAvailableActions(decisionNode.gameState, actorPosition),
            gameState: {
              pot: decisionNode.gameState.pot,
              stack: player.stack
            },
            actualNode: decisionNode // The node where decision was made
          } as any);
        } else {
          console.error(`No player found for ${actorPosition} in state`);
        }
      }
      // No need for prevNode tracking anymore
    });

    // Step 2: Add current position (if betting round not complete)
    if (currentNode && !gameEngine.isBettingRoundOver(currentNode.gameState)) {
      const currentPlayer = currentNode.gameState.players.get(currentNode.position);
      if (currentPlayer && !currentPlayer.isFolded && !currentPlayer.isAllIn) {
        states.push({
          index: cardIndex++,
          position: currentNode.position,
          status: 'current',
          selectedAction: null,
          selectedAmount: undefined,
          availableActions: gameEngine.getAvailableActions(currentNode.gameState, currentNode.position),
          gameState: {
            pot: currentNode.gameState.pot,
            stack: currentPlayer.stack
          },
          actualNode: currentNode
        } as any);
      }
      
      // Step 3: Pre-generate future decision points
      const futurePoints = generateBettingRoundSequence();
      
      futurePoints.forEach(point => {
        const player = point.gameState.players.get(point.position);
        if (player && !player.isFolded && !player.isAllIn) {
          states.push({
            index: cardIndex++,
            position: point.position,
            status: 'future',
            selectedAction: null,
            selectedAmount: undefined,
            availableActions: point.availableActions,
            gameState: {
              pot: point.gameState.pot,
              stack: player.stack
            },
            isSimulated: true
          } as any);
        }
      });
    }

    setPositionStates(states);
  }, [sequence, positions, tableConfig, showBBAmounts]);

  const handleActionClick = (state: PositionDisplayState, action: string, amount?: number) => {
    // When clicking an action button, we're either:
    // 1. Editing a past action (changing what was chosen)
    // 2. Making a new choice (current/future)
    // Allow clicking on future positions to skip ahead
    onActionSelect(state.position, action, amount, state.index, state.status as string, false);
  };
  
  const handlePositionClick = (state: PositionDisplayState) => {
    
    // Allow clicking on future nodes to view their potential range
    // But don't allow modifying them directly
    if (state.status === 'future') {
      // For future positions, we can view what their range would be
      onPositionClick(state.position, state.index, false);
      return;
    }
    
    // When clicking a past action card (not on a button), it's view-only
    if (state.status === 'past') {
      // For past actions, we want to view the range at that decision point
      onPositionClick(state.position, state.index, false);
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
                              color: catppuccin.overlay1,
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
                          color: catppuccin.overlay1,
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
          
          // Check if this card represents the selected node
          const actualNode = (state as any).actualNode; // For past actions only
          
          // Determine if this card is selected:
          // - For past actions: check if actualNode matches selectedNode
          // - For current: check if selectedNode is the currentNode
          // - For future: never selected
          let isSelectedNode = false;
          
          if (state.status === 'past' && actualNode && selectedNode) {
            isSelectedNode = actualNode.id === selectedNode.id;
          } else if (state.status === 'current' && selectedNode && currentNode) {
            isSelectedNode = selectedNode.id === currentNode.id;
          }
          // future nodes are never selected
          
          // Check if this action was auto-filled
          
          // Determine background and border colors
          let bgColor = catppuccin.mantle;
          let borderColor = catppuccin.surface1;
          let boxShadow = '';
          let opacity = 1;
          
          // No visual difference for auto-filled actions
          
          // Check if this is both current AND selected
          const isBothCurrentAndSelected = isCurrent && isSelectedNode;
          
          if (isBothCurrentAndSelected) {
            // Cool gradient effect with animated border for current + selected
            bgColor = `linear-gradient(135deg, ${catppuccin.blue}30 0%, ${catppuccin.mauve}30 50%, ${catppuccin.blue}30 100%)`;
            borderColor = catppuccin.mauve;
            // Add a glow effect
            boxShadow = `0 0 10px ${catppuccin.mauve}50, inset 0 0 10px ${catppuccin.blue}20`;
          } else if (isCurrent) {
            // Just current - blue highlight
            bgColor = catppuccin.blue + '20';
            borderColor = catppuccin.blue;
          } else if (isSelectedNode) {
            // Just selected - purple/mauve highlight
            bgColor = catppuccin.mauve + '30';
            borderColor = catppuccin.mauve;
          } else if (isPast && state.selectedAction) {
            // Past action that was taken
            borderColor = catppuccin.surface2;
          }
          
          return (
            <div
              key={`${state.position}-${index}`}
              className={isBothCurrentAndSelected ? 'gradient-border' : ''}
              style={{
                display: 'flex',
                flexDirection: 'column',
                minWidth: '75px',
                background: isBothCurrentAndSelected ? 
                  `linear-gradient(${catppuccin.mantle}, ${catppuccin.mantle}) padding-box, linear-gradient(135deg, ${catppuccin.blue} 0%, ${catppuccin.mauve} 50%, ${catppuccin.blue} 100%) border-box` : 
                  bgColor,
                border: isBothCurrentAndSelected ? '3px solid transparent' : `2px solid ${borderColor}`,
                borderRadius: '4px',
                cursor: 'pointer',
                opacity: state.status === 'inactive' ? 0.5 : opacity,
                transition: 'all 0.2s',
                boxShadow: boxShadow || 'none',
                position: 'relative' as const
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    color: isSelectedNode && !isCurrent ? catppuccin.mauve :
                           isBothCurrentAndSelected ? catppuccin.mauve :
                           isCurrent ? catppuccin.blue : 
                           isPast ? catppuccin.text : 
                           catppuccin.subtext0
                  }}>
                    {state.position}
                  </span>
                </div>
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
                {state.availableActions.map((actionInfo: any) => {
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
                      {formatActionLabel(
                        actionInfo.action, 
                        actionInfo.amount, 
                        (state as any).stateBefore,
                        actionInfo.label
                      )}
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
      
      {/* Custom scrollbar and gradient border styles */}
      <style>{`
        @keyframes gradient-rotate {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .gradient-border {
          animation: gradient-rotate 3s ease infinite;
          background-size: 200% 200%;
        }
        
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
            const streetItem = sequence.find(item => 
              item.edge && item.edge.action === 'advance' && 
              item.node.gameState.street === boardSelector.street
            );
            const streetNode = streetItem?.node;
            
            // Get the board cards for this street
            const streetCards = streetNode?.boardCards || [];
            
            // Also collect all OTHER board cards to prevent duplicates
            const otherBoardCards: string[] = [];
            sequence.forEach(item => {
              if (item.edge && item.edge.action === 'advance' && 
                  item.node.gameState.street !== boardSelector.street &&
                  item.node.boardCards && item.node.boardCards.length > 0) {
                item.node.boardCards.forEach(card => {
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