import React from 'react';
import { RangeData } from './RangeBuilder';

interface RangeStatsProps {
  rangeData: RangeData;
  percentages: {
    raise: number;
    call: number;
    fold: number;
    active: number;
  };
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

export const RangeStats: React.FC<RangeStatsProps> = ({ rangeData, percentages }) => {
  // Calculate combo counts
  const calculateComboCounts = () => {
    let raiseCombos = 0;
    let callCombos = 0;
    let mixedCombos = 0;
    
    Object.values(rangeData).forEach(action => {
      if (action.raise >= 0.95) {
        raiseCombos++;
      } else if (action.call >= 0.95) {
        callCombos++;
      } else if (action.raise > 0 || action.call > 0) {
        mixedCombos++;
      }
    });
    
    return {
      raise: raiseCombos,
      call: callCombos,
      mixed: mixedCombos,
      total: raiseCombos + callCombos + mixedCombos
    };
  };
  
  const comboCounts = calculateComboCounts();
  
  // Calculate hand class breakdown
  const calculateHandClasses = () => {
    const classes = {
      pairs: 0,
      suited: 0,
      offsuit: 0,
      broadway: 0,
      connectors: 0,
      gappers: 0
    };
    
    Object.keys(rangeData).forEach(combo => {
      const action = rangeData[combo];
      if (action.raise > 0 || action.call > 0) {
        // Parse combo (e.g., "AcKd" or hand notation)
        if (combo.length === 4) {
          const rank1 = combo[0];
          const rank2 = combo[2];
          const suit1 = combo[1];
          const suit2 = combo[3];
          
          if (rank1 === rank2) {
            classes.pairs++;
          } else if (suit1 === suit2) {
            classes.suited++;
          } else {
            classes.offsuit++;
          }
          
          // Check for broadway
          if (['A', 'K', 'Q', 'J', 'T'].includes(rank1) && 
              ['A', 'K', 'Q', 'J', 'T'].includes(rank2)) {
            classes.broadway++;
          }
        }
      }
    });
    
    return classes;
  };
  
  const handClasses = calculateHandClasses();
  
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
        Range Statistics
      </h3>
      
      {/* Combo Counts */}
      <div style={{
        marginBottom: '1.5rem',
        paddingBottom: '1.5rem',
        borderBottom: `1px solid ${catppuccin.surface1}`
      }}>
        <h4 style={{
          fontSize: '0.875rem',
          fontWeight: '500',
          color: catppuccin.subtext0,
          marginBottom: '1rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Combo Counts
        </h4>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.5rem',
            background: catppuccin.mantle,
            borderRadius: '6px'
          }}>
            <span style={{ color: catppuccin.red, fontSize: '0.875rem' }}>
              Raise
            </span>
            <span style={{ color: catppuccin.text, fontSize: '0.875rem', fontWeight: '600' }}>
              {comboCounts.raise}
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.5rem',
            background: catppuccin.mantle,
            borderRadius: '6px'
          }}>
            <span style={{ color: catppuccin.green, fontSize: '0.875rem' }}>
              Call
            </span>
            <span style={{ color: catppuccin.text, fontSize: '0.875rem', fontWeight: '600' }}>
              {comboCounts.call}
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.5rem',
            background: catppuccin.mantle,
            borderRadius: '6px'
          }}>
            <span style={{ color: catppuccin.yellow, fontSize: '0.875rem' }}>
              Mixed
            </span>
            <span style={{ color: catppuccin.text, fontSize: '0.875rem', fontWeight: '600' }}>
              {comboCounts.mixed}
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.5rem',
            background: catppuccin.mantle,
            borderRadius: '6px'
          }}>
            <span style={{ color: catppuccin.blue, fontSize: '0.875rem' }}>
              Total
            </span>
            <span style={{ color: catppuccin.text, fontSize: '0.875rem', fontWeight: '600' }}>
              {comboCounts.total}
            </span>
          </div>
        </div>
      </div>
      
      {/* Percentages */}
      <div style={{
        marginBottom: '1.5rem',
        paddingBottom: '1.5rem',
        borderBottom: `1px solid ${catppuccin.surface1}`
      }}>
        <h4 style={{
          fontSize: '0.875rem',
          fontWeight: '500',
          color: catppuccin.subtext0,
          marginBottom: '1rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Range Percentages
        </h4>
        
        <div style={{ marginBottom: '1rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '0.5rem'
          }}>
            <span style={{ color: catppuccin.text, fontSize: '0.875rem' }}>
              Total Range
            </span>
            <span style={{ color: catppuccin.blue, fontSize: '0.875rem', fontWeight: '600' }}>
              {percentages.active.toFixed(1)}%
            </span>
          </div>
          <div style={{
            height: '8px',
            background: catppuccin.surface2,
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${percentages.active}%`,
              background: catppuccin.blue,
              transition: 'width 0.3s'
            }} />
          </div>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
          fontSize: '0.75rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            color: catppuccin.subtext0
          }}>
            <span>Raise:</span>
            <span style={{ color: catppuccin.red }}>
              {percentages.raise.toFixed(1)}%
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            color: catppuccin.subtext0
          }}>
            <span>Call:</span>
            <span style={{ color: catppuccin.green }}>
              {percentages.call.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
      
      {/* Hand Classes */}
      <div>
        <h4 style={{
          fontSize: '0.875rem',
          fontWeight: '500',
          color: catppuccin.subtext0,
          marginBottom: '1rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Hand Types
        </h4>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
          fontSize: '0.75rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            color: catppuccin.subtext0
          }}>
            <span>Pairs:</span>
            <span style={{ color: catppuccin.text }}>
              {handClasses.pairs}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            color: catppuccin.subtext0
          }}>
            <span>Suited:</span>
            <span style={{ color: catppuccin.text }}>
              {handClasses.suited}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            color: catppuccin.subtext0
          }}>
            <span>Offsuit:</span>
            <span style={{ color: catppuccin.text }}>
              {handClasses.offsuit}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            color: catppuccin.subtext0
          }}>
            <span>Broadway:</span>
            <span style={{ color: catppuccin.text }}>
              {handClasses.broadway}
            </span>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div style={{
        marginTop: '1.5rem',
        paddingTop: '1.5rem',
        borderTop: `1px solid ${catppuccin.surface1}`
      }}>
        <button
          style={{
            width: '100%',
            padding: '0.75rem',
            background: catppuccin.surface1,
            color: catppuccin.text,
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <span>📊</span>
          <span>Detailed Analysis</span>
        </button>
      </div>
    </div>
  );
};