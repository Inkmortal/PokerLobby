import React, { useState, useEffect } from 'react';
import { RangeGrid } from './RangeGrid';
import { TableSettings, SolverConfig } from './TableSettings';
import { ActionSequenceBar } from './ActionSequenceBar';
import { PaintToolbar } from './PaintToolbar';
import { RangeStats } from './RangeStats';
import { ImportExportModal } from './ImportExportModal';
import { parseGTOWizardFormat, exportToGTOWizard } from './utils/formats/gtoWizard';
import { GameTree, GameNode } from './types/GameTree';
import { PokerGameEngine } from './engine/PokerGameEngine';
import { ActionNode, Position as PokerPosition, ActionType, BettingRoundState } from './types/PokerState';

export type Position = 'UTG' | 'UTG+1' | 'HJ' | 'LJ' | 'CO' | 'BTN' | 'SB' | 'BB';
export type GameType = 'Cash' | 'MTT' | 'Spin & Go' | 'HU' | 'SnG';
export type Action = 'open' | 'raise' | 'call' | 'fold' | 'check' | 'bet' | 'allin';

export interface HandAction {
  raise: number;
  call: number;
  fold: number;
}

export interface RangeData {
  [combo: string]: HandAction;
}

// Re-export TableConfig as alias for SolverConfig for compatibility
export type TableConfig = SolverConfig;

// Legacy ActionNode for ActionSequenceBar compatibility
export interface ActionNode {
  position: Position;
  action: string;
  amount?: number;
  range?: RangeData;
}

interface RangeBuilderProps {
  onSave?: (range: SavedRange) => void;
  onUseInSolver?: (range: SavedRange, config: TableConfig) => void;
}

export interface SavedRange {
  id: string;
  name: string;
  gameTree: GameTree;
  tableConfig: TableConfig;
  rangeData: RangeData;
  rangeString: string;
  created: Date;
  modified: Date;
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

export const RangeBuilder: React.FC<RangeBuilderProps> = ({ onSave, onUseInSolver }) => {
  // Table configuration with enhanced solver settings
  const [tableConfig, setTableConfig] = useState<SolverConfig>({
    gameType: 'Cash',
    format: 'Classic',
    tableSize: '6max',
    stackSize: 100,
    preflop: {
      all: {
        openSizes: [2.5],
        threeBet: [3],
        fourBet: {
          sizes: [2.5],
          useAllIn: false
        },
        fiveBet: {
          sizes: [2.5],
          useAllIn: false,
          allInThreshold: 60
        },
        allowLimping: false
      },
      overrides: {}
    },
    postflop: {
      flop: {
        oopBetSizes: [33, 50, 75],
        ipBetSizes: [33, 50, 75, 100],
        oopRaiseSizes: [2.5, 3],
        ipRaiseSizes: [2.2, 2.5, 3],
        enableDonk: false,
        donkSizes: []
      },
      turn: {
        oopBetSizes: [50, 75, 100],
        ipBetSizes: [50, 75, 100],
        oopRaiseSizes: [2.5, 3],
        ipRaiseSizes: [2.2, 2.5],
        enableDonk: false,
        donkSizes: []
      },
      river: {
        oopBetSizes: [50, 75, 100, 150],
        ipBetSizes: [50, 75, 100, 150],
        oopRaiseSizes: [2.5],
        ipRaiseSizes: [2.2, 2.5],
        enableDonk: false,
        donkSizes: []
      }
    },
    rake: {
      percentage: 5,
      cap: 3,
      noFlopNoDrop: true,
      preflopRake: false
    },
    addAllInThreshold: 150,
    forceAllInThreshold: 20,
    mergingThreshold: 10
  });

  // Get positions based on table size
  const getPositions = (): Position[] => {
    switch (tableConfig.tableSize) {
      case '6max': return ['HJ', 'LJ', 'CO', 'BTN', 'SB', 'BB'];
      case '9max': return ['UTG', 'UTG+1', 'HJ', 'LJ', 'CO', 'BTN', 'SB', 'BB'];
      case 'HU': return ['BTN', 'BB'];
      default: return ['HJ', 'LJ', 'CO', 'BTN', 'SB', 'BB'];
    }
  };

  // Game tree and engine
  const [gameEngine, setGameEngine] = useState(() => new PokerGameEngine(getPositions(), tableConfig));
  const [gameTree, setGameTree] = useState<{
    root: ActionNode;
    currentNode: ActionNode;
    selectedNode: ActionNode; // Node whose range is being viewed/edited
  }>(() => {
    const root = gameEngine.createRootNode();
    return {
      root,
      currentNode: root,
      selectedNode: root
    };
  });
  
  // Range data (from selected node, not current node)
  const [rangeData, setRangeData] = useState<RangeData>({});

  // Update game engine when table config changes
  useEffect(() => {
    const newPositions = getPositions();
    const newEngine = new PokerGameEngine(newPositions, tableConfig);
    const rootNode = newEngine.createRootNode();
    
    // Actually update the engine in state
    setGameEngine(newEngine);
    
    // Reset the tree with the new engine
    setGameTree({
      root: rootNode,
      currentNode: rootNode,
      selectedNode: rootNode
    });
    
    // Clear ranges since the tree structure changed
    setRangeData({});
  }, [tableConfig]);
  
  // UI state
  const [paintMode, setPaintMode] = useState<'select' | 'paint'>('select');
  const [paintAction, setPaintAction] = useState<Action>('raise');
  const [paintFrequency, setPaintFrequency] = useState<number>(100);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Calculate action percentages
  const calculateActionPercentages = () => {
    let raiseCount = 0;
    let callCount = 0;
    let totalCombos = 0;
    
    Object.values(rangeData).forEach(action => {
      const weight = Math.max(action.raise, action.call, 1 - action.fold);
      totalCombos += weight;
      raiseCount += action.raise;
      callCount += action.call;
    });
    
    const total = 1326; // Total possible combos
    return {
      raise: (raiseCount / total) * 100,
      call: (callCount / total) * 100,
      fold: ((total - raiseCount - callCount) / total) * 100,
      active: ((raiseCount + callCount) / total) * 100
    };
  };

  const percentages = calculateActionPercentages();

  const handleActionSelect = (position: Position, action: string, amount?: number, cardIndex?: number, status?: string, isViewOnly?: boolean) => {
    console.log(`handleActionSelect called: ${position} ${action} ${amount || ''} index=${cardIndex} status=${status} viewOnly=${isViewOnly}`);
    
    const positions = getPositions();
    const currentPath = getActionSequenceFromPath();
    const posIndex = positions.indexOf(position);
    
    // Check if we're trying to view or edit a past action
    if (status === 'past' && cardIndex !== undefined) {
      // Filter out advance nodes to match the card indexing from ActionSequenceBar
      const visibleActions = currentPath.filter(n => n.action !== 'advance');
      
      if (cardIndex < visibleActions.length) {
        const clickedNode = visibleActions[cardIndex];
        
        // If this is just a view action (clicking to see the range), don't modify the tree
        if (isViewOnly || (clickedNode.action === action && clickedNode.amount === amount)) {
          console.log(`Viewing range for node at index ${cardIndex}: ${clickedNode.position}:${clickedNode.action}`);
          
          // Update selectedNode without changing currentNode
          setGameTree(prev => ({
            ...prev,
            selectedNode: clickedNode
          }));
          
          // Load the range data for this node
          setRangeData(clickedNode.ranges[clickedNode.position] || {});
          return;
        }
        
        // Otherwise, this is an actual edit that will modify the tree
        console.log(`Editing past action at card index ${cardIndex} for ${position}`);
        console.log('Current path:', currentPath.map(n => `${n.position}:${n.action}`));
        console.log('Visible actions:', visibleActions.map(n => `${n.position}:${n.action}`));
        
        // Find the actual node we want to edit
        const nodeToEdit = clickedNode;
        console.log(`Node to edit: ${nodeToEdit.position}:${nodeToEdit.action}`);
        
        // Navigate back to the parent of this specific action
        let targetNode = gameTree.root;
        
        // Replay ALL actions (including advances) up to but not including the one we're editing
        for (let i = 0; i < currentPath.length; i++) {
          const step = currentPath[i];
          
          // Stop when we reach the node we want to edit
          if (step === nodeToEdit) {
            break;
          }
          
          const child = targetNode.children.find(
            c => c.position === step.position && c.action === step.action && c.amount === step.amount
          );
          if (child) {
            targetNode = child;
          }
        }
        
        // Now create or find the new action from this point
        let newBranch = targetNode.children.find(
          child => child.position === position && child.action === action && child.amount === amount
        );
        
        if (!newBranch) {
          newBranch = gameEngine.createChildNode(targetNode, position, action as ActionType, amount);
        }
        
        console.log(`Creating new branch: ${newBranch.id}`);
        
        // Check if this new action closes the betting round
        const stateAfterNewAction = gameEngine.applyAction(
          newBranch.stateBefore,
          newBranch.position,
          newBranch.action as ActionType,
          newBranch.amount
        );
        
        if (gameEngine.isBettingRoundOver(stateAfterNewAction) && stateAfterNewAction.street !== 'river') {
          console.log(`New action closes betting round on ${stateAfterNewAction.street}, creating street advancement`);
          
          // Advance to next street
          const nextStreetState = gameEngine.advanceToNextStreet(stateAfterNewAction);
          
          // Create a new node for the street transition
          const streetNode = gameEngine.createChildNode(
            newBranch,
            newBranch.position,
            'advance' as ActionType,
            undefined
          );
          
          // Override the state with the next street state
          streetNode.stateBefore = nextStreetState;
          
          // Set both current and selected node to the street advancement node
          setGameTree(prev => ({
            ...prev,
            currentNode: streetNode,
            selectedNode: streetNode
          }));
          
          // Load range for the first position to act on the new street
          const firstToAct = gameEngine.getPlayersStillToAct(streetNode.stateBefore)[0];
          setRangeData(streetNode.ranges[firstToAct] || {});
        } else {
          // Set both current and selected node to the new branch
          setGameTree(prev => ({
            ...prev,
            currentNode: newBranch,
            selectedNode: newBranch
          }));
          
          // Load the range for the NEXT position to act after this action
          const stateAfter = gameEngine.applyAction(
            newBranch.stateBefore,
            newBranch.position,
            newBranch.action as ActionType,
            newBranch.amount
          );
          const nextToAct = gameEngine.getPlayersStillToAct(stateAfter);
          if (nextToAct.length > 0) {
            setRangeData(newBranch.ranges[nextToAct[0]] || {});
          } else {
            // If no one left to act, keep showing the last actor's range
            setRangeData(newBranch.ranges[position] || {});
          }
        }
      }
      return;
    }
    
    // Not editing - we're adding a new action
    // Get players still to act from the game engine
    
    // Check if we're at the start of a new street (last node was 'advance')
    const isNewStreet = currentPath.length > 0 && currentPath[currentPath.length - 1].action === 'advance';
    
    // Find last actor, but only from the current betting round
    let lastActor: Position | undefined = undefined;
    if (!isNewStreet) {
      // Find the last non-advance action on the current street
      for (let i = currentPath.length - 1; i >= 0; i--) {
        const node = currentPath[i];
        if (node.action !== 'advance' && node.action !== 'start') {
          // Make sure this action is from the current street
          if (node.stateBefore.street === currentBettingState.street) {
            lastActor = node.position;
            break;
          }
        }
      }
    }
    
    const pendingPlayers = gameEngine.getPlayersStillToAct(currentBettingState, lastActor);
    
    console.log(`Current street: ${currentBettingState.street}`);
    console.log(`Is new street: ${isNewStreet}`);
    console.log(`Last actor: ${lastActor}`);
    console.log(`Pending players: ${pendingPlayers.join(', ')}`);
    console.log(`Clicked position: ${position}`);
    
    // Find positions that need to be filled before the clicked position
    const positionsToFill: Position[] = [];
    const clickedIndex = pendingPlayers.indexOf(position);
    if (clickedIndex > 0) {
      for (let i = 0; i < clickedIndex; i++) {
        positionsToFill.push(pendingPlayers[i]);
      }
    }
    
    console.log(`Positions to fill: ${positionsToFill.join(', ')}`);
    
    // Start from current node
    let currentNode = gameTree.currentNode;
    
    // Fill gaps with smart check/fold defaults
    for (const gapPosition of positionsToFill) {
      // Get the current state after the last action
      const stateAfterLast = currentNode.action === 'start' ? 
        currentNode.stateBefore : 
        gameEngine.applyAction(currentNode.stateBefore, currentNode.position as Position, currentNode.action as ActionType, currentNode.amount);
      
      // Get available actions for this position
      const availableActions = gameEngine.getAvailableActions(stateAfterLast, gapPosition);
      
      // Choose smart default: check if available, otherwise fold
      const hasCheck = availableActions.some(a => a.action === 'check');
      const defaultAction = hasCheck ? 'check' : 'fold';
      
      console.log(`Auto-${defaultAction}ing ${gapPosition}`);
      
      // Check if this default node already exists
      let defaultNode = currentNode.children.find(
        child => child.position === gapPosition && child.action === defaultAction
      );
      
      if (!defaultNode) {
        defaultNode = gameEngine.createChildNode(currentNode, gapPosition, defaultAction as ActionType);
      }
      
      currentNode = defaultNode;
    }
    
    // Now add the actual clicked action
    let targetNode = currentNode.children.find(
      child => child.position === position && child.action === action && child.amount === amount
    );
    
    if (!targetNode) {
      targetNode = gameEngine.createChildNode(currentNode, position, action as ActionType, amount);
    }
    
    console.log(`Setting current node to: ${targetNode.id}`);
    
    // Check if betting round is complete after this action
    const stateAfterAction = gameEngine.applyAction(
      targetNode.stateBefore,
      targetNode.position,
      targetNode.action as ActionType,
      targetNode.amount
    );
    
    if (gameEngine.isBettingRoundOver(stateAfterAction) && stateAfterAction.street !== 'river') {
      console.log(`Betting round complete on ${stateAfterAction.street}, advancing to next street`);
      
      // Advance to next street
      const nextStreetState = gameEngine.advanceToNextStreet(stateAfterAction);
      
      // Create a new node for the street transition
      // This node represents the start of the new street with wildcard board
      const streetNode = gameEngine.createChildNode(
        targetNode,
        targetNode.position, // Use last actor's position
        'advance' as ActionType, // Special action type for street transitions
        undefined
      );
      
      // Override the state with the next street state
      streetNode.stateBefore = nextStreetState;
      
      // Update tree to the new street node
      // When advancing streets, the new node is also the selected node
      setGameTree(prev => ({
        ...prev,
        currentNode: streetNode,
        selectedNode: streetNode
      }));
      
      // Load range for the first position to act on the new street
      const firstToAct = gameEngine.getPlayersStillToAct(streetNode.stateBefore)[0];
      setRangeData(streetNode.ranges[firstToAct] || {});
    } else {
      // Update tree to final node
      // When making a decision, the new current node is also the selected node
      setGameTree(prev => ({
        ...prev,
        currentNode: targetNode,
        selectedNode: targetNode
      }));
      
      // Load the range for the NEXT position to act, not the one that just acted
      const nextToAct = gameEngine.getPlayersStillToAct(stateAfterAction);
      if (nextToAct.length > 0) {
        setRangeData(targetNode.ranges[nextToAct[0]] || {});
      } else {
        // If no one left to act, keep showing the last actor's range
        setRangeData(targetNode.ranges[position] || {});
      }
    }
  };

  const handleNodeSelect = (targetNode: ActionNode) => {
    // This is called when clicking on a past action to view its range
    setGameTree(prev => ({
      ...prev,
      selectedNode: targetNode  // Only update selectedNode for viewing ranges
    }));
    
    // Load the range for the position that acted at this node
    const positionRange = targetNode.ranges[targetNode.position] || {};
    setRangeData(positionRange);
  };

  // Update selected node's range when range data changes
  useEffect(() => {
    if (gameTree.selectedNode) {
      // Determine which position's range we're editing
      let rangePosition = gameTree.selectedNode.position;
      
      // If this is the current node (where we're building the tree), 
      // we need to show the range for the NEXT position to act
      if (gameTree.selectedNode === gameTree.currentNode) {
        if (gameTree.selectedNode.action === 'start') {
          // At the root, the range is for the first position to act
          const positions = getPositions();
          rangePosition = positions[0];
        } else {
          // For any other current node, determine who's next to act AFTER this node's action
          const state = gameEngine.applyAction(
            gameTree.selectedNode.stateBefore,
            gameTree.selectedNode.position,
            gameTree.selectedNode.action as ActionType,
            gameTree.selectedNode.amount
          );
          const nextToAct = gameEngine.getPlayersStillToAct(state);
          if (nextToAct.length > 0) {
            rangePosition = nextToAct[0];
          }
          // If no one left to act, keep the position that just acted
        }
      }
      // For past nodes (not current), use the position that acted at that node
      
      const updatedRanges = {
        ...gameTree.selectedNode.ranges,
        [rangePosition]: rangeData
      };
      
      gameTree.selectedNode.ranges = updatedRanges;
    }
  }, [rangeData]);

  const handleImport = (rangeString: string) => {
    const imported = parseGTOWizardFormat(rangeString);
    setRangeData(imported);
    setShowImportExport(false);
  };

  // Convert current tree path to action sequence for display
  const getActionSequenceFromPath = (): ActionNode[] => {
    const sequence: ActionNode[] = [];
    let current = gameTree.currentNode;
    
    // Walk back to root to build the path
    const path: ActionNode[] = [];
    while (current && current.parent) {
      path.unshift(current);
      current = current.parent;
    }
    
    // Filter out the root node (which has action 'start')
    const result = path.filter(node => node.action !== 'start');
    
    console.log(`getActionSequenceFromPath returning ${result.length} actions:`, result.map(n => `${n.position}:${n.action}`));
    return result;
  };

  const handleSave = () => {
    const pathSequence = getActionSequenceFromPath();
    const savedRange: SavedRange = {
      id: `range_${Date.now()}`,
      name: pathSequence.length > 0 
        ? `${pathSequence.map(n => `${n.position} ${n.action}`).join(' → ')}`
        : 'Empty Range',
      gameTree,
      tableConfig,
      rangeData,
      rangeString: exportToGTOWizard(rangeData),
      created: new Date(),
      modified: new Date()
    };
    
    onSave?.(savedRange);
  };

  const handleUseInSolver = () => {
    const pathSequence = getActionSequenceFromPath();
    const savedRange: SavedRange = {
      id: `range_${Date.now()}`,
      name: pathSequence.length > 0 
        ? `${pathSequence.map(n => `${n.position} ${n.action}`).join(' → ')}`
        : 'Empty Range',
      gameTree,
      tableConfig,
      rangeData,
      rangeString: exportToGTOWizard(rangeData),
      created: new Date(),
      modified: new Date()
    };
    
    onUseInSolver?.(savedRange, tableConfig);
  };

  // Calculate current betting state for display
  const currentBettingState = (() => {
    const currentNode = gameTree.currentNode;
    if (currentNode.action === 'start') {
      return currentNode.stateBefore;
    }
    return gameEngine.applyAction(
      currentNode.stateBefore,
      currentNode.position,
      currentNode.action as ActionType,
      currentNode.amount
    );
  })();

  return (
    <div style={{
      minHeight: '100vh',
      background: catppuccin.base,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Bar with Settings */}
      <div style={{
        background: catppuccin.mantle,
        borderBottom: `1px solid ${catppuccin.surface1}`,
        padding: '1rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: catppuccin.text
          }}>
            Range Builder
          </h1>
          <span style={{
            padding: '0.25rem 0.75rem',
            background: catppuccin.surface0,
            borderRadius: '20px',
            fontSize: '0.75rem',
            color: catppuccin.subtext0
          }}>
            {tableConfig.gameType} • {tableConfig.tableSize} • Pot: {currentBettingState.pot}BB • Stacks: {tableConfig.stackSize}BB
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              padding: '0.5rem 1rem',
              background: catppuccin.surface0,
              color: catppuccin.text,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            ⚙️ Settings
          </button>
          <button
            onClick={() => setShowImportExport(true)}
            style={{
              padding: '0.5rem 1rem',
              background: catppuccin.surface0,
              color: catppuccin.text,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            📥 Import/Export
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <TableSettings
          config={tableConfig}
          onChange={setTableConfig}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Action Sequence Bar */}
      <ActionSequenceBar
        sequence={getActionSequenceFromPath()}
        currentBettingState={currentBettingState}
        gameEngine={gameEngine}
        selectedNode={gameTree.selectedNode}
        currentNode={gameTree.currentNode}
        onActionSelect={handleActionSelect}
        onPositionClick={(position: Position, cardIndex?: number, isCurrentNode?: boolean) => {
          // If this is the current node (the next decision point), select it
          if (isCurrentNode) {
            setGameTree(prev => ({
              ...prev,
              selectedNode: prev.currentNode
            }));
            
            // For the current node, we need to determine which position is next to act
            // The current node represents the state after the last action
            const nextToAct = position; // The position parameter tells us who is next to act
            const currentRange = gameTree.currentNode.ranges[nextToAct] || {};
            setRangeData(currentRange);
            return;
          }
          
          // Navigate to the node for this position if it exists
          const pathSequence = getActionSequenceFromPath();
          
          // Use the card index if provided to navigate to the exact card
          if (cardIndex !== undefined && cardIndex < pathSequence.length) {
            // Navigate to the specific node at this index
            let targetNode = gameTree.root;
            for (let i = 0; i <= cardIndex; i++) {
              const step = pathSequence[i];
              const child = targetNode.children.find(
                c => c.position === step.position && c.action === step.action && c.amount === step.amount
              );
              if (child) {
                targetNode = child;
              }
            }
            handleNodeSelect(targetNode);
          }
          // If position hasn't acted yet, just highlight it visually (handled by ActionSequenceBar)
        }}
        onBoardSelect={(street: 'flop' | 'turn' | 'river', cards: string[]) => {
          // Find the advance node for this specific street
          const findStreetNode = (node: ActionNode, targetStreet: string): ActionNode | null => {
            // Check if this is the advance node for the target street
            if (node.action === 'advance' && node.stateBefore.street === targetStreet) {
              return node;
            }
            
            // Search children recursively
            for (const child of node.children) {
              const found = findStreetNode(child, targetStreet);
              if (found) return found;
            }
            
            return null;
          };
          
          const streetNode = findStreetNode(gameTree.root, street);
          
          if (streetNode) {
            // Cards come in "As" format, convert to "A♠" format for display
            // Keep empty strings as wildcards
            const convertedCards = cards.map(card => {
              if (!card || card.length < 2) return ''; // Empty string = wildcard
              const rank = card[0].toUpperCase();
              const suit = card[1].toLowerCase();
              let suitSymbol = '';
              if (suit === 's') suitSymbol = '♠';
              else if (suit === 'h') suitSymbol = '♥';
              else if (suit === 'd') suitSymbol = '♦';
              else if (suit === 'c') suitSymbol = '♣';
              return rank + suitSymbol;
            });
            
            // Store the full array with empty strings for wildcards
            // This is important for range calculations
            streetNode.boardCards = convertedCards;
            
            // Trigger re-render
            setGameTree(prev => ({ ...prev }));
          }
        }}
        tableSize={tableConfig.tableSize}
        tableConfig={tableConfig}
      />

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        padding: '1.5rem',
        gap: '1.5rem'
      }}>
        {/* Left Panel - Paint Tools & Stats */}
        <div style={{
          width: '280px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <PaintToolbar
            mode={paintMode}
            onModeChange={setPaintMode}
            paintAction={paintAction}
            onActionChange={setPaintAction}
            paintFrequency={paintFrequency}
            onFrequencyChange={setPaintFrequency}
            rangeData={rangeData}
            onRangeUpdate={setRangeData}
          />
          
          <RangeStats
            rangeData={rangeData}
            percentages={percentages}
          />
        </div>

        {/* Center - Range Grid */}
        <div style={{ flex: 1 }}>
          <RangeGrid
            rangeData={rangeData}
            onChange={setRangeData}
            paintMode={paintMode}
            paintAction={paintAction}
            paintFrequency={paintFrequency}
          />
        </div>

        {/* Right Panel - Actions */}
        <div style={{
          width: '200px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{
            background: catppuccin.surface0,
            borderRadius: '12px',
            padding: '1rem'
          }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: catppuccin.subtext0,
              marginBottom: '1rem',
              textTransform: 'uppercase'
            }}>
              Range Info
            </h3>
            <div style={{
              fontSize: '0.875rem',
              color: catppuccin.text,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div>
                <span style={{ color: catppuccin.subtext0 }}>Active: </span>
                <span style={{ color: catppuccin.blue, fontWeight: '600' }}>
                  {percentages.active.toFixed(1)}%
                </span>
              </div>
              <div>
                <span style={{ color: catppuccin.subtext0 }}>Combos: </span>
                <span style={{ fontWeight: '600' }}>
                  {Math.round(percentages.active * 13.26)}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setRangeData({})}
            style={{
              padding: '0.75rem',
              background: catppuccin.surface0,
              color: catppuccin.text,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Clear Range
          </button>

          <button
            onClick={handleSave}
            style={{
              padding: '0.75rem',
              background: catppuccin.blue,
              color: catppuccin.base,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}
          >
            Save Range
          </button>

          <button
            onClick={handleUseInSolver}
            style={{
              padding: '0.75rem',
              background: catppuccin.green,
              color: catppuccin.base,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}
          >
            Use in Solver
          </button>
        </div>
      </div>

      {/* Import/Export Modal */}
      {showImportExport && (
        <ImportExportModal
          rangeData={rangeData}
          onImport={handleImport}
          onClose={() => setShowImportExport(false)}
        />
      )}
    </div>
  );
};