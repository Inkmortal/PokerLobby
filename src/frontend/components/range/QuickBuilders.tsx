import React, { useState } from 'react';

interface QuickBuildersProps {
  onBuild: (template: string, value: number) => void;
  facingAction: string;
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

interface QuickButton {
  label: string;
  template: string;
  defaultValue: number;
  color: string;
  description: string;
}

export const QuickBuilders: React.FC<QuickBuildersProps> = ({ onBuild, facingAction }) => {
  const [customValue, setCustomValue] = useState<{ [key: string]: number }>({});
  
  // Dynamic quick builders based on context
  const getQuickButtons = (): QuickButton[] => {
    if (facingAction === 'unopened') {
      return [
        { label: 'Top 15%', template: 'top', defaultValue: 15, color: catppuccin.blue, description: 'Tight opening range' },
        { label: 'Top 20%', template: 'top', defaultValue: 20, color: catppuccin.blue, description: 'Standard opening range' },
        { label: 'Top 30%', template: 'top', defaultValue: 30, color: catppuccin.blue, description: 'Loose opening range' },
        { label: 'GTO Open', template: 'top', defaultValue: 22, color: catppuccin.green, description: 'GTO baseline' }
      ];
    } else if (facingAction.includes('open')) {
      return [
        { label: 'Defend 40%', template: 'defend', defaultValue: 40, color: catppuccin.green, description: 'Standard defense' },
        { label: '3-bet 8%', template: '3bet-linear', defaultValue: 8, color: catppuccin.red, description: 'Linear 3-bet' },
        { label: '3-bet Polar', template: '3bet-polar', defaultValue: 10, color: catppuccin.mauve, description: 'Polarized 3-bet' },
        { label: 'GTO vs Open', template: 'defend', defaultValue: 35, color: catppuccin.green, description: 'GTO defense frequency' }
      ];
    } else if (facingAction.includes('3bet')) {
      return [
        { label: '4-bet Value', template: 'top', defaultValue: 3, color: catppuccin.red, description: 'Premium hands only' },
        { label: '4-bet Bluff', template: '3bet-polar', defaultValue: 2, color: catppuccin.mauve, description: 'Blocker hands' },
        { label: 'Defend 25%', template: 'defend', defaultValue: 25, color: catppuccin.green, description: 'vs 3-bet' },
        { label: 'Tight Fold', template: 'top', defaultValue: 10, color: catppuccin.yellow, description: 'Only continue with best' }
      ];
    }
    return [];
  };
  
  const quickButtons = getQuickButtons();
  
  const handleQuickBuild = (button: QuickButton) => {
    const value = customValue[button.label] || button.defaultValue;
    onBuild(button.template, value);
  };
  
  const handleCustomValueChange = (label: string, value: string) => {
    setCustomValue(prev => ({
      ...prev,
      [label]: parseFloat(value) || 0
    }));
  };
  
  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        <h3 style={{
          fontSize: '0.875rem',
          fontWeight: '600',
          color: catppuccin.subtext0,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Quick Build
        </h3>
        <div style={{
          flex: 1,
          height: '1px',
          background: catppuccin.surface1
        }} />
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.75rem'
      }}>
        {quickButtons.map((button) => (
          <div
            key={button.label}
            style={{
              position: 'relative'
            }}
          >
            <button
              onClick={() => handleQuickBuild(button)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: `linear-gradient(135deg, ${button.color}20, ${button.color}10)`,
                color: button.color,
                border: `1px solid ${button.color}40`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 4px 12px ${button.color}30`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div>{button.label}</div>
              <div style={{
                fontSize: '0.625rem',
                opacity: 0.8,
                marginTop: '0.25rem'
              }}>
                {button.description}
              </div>
            </button>
            
            {/* Custom value input */}
            <div style={{
              position: 'absolute',
              bottom: '-30px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              opacity: 0,
              transition: 'opacity 0.2s',
              pointerEvents: 'none'
            }}>
              <input
                type="number"
                min="0"
                max="100"
                value={customValue[button.label] || button.defaultValue}
                onChange={(e) => handleCustomValueChange(button.label, e.target.value)}
                style={{
                  width: '50px',
                  padding: '0.25rem',
                  background: catppuccin.surface1,
                  color: catppuccin.text,
                  border: `1px solid ${catppuccin.surface2}`,
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  pointerEvents: 'all'
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <span style={{
                fontSize: '0.75rem',
                color: catppuccin.subtext0
              }}>%</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Custom Range Builder */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        background: catppuccin.mantle,
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <label style={{
          fontSize: '0.875rem',
          color: catppuccin.text,
          fontWeight: '500'
        }}>
          Custom Top
        </label>
        <input
          type="number"
          min="0"
          max="100"
          placeholder="20"
          style={{
            width: '80px',
            padding: '0.5rem',
            background: catppuccin.surface0,
            color: catppuccin.text,
            border: `1px solid ${catppuccin.surface1}`,
            borderRadius: '6px',
            fontSize: '0.875rem'
          }}
          onChange={(e) => setCustomValue(prev => ({ ...prev, custom: parseFloat(e.target.value) || 0 }))}
        />
        <span style={{
          fontSize: '0.875rem',
          color: catppuccin.subtext0
        }}>%</span>
        <button
          onClick={() => onBuild('top', customValue.custom || 20)}
          style={{
            padding: '0.5rem 1rem',
            background: catppuccin.blue,
            color: catppuccin.base,
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Build
        </button>
      </div>
    </div>
  );
};