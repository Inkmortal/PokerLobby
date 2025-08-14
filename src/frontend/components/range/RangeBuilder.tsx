import React, { useState, useEffect } from 'react';
import { RangeGrid } from './RangeGrid';
import { TableSettings } from './TableSettings';
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

export interface TableConfig {
  gameType: GameType;
  format: 'Classic' | 'Progressive' | 'PKO';
  tableSize: '6max' | '9max' | 'HU';
  stackSize: number; // in BBs
  
  // Preflop configuration
  preflop: {
    openSize: number; // Default open raise (BBs)
    threebet: number; // 3-bet multiplier
    fourbet: number; // 4-bet multiplier
    fivebet: number; // 5-bet/jam threshold
    limping: boolean; // Allow limping
    rakePreflop: boolean; // Rake taken preflop
  };
  
  // Postflop bet sizes
  betSizes: {
    flop: number[];
    turn: number[];
    river: number[];
  };
  
  // Rake structure
  rake: {
    percentage: number;
    cap: number; // in BBs
    noFlopNoDrop: boolean; // No rake if no flop
  };
  
  // Advanced settings
  icm?: {
    enabled: boolean;
    payouts?: number[];
  };
  antes?: number; // in BBs
  straddle?: boolean;
}

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
  // Table configuration
  const [tableConfig, setTableConfig] = useState<TableConfig>({
    gameType: 'Cash',
    format: 'Classic',
    tableSize: '6max',
    stackSize: 100,
    preflop: {
      openSize: 2.5,
      threebet: 3.5,
      fourbet: 2.5,
      fivebet: 100, // All-in threshold
      limping: false,
      rakePreflop: false
    },
    betSizes: {
      flop: [33, 50, 75],
      turn: [50, 75],
      river: [50, 75]
    },
    rake: {
      percentage: 5,
      cap: 3,
      noFlopNoDrop: true
    }
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
  const [gameEngine] = useState(() => new PokerGameEngine(getPositions(), tableConfig));
  const [gameTree, setGameTree] = useState<{
    root: ActionNode;
    currentNode: ActionNode;
  }>(() => {
    const root = gameEngine.createRootNode();
    return {
      root,
      currentNode: root
    };
  });
  
  // Range data (from current node)
  const [rangeData, setRangeData] = useState<RangeData>({});

  // Update game engine when table config changes
  useEffect(() => {
    const newPositions = getPositions();
    const newEngine = new PokerGameEngine(newPositions, tableConfig);
    const rootNode = newEngine.createRootNode();
    setGameTree({
      root: rootNode,
      currentNode: rootNode
    });
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

  const handleActionSelect = (position: Position, action: string, amount?: number, cardIndex?: number, status?: string) => {
    console.log(`handleActionSelect called: ${position} ${action} ${amount || ''} index=${cardIndex} status=${status}`);
    
    const positions = getPositions();
    const currentPath = getActionSequenceFromPath();
    const posIndex = positions.indexOf(position);
    
    // Check if we're trying to edit a past action based on status AND card index
    if (status === 'past' && cardIndex !== undefined && cardIndex < currentPath.length) {
      console.log(`Editing past action at card index ${cardIndex} for ${position}`);
      
      // Navigate back to the parent of this specific action
      let targetNode = gameTree.root;
      
      // Replay actions up to (but not including) the card we're editing
      for (let i = 0; i < cardIndex; i++) {
        const step = currentPath[i];
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
      
      setGameTree(prev => ({
        ...prev,
        currentNode: newBranch
      }));
      
      setRangeData(newBranch.ranges[position] || {});
      return;
    }
    
    // Not editing - we're adding a new action
    // Get players still to act from the game engine
    const lastActor = currentPath.length > 0 ? 
      currentPath[currentPath.length - 1].position : 
      undefined;
    const pendingPlayers = gameEngine.getPlayersStillToAct(currentBettingState, lastActor);
    
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
    
    // Update tree to final node
    setGameTree(prev => ({
      ...prev,
      currentNode: targetNode
    }));
    
    setRangeData(targetNode.ranges[position] || {});
  };

  const handleNodeSelect = (targetNode: ActionNode) => {
    setGameTree(prev => ({
      ...prev,
      currentNode: targetNode
    }));
    
    // Load the range for the position that acted at this node
    const positionRange = targetNode.ranges[targetNode.position] || {};
    setRangeData(positionRange);
  };

  // Update current node's range when range data changes
  useEffect(() => {
    if (gameTree.currentNode && gameTree.currentNode.position !== 'SB') {
      const updatedRanges = {
        ...gameTree.currentNode.ranges,
        [gameTree.currentNode.position]: rangeData
      };
      
      gameTree.currentNode.ranges = updatedRanges;
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

      {/* Settings Panel (collapsible) */}
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
        onActionSelect={handleActionSelect}
        onPositionClick={(position: Position, cardIndex?: number) => {
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