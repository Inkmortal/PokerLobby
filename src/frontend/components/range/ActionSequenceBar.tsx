import React, { useState } from 'react';
import { Position, ActionNode } from './RangeBuilder';

interface ActionSequenceBarProps {
  sequence: ActionNode[];
  currentNode: ActionNode | null;
  onActionSelect: (position: Position, action: string, amount?: number) => void;
  tableSize: '6max' | '9max' | 'HU';
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

const POSITIONS_6MAX: Position[] = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
const POSITIONS_9MAX: Position[] = ['UTG', 'MP', 'MP', 'CO', 'BTN', 'SB', 'BB'];
const POSITIONS_HU: Position[] = ['BTN', 'BB'];

export const ActionSequenceBar: React.FC<ActionSequenceBarProps> = ({
  sequence,
  currentNode,
  onActionSelect,
  tableSize
}) => {
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [raiseAmount, setRaiseAmount] = useState('2.5');

  const positions = tableSize === '6max' ? POSITIONS_6MAX : 
                   tableSize === '9max' ? POSITIONS_9MAX : 
                   POSITIONS_HU;

  const getNextPositions = (): Position[] => {
    if (sequence.length === 0) {
      // First action can be from any position
      return positions;
    }
    
    const lastAction = sequence[sequence.length - 1];
    const lastPosIndex = positions.indexOf(lastAction.position);
    
    // Next actions are from positions after the last one
    return positions.slice(lastPosIndex + 1);
  };

  const availablePositions = getNextPositions();

  const handlePositionClick = (position: Position) => {
    setSelectedPosition(position);
    setShowActionMenu(true);
  };

  const handleActionClick = (action: string) => {
    if (selectedPosition) {
      const amount = action === 'raise' ? parseFloat(raiseAmount) : undefined;
      onActionSelect(selectedPosition, action, amount);
      setShowActionMenu(false);
      setSelectedPosition(null);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'fold': return catppuccin.overlay1;
      case 'call': return catppuccin.green;
      case 'raise': return catppuccin.red;
      case 'check': return catppuccin.blue;
      case 'bet': return catppuccin.red;
      case 'allin': return catppuccin.yellow;
      default: return catppuccin.text;
    }
  };

  const getAvailableActions = () => {
    if (sequence.length === 0) {
      // First action from any position
      return ['raise', 'fold'];
    }
    
    const lastAction = sequence[sequence.length - 1];
    if (lastAction.action === 'raise' || lastAction.action === 'bet') {
      return ['fold', 'call', 'raise'];
    } else if (lastAction.action === 'check') {
      return ['check', 'bet'];
    }
    
    return ['fold', 'call', 'raise'];
  };

  return (
    <div style={{
      background: catppuccin.surface0,
      borderBottom: `1px solid ${catppuccin.surface1}`,
      padding: '1rem 1.5rem',
      minHeight: '80px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        overflowX: 'auto'
      }}>
        {/* Show completed sequence */}
        {sequence.map((node, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <span style={{ color: catppuccin.overlay1 }}>→</span>
            )}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: catppuccin.mantle,
              borderRadius: '8px',
              border: `1px solid ${catppuccin.surface1}`
            }}>
              <span style={{
                fontWeight: '600',
                color: catppuccin.text,
                fontSize: '0.875rem'
              }}>
                {node.position}
              </span>
              <span style={{
                color: getActionColor(node.action),
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                {node.action}
                {node.amount && ` ${node.amount}BB`}
              </span>
            </div>
          </React.Fragment>
        ))}

        {/* Show available positions for next action */}
        {availablePositions.length > 0 && (
          <>
            {sequence.length > 0 && (
              <span style={{ color: catppuccin.overlay1 }}>→</span>
            )}
            <div style={{
              display: 'flex',
              gap: '0.5rem'
            }}>
              {availablePositions.map(position => (
                <button
                  key={position}
                  onClick={() => handlePositionClick(position)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: selectedPosition === position ? catppuccin.blue : catppuccin.surface1,
                    color: selectedPosition === position ? catppuccin.base : catppuccin.text,
                    border: `1px solid ${selectedPosition === position ? catppuccin.blue : catppuccin.surface2}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedPosition !== position) {
                      e.currentTarget.style.background = catppuccin.surface2;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedPosition !== position) {
                      e.currentTarget.style.background = catppuccin.surface1;
                    }
                  }}
                >
                  {position}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Action selection menu */}
        {showActionMenu && selectedPosition && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem',
            background: catppuccin.mantle,
            borderRadius: '8px',
            border: `1px solid ${catppuccin.blue}`
          }}>
            {getAvailableActions().map(action => (
              <React.Fragment key={action}>
                {action === 'raise' && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <button
                      onClick={() => handleActionClick(action)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: catppuccin.red,
                        color: catppuccin.base,
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                    >
                      Raise
                    </button>
                    <input
                      type="number"
                      step="0.5"
                      value={raiseAmount}
                      onChange={(e) => setRaiseAmount(e.target.value)}
                      style={{
                        width: '60px',
                        padding: '0.5rem',
                        background: catppuccin.surface0,
                        color: catppuccin.text,
                        border: `1px solid ${catppuccin.surface2}`,
                        borderRadius: '6px',
                        fontSize: '0.875rem'
                      }}
                    />
                    <span style={{
                      color: catppuccin.subtext0,
                      fontSize: '0.875rem'
                    }}>BB</span>
                  </div>
                )}
                {action !== 'raise' && (
                  <button
                    onClick={() => handleActionClick(action)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: getActionColor(action),
                      color: action === 'fold' ? catppuccin.text : catppuccin.base,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      textTransform: 'capitalize'
                    }}
                  >
                    {action}
                  </button>
                )}
              </React.Fragment>
            ))}
            <button
              onClick={() => {
                setShowActionMenu(false);
                setSelectedPosition(null);
              }}
              style={{
                padding: '0.5rem',
                background: 'transparent',
                color: catppuccin.overlay1,
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Reset sequence button */}
        {sequence.length > 0 && (
          <button
            onClick={() => {
              // This would need to be passed from parent
              console.log('Reset sequence');
            }}
            style={{
              marginLeft: 'auto',
              padding: '0.5rem 1rem',
              background: catppuccin.surface1,
              color: catppuccin.text,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Instruction text when empty */}
      {sequence.length === 0 && !showActionMenu && (
        <div style={{
          marginTop: '0.5rem',
          color: catppuccin.subtext0,
          fontSize: '0.875rem'
        }}>
          Click on a position to start building your action sequence
        </div>
      )}
    </div>
  );
};