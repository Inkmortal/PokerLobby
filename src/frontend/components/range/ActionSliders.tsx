import React from 'react';
import { Action } from './RangeBuilder';

interface ActionSlidersProps {
  availableActions: Action[];
  percentages: {
    raise: number;
    call: number;
    fold: number;
    active: number;
  };
  onChange: (action: Action, percentage: number) => void;
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
  red: '#f38ba8'
};

const actionColors = {
  raise: catppuccin.red,
  call: catppuccin.green,
  fold: catppuccin.surface1
};

const actionLabels = {
  raise: 'Raise',
  call: 'Call',
  fold: 'Fold'
};

export const ActionSliders: React.FC<ActionSlidersProps> = ({
  availableActions,
  percentages,
  onChange
}) => {
  const handleSliderChange = (action: Action, value: string) => {
    const percentage = parseFloat(value);
    onChange(action, percentage);
  };
  
  return (
    <div style={{
      background: catppuccin.surface0,
      borderRadius: '12px',
      padding: '1.5rem'
    }}>
      <h3 style={{
        fontSize: '1rem',
        fontWeight: '600',
        color: catppuccin.text,
        marginBottom: '1.5rem'
      }}>
        Action Frequencies
      </h3>
      
      {/* Total Active Range */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.5rem'
        }}>
          <label style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: catppuccin.text
          }}>
            Total Active
          </label>
          <span style={{
            fontSize: '0.875rem',
            color: catppuccin.blue,
            fontWeight: '600'
          }}>
            {percentages.active.toFixed(1)}%
          </span>
        </div>
        <div style={{
          position: 'relative',
          height: '8px',
          background: catppuccin.surface2,
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${percentages.active}%`,
            background: catppuccin.blue,
            transition: 'width 0.2s'
          }} />
        </div>
      </div>
      
      {/* Individual Action Sliders */}
      {availableActions.map(action => (
        <div key={action} style={{ marginBottom: '1.5rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '0.5rem'
          }}>
            <label style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: actionColors[action]
            }}>
              {actionLabels[action]}
            </label>
            <span style={{
              fontSize: '0.875rem',
              color: catppuccin.subtext0
            }}>
              {percentages[action].toFixed(1)}%
            </span>
          </div>
          
          <input
            type="range"
            min="0"
            max="100"
            step="0.5"
            value={percentages[action]}
            onChange={(e) => handleSliderChange(action, e.target.value)}
            style={{
              width: '100%',
              height: '6px',
              background: `linear-gradient(to right, ${actionColors[action]} 0%, ${actionColors[action]} ${percentages[action]}%, ${catppuccin.surface2} ${percentages[action]}%, ${catppuccin.surface2} 100%)`,
              borderRadius: '3px',
              outline: 'none',
              WebkitAppearance: 'none',
              cursor: 'pointer'
            }}
          />
        </div>
      ))}
      
      {/* Fold percentage (automatic) */}
      {!availableActions.includes('fold') && (
        <div style={{
          paddingTop: '1rem',
          borderTop: `1px solid ${catppuccin.surface1}`
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            color: catppuccin.overlay1,
            fontSize: '0.875rem'
          }}>
            <span>Fold (automatic)</span>
            <span>{percentages.fold.toFixed(1)}%</span>
          </div>
        </div>
      )}
      
      {/* Value/Bluff Ratio for Polarized */}
      <div style={{
        marginTop: '1.5rem',
        paddingTop: '1.5rem',
        borderTop: `1px solid ${catppuccin.surface1}`
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.5rem'
        }}>
          <label style={{
            fontSize: '0.875rem',
            color: catppuccin.subtext0
          }}>
            Value/Bluff Ratio
          </label>
          <span style={{
            fontSize: '0.875rem',
            color: catppuccin.text
          }}>
            70/30
          </span>
        </div>
        <input
          type="range"
          min="50"
          max="90"
          value="70"
          disabled
          style={{
            width: '100%',
            opacity: 0.5,
            cursor: 'not-allowed'
          }}
        />
      </div>
    </div>
  );
};