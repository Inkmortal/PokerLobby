import React, { useState, useRef, useEffect } from 'react';
import { HandAction } from './RangeBuilder';

interface HandCellProps {
  hand: string;
  action: HandAction;
  isPair: boolean;
  isSuited: boolean;
  isSelected: boolean;
  isEditing: boolean;
  onClick: () => void;
  onActionChange: (action: HandAction) => void;
  onHover: () => void;
  onLeave: () => void;
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
  yellow: '#f9e2af'
};

// Get color based on action
const getActionColor = (action: HandAction): string => {
  const { raise, call, fold } = action;
  
  // Pure strategies
  if (raise >= 0.95) return catppuccin.red;
  if (call >= 0.95) return catppuccin.green;
  if (fold >= 0.95) return catppuccin.surface1;
  
  // Mixed strategies - blend colors
  if (raise > call && raise > fold) {
    // Raise dominant
    const opacity = Math.min(raise, 1);
    return `${catppuccin.red}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  } else if (call > raise && call > fold) {
    // Call dominant
    const opacity = Math.min(call, 1);
    return `${catppuccin.green}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  } else {
    // Fold dominant
    return catppuccin.surface1;
  }
};

// Format percentage for display
const formatPercent = (value: number): string => {
  if (value === 0) return '0';
  if (value === 1) return '100';
  return Math.round(value * 100).toString();
};

export const HandCell: React.FC<HandCellProps> = ({
  hand,
  action,
  isPair,
  isSuited: _isSuited,
  isSelected,
  isEditing,
  onClick,
  onActionChange,
  onHover,
  onLeave
}) => {
  const [localAction, setLocalAction] = useState(action);
  const popupRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setLocalAction(action);
  }, [action]);
  
  useEffect(() => {
    if (isEditing && popupRef.current) {
      // Position popup to be visible
      const rect = popupRef.current.getBoundingClientRect();
      if (rect.bottom > window.innerHeight) {
        popupRef.current.style.bottom = '100%';
        popupRef.current.style.top = 'auto';
      }
      if (rect.right > window.innerWidth) {
        popupRef.current.style.right = '0';
        popupRef.current.style.left = 'auto';
      }
    }
  }, [isEditing]);
  
  const handleRaiseChange = (value: string) => {
    const raise = Math.min(1, Math.max(0, parseFloat(value) / 100 || 0));
    const remaining = 1 - raise;
    setLocalAction({
      raise,
      call: localAction.call > 0 ? localAction.call / (localAction.call + localAction.fold) * remaining : 0,
      fold: localAction.fold > 0 ? localAction.fold / (localAction.call + localAction.fold) * remaining : remaining
    });
  };
  
  const handleCallChange = (value: string) => {
    const call = Math.min(1, Math.max(0, parseFloat(value) / 100 || 0));
    const remaining = 1 - call;
    setLocalAction({
      raise: localAction.raise > 0 ? localAction.raise / (localAction.raise + localAction.fold) * remaining : 0,
      call,
      fold: localAction.fold > 0 ? localAction.fold / (localAction.raise + localAction.fold) * remaining : remaining
    });
  };
  
  const handleApply = () => {
    // Normalize to ensure sum equals 1
    const total = localAction.raise + localAction.call + localAction.fold;
    if (total > 0) {
      onActionChange({
        raise: localAction.raise / total,
        call: localAction.call / total,
        fold: localAction.fold / total
      });
    } else {
      onActionChange({ raise: 0, call: 0, fold: 1 });
    }
  };
  
  const backgroundColor = getActionColor(action);
  const hasMixedStrategy = 
    (action.raise > 0 && action.raise < 1) ||
    (action.call > 0 && action.call < 1);
  
  return (
    <div
      style={{
        position: 'relative',
        aspectRatio: '1',
        background: backgroundColor,
        border: `1px solid ${isSelected ? catppuccin.yellow : catppuccin.surface2}`,
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.15s',
        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
        zIndex: isEditing ? 10 : 1
      }}
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Hand notation */}
      <div style={{
        fontSize: isPair ? '0.875rem' : '0.75rem',
        fontWeight: isPair ? '700' : '600',
        color: catppuccin.text
      }}>
        {hand}
      </div>
      
      {/* Mixed strategy indicator */}
      {hasMixedStrategy && (
        <div style={{
          fontSize: '0.625rem',
          color: catppuccin.subtext0,
          marginTop: '2px'
        }}>
          {action.raise > 0 && `R:${formatPercent(action.raise)}`}
          {action.raise > 0 && action.call > 0 && ' '}
          {action.call > 0 && `C:${formatPercent(action.call)}`}
        </div>
      )}
      
      {/* Edit popup */}
      {isEditing && (
        <div
          ref={popupRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: '4px',
            background: catppuccin.surface0,
            border: `1px solid ${catppuccin.surface1}`,
            borderRadius: '8px',
            padding: '1rem',
            minWidth: '200px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 100
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: catppuccin.text,
            marginBottom: '0.75rem'
          }}>
            {hand}
          </div>
          
          <div style={{ marginBottom: '0.5rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: catppuccin.text,
              fontSize: '0.875rem'
            }}>
              <span style={{ color: catppuccin.red }}>Raise:</span>
              <input
                type="number"
                min="0"
                max="100"
                value={formatPercent(localAction.raise)}
                onChange={(e) => handleRaiseChange(e.target.value)}
                style={{
                  width: '60px',
                  padding: '0.25rem',
                  background: catppuccin.surface1,
                  color: catppuccin.text,
                  border: `1px solid ${catppuccin.surface2}`,
                  borderRadius: '4px',
                  marginLeft: '0.5rem'
                }}
              />
              <span style={{ marginLeft: '0.25rem', color: catppuccin.subtext0 }}>%</span>
            </label>
          </div>
          
          <div style={{ marginBottom: '0.5rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: catppuccin.text,
              fontSize: '0.875rem'
            }}>
              <span style={{ color: catppuccin.green }}>Call:</span>
              <input
                type="number"
                min="0"
                max="100"
                value={formatPercent(localAction.call)}
                onChange={(e) => handleCallChange(e.target.value)}
                style={{
                  width: '60px',
                  padding: '0.25rem',
                  background: catppuccin.surface1,
                  color: catppuccin.text,
                  border: `1px solid ${catppuccin.surface2}`,
                  borderRadius: '4px',
                  marginLeft: '0.5rem'
                }}
              />
              <span style={{ marginLeft: '0.25rem', color: catppuccin.subtext0 }}>%</span>
            </label>
          </div>
          
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: catppuccin.subtext0,
              fontSize: '0.875rem'
            }}>
              <span>Fold:</span>
              <span>{formatPercent(localAction.fold)}%</span>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '0.5rem'
          }}>
            <button
              onClick={handleApply}
              style={{
                flex: 1,
                padding: '0.5rem',
                background: catppuccin.green,
                color: catppuccin.base,
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Apply
            </button>
            <button
              onClick={() => onActionChange(action)}
              style={{
                flex: 1,
                padding: '0.5rem',
                background: catppuccin.surface1,
                color: catppuccin.text,
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};