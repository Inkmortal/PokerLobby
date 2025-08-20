import React, { useState } from 'react';
import { Position } from './types/PokerState';
import { Tooltip, InfoIcon } from './Tooltip';

export type GameType = 'Cash' | 'MTT' | 'Spin & Go' | 'HU' | 'SnG';

// Enhanced configuration with position-specific settings
export interface SolverConfig {
  gameType: GameType;
  format: 'Classic' | 'Progressive' | 'PKO';
  tableSize: '6max' | '9max' | 'HU';
  stackSize: number; // in BBs
  
  // Preflop configuration with position overrides
  preflop: {
    // Default settings for all positions
    all: {
      openSizes: number[]; // Multiple open sizes in BBs
      threeBet: number[]; // 3-bet multipliers
      fourBet: {
        sizes: number[]; // 4-bet multipliers
        useAllIn: boolean;
      };
      fiveBet: {
        sizes: number[];
        useAllIn: boolean;
        allInThreshold?: number; // Auto all-in if stack < this
      };
      allowLimping: boolean;
      allowOpenShove: boolean; // Allow all-in as opening action
      
      // VS specific aggressor settings (when facing opens/raises from specific positions)
      vsAggressor?: {
        [aggressor in Position]?: {
          threeBet?: number[];
          fourBet?: {
            sizes?: number[];
            useAllIn?: boolean;
          };
          fiveBet?: {
            sizes?: number[];
            useAllIn?: boolean;
            allInThreshold?: number;
          };
        };
      };
    };
    // Position-specific overrides
    overrides?: {
      [key in Position]?: {
        openSizes?: number[];
        threeBet?: number[];
        fourBet?: {
          sizes?: number[];
          useAllIn?: boolean;
        };
        fiveBet?: {
          sizes?: number[];
          useAllIn?: boolean;
          allInThreshold?: number;
        };
        allowLimping?: boolean;
        allowOpenShove?: boolean;
        
        // VS specific aggressor overrides for this position
        vsAggressor?: {
          [aggressor in Position]?: {
            threeBet?: number[];
            fourBet?: {
              sizes?: number[];
              useAllIn?: boolean;
            };
            fiveBet?: {
              sizes?: number[];
              useAllIn?: boolean;
              allInThreshold?: number;
            };
          };
        };
      };
    };
  };
  
  // Postflop bet and raise sizes
  postflop: {
    flop: {
      oopBetSizes: number[]; // OOP bet sizes % of pot
      ipBetSizes: number[]; // IP bet sizes % of pot
      oopRaiseSizes: number[]; // OOP raise multipliers
      ipRaiseSizes: number[]; // IP raise multipliers
      enableDonk?: boolean;
      donkSizes?: number[]; // % of pot (OOP only)
    };
    turn: {
      oopBetSizes: number[];
      ipBetSizes: number[];
      oopRaiseSizes: number[];
      ipRaiseSizes: number[];
      enableDonk?: boolean;
      donkSizes?: number[]; // % of pot (OOP only)
    };
    river: {
      oopBetSizes: number[];
      ipBetSizes: number[];
      oopRaiseSizes: number[];
      ipRaiseSizes: number[];
      enableDonk?: boolean;
      donkSizes?: number[]; // % of pot (OOP only)
    };
  };
  
  // Rake structure
  rake: {
    percentage: number;
    cap: number; // in BBs
    noFlopNoDrop: boolean;
    preflopRake: boolean;
  };
  
  // Advanced settings
  icm?: {
    enabled: boolean;
    payouts?: number[];
  };
  antes?: number; // in BBs
  straddle?: boolean;
  
  // Solver thresholds
  startingPot?: number; // in BBs
  addAllInThreshold?: number; // % of pot
  forceAllInThreshold?: number; // % of stack
  mergingThreshold?: number; // % difference
}

interface TableSettingsProps {
  config: SolverConfig;
  onChange: (config: SolverConfig) => void;
  onClose: () => void;
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
  sapphire: '#74c7ec',
  pink: '#f5c2e7'
};

// Component for chip-style size inputs
const SizeChips: React.FC<{
  sizes: number[];
  onChange: (sizes: number[]) => void;
  label: string;
  suffix?: string;
  placeholder?: string;
}> = ({ sizes, onChange, label, suffix = '', placeholder = 'Add size...' }) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const value = parseFloat(inputValue);
    if (!isNaN(value) && value > 0 && !sizes.includes(value)) {
      onChange([...sizes, value].sort((a, b) => a - b));
      setInputValue('');
    }
  };

  const handleRemove = (index: number) => {
    onChange(sizes.filter((_, i) => i !== index));
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ 
        fontSize: '0.875rem', 
        color: catppuccin.subtext0,
        display: 'block',
        marginBottom: '0.5rem'
      }}>
        {label}
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        {sizes.map((size, i) => (
          <div key={i} style={{
            padding: '0.25rem 0.75rem',
            background: catppuccin.surface1,
            borderRadius: '20px',
            fontSize: '0.875rem',
            color: catppuccin.text,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {size}{suffix}
            <button
              onClick={() => handleRemove(i)}
              style={{
                background: 'none',
                border: 'none',
                color: catppuccin.red,
                cursor: 'pointer',
                padding: 0,
                fontSize: '1rem'
              }}
            >
              ×
            </button>
          </div>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={placeholder}
          style={{
            padding: '0.25rem 0.75rem',
            background: catppuccin.surface0,
            border: `1px solid ${catppuccin.surface1}`,
            borderRadius: '20px',
            color: catppuccin.text,
            fontSize: '0.875rem',
            width: '100px'
          }}
        />
      </div>
    </div>
  );
};

export const TableSettings: React.FC<TableSettingsProps> = ({ config, onChange, onClose }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'preflop' | 'postflop'>('general');
  const [activePreflopPosition, setActivePreflopPosition] = useState<'all' | Position>('all');
  const [activeVsAggressor, setActiveVsAggressor] = useState<'default' | Position>('default');
  const [activePostflopStreet, setActivePostflopStreet] = useState<'flop' | 'turn' | 'river'>('flop');

  // Get positions based on table size
  const getPositions = (): Position[] => {
    switch (config.tableSize) {
      case '6max': return ['HJ', 'LJ', 'CO', 'BTN', 'SB', 'BB'];
      case '9max': return ['UTG', 'UTG+1', 'HJ', 'LJ', 'CO', 'BTN', 'SB', 'BB'];
      case 'HU': return ['BTN', 'BB'];
      default: return ['HJ', 'LJ', 'CO', 'BTN', 'SB', 'BB'];
    }
  };
  
  // Get positions that can be aggressors for a given position
  const getPossibleAggressors = (position: Position | 'all'): Position[] => {
    if (position === 'all') {
      // For 'all', show all positions (they all can be aggressors in various scenarios)
      return getPositions();
    }
    
    const positions = getPositions();
    
    // Every position needs VS settings for all OTHER positions because:
    // - Early positions face 3-bets from later positions after opening
    // - Late positions face opens from earlier positions
    // - Middle positions face both scenarios
    // - Any position can face re-raises (4-bet, 5-bet) from any other position
    // So we return all positions except the current one
    return positions.filter(p => p !== position);
  };

  // Get effective setting for a position (with inheritance and VS aggressor support)
  const getEffectiveSetting = (
    position: Position | 'all', 
    setting: keyof typeof config.preflop.all,
    vsAggressor?: Position | 'default'
  ) => {
    // For open sizes, limping, and open shove, VS doesn't apply
    if (setting === 'openSizes' || setting === 'allowLimping' || setting === 'allowOpenShove') {
      if (position === 'all') {
        return config.preflop.all[setting];
      }
      const override = config.preflop.overrides?.[position]?.[setting];
      return override !== undefined ? override : config.preflop.all[setting];
    }
    
    // For 3bet/4bet/5bet, check VS aggressor settings
    if (vsAggressor && vsAggressor !== 'default') {
      // Check position-specific VS aggressor override first
      if (position !== 'all') {
        const posVsOverride = config.preflop.overrides?.[position]?.vsAggressor?.[vsAggressor]?.[setting];
        if (posVsOverride !== undefined) return posVsOverride;
      }
      
      // Check general VS aggressor setting
      const generalVsOverride = config.preflop.all.vsAggressor?.[vsAggressor]?.[setting];
      if (generalVsOverride !== undefined) return generalVsOverride;
    }
    
    // Fall back to regular position override or default
    if (position === 'all') {
      return config.preflop.all[setting];
    }
    
    const override = config.preflop.overrides?.[position]?.[setting];
    return override !== undefined ? override : config.preflop.all[setting];
  };

  // Update preflop setting (with VS aggressor support)
  const updatePreflopSetting = (
    position: Position | 'all',
    setting: keyof typeof config.preflop.all,
    value: any,
    vsAggressor?: Position | 'default'
  ) => {
    // Handle VS aggressor settings
    if (vsAggressor && vsAggressor !== 'default' && setting !== 'openSizes' && setting !== 'allowLimping' && setting !== 'allowOpenShove') {
      if (position === 'all') {
        // Update general VS aggressor setting
        onChange({
          ...config,
          preflop: {
            ...config.preflop,
            all: {
              ...config.preflop.all,
              vsAggressor: {
                ...config.preflop.all.vsAggressor,
                [vsAggressor]: {
                  ...config.preflop.all.vsAggressor?.[vsAggressor],
                  [setting]: value
                }
              }
            }
          }
        });
      } else {
        // Update position-specific VS aggressor setting
        onChange({
          ...config,
          preflop: {
            ...config.preflop,
            overrides: {
              ...config.preflop.overrides,
              [position]: {
                ...config.preflop.overrides?.[position],
                vsAggressor: {
                  ...config.preflop.overrides?.[position]?.vsAggressor,
                  [vsAggressor]: {
                    ...config.preflop.overrides?.[position]?.vsAggressor?.[vsAggressor],
                    [setting]: value
                  }
                }
              }
            }
          }
        });
      }
    } else {
      // Regular setting update (no VS aggressor)
      if (position === 'all') {
        onChange({
          ...config,
          preflop: {
            ...config.preflop,
            all: {
              ...config.preflop.all,
              [setting]: value
            }
          }
        });
      } else {
        onChange({
          ...config,
          preflop: {
            ...config.preflop,
            overrides: {
              ...config.preflop.overrides,
              [position]: {
                ...config.preflop.overrides?.[position],
                [setting]: value
              }
            }
          }
        });
      }
    }
  };


  return (
    <>
      {/* Modal Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      />
      
      {/* Modal Content */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '1200px',
        maxHeight: '85vh',
        background: catppuccin.mantle,
        borderRadius: '12px',
        border: `1px solid ${catppuccin.surface1}`,
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
      }}
      onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: `1px solid ${catppuccin.surface1}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: catppuccin.text
          }}>
            Table Settings
          </h2>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {/* Config management buttons */}
            <button
              onClick={() => console.log('Load config')}
              style={{
                padding: '0.5rem 1rem',
                background: catppuccin.surface0,
                color: catppuccin.text,
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = catppuccin.surface1}
              onMouseLeave={(e) => e.currentTarget.style.background = catppuccin.surface0}
            >
              📂 Load
            </button>
            
            <button
              onClick={() => console.log('Save config')}
              style={{
                padding: '0.5rem 1rem',
                background: catppuccin.surface0,
                color: catppuccin.text,
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = catppuccin.surface1}
              onMouseLeave={(e) => e.currentTarget.style.background = catppuccin.surface0}
            >
              💾 Save
            </button>
            
            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem',
                background: 'transparent',
                color: catppuccin.overlay1,
                border: 'none',
                borderRadius: '6px',
                fontSize: '1.25rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = catppuccin.text}
              onMouseLeave={(e) => e.currentTarget.style.color = catppuccin.overlay1}
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* Tab Bar */}
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${catppuccin.surface1}`,
          background: catppuccin.mantle
        }}>
          {(['general', 'preflop', 'postflop'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '1rem 1.5rem',
                background: activeTab === tab ? catppuccin.surface0 : 'transparent',
                color: activeTab === tab ? catppuccin.text : catppuccin.subtext0,
                border: 'none',
                borderBottom: activeTab === tab ? `2px solid ${catppuccin.blue}` : 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: activeTab === tab ? '600' : '400',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content with scroll */}
        <div style={{ 
          padding: '1.5rem',
          flex: 1,
          overflowY: 'auto'
        }}>
        {/* Preflop Tab */}
        {activeTab === 'preflop' && (
          <>
            {/* Position Tabs */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '1.5rem',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => setActivePreflopPosition('all')}
                style={{
                  padding: '0.5rem 1rem',
                  background: activePreflopPosition === 'all' ? catppuccin.blue : catppuccin.surface0,
                  color: activePreflopPosition === 'all' ? catppuccin.base : catppuccin.text,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                All Positions
              </button>
              {getPositions().map(pos => (
                <button
                  key={pos}
                  onClick={() => setActivePreflopPosition(pos)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: activePreflopPosition === pos ? catppuccin.blue : catppuccin.surface0,
                    color: activePreflopPosition === pos ? catppuccin.base : catppuccin.text,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    position: 'relative'
                  }}
                >
                  {pos}
                  {config.preflop.overrides?.[pos] && Object.keys(config.preflop.overrides[pos]).length > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: catppuccin.yellow
                    }} />
                  )}
                </button>
              ))}
            </div>

            {/* Position Settings */}
            <div style={{
              background: catppuccin.surface0,
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              {activePreflopPosition !== 'all' && (
                <div style={{
                  marginBottom: '1rem',
                  padding: '0.75rem',
                  background: catppuccin.surface1,
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: catppuccin.subtext0
                }}>
                  💡 Overriding defaults for {activePreflopPosition}. Leave empty to inherit from "All Positions".
                </div>
              )}

              {/* Open Raise Sizes and Allow Limping (always shown, not VS-specific) */}
              <div style={{
                marginBottom: '1.5rem',
                paddingBottom: '1.5rem',
                borderBottom: `1px solid ${catppuccin.surface1}`
              }}>
                <SizeChips
                  sizes={getEffectiveSetting(activePreflopPosition, 'openSizes') as number[]}
                  onChange={(sizes) => updatePreflopSetting(activePreflopPosition, 'openSizes', sizes)}
                  label="Open Raise Sizes (when first to act)"
                  suffix="bb"
                  placeholder="e.g., 2.5"
                />
                
                {/* Allow Limping */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                  <div
                    onClick={() => updatePreflopSetting(activePreflopPosition, 'allowLimping', !(getEffectiveSetting(activePreflopPosition, 'allowLimping') as boolean))}
                    style={{
                      width: '40px',
                      height: '20px',
                      borderRadius: '10px',
                      background: getEffectiveSetting(activePreflopPosition, 'allowLimping') ? catppuccin.blue : catppuccin.surface2,
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      flexShrink: 0
                    }}
                  >
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: catppuccin.text,
                      position: 'absolute',
                      top: '2px',
                      left: getEffectiveSetting(activePreflopPosition, 'allowLimping') ? '22px' : '2px',
                      transition: 'left 0.2s'
                    }} />
                  </div>
                  <label style={{ fontSize: '0.875rem', color: catppuccin.text }}>
                    Allow Limping
                  </label>
                </div>
                
                {/* Allow Open Shove */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <div
                    onClick={() => updatePreflopSetting(activePreflopPosition, 'allowOpenShove', !(getEffectiveSetting(activePreflopPosition, 'allowOpenShove') as boolean))}
                    style={{
                      width: '40px',
                      height: '20px',
                      borderRadius: '10px',
                      background: getEffectiveSetting(activePreflopPosition, 'allowOpenShove') ? catppuccin.blue : catppuccin.surface2,
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      flexShrink: 0
                    }}
                  >
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: catppuccin.text,
                      position: 'absolute',
                      top: '2px',
                      left: getEffectiveSetting(activePreflopPosition, 'allowOpenShove') ? '22px' : '2px',
                      transition: 'left 0.2s'
                    }} />
                  </div>
                  <label style={{ fontSize: '0.875rem', color: catppuccin.text, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    Allow Open Shove
                    <Tooltip content="Allows going all-in as an opening action without prior betting buildup. Common in short-stack and tournament play.">
                      <InfoIcon />
                    </Tooltip>
                  </label>
                </div>
              </div>

              {/* VS Aggressor Tabs */}
              {getPossibleAggressors(activePreflopPosition).length > 0 && (
                <>
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => setActiveVsAggressor('default')}
                      style={{
                        padding: '0.25rem 0.75rem',
                        background: activeVsAggressor === 'default' ? catppuccin.mauve : catppuccin.surface1,
                        color: activeVsAggressor === 'default' ? catppuccin.base : catppuccin.text,
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}
                    >
                      VS Default
                    </button>
                    {getPossibleAggressors(activePreflopPosition).map(pos => (
                      <button
                        key={pos}
                        onClick={() => setActiveVsAggressor(pos)}
                        style={{
                          padding: '0.25rem 0.75rem',
                          background: activeVsAggressor === pos ? catppuccin.mauve : catppuccin.surface1,
                          color: activeVsAggressor === pos ? catppuccin.base : catppuccin.text,
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          position: 'relative'
                        }}
                      >
                        VS {pos}
                        {/* Show indicator if VS overrides exist */}
                        {((activePreflopPosition === 'all' && config.preflop.all.vsAggressor?.[pos]) ||
                          (activePreflopPosition !== 'all' && config.preflop.overrides?.[activePreflopPosition]?.vsAggressor?.[pos])) && (
                          <span style={{
                            position: 'absolute',
                            top: '-2px',
                            right: '-2px',
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: catppuccin.yellow
                          }} />
                        )}
                      </button>
                    ))}
                  </div>
                  
                  {activeVsAggressor !== 'default' && (
                    <div style={{
                      marginBottom: '0.75rem',
                      padding: '0.5rem',
                      background: catppuccin.mantle,
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      color: catppuccin.subtext0
                    }}>
                      Settings when facing aggression from {activeVsAggressor}
                    </div>
                  )}
                </>
              )}

              {/* 3-Bet Sizes */}
              <SizeChips
                sizes={getEffectiveSetting(activePreflopPosition, 'threeBet', activeVsAggressor) as number[]}
                onChange={(sizes) => updatePreflopSetting(activePreflopPosition, 'threeBet', sizes, activeVsAggressor)}
                label="3-Bet Sizes (Multipliers)"
                suffix="x"
                placeholder="e.g., 3.5"
              />

              {/* 4-Bet Sizes */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.875rem', color: catppuccin.subtext0 }}>
                    4-Bet Sizes (Multipliers)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: catppuccin.text }}>
                    <span style={{ marginRight: '0.5rem', fontSize: '0.75rem', color: catppuccin.subtext0 }}>All-in</span>
                    <div
                      onClick={() => updatePreflopSetting(activePreflopPosition, 'fourBet', {
                        ...(getEffectiveSetting(activePreflopPosition, 'fourBet', activeVsAggressor) as any),
                        useAllIn: !(getEffectiveSetting(activePreflopPosition, 'fourBet', activeVsAggressor) as any).useAllIn
                      }, activeVsAggressor)}
                      style={{
                        width: '40px',
                        height: '20px',
                        borderRadius: '10px',
                        background: (getEffectiveSetting(activePreflopPosition, 'fourBet', activeVsAggressor) as any).useAllIn ? catppuccin.blue : catppuccin.surface2,
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                    >
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: catppuccin.text,
                        position: 'absolute',
                        top: '2px',
                        left: (getEffectiveSetting(activePreflopPosition, 'fourBet', activeVsAggressor) as any).useAllIn ? '22px' : '2px',
                        transition: 'left 0.2s'
                      }} />
                    </div>
                  </label>
                </div>
                {!(getEffectiveSetting(activePreflopPosition, 'fourBet', activeVsAggressor) as any).useAllIn && (
                  <SizeChips
                    sizes={(getEffectiveSetting(activePreflopPosition, 'fourBet', activeVsAggressor) as any).sizes || []}
                    onChange={(sizes) => updatePreflopSetting(activePreflopPosition, 'fourBet', {
                      ...(getEffectiveSetting(activePreflopPosition, 'fourBet', activeVsAggressor) as any),
                      sizes
                    }, activeVsAggressor)}
                    label=""
                    suffix="x"
                    placeholder="e.g., 2.5"
                  />
                )}
              </div>

              {/* 5-Bet Sizes - Only show if 4-bet is not all-in */}
              {!(getEffectiveSetting(activePreflopPosition, 'fourBet', activeVsAggressor) as any).useAllIn && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.875rem', color: catppuccin.subtext0 }}>
                      5-Bet Sizes (Multipliers)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: catppuccin.text }}>
                      <span style={{ marginRight: '0.5rem', fontSize: '0.75rem', color: catppuccin.subtext0 }}>All-in</span>
                      <div
                        onClick={() => updatePreflopSetting(activePreflopPosition, 'fiveBet', {
                          ...(getEffectiveSetting(activePreflopPosition, 'fiveBet', activeVsAggressor) as any),
                          useAllIn: !(getEffectiveSetting(activePreflopPosition, 'fiveBet', activeVsAggressor) as any).useAllIn
                        }, activeVsAggressor)}
                        style={{
                          width: '40px',
                          height: '20px',
                          borderRadius: '10px',
                          background: (getEffectiveSetting(activePreflopPosition, 'fiveBet', activeVsAggressor) as any).useAllIn ? catppuccin.blue : catppuccin.surface2,
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                      >
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: catppuccin.text,
                          position: 'absolute',
                          top: '2px',
                          left: (getEffectiveSetting(activePreflopPosition, 'fiveBet', activeVsAggressor) as any).useAllIn ? '22px' : '2px',
                          transition: 'left 0.2s'
                        }} />
                      </div>
                    </label>
                  </div>
                  {!(getEffectiveSetting(activePreflopPosition, 'fiveBet', activeVsAggressor) as any).useAllIn && (
                    <SizeChips
                      sizes={(getEffectiveSetting(activePreflopPosition, 'fiveBet', activeVsAggressor) as any).sizes || []}
                      onChange={(sizes) => updatePreflopSetting(activePreflopPosition, 'fiveBet', {
                        ...(getEffectiveSetting(activePreflopPosition, 'fiveBet', activeVsAggressor) as any),
                        sizes
                      }, activeVsAggressor)}
                      label=""
                      suffix="x"
                      placeholder="e.g., 2.2"
                    />
                  )}
                </div>
              )}

              {/* Clear Override Button */}
              {activePreflopPosition !== 'all' && config.preflop.overrides?.[activePreflopPosition] && (
                <button
                  onClick={() => {
                    const overrides = { ...config.preflop.overrides };
                    delete overrides[activePreflopPosition];
                    onChange({
                      ...config,
                      preflop: {
                        ...config.preflop,
                        overrides
                      }
                    });
                  }}
                  style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    background: catppuccin.red,
                    color: catppuccin.base,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Clear All {activePreflopPosition} Overrides
                </button>
              )}
            </div>
          </>
        )}

        {/* Postflop Tab */}
        {activeTab === 'postflop' && (
          <>
            {/* Street Tabs */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '1.5rem'
            }}>
              {(['flop', 'turn', 'river'] as const).map(street => (
                <button
                  key={street}
                  onClick={() => setActivePostflopStreet(street)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: activePostflopStreet === street ? catppuccin.blue : catppuccin.surface0,
                    color: activePostflopStreet === street ? catppuccin.base : catppuccin.text,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}
                >
                  {street}
                </button>
              ))}
            </div>

            {/* Street Settings */}
            <div style={{
              background: catppuccin.surface0,
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              {/* OOP Settings */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: catppuccin.blue, marginBottom: '1rem' }}>
                  Out of Position (OOP)
                </h4>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.875rem', color: catppuccin.subtext0, display: 'flex', alignItems: 'center' }}>
                    OOP Bet Sizes (% of Pot)
                    <Tooltip content="Bet sizes when out of position as percentage of pot">
                      <InfoIcon />
                    </Tooltip>
                  </label>
                  <SizeChips
                    sizes={config.postflop[activePostflopStreet].oopBetSizes || []}
                    onChange={(sizes) => onChange({
                      ...config,
                      postflop: {
                        ...config.postflop,
                        [activePostflopStreet]: {
                          ...config.postflop[activePostflopStreet],
                          oopBetSizes: sizes
                        }
                      }
                    })}
                    label=""
                    suffix="%"
                    placeholder="e.g., 33"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.875rem', color: catppuccin.subtext0, display: 'flex', alignItems: 'center' }}>
                    OOP Raise Sizes (Multipliers)
                    <Tooltip content="Raise sizes when out of position as multipliers of the previous bet">
                      <InfoIcon />
                    </Tooltip>
                  </label>
                  <SizeChips
                    sizes={config.postflop[activePostflopStreet].oopRaiseSizes || []}
                    onChange={(sizes) => onChange({
                      ...config,
                      postflop: {
                        ...config.postflop,
                        [activePostflopStreet]: {
                          ...config.postflop[activePostflopStreet],
                          oopRaiseSizes: sizes
                        }
                      }
                    })}
                    label=""
                    suffix="x"
                    placeholder="e.g., 2.5"
                  />
                </div>
                
                {/* Donk Betting - OOP only */}
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: catppuccin.text, marginBottom: '0.5rem' }}>
                    <div
                      onClick={() => onChange({
                        ...config,
                        postflop: {
                          ...config.postflop,
                          [activePostflopStreet]: {
                            ...config.postflop[activePostflopStreet],
                            enableDonk: !config.postflop[activePostflopStreet].enableDonk
                          }
                        }
                      })}
                      style={{
                        width: '40px',
                        height: '20px',
                        borderRadius: '10px',
                        background: config.postflop[activePostflopStreet].enableDonk ? catppuccin.blue : catppuccin.surface2,
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        flexShrink: 0
                      }}
                    >
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: catppuccin.text,
                        position: 'absolute',
                        top: '2px',
                        left: config.postflop[activePostflopStreet].enableDonk ? '22px' : '2px',
                        transition: 'left 0.2s'
                      }} />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      Enable Donk Betting
                      <Tooltip content="Allow OOP player to lead into previous street's aggressor">
                        <InfoIcon />
                      </Tooltip>
                    </label>
                  </div>
                  
                  {config.postflop[activePostflopStreet].enableDonk && (
                    <SizeChips
                      sizes={config.postflop[activePostflopStreet].donkSizes || []}
                      onChange={(sizes) => onChange({
                        ...config,
                        postflop: {
                          ...config.postflop,
                          [activePostflopStreet]: {
                            ...config.postflop[activePostflopStreet],
                            donkSizes: sizes
                          }
                        }
                      })}
                      label="Donk Bet Sizes (% of Pot)"
                      suffix="%"
                      placeholder="e.g., 25"
                    />
                  )}
                </div>
              </div>

              {/* IP Settings */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: catppuccin.green, marginBottom: '1rem' }}>
                  In Position (IP)
                </h4>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.875rem', color: catppuccin.subtext0, display: 'flex', alignItems: 'center' }}>
                    IP Bet Sizes (% of Pot)
                    <Tooltip content="Bet sizes when in position as percentage of pot">
                      <InfoIcon />
                    </Tooltip>
                  </label>
                  <SizeChips
                    sizes={config.postflop[activePostflopStreet].ipBetSizes || []}
                    onChange={(sizes) => onChange({
                      ...config,
                      postflop: {
                        ...config.postflop,
                        [activePostflopStreet]: {
                          ...config.postflop[activePostflopStreet],
                          ipBetSizes: sizes
                        }
                      }
                    })}
                    label=""
                    suffix="%"
                    placeholder="e.g., 50"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.875rem', color: catppuccin.subtext0, display: 'flex', alignItems: 'center' }}>
                    IP Raise Sizes (Multipliers)
                    <Tooltip content="Raise sizes when in position as multipliers of the previous bet">
                      <InfoIcon />
                    </Tooltip>
                  </label>
                  <SizeChips
                    sizes={config.postflop[activePostflopStreet].ipRaiseSizes || []}
                    onChange={(sizes) => onChange({
                      ...config,
                      postflop: {
                        ...config.postflop,
                        [activePostflopStreet]: {
                          ...config.postflop[activePostflopStreet],
                          ipRaiseSizes: sizes
                        }
                      }
                    })}
                    label=""
                    suffix="x"
                    placeholder="e.g., 2.5"
                  />
                </div>
              </div>

            </div>
          </>
        )}

        {/* General Tab */}
        {activeTab === 'general' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            {/* Game Settings Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem'
            }}>
              {/* Game Configuration */}
              <div style={{
                background: catppuccin.surface0,
                borderRadius: '12px',
                padding: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: catppuccin.text,
                  marginBottom: '1rem'
                }}>
                  Game Settings
                </h3>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.875rem', color: catppuccin.subtext0, display: 'block', marginBottom: '0.25rem' }}>
                  Game Type
                </label>
                <select
                  value={config.gameType}
                  onChange={(e) => onChange({ ...config, gameType: e.target.value as GameType })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: catppuccin.surface1,
                    border: `1px solid ${catppuccin.surface2}`,
                    borderRadius: '8px',
                    color: catppuccin.text,
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="Cash">Cash Game</option>
                  <option value="MTT">Tournament (MTT)</option>
                  <option value="SnG">Sit & Go</option>
                  <option value="Spin & Go">Spin & Go</option>
                  <option value="HU">Heads-Up</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.875rem', color: catppuccin.subtext0, display: 'block', marginBottom: '0.25rem' }}>
                  Table Size
                </label>
                <select
                  value={config.tableSize}
                  onChange={(e) => onChange({ ...config, tableSize: e.target.value as '6max' | '9max' | 'HU' })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: catppuccin.surface1,
                    border: `1px solid ${catppuccin.surface2}`,
                    borderRadius: '8px',
                    color: catppuccin.text,
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="6max">6-Max</option>
                  <option value="9max">9-Max</option>
                  <option value="HU">Heads-Up</option>
                </select>
              </div>


              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.875rem', color: catppuccin.subtext0, display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
                  Effective Stack (BBs)
                  <Tooltip content="Stack size for each player at the start of the hand">
                    <InfoIcon />
                  </Tooltip>
                </label>
                <input
                  type="number"
                  value={config.stackSize}
                  onChange={(e) => onChange({ ...config, stackSize: parseFloat(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: catppuccin.surface1,
                    border: `1px solid ${catppuccin.surface2}`,
                    borderRadius: '8px',
                    color: catppuccin.text,
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.875rem', color: catppuccin.subtext0, display: 'block', marginBottom: '0.25rem' }}>
                  Antes (BBs)
                </label>
                <input
                  type="number"
                  value={config.antes || 0}
                  onChange={(e) => onChange({ ...config, antes: parseFloat(e.target.value) || undefined })}
                  step="0.1"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: catppuccin.surface1,
                    border: `1px solid ${catppuccin.surface2}`,
                    borderRadius: '8px',
                    color: catppuccin.text,
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: catppuccin.text }}>
                <div
                  onClick={() => onChange({ ...config, straddle: !config.straddle })}
                  style={{
                    width: '40px',
                    height: '20px',
                    borderRadius: '10px',
                    background: config.straddle ? catppuccin.blue : catppuccin.surface2,
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    flexShrink: 0
                  }}
                >
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: catppuccin.text,
                    position: 'absolute',
                    top: '2px',
                    left: config.straddle ? '22px' : '2px',
                    transition: 'left 0.2s'
                  }} />
                </div>
                <label>Enable Straddle</label>
              </div>
            </div>

              {/* Rake Settings */}
              <div style={{
                background: catppuccin.surface0,
                borderRadius: '12px',
                padding: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: catppuccin.text,
                  marginBottom: '1rem'
                }}>
                  Rake Settings
                </h3>

                {/* Rake Presets */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.875rem', color: catppuccin.subtext0, display: 'block', marginBottom: '0.5rem' }}>
                    Quick Presets:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {(['NL2', 'NL5', 'NL10', 'NL25', 'NL50', 'NL100', 'NL500'] as const).map(stake => {
                      const presets = {
                        'NL2': { percentage: 5, cap: 0.5 },
                        'NL5': { percentage: 5, cap: 0.5 },
                        'NL10': { percentage: 5, cap: 2 },
                        'NL25': { percentage: 5, cap: 3 },
                        'NL50': { percentage: 5, cap: 4 },
                        'NL100': { percentage: 5, cap: 3 },
                        'NL500': { percentage: 5, cap: 0.6 }
                      };
                      return (
                        <button
                          key={stake}
                          onClick={() => onChange({
                            ...config,
                            rake: {
                              ...config.rake,
                              percentage: presets[stake].percentage,
                              cap: presets[stake].cap
                            }
                          })}
                          style={{
                            padding: '0.25rem 0.75rem',
                            background: catppuccin.surface1,
                            color: catppuccin.text,
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = catppuccin.surface2}
                          onMouseLeave={(e) => e.currentTarget.style.background = catppuccin.surface1}
                        >
                          {stake}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.875rem', color: catppuccin.subtext0, display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
                    Rake Percentage
                    <Tooltip content="Percentage of pot taken as rake by the house">
                      <InfoIcon />
                    </Tooltip>
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="number"
                      value={config.rake.percentage}
                      onChange={(e) => onChange({
                        ...config,
                        rake: { ...config.rake, percentage: parseFloat(e.target.value) }
                      })}
                      step="0.1"
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: catppuccin.surface1,
                        border: `1px solid ${catppuccin.surface2}`,
                        borderRadius: '8px',
                        color: catppuccin.text,
                        fontSize: '0.875rem'
                      }}
                    />
                    <span style={{
                      padding: '0.5rem 0.75rem',
                      background: catppuccin.surface1,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      color: catppuccin.subtext0
                    }}>%</span>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.875rem', color: catppuccin.subtext0, display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
                    Rake Cap (BBs)
                    <Tooltip content="Maximum rake amount in big blinds">
                      <InfoIcon />
                    </Tooltip>
                  </label>
                  <input
                    type="number"
                    value={config.rake.cap}
                    onChange={(e) => onChange({
                      ...config,
                      rake: { ...config.rake, cap: parseFloat(e.target.value) }
                    })}
                    step="0.5"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: catppuccin.surface1,
                      border: `1px solid ${catppuccin.surface2}`,
                      borderRadius: '8px',
                      color: catppuccin.text,
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: catppuccin.text, marginBottom: '0.5rem' }}>
                  <div
                    onClick={() => onChange({
                      ...config,
                      rake: { ...config.rake, noFlopNoDrop: !config.rake.noFlopNoDrop }
                    })}
                    style={{
                      width: '40px',
                      height: '20px',
                      borderRadius: '10px',
                      background: config.rake.noFlopNoDrop ? catppuccin.blue : catppuccin.surface2,
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      flexShrink: 0
                    }}
                  >
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: catppuccin.text,
                      position: 'absolute',
                      top: '2px',
                      left: config.rake.noFlopNoDrop ? '22px' : '2px',
                      transition: 'left 0.2s'
                    }} />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    No Flop, No Drop
                    <Tooltip content="No rake is taken if the hand ends preflop (standard online policy)">
                      <InfoIcon />
                    </Tooltip>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: catppuccin.text }}>
                  <div
                    onClick={() => onChange({
                      ...config,
                      rake: { ...config.rake, preflopRake: !config.rake.preflopRake }
                    })}
                    style={{
                      width: '40px',
                      height: '20px',
                      borderRadius: '10px',
                      background: config.rake.preflopRake ? catppuccin.blue : catppuccin.surface2,
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      flexShrink: 0
                    }}
                  >
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: catppuccin.text,
                      position: 'absolute',
                      top: '2px',
                      left: config.rake.preflopRake ? '22px' : '2px',
                      transition: 'left 0.2s'
                    }} />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    Rake Preflop
                    <Tooltip content="Whether to take rake on pots that end preflop (some sites do this)">
                      <InfoIcon />
                    </Tooltip>
                  </label>
                </div>
              </div>
            </div>

            {/* Solver Thresholds */}
            <div style={{
              background: catppuccin.surface0,
              borderRadius: '12px',
              padding: '1.5rem',
              gridColumn: 'span 2'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: catppuccin.text,
                marginBottom: '1rem'
              }}>
                Solver Thresholds
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.875rem', color: catppuccin.subtext0, display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
                    Add All-in Threshold (%)
                    <Tooltip content="Include all-in as betting option when it exceeds this % of pot (default 150%)">
                      <InfoIcon />
                    </Tooltip>
                  </label>
                  <input
                    type="number"
                    value={config.addAllInThreshold || 150}
                    onChange={(e) => onChange({ ...config, addAllInThreshold: parseFloat(e.target.value) })}
                    step="10"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: catppuccin.surface1,
                      border: `1px solid ${catppuccin.surface2}`,
                      borderRadius: '8px',
                      color: catppuccin.text,
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.875rem', color: catppuccin.subtext0, display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
                    Force All-in Threshold (%)
                    <Tooltip content="Convert bets to all-in when committing >X% of stack (default 20%)">
                      <InfoIcon />
                    </Tooltip>
                  </label>
                  <input
                    type="number"
                    value={config.forceAllInThreshold || 20}
                    onChange={(e) => onChange({ ...config, forceAllInThreshold: parseFloat(e.target.value) })}
                    step="5"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: catppuccin.surface1,
                      border: `1px solid ${catppuccin.surface2}`,
                      borderRadius: '8px',
                      color: catppuccin.text,
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.875rem', color: catppuccin.subtext0, display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
                    Merging Threshold (%)
                    <Tooltip content="Combine similar bet sizes within X% to simplify tree (default 10%)">
                      <InfoIcon />
                    </Tooltip>
                  </label>
                  <input
                    type="number"
                    value={config.mergingThreshold || 10}
                    onChange={(e) => onChange({ ...config, mergingThreshold: parseFloat(e.target.value) })}
                    step="1"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: catppuccin.surface1,
                      border: `1px solid ${catppuccin.surface2}`,
                      borderRadius: '8px',
                      color: catppuccin.text,
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ICM Settings (if tournament) */}
            {(config.gameType === 'MTT' || config.gameType === 'SnG') && (
              <div style={{
                background: catppuccin.surface0,
                borderRadius: '12px',
                padding: '1.5rem',
                gridColumn: 'span 2'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: catppuccin.text,
                  marginBottom: '1rem'
                }}>
                  ICM Settings
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: catppuccin.text, marginBottom: '1rem' }}>
                  <div
                    onClick={() => onChange({
                      ...config,
                      icm: { ...config.icm, enabled: !config.icm?.enabled }
                    })}
                    style={{
                      width: '40px',
                      height: '20px',
                      borderRadius: '10px',
                      background: config.icm?.enabled ? catppuccin.blue : catppuccin.surface2,
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      flexShrink: 0
                    }}
                  >
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: catppuccin.text,
                      position: 'absolute',
                      top: '2px',
                      left: config.icm?.enabled ? '22px' : '2px',
                      transition: 'left 0.2s'
                    }} />
                  </div>
                  <label>Enable ICM Calculations</label>
                </div>

                {config.icm?.enabled && (
                  <div>
                    <label style={{ fontSize: '0.875rem', color: catppuccin.subtext0, display: 'block', marginBottom: '0.25rem' }}>
                      Payout Structure (%)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 50,30,20"
                      value={config.icm?.payouts?.join(',') || ''}
                      onChange={(e) => {
                        const payouts = e.target.value.split(',').map(p => parseFloat(p.trim())).filter(p => !isNaN(p));
                        onChange({
                          ...config,
                          icm: { ...config.icm, enabled: true, payouts }
                        });
                      }}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        background: catppuccin.surface1,
                        border: `1px solid ${catppuccin.surface2}`,
                        borderRadius: '8px',
                        color: catppuccin.text,
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </>
  );
};