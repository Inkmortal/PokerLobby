import React from 'react';
import { Action, RangeData } from './RangeBuilder';
import { buildLinearRange, buildPolarizedRange, buildMergedRange } from './utils/rangeConstructor';

interface PaintToolbarProps {
  mode: 'select' | 'paint';
  onModeChange: (mode: 'select' | 'paint') => void;
  paintAction: Action;
  onActionChange: (action: Action) => void;
  paintFrequency: number;
  onFrequencyChange: (frequency: number) => void;
  rangeData: RangeData;
  onRangeUpdate: (data: RangeData) => void;
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

export const PaintToolbar: React.FC<PaintToolbarProps> = ({
  mode,
  onModeChange,
  paintAction,
  onActionChange,
  paintFrequency,
  onFrequencyChange,
  rangeData,
  onRangeUpdate
}) => {
  const handleQuickBuild = (type: 'linear' | 'polarized' | 'merged', percentage: number) => {
    let newRange: RangeData = {};
    
    switch (type) {
      case 'linear':
        newRange = buildLinearRange(percentage, paintAction);
        break;
      case 'polarized':
        newRange = buildPolarizedRange(percentage, paintAction);
        break;
      case 'merged':
        newRange = buildMergedRange(percentage, paintAction);
        break;
    }
    
    onRangeUpdate(newRange);
  };

  const getActionColor = (action: Action) => {
    switch (action) {
      case 'raise': return catppuccin.red;
      case 'call': return catppuccin.green;
      case 'fold': return catppuccin.overlay1;
      default: return catppuccin.text;
    }
  };

  return (
    <div style={{
      background: catppuccin.surface0,
      borderRadius: '12px',
      padding: '1rem'
    }}>
      {/* Mode Selection */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{
          fontSize: '0.875rem',
          fontWeight: '600',
          color: catppuccin.subtext0,
          marginBottom: '0.75rem',
          textTransform: 'uppercase'
        }}>
          Tool Mode
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem'
        }}>
          <button
            onClick={() => onModeChange('select')}
            style={{
              padding: '0.75rem',
              background: mode === 'select' ? catppuccin.blue : catppuccin.surface1,
              color: mode === 'select' ? catppuccin.base : catppuccin.text,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: mode === 'select' ? '600' : '400',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <span>👆</span>
            Select
          </button>
          <button
            onClick={() => onModeChange('paint')}
            style={{
              padding: '0.75rem',
              background: mode === 'paint' ? catppuccin.blue : catppuccin.surface1,
              color: mode === 'paint' ? catppuccin.base : catppuccin.text,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: mode === 'paint' ? '600' : '400',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <span>🎨</span>
            Paint
          </button>
        </div>
      </div>

      {/* Paint Settings */}
      {mode === 'paint' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: catppuccin.subtext0,
            marginBottom: '0.75rem',
            textTransform: 'uppercase'
          }}>
            Paint Action
          </h3>
          
          {/* Action selection */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            {(['raise', 'call', 'fold'] as Action[]).map(action => (
              <button
                key={action}
                onClick={() => onActionChange(action)}
                style={{
                  padding: '0.5rem',
                  background: paintAction === action ? getActionColor(action) : catppuccin.surface1,
                  color: paintAction === action ? catppuccin.base : catppuccin.text,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: paintAction === action ? '600' : '400',
                  textTransform: 'capitalize'
                }}
              >
                {action}
              </button>
            ))}
          </div>

          {/* Frequency slider */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <label style={{
                fontSize: '0.75rem',
                color: catppuccin.text
              }}>
                Frequency
              </label>
              <span style={{
                fontSize: '0.75rem',
                color: getActionColor(paintAction),
                fontWeight: '600'
              }}>
                {paintFrequency}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={paintFrequency}
              onChange={(e) => onFrequencyChange(parseInt(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                background: `linear-gradient(to right, ${getActionColor(paintAction)} 0%, ${getActionColor(paintAction)} ${paintFrequency}%, ${catppuccin.surface2} ${paintFrequency}%, ${catppuccin.surface2} 100%)`,
                borderRadius: '3px',
                outline: 'none',
                WebkitAppearance: 'none',
                cursor: 'pointer'
              }}
            />
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '0.25rem',
              marginTop: '0.5rem'
            }}>
              {[0, 25, 50, 75, 100].map(freq => (
                <button
                  key={freq}
                  onClick={() => onFrequencyChange(freq)}
                  style={{
                    padding: '0.25rem',
                    background: paintFrequency === freq ? catppuccin.surface2 : catppuccin.surface1,
                    color: paintFrequency === freq ? catppuccin.text : catppuccin.subtext0,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.625rem'
                  }}
                >
                  {freq}%
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Builders */}
      <div>
        <h3 style={{
          fontSize: '0.875rem',
          fontWeight: '600',
          color: catppuccin.subtext0,
          marginBottom: '0.75rem',
          textTransform: 'uppercase'
        }}>
          Quick Build
        </h3>
        
        {/* Range Type */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <button
            onClick={() => handleQuickBuild('linear', 20)}
            style={{
              padding: '0.75rem',
              background: `linear-gradient(135deg, ${catppuccin.blue}20, ${catppuccin.blue}10)`,
              color: catppuccin.blue,
              border: `1px solid ${catppuccin.blue}40`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              textAlign: 'left'
            }}
          >
            <div style={{ marginBottom: '0.25rem' }}>Linear Top 20%</div>
            <div style={{ fontSize: '0.625rem', opacity: 0.8 }}>
              Strongest hands in order
            </div>
          </button>
          
          <button
            onClick={() => handleQuickBuild('polarized', 15)}
            style={{
              padding: '0.75rem',
              background: `linear-gradient(135deg, ${catppuccin.mauve}20, ${catppuccin.mauve}10)`,
              color: catppuccin.mauve,
              border: `1px solid ${catppuccin.mauve}40`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              textAlign: 'left'
            }}
          >
            <div style={{ marginBottom: '0.25rem' }}>Polarized 15%</div>
            <div style={{ fontSize: '0.625rem', opacity: 0.8 }}>
              Strong + bluffs
            </div>
          </button>
          
          <button
            onClick={() => handleQuickBuild('merged', 25)}
            style={{
              padding: '0.75rem',
              background: `linear-gradient(135deg, ${catppuccin.green}20, ${catppuccin.green}10)`,
              color: catppuccin.green,
              border: `1px solid ${catppuccin.green}40`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              textAlign: 'left'
            }}
          >
            <div style={{ marginBottom: '0.25rem' }}>Merged 25%</div>
            <div style={{ fontSize: '0.625rem', opacity: 0.8 }}>
              Gradual distribution
            </div>
          </button>
        </div>

        {/* Custom percentage */}
        <div style={{
          padding: '0.75rem',
          background: catppuccin.mantle,
          borderRadius: '8px'
        }}>
          <label style={{
            display: 'block',
            fontSize: '0.75rem',
            color: catppuccin.text,
            marginBottom: '0.5rem'
          }}>
            Custom Top %
          </label>
          <div style={{
            display: 'flex',
            gap: '0.5rem'
          }}>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="20"
              style={{
                flex: 1,
                padding: '0.5rem',
                background: catppuccin.surface0,
                color: catppuccin.text,
                border: `1px solid ${catppuccin.surface1}`,
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = parseFloat((e.target as HTMLInputElement).value);
                  if (value > 0 && value <= 100) {
                    handleQuickBuild('linear', value);
                  }
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.querySelector('input[type="number"]') as HTMLInputElement;
                const value = parseFloat(input?.value || '20');
                if (value > 0 && value <= 100) {
                  handleQuickBuild('linear', value);
                }
              }}
              style={{
                padding: '0.5rem 1rem',
                background: catppuccin.blue,
                color: catppuccin.base,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Build
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};