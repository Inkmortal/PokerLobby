import React, { useState, useEffect } from 'react';
import { RangeGrid } from './RangeGrid';
import { TableSettings, SolverConfig } from './TableSettings';
import { ActionSequenceBar } from './ActionSequenceBar';
import { PaintToolbar } from './PaintToolbar';
import { RangeStats } from './RangeStats';
import { ImportExportModal } from './ImportExportModal';
import { parseGTOWizardFormat, exportToGTOWizard } from './utils/formats/gtoWizard';
import { GameTree } from './types/GameTree';
import { PokerGameEngine } from './engine/PokerGameEngine';
import { DecisionNode, ActionEdge, ActionType } from './types/PokerState';

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
        allowLimping: false,
        allowOpenShove: false
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
  const [gameTree, setGameTree] = useState<GameTree>(() => {
    const root = gameEngine.createRootNode();
    return {
      root,
      currentNode: root,
      selectedNode: root,
      tableConfig,
      positions: getPositions()
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
      selectedNode: rootNode,
      tableConfig,
      positions: newPositions
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
  const [showBBAmounts, setShowBBAmounts] = useState(true); // Toggle for BB vs configured sizes

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


  const handleActionSelect = (position: Position, action: string, amount?: number, nodeIndex?: number, status?: string, isViewOnly?: boolean) => {
    // View-only mode - just load the range
    if (isViewOnly) {
      const currentPath = getActionSequenceFromPath();
      const visibleActions = currentPath.filter(item => !item.edge || item.edge.action !== 'advance');
      
      if (nodeIndex !== undefined && nodeIndex < visibleActions.length) {
        const clickedNode = visibleActions[nodeIndex].node;
        setGameTree(prev => ({
          ...prev,
          selectedNode: clickedNode
        }));
        setRangeData(clickedNode.range || {});
      }
      return;
    }
    
    // SIMPLE APPROACH: Always build the exact path we want
    
    // Step 1: Determine what path we want to build
    const currentPath = getActionSequenceFromPath();
    const desiredPath: Array<{position: Position, action: string, amount?: number}> = [];
    
    // Build desired path based on what was clicked
    if (status === 'past') {
      // Changing a past action - rebuild up to that point with the new action
      const visibleActions = currentPath.filter(item => !item.edge || item.edge.action !== 'advance');
      
      // Copy all actions before the clicked one
      for (let i = 0; i < nodeIndex! && i < visibleActions.length; i++) {
        const item = visibleActions[i];
        if (item.edge && item.edge.action !== 'advance') {
          // CRITICAL: item.node.position is who TOOK this action (made the decision at this node)
          desiredPath.push({
            position: item.node.position,
            action: item.edge.action,
            amount: item.edge.rawAmount
          });
        }
      }
      
      // Add the new action at the clicked position
      desiredPath.push({ position, action, amount });
      
    } else {
      // Current or future - build from existing path
      
      // Copy all existing actions
      // CRITICAL FIX: The position that took an action is the position AT the node where the edge originates
      // item.node is where the decision was made, item.edge is the action taken FROM that node
      for (const item of currentPath) {
        if (item.edge && item.edge.action !== 'advance') {
          // item.node.position is who TOOK this action (made the decision at this node)
          desiredPath.push({
            position: item.node.position,
            action: item.edge.action,
            amount: item.edge.rawAmount
          });
        }
      }
      
      // If future, auto-fill positions between current and target
      if (status === 'future') {
        let simulatedState = gameTree.currentNode.gameState;
        let lastPos = gameTree.currentNode.position;
        
        // Keep adding default actions until we reach target position
        while (lastPos !== position) {
          const nextToAct = gameEngine.getPlayersStillToAct(simulatedState, lastPos);
          if (nextToAct.length === 0) break;
          
          const nextPos = nextToAct[0];
          if (nextPos === position) break;
          
          // Add default action for this position
          const actions = gameEngine.getAvailableActions(simulatedState, nextPos);
          const defaultAction = actions.find(a => a.action === 'check') || actions.find(a => a.action === 'fold');
          if (!defaultAction) break;
          
          desiredPath.push({
            position: nextPos,
            action: defaultAction.action,
            amount: defaultAction.amount
          });
          
          // Simulate the action
          simulatedState = gameEngine.applyAction(simulatedState, nextPos, defaultAction.action as ActionType);
          lastPos = nextPos;
        }
      }
      
      // Add the clicked action
      desiredPath.push({ position, action, amount });
    }
    
    // Step 2: Build the tree following the desired path
    let currentNode = gameTree.root;
    
    for (const step of desiredPath) {
      // Verify we're at the right position
      if (currentNode.position !== step.position) {
        console.error(`Path error: at ${currentNode.position}, expected ${step.position}`);
        break;
      }
      
      // Find or create the edge
      let edge = currentNode.edges.find(e => 
        e.action === step.action && 
        (step.amount === undefined || e.rawAmount === step.amount)
      );
      
      if (edge?.toNode) {
        currentNode = edge.toNode;
      } else {
        currentNode = gameEngine.createChildNode(currentNode, step.action as ActionType, step.amount);
      }
    }
    
    // Step 3: Check if betting round is complete
    if (gameEngine.isBettingRoundOver(currentNode.gameState) && currentNode.gameState.street !== 'river') {
      const streetNode = gameEngine.createChildNode(currentNode, 'advance' as ActionType);
      const nextStreetState = gameEngine.advanceToNextStreet(currentNode.gameState);
      streetNode.gameState = nextStreetState;
      currentNode = streetNode;
    }
    
    // Step 4: Update tree state
    setGameTree({
      root: gameTree.root,
      currentNode: currentNode,
      selectedNode: currentNode,
      tableConfig: gameTree.tableConfig,
      positions: gameTree.positions
    });
    
    setRangeData(currentNode.range || {});
  };

  const handleNodeSelect = (targetNode: DecisionNode) => {
    
    // Update selected node for UI highlighting
    setGameTree(prev => ({
      ...prev,
      selectedNode: targetNode
    }));
    
    // Load the range for the position at this decision node
    setRangeData(targetNode.range || {});
  };

  // Update selected node's range when range data changes
  useEffect(() => {
    if (gameTree.selectedNode) {
      // Update the range
      gameTree.selectedNode.range = rangeData;
      
      // Force a re-render by updating the gameTree state
      setGameTree(prev => ({
        ...prev,
        lastUpdate: Date.now()
      } as any));
    }
  }, [rangeData]);

  const handleImport = (rangeString: string) => {
    const imported = parseGTOWizardFormat(rangeString);
    setRangeData(imported);
    setShowImportExport(false);
  };

  // Convert current tree path to action sequence for display
  // Returns array of {node, edge} pairs for the ActionSequenceBar
  const getActionSequenceFromPath = (): Array<{ node: DecisionNode; edge?: ActionEdge }> => {
    const sequence: Array<{ node: DecisionNode; edge?: ActionEdge }> = [];
    let current = gameTree.currentNode;
    
    // Walk back to root to build the path
    const path: DecisionNode[] = [];
    let node: DecisionNode | null = current;
    while (node) {
      path.unshift(node);
      node = node.parent;
    }
    
    // Build sequence of decision points and the edges taken from them
    for (let i = 0; i < path.length; i++) {
      const node = path[i];
      let edge: ActionEdge | undefined;
      
      // Find the edge that was taken from this node (if any)
      if (i < path.length - 1) {
        const nextNode = path[i + 1];
        edge = node.edges.find(e => e.toNode === nextNode);
      }
      
      sequence.push({ node, edge });
    }
    
    return sequence;
  };

  const handleSave = () => {
    const pathSequence = getActionSequenceFromPath();
    const savedRange: SavedRange = {
      id: `range_${Date.now()}`,
      name: pathSequence.length > 0 
        ? `${pathSequence.map(item => item.edge ? `${item.node.position} ${item.edge.action}` : 'root').join(' → ')}`
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
        ? `${pathSequence.map(item => item.edge ? `${item.node.position} ${item.edge.action}` : 'root').join(' → ')}`
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
  const currentBettingState = gameTree.currentNode.gameState;

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

      {/* Bet Display Toggle */}
      <div style={{
        background: catppuccin.surface0,
        padding: '0.5rem 1rem',
        borderBottom: `1px solid ${catppuccin.surface1}`,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem',
          color: catppuccin.text,
          cursor: 'pointer'
        }}>
          <div
            onClick={() => setShowBBAmounts(!showBBAmounts)}
            style={{
              position: 'relative',
              width: '40px',
              height: '22px',
              backgroundColor: showBBAmounts ? catppuccin.blue : catppuccin.surface1,
              borderRadius: '11px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '2px',
              left: showBBAmounts ? '20px' : '2px',
              width: '18px',
              height: '18px',
              backgroundColor: catppuccin.text,
              borderRadius: '50%',
              transition: 'left 0.2s'
            }} />
          </div>
          <span>Show amounts in BB</span>
        </label>
        <span style={{
          fontSize: '0.75rem',
          color: catppuccin.subtext0,
          marginLeft: '0.5rem'
        }}>
          {showBBAmounts ? 
            'Displaying all amounts in big blinds' : 
            'Showing configured bet sizes (multipliers & percentages)'
          }
        </span>
      </div>

      {/* Action Sequence Bar */}
      <ActionSequenceBar
        sequence={getActionSequenceFromPath()}
        currentBettingState={currentBettingState}
        gameEngine={gameEngine}
        selectedNode={gameTree.selectedNode}
        currentNode={gameTree.currentNode}
        showBBAmounts={showBBAmounts}
        onActionSelect={handleActionSelect}
        onPositionClick={(position: Position, nodeIndex?: number, isCurrentNode?: boolean) => {
          console.log(`onPositionClick: position=${position}, nodeIndex=${nodeIndex}, isCurrentNode=${isCurrentNode}`);
          
          if (isCurrentNode) {
            // Clicking on the current (blue) node
            console.log(`Selecting current node`);
            handleNodeSelect(gameTree.currentNode);
          } else if (nodeIndex !== undefined) {
            // Clicking on a past action card
            const pathSequence = getActionSequenceFromPath();
            // Filter out advance nodes to match ActionSequenceBar's indexing
            const visibleActions = pathSequence.filter(item => item.edge && item.edge.action !== 'advance');
            if (nodeIndex < visibleActions.length) {
              // Select the node where the decision was made
              const item = visibleActions[nodeIndex];
              const decisionNode = item.node;
              if (decisionNode) {
                console.log(`Selecting decision node at index ${nodeIndex}: ${decisionNode.id}`);
                handleNodeSelect(decisionNode);
              }
            }
          }
        }}
        onBoardSelect={(street: 'flop' | 'turn' | 'river', cards: string[]) => {
          // Find the advance node for this specific street
          const findStreetNode = (node: DecisionNode, targetStreet: string): DecisionNode | null => {
            // Check if this node is on the target street
            if (node.gameState.street === targetStreet) {
              return node;
            }
            
            // Search through edges to find children
            for (const edge of node.edges) {
              if (edge.toNode) {
                const found = findStreetNode(edge.toNode, targetStreet);
                if (found) return found;
              }
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