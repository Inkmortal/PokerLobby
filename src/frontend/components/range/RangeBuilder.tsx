import React, { useState } from 'react';
import { RangeGrid } from './RangeGrid';
import { TableSettings } from './TableSettings';
import { ActionSequenceBar } from './ActionSequenceBar';
import { PaintToolbar } from './PaintToolbar';
import { RangeStats } from './RangeStats';
import { ImportExportModal } from './ImportExportModal';
import { parseGTOWizardFormat, exportToGTOWizard } from './utils/formats/gtoWizard';

export type Position = 'UTG' | 'MP' | 'CO' | 'BTN' | 'SB' | 'BB';
export type GameType = 'Cash' | 'MTT' | 'Spin & Go' | 'HU' | 'SnG';
export type Action = 'raise' | 'call' | 'fold' | 'check' | 'bet' | 'allin';

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
  actionSequence: ActionNode[];
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

  // Action sequence (builds as you select actions)
  const [actionSequence, setActionSequence] = useState<ActionNode[]>([]);
  const [currentNode, setCurrentNode] = useState<ActionNode | null>(null);
  
  // Range data
  const [rangeData, setRangeData] = useState<RangeData>({});
  
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

  const handleActionSelect = (position: Position, action: string, amount?: number) => {
    const newNode: ActionNode = {
      position,
      action,
      amount,
      range: { ...rangeData }
    };
    
    setActionSequence([...actionSequence, newNode]);
    setCurrentNode(newNode);
    // Clear range for new action
    setRangeData({});
  };

  const handleImport = (rangeString: string) => {
    const imported = parseGTOWizardFormat(rangeString);
    setRangeData(imported);
    setShowImportExport(false);
  };

  const handleSave = () => {
    const savedRange: SavedRange = {
      id: `range_${Date.now()}`,
      name: `${actionSequence.map(n => `${n.position} ${n.action}`).join(' → ')}`,
      actionSequence,
      tableConfig,
      rangeData,
      rangeString: exportToGTOWizard(rangeData),
      created: new Date(),
      modified: new Date()
    };
    
    onSave?.(savedRange);
  };

  const handleUseInSolver = () => {
    const savedRange: SavedRange = {
      id: `range_${Date.now()}`,
      name: `${actionSequence.map(n => `${n.position} ${n.action}`).join(' → ')}`,
      actionSequence,
      tableConfig,
      rangeData,
      rangeString: exportToGTOWizard(rangeData),
      created: new Date(),
      modified: new Date()
    };
    
    onUseInSolver?.(savedRange, tableConfig);
  };

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
            {tableConfig.gameType} • {tableConfig.tableSize} • {tableConfig.stackSize}BB
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
        sequence={actionSequence}
        currentNode={currentNode}
        onActionSelect={handleActionSelect}
        tableSize={tableConfig.tableSize}
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