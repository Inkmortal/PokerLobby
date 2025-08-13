import React, { useState } from 'react';
import { TableConfig, GameType } from './RangeBuilder';

interface TableSettingsProps {
  config: TableConfig;
  onChange: (config: TableConfig) => void;
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
  mauve: '#cba6f7'
};

// Preset bet size configurations
const BET_SIZE_PRESETS = {
  small: { flop: [25, 33, 50], turn: [33, 50, 75], river: [33, 50, 75] },
  medium: { flop: [33, 50, 75], turn: [50, 75], river: [50, 75] },
  large: { flop: [50, 75], turn: [75], river: [75] },
  geometric: { flop: [30, 70], turn: [70], river: [70] },
  exploitative: { flop: [25, 50, 75], turn: [50, 75], river: [50, 75, 150] }
};

export const TableSettings: React.FC<TableSettingsProps> = ({ config, onChange, onClose }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'preflop' | 'postflop' | 'rake'>('basic');
  const [customBetInput, setCustomBetInput] = useState<{ [key: string]: string }>({
    flop: '',
    turn: '',
    river: ''
  });

  const handleGameTypeChange = (gameType: GameType) => {
    onChange({ ...config, gameType });
  };

  const handleTableSizeChange = (tableSize: '6max' | '9max' | 'HU') => {
    onChange({ ...config, tableSize });
  };

  const handleStackSizeChange = (stackSize: string) => {
    onChange({ ...config, stackSize: parseFloat(stackSize) || 100 });
  };

  const handlePreflopChange = (key: keyof typeof config.preflop, value: any) => {
    onChange({
      ...config,
      preflop: { ...config.preflop, [key]: value }
    });
  };

  const addBetSize = (street: 'flop' | 'turn' | 'river', size: number) => {
    const newBetSizes = { ...config.betSizes };
    if (!newBetSizes[street].includes(size)) {
      newBetSizes[street] = [...newBetSizes[street], size].sort((a, b) => a - b);
      onChange({ ...config, betSizes: newBetSizes });
    }
  };

  const removeBetSize = (street: 'flop' | 'turn' | 'river', size: number) => {
    const newBetSizes = { ...config.betSizes };
    newBetSizes[street] = newBetSizes[street].filter(s => s !== size);
    onChange({ ...config, betSizes: newBetSizes });
  };

  const applyPreset = (preset: keyof typeof BET_SIZE_PRESETS) => {
    onChange({ ...config, betSizes: BET_SIZE_PRESETS[preset] });
  };

  const formatBetSize = (size: number): string => {
    if (size >= 100) return 'All-in';
    return `${size}%`;
  };

  return (
    <div style={{
      background: catppuccin.surface0,
      borderBottom: `1px solid ${catppuccin.surface1}`,
      padding: '0',
      animation: 'slideDown 0.2s ease-out',
      position: 'relative'
    }}>
      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${catppuccin.surface1}`,
        padding: '0 1.5rem'
      }}>
        {(['basic', 'preflop', 'postflop', 'rake'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '1rem 1.5rem',
              background: 'transparent',
              color: activeTab === tab ? catppuccin.text : catppuccin.subtext0,
              border: 'none',
              borderBottom: activeTab === tab ? `2px solid ${catppuccin.blue}` : 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: activeTab === tab ? '600' : '400',
              textTransform: 'capitalize',
              transition: 'all 0.2s'
            }}
          >
            {tab === 'basic' ? 'Game Setup' : tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Basic Tab */}
        {activeTab === 'basic' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            {/* Game Type */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: catppuccin.subtext0,
                marginBottom: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Game Type
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem'
              }}>
                {(['Cash', 'MTT', 'Spin & Go'] as GameType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => handleGameTypeChange(type)}
                    style={{
                      padding: '0.75rem',
                      background: config.gameType === type ? catppuccin.blue : catppuccin.surface1,
                      color: config.gameType === type ? catppuccin.base : catppuccin.text,
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: config.gameType === type ? '600' : '400',
                      transition: 'all 0.2s'
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Size */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: catppuccin.subtext0,
                marginBottom: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Table Size
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem'
              }}>
                {(['6max', '9max', 'HU'] as const).map(size => (
                  <button
                    key={size}
                    onClick={() => handleTableSizeChange(size)}
                    style={{
                      padding: '0.75rem',
                      background: config.tableSize === size ? catppuccin.green : catppuccin.surface1,
                      color: config.tableSize === size ? catppuccin.base : catppuccin.text,
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: config.tableSize === size ? '600' : '400'
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Stack Size */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: catppuccin.subtext0,
                marginBottom: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Effective Stack
              </label>
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                {[20, 50, 100, 200, 500].map(size => (
                  <button
                    key={size}
                    onClick={() => handleStackSizeChange(size.toString())}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: config.stackSize === size ? catppuccin.yellow : catppuccin.surface1,
                      color: config.stackSize === size ? catppuccin.base : catppuccin.text,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: config.stackSize === size ? '600' : '400'
                    }}
                  >
                    {size}BB
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={config.stackSize}
                onChange={(e) => handleStackSizeChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: catppuccin.mantle,
                  color: catppuccin.text,
                  border: `1px solid ${catppuccin.surface2}`,
                  borderRadius: '8px',
                  fontSize: '0.875rem'
                }}
                placeholder="Custom stack size..."
              />
            </div>
          </div>
        )}

        {/* Preflop Tab */}
        {activeTab === 'preflop' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            {/* Open Raise Size */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: catppuccin.subtext0,
                marginBottom: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Open Raise Size
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                {[2, 2.2, 2.5, 3].map(size => (
                  <button
                    key={size}
                    onClick={() => handlePreflopChange('openSize', size)}
                    style={{
                      padding: '0.5rem',
                      background: config.preflop.openSize === size ? catppuccin.blue : catppuccin.surface1,
                      color: config.preflop.openSize === size ? catppuccin.base : catppuccin.text,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    {size}x
                  </button>
                ))}
              </div>
            </div>

            {/* 3-Bet Size */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: catppuccin.subtext0,
                marginBottom: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                3-Bet Multiplier
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.5rem'
              }}>
                {[3, 3.5, 4, 4.5].map(size => (
                  <button
                    key={size}
                    onClick={() => handlePreflopChange('threebet', size)}
                    style={{
                      padding: '0.5rem',
                      background: config.preflop.threebet === size ? catppuccin.red : catppuccin.surface1,
                      color: config.preflop.threebet === size ? catppuccin.base : catppuccin.text,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    {size}x
                  </button>
                ))}
              </div>
            </div>

            {/* 4-Bet Size */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: catppuccin.subtext0,
                marginBottom: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                4-Bet Multiplier
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.5rem'
              }}>
                {[2.2, 2.5, 2.8, 3].map(size => (
                  <button
                    key={size}
                    onClick={() => handlePreflopChange('fourbet', size)}
                    style={{
                      padding: '0.5rem',
                      background: config.preflop.fourbet === size ? catppuccin.mauve : catppuccin.surface1,
                      color: config.preflop.fourbet === size ? catppuccin.base : catppuccin.text,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    {size}x
                  </button>
                ))}
              </div>
            </div>

            {/* All-in Threshold */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: catppuccin.subtext0,
                marginBottom: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                5-Bet/Jam Threshold (BBs)
              </label>
              <input
                type="number"
                value={config.preflop.fivebet}
                onChange={(e) => handlePreflopChange('fivebet', parseFloat(e.target.value) || 100)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: catppuccin.mantle,
                  color: catppuccin.text,
                  border: `1px solid ${catppuccin.surface2}`,
                  borderRadius: '8px',
                  fontSize: '0.875rem'
                }}
                placeholder="Stack size to jam (default: 100BB)"
              />
            </div>

            {/* Options */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: catppuccin.subtext0,
                marginBottom: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Preflop Options
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={config.preflop.limping}
                    onChange={(e) => handlePreflopChange('limping', e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ color: catppuccin.text, fontSize: '0.875rem' }}>
                    Allow Limping
                  </span>
                </label>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={config.preflop.rakePreflop}
                    onChange={(e) => handlePreflopChange('rakePreflop', e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ color: catppuccin.text, fontSize: '0.875rem' }}>
                    Rake Taken Preflop
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Postflop Tab */}
        {activeTab === 'postflop' && (
          <div>
            {/* Presets */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: catppuccin.subtext0,
                marginBottom: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Bet Size Presets
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '0.5rem'
              }}>
                {Object.keys(BET_SIZE_PRESETS).map(preset => (
                  <button
                    key={preset}
                    onClick={() => applyPreset(preset as keyof typeof BET_SIZE_PRESETS)}
                    style={{
                      padding: '0.75rem',
                      background: catppuccin.surface1,
                      color: catppuccin.text,
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      textTransform: 'capitalize',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = catppuccin.surface2}
                    onMouseLeave={e => e.currentTarget.style.background = catppuccin.surface1}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Bet Sizes by Street */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '2rem'
            }}>
              {(['flop', 'turn', 'river'] as const).map(street => (
                <div key={street}>
                  <h4 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: catppuccin.text,
                    marginBottom: '1rem',
                    textTransform: 'capitalize'
                  }}>
                    {street}
                  </h4>
                  
                  {/* Current Sizes */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    minHeight: '40px'
                  }}>
                    {config.betSizes[street].map(size => (
                      <div
                        key={size}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          background: size >= 100 ? catppuccin.yellow : catppuccin.blue,
                          color: catppuccin.base,
                          borderRadius: '20px',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}
                      >
                        {formatBetSize(size)}
                        <button
                          onClick={() => removeBetSize(street, size)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: catppuccin.base,
                            cursor: 'pointer',
                            fontSize: '1rem',
                            lineHeight: 1,
                            padding: 0
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Quick Add Buttons */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.25rem',
                    marginBottom: '0.5rem'
                  }}>
                    {[25, 33, 50, 75, 100, 150].map(size => (
                      <button
                        key={size}
                        onClick={() => addBetSize(street, size)}
                        disabled={config.betSizes[street].includes(size)}
                        style={{
                          padding: '0.5rem',
                          background: config.betSizes[street].includes(size) 
                            ? catppuccin.surface2 
                            : catppuccin.surface1,
                          color: config.betSizes[street].includes(size)
                            ? catppuccin.overlay1
                            : catppuccin.text,
                          border: 'none',
                          borderRadius: '6px',
                          cursor: config.betSizes[street].includes(size) ? 'not-allowed' : 'pointer',
                          fontSize: '0.75rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        {formatBetSize(size)}
                      </button>
                    ))}
                  </div>

                  {/* Custom Input */}
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem'
                  }}>
                    <input
                      type="number"
                      placeholder="Custom %"
                      value={customBetInput[street] || ''}
                      onChange={(e) => setCustomBetInput({
                        ...customBetInput,
                        [street]: e.target.value
                      })}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: catppuccin.mantle,
                        color: catppuccin.text,
                        border: `1px solid ${catppuccin.surface2}`,
                        borderRadius: '6px',
                        fontSize: '0.75rem'
                      }}
                    />
                    <button
                      onClick={() => {
                        const size = parseFloat(customBetInput[street]);
                        if (size > 0) {
                          addBetSize(street, size);
                          setCustomBetInput({ ...customBetInput, [street]: '' });
                        }
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        background: catppuccin.green,
                        color: catppuccin.base,
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rake Tab */}
        {activeTab === 'rake' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            {/* Rake Percentage */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: catppuccin.subtext0,
                marginBottom: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Rake Percentage
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                {[0, 3, 5, 7.5, 10].map(percent => (
                  <button
                    key={percent}
                    onClick={() => onChange({
                      ...config,
                      rake: { ...config.rake, percentage: percent }
                    })}
                    style={{
                      padding: '0.5rem',
                      background: config.rake.percentage === percent ? catppuccin.red : catppuccin.surface1,
                      color: config.rake.percentage === percent ? catppuccin.base : catppuccin.text,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    {percent}%
                  </button>
                ))}
              </div>
            </div>

            {/* Rake Cap */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: catppuccin.subtext0,
                marginBottom: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Rake Cap (BBs)
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                {[0, 1, 3, 5, 10].map(cap => (
                  <button
                    key={cap}
                    onClick={() => onChange({
                      ...config,
                      rake: { ...config.rake, cap }
                    })}
                    style={{
                      padding: '0.5rem',
                      background: config.rake.cap === cap ? catppuccin.red : catppuccin.surface1,
                      color: config.rake.cap === cap ? catppuccin.base : catppuccin.text,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    {cap}BB
                  </button>
                ))}
              </div>
            </div>

            {/* Rake Options */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: catppuccin.subtext0,
                marginBottom: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Rake Options
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={config.rake.noFlopNoDrop}
                  onChange={(e) => onChange({
                    ...config,
                    rake: { ...config.rake, noFlopNoDrop: e.target.checked }
                  })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ color: catppuccin.text, fontSize: '0.875rem' }}>
                  No Flop No Drop (no rake if hand ends preflop)
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: catppuccin.surface1,
          border: 'none',
          color: catppuccin.text,
          fontSize: '1.25rem',
          cursor: 'pointer',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.background = catppuccin.surface2}
        onMouseLeave={e => e.currentTarget.style.background = catppuccin.surface1}
      >
        ×
      </button>
    </div>
  );
};