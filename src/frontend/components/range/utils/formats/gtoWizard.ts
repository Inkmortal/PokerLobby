import { RangeData } from '../../RangeBuilder';

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const SUITS = ['c', 'd', 'h', 's'];

/**
 * Parse GTO Wizard/PIO format string into RangeData
 * Format: "Ac2c:1,Ac2d:0.5,Ac2h:0,Ac2s:0.5,..."
 */
export function parseGTOWizardFormat(rangeString: string): RangeData {
  const rangeData: RangeData = {};
  
  if (!rangeString || rangeString.trim() === '') {
    return rangeData;
  }
  
  // Split by comma to get individual combo:weight pairs
  const combos = rangeString.split(',');
  
  combos.forEach(combo => {
    const [hand, weightStr] = combo.trim().split(':');
    if (!hand || !weightStr) return;
    
    const weight = parseFloat(weightStr);
    if (isNaN(weight)) return;
    
    // For now, interpret weight as raise frequency
    // In real implementation, might need context to determine action
    rangeData[hand] = {
      raise: weight,
      call: 0,
      fold: 1 - weight
    };
  });
  
  return rangeData;
}

/**
 * Export RangeData to GTO Wizard/PIO format string
 * Format: "Ac2c:1,Ac2d:0.5,Ac2h:0,Ac2s:0.5,..."
 */
export function exportToGTOWizard(rangeData: RangeData): string {
  const combos: string[] = [];
  
  // Generate all possible combos in order
  for (let i = 0; i < RANKS.length; i++) {
    for (let j = i; j < RANKS.length; j++) {
      const rank1 = RANKS[i];
      const rank2 = RANKS[j];
      
      if (i === j) {
        // Pocket pairs - 6 combos
        for (let s1 = 0; s1 < SUITS.length; s1++) {
          for (let s2 = s1 + 1; s2 < SUITS.length; s2++) {
            const combo = `${rank1}${SUITS[s1]}${rank2}${SUITS[s2]}`;
            const action = rangeData[combo];
            if (action) {
              // Use raise frequency as weight, or sum of raise+call for active hands
              const weight = Math.max(action.raise, action.raise + action.call);
              if (weight > 0) {
                combos.push(`${combo}:${weight.toFixed(2).replace(/\.?0+$/, '')}`);
              }
            }
          }
        }
      } else {
        // Non-pairs - suited and offsuit
        for (let s1 = 0; s1 < SUITS.length; s1++) {
          for (let s2 = 0; s2 < SUITS.length; s2++) {
            const combo = `${rank1}${SUITS[s1]}${rank2}${SUITS[s2]}`;
            const action = rangeData[combo];
            if (action) {
              const weight = Math.max(action.raise, action.raise + action.call);
              if (weight > 0) {
                combos.push(`${combo}:${weight.toFixed(2).replace(/\.?0+$/, '')}`);
              }
            }
          }
        }
      }
    }
  }
  
  return combos.join(',');
}

/**
 * Convert hand notation (e.g., "AKs", "QQ") to all specific combos
 */
export function expandHandNotation(notation: string): string[] {
  const combos: string[] = [];
  
  if (notation.length === 2) {
    // Pocket pair (e.g., "AA", "KK")
    const rank = notation[0];
    for (let i = 0; i < SUITS.length; i++) {
      for (let j = i + 1; j < SUITS.length; j++) {
        combos.push(`${rank}${SUITS[i]}${rank}${SUITS[j]}`);
      }
    }
  } else if (notation.endsWith('s')) {
    // Suited (e.g., "AKs")
    const rank1 = notation[0];
    const rank2 = notation[1];
    for (const suit of SUITS) {
      combos.push(`${rank1}${suit}${rank2}${suit}`);
    }
  } else if (notation.endsWith('o')) {
    // Offsuit (e.g., "AKo")
    const rank1 = notation[0];
    const rank2 = notation[1];
    for (const suit1 of SUITS) {
      for (const suit2 of SUITS) {
        if (suit1 !== suit2) {
          combos.push(`${rank1}${suit1}${rank2}${suit2}`);
        }
      }
    }
  }
  
  return combos;
}

/**
 * Parse multiple formats including shorthand notation
 * Examples: "AA,KK,AKs" or "AA-TT,AKo-AJo,KQs+"
 */
export function parseRangeString(rangeStr: string): string[] {
  const combos: string[] = [];
  const parts = rangeStr.split(',');
  
  parts.forEach(part => {
    part = part.trim();
    
    // Handle range notation (e.g., "AA-TT")
    if (part.includes('-')) {
      // const [start, end] = part.split('-');
      // TODO: Implement range expansion
      // For now, just handle individual hands
    }
    
    // Handle "+" notation (e.g., "AJs+")
    else if (part.endsWith('+')) {
      // const base = part.slice(0, -1);
      // TODO: Implement "and better" expansion
    }
    
    // Handle individual hands
    else {
      combos.push(...expandHandNotation(part));
    }
  });
  
  return combos;
}