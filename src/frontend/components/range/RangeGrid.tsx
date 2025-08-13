import React, { useState, useRef } from 'react';
import { HandCell } from './HandCell';
import { RangeData, HandAction, Action } from './RangeBuilder';

interface RangeGridProps {
  rangeData: RangeData;
  onChange: (data: RangeData) => void;
  paintMode?: 'select' | 'paint';
  paintAction?: Action;
  paintFrequency?: number;
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

// All 169 starting hands in order (13x13 grid)
const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const SUITS = ['c', 'd', 'h', 's'];

// Generate hand notation for grid position
const getHandNotation = (row: number, col: number): string => {
  const rank1 = RANKS[row];
  const rank2 = RANKS[col];
  
  if (row === col) {
    // Pocket pair
    return `${rank1}${rank2}`;
  } else if (row < col) {
    // Suited (above diagonal)
    return `${rank1}${rank2}s`;
  } else {
    // Offsuit (below diagonal)
    return `${rank2}${rank1}o`;
  }
};

// Get all specific combos for a hand
const getHandCombos = (hand: string): string[] => {
  const combos: string[] = [];
  
  if (hand.length === 2) {
    // Pocket pair - 6 combos
    const rank = hand[0];
    for (let i = 0; i < SUITS.length; i++) {
      for (let j = i + 1; j < SUITS.length; j++) {
        combos.push(`${rank}${SUITS[i]}${rank}${SUITS[j]}`);
      }
    }
  } else if (hand.endsWith('s')) {
    // Suited - 4 combos
    const rank1 = hand[0];
    const rank2 = hand[1];
    for (const suit of SUITS) {
      combos.push(`${rank1}${suit}${rank2}${suit}`);
    }
  } else if (hand.endsWith('o')) {
    // Offsuit - 12 combos
    const rank1 = hand[0];
    const rank2 = hand[1];
    for (const suit1 of SUITS) {
      for (const suit2 of SUITS) {
        if (suit1 !== suit2) {
          combos.push(`${rank1}${suit1}${rank2}${suit2}`);
        }
      }
    }
  }
  
  return combos;
};

// Calculate average action for a hand
const getHandAction = (hand: string, rangeData: RangeData): HandAction => {
  const combos = getHandCombos(hand);
  let totalRaise = 0;
  let totalCall = 0;
  let totalFold = 0;
  let count = 0;
  
  combos.forEach(combo => {
    if (rangeData[combo]) {
      totalRaise += rangeData[combo].raise || 0;
      totalCall += rangeData[combo].call || 0;
      totalFold += rangeData[combo].fold || 0;
      count++;
    }
  });
  
  if (count === 0) {
    return { raise: 0, call: 0, fold: 1 };
  }
  
  return {
    raise: totalRaise / count,
    call: totalCall / count,
    fold: totalFold / count
  };
};

export const RangeGrid: React.FC<RangeGridProps> = ({ 
  rangeData, 
  onChange,
  paintMode = 'select',
  paintAction = 'raise',
  paintFrequency = 100
}) => {
  const [selectedHand, setSelectedHand] = useState<string | null>(null);
  const [editingHand, setEditingHand] = useState<string | null>(null);
  const [isPainting, setIsPainting] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  
  const handleCellClick = (hand: string) => {
    if (paintMode === 'select') {
      setEditingHand(hand);
    } else {
      // Paint mode - apply action immediately
      applyPaintAction(hand);
    }
  };
  
  const applyPaintAction = (hand: string) => {
    const combos = getHandCombos(hand);
    const newData = { ...rangeData };
    
    const frequency = paintFrequency / 100;
    const action: HandAction = {
      raise: paintAction === 'raise' ? frequency : 0,
      call: paintAction === 'call' ? frequency : 0,
      fold: paintAction === 'fold' ? frequency : (1 - frequency)
    };
    
    // Normalize to ensure sum equals 1
    const total = action.raise + action.call + action.fold;
    if (total > 0) {
      action.raise /= total;
      action.call /= total;
      action.fold /= total;
    }
    
    combos.forEach(combo => {
      newData[combo] = action;
    });
    
    onChange(newData);
  };
  
  const handleMouseDown = (hand: string) => {
    if (paintMode === 'paint') {
      setIsPainting(true);
      applyPaintAction(hand);
    }
  };
  
  const handleMouseEnter = (hand: string) => {
    setSelectedHand(hand);
    if (isPainting && paintMode === 'paint') {
      applyPaintAction(hand);
    }
  };
  
  const handleMouseUp = () => {
    setIsPainting(false);
  };
  
  const handleActionChange = (hand: string, action: HandAction) => {
    const combos = getHandCombos(hand);
    const newData = { ...rangeData };
    
    combos.forEach(combo => {
      newData[combo] = action;
    });
    
    onChange(newData);
    setEditingHand(null);
  };
  
  // Add mouse up listener to document
  React.useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);
  
  return (
    <div 
      ref={gridRef}
      style={{
        background: catppuccin.mantle,
        borderRadius: '12px',
        padding: '1rem',
        position: 'relative',
        userSelect: 'none'
      }}
    >
      {/* Paint mode indicator */}
      {paintMode === 'paint' && (
        <div style={{
          position: 'absolute',
          top: '-30px',
          right: '0',
          padding: '0.25rem 0.75rem',
          background: catppuccin.blue,
          color: catppuccin.base,
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>🎨</span>
          Paint Mode: {paintAction} {paintFrequency}%
        </div>
      )}
      
      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(13, 1fr)',
        gap: '2px',
        marginBottom: '2px',
        paddingLeft: '30px'
      }}>
        {RANKS.map(rank => (
          <div
            key={rank}
            style={{
              textAlign: 'center',
              color: catppuccin.subtext0,
              fontSize: '0.75rem',
              fontWeight: '600'
            }}
          >
            {rank}
          </div>
        ))}
      </div>
      
      {/* Grid with row headers */}
      {RANKS.map((rank, row) => (
        <div
          key={row}
          style={{
            display: 'grid',
            gridTemplateColumns: '30px repeat(13, 1fr)',
            gap: '2px',
            marginBottom: '2px'
          }}
        >
          {/* Row header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: catppuccin.subtext0,
            fontSize: '0.75rem',
            fontWeight: '600'
          }}>
            {rank}
          </div>
          
          {/* Hand cells */}
          {RANKS.map((_, col) => {
            const hand = getHandNotation(row, col);
            const action = getHandAction(hand, rangeData);
            const isPair = row === col;
            const isSuited = row < col;
            
            return (
              <div
                key={`${row}-${col}`}
                onMouseDown={() => handleMouseDown(hand)}
                onMouseEnter={() => handleMouseEnter(hand)}
                style={{ cursor: paintMode === 'paint' ? 'crosshair' : 'pointer' }}
              >
                <HandCell
                  hand={hand}
                  action={action}
                  isPair={isPair}
                  isSuited={isSuited}
                  isSelected={selectedHand === hand}
                  isEditing={editingHand === hand && paintMode === 'select'}
                  onClick={() => handleCellClick(hand)}
                  onActionChange={(newAction) => handleActionChange(hand, newAction)}
                  onHover={() => setSelectedHand(hand)}
                  onLeave={() => setSelectedHand(null)}
                />
              </div>
            );
          })}
        </div>
      ))}
      
      {/* Legend */}
      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: catppuccin.surface0,
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'center',
        gap: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '16px',
            height: '16px',
            background: catppuccin.red,
            borderRadius: '4px'
          }} />
          <span style={{ color: catppuccin.subtext0, fontSize: '0.875rem' }}>
            Raise
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '16px',
            height: '16px',
            background: catppuccin.green,
            borderRadius: '4px'
          }} />
          <span style={{ color: catppuccin.subtext0, fontSize: '0.875rem' }}>
            Call
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '16px',
            height: '16px',
            background: catppuccin.surface1,
            borderRadius: '4px'
          }} />
          <span style={{ color: catppuccin.subtext0, fontSize: '0.875rem' }}>
            Fold
          </span>
        </div>
      </div>
    </div>
  );
};