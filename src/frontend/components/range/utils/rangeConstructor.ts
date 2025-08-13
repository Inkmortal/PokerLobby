import { RangeData, HandAction, Action } from '../RangeBuilder';

const SUITS = ['c', 'd', 'h', 's'];

// Hand strength rankings (simplified)
const HAND_RANKINGS = [
  'AA', 'KK', 'QQ', 'AKs', 'JJ', 'AKo', 'AQs', 'TT', 'AQo', 'KQs',
  '99', 'AJs', 'KQo', 'ATs', 'AJo', '88', 'KJs', 'QJs', 'KTs', 'ATo',
  '77', 'KJo', 'QTs', 'JTs', 'QJo', 'KTo', '66', 'A9s', 'JTo', 'QTo',
  'A8s', 'K9s', 'A9o', '55', 'A7s', 'Q9s', 'A5s', 'A8o', 'A6s', 'K8s',
  'J9s', 'A4s', 'K9o', 'A7o', 'K7s', 'T9s', 'Q8s', 'A3s', '44', 'K6s',
  'Q9o', 'J8s', 'A5o', 'A6o', 'K8o', 'A2s', 'T8s', '98s', 'J9o', 'K5s',
  'Q7s', 'A4o', 'K7o', '33', 'J7s', 'Q6s', 'K4s', 'T9o', 'Q8o', 'A3o',
  '87s', 'K6o', 'J8o', 'Q5s', 'T7s', 'K3s', '97s', 'A2o', '22', 'K5o',
  'Q4s', 'K2s', '76s', 'T8o', 'J6s', '86s', '98o', 'Q7o', 'J5s', 'Q3s',
  'T6s', 'K4o', 'J7o', '96s', 'Q6o', '65s', 'Q2s', '87o', 'K3o', 'J4s',
  '75s', 'T5s', 'K2o', 'J3s', '85s', '54s', 'Q5o', 'T7o', 'J6o', '97o',
  'J2s', '64s', 'Q4o', 'T4s', '95s', '76o', 'T3s', '86o', 'Q3o', '74s',
  'J5o', 'T6o', '96o', '53s', 'Q2o', 'T2s', '84s', '65o', 'J4o', '94s',
  '75o', 'J3o', '63s', 'T5o', '93s', '43s', '85o', '54o', 'J2o', '73s',
  '52s', 'T4o', '64o', '92s', '83s', 'T3o', '95o', '42s', '62s', '74o',
  'T2o', '82s', '84o', '53o', '72s', '32s', '94o', '63o', '93o', '43o',
  '73o', '52o', '92o', '83o', '42o', '62o', '82o', '72o', '32o'
];

/**
 * Get all combos for a hand notation
 */
function getHandCombos(notation: string): string[] {
  const combos: string[] = [];
  
  if (notation.length === 2) {
    // Pocket pair
    const rank = notation[0];
    for (let i = 0; i < SUITS.length; i++) {
      for (let j = i + 1; j < SUITS.length; j++) {
        combos.push(`${rank}${SUITS[i]}${rank}${SUITS[j]}`);
      }
    }
  } else if (notation.endsWith('s')) {
    // Suited
    const rank1 = notation[0];
    const rank2 = notation[1];
    for (const suit of SUITS) {
      combos.push(`${rank1}${suit}${rank2}${suit}`);
    }
  } else if (notation.endsWith('o')) {
    // Offsuit
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
 * Build a linear range (top X% of hands)
 */
export function buildLinearRange(percentage: number, action: Action): RangeData {
  const rangeData: RangeData = {};
  const targetCombos = Math.floor((percentage / 100) * 1326);
  let comboCount = 0;
  
  for (const hand of HAND_RANKINGS) {
    if (comboCount >= targetCombos) break;
    
    const combos = getHandCombos(hand);
    for (const combo of combos) {
      if (comboCount >= targetCombos) break;
      
      const handAction: HandAction = {
        raise: action === 'raise' ? 1 : 0,
        call: action === 'call' ? 1 : 0,
        fold: action === 'fold' ? 1 : 0
      };
      
      // Normalize to ensure sum equals 1
      const total = handAction.raise + handAction.call + handAction.fold;
      if (total > 0) {
        handAction.raise /= total;
        handAction.call /= total;
        handAction.fold /= total;
      }
      
      rangeData[combo] = handAction;
      comboCount++;
    }
  }
  
  return rangeData;
}

/**
 * Build a polarized range (strong + bluffs, no medium strength)
 */
export function buildPolarizedRange(percentage: number, action: Action): RangeData {
  const rangeData: RangeData = {};
  const targetCombos = Math.floor((percentage / 100) * 1326);
  
  // Value portion (70% of range from top hands)
  const valueCombos = Math.floor(targetCombos * 0.7);
  const bluffCombos = targetCombos - valueCombos;
  
  let comboCount = 0;
  
  // Add value hands
  for (const hand of HAND_RANKINGS) {
    if (comboCount >= valueCombos) break;
    
    const combos = getHandCombos(hand);
    for (const combo of combos) {
      if (comboCount >= valueCombos) break;
      
      const handAction: HandAction = {
        raise: action === 'raise' ? 1 : 0,
        call: action === 'call' ? 1 : 0,
        fold: 0
      };
      
      rangeData[combo] = handAction;
      comboCount++;
    }
  }
  
  // Add bluff hands (suited connectors, suited aces)
  const bluffHands = [
    'A5s', 'A4s', 'A3s', 'A2s', // Wheel aces
    '76s', '65s', '54s', '43s',  // Suited connectors
    '87s', '98s', 'T9s', 'J9s',  // More suited connectors
    'K5s', 'K4s', 'K3s', 'K2s',  // Suited kings (blockers)
    'Q5s', 'Q4s', 'Q3s', 'Q2s'   // Suited queens (blockers)
  ];
  
  comboCount = 0;
  for (const hand of bluffHands) {
    if (comboCount >= bluffCombos) break;
    
    const combos = getHandCombos(hand);
    for (const combo of combos) {
      if (comboCount >= bluffCombos) break;
      
      if (!rangeData[combo]) {
        const handAction: HandAction = {
          raise: action === 'raise' ? 1 : 0,
          call: action === 'call' ? 1 : 0,
          fold: 0
        };
        
        rangeData[combo] = handAction;
        comboCount++;
      }
    }
  }
  
  return rangeData;
}

/**
 * Build a merged range (gradual strength distribution)
 */
export function buildMergedRange(percentage: number, action: Action): RangeData {
  const rangeData: RangeData = {};
  const targetCombos = Math.floor((percentage / 100) * 1326);
  let comboCount = 0;
  
  for (const hand of HAND_RANKINGS) {
    if (comboCount >= targetCombos) break;
    
    const combos = getHandCombos(hand);
    for (const combo of combos) {
      if (comboCount >= targetCombos) break;
      
      // Calculate frequency based on position in range
      // Stronger hands have higher frequency
      const strength = 1 - (comboCount / targetCombos);
      const frequency = 0.5 + (strength * 0.5); // 50% to 100% frequency
      
      const handAction: HandAction = {
        raise: action === 'raise' ? frequency : 0,
        call: action === 'call' ? frequency : 0,
        fold: 1 - frequency
      };
      
      rangeData[combo] = handAction;
      comboCount++;
    }
  }
  
  return rangeData;
}

/**
 * Apply a template to build a range
 */
export function applyRangeTemplate(template: string, percentage: number): RangeData {
  switch (template) {
    case 'tight-aggressive':
      return buildLinearRange(15, 'raise');
    
    case 'loose-aggressive':
      return buildLinearRange(30, 'raise');
    
    case 'gto-open':
      return buildLinearRange(22, 'raise');
    
    case '3bet-linear':
      return buildLinearRange(percentage, 'raise');
    
    case '3bet-polar':
      return buildPolarizedRange(percentage, 'raise');
    
    case 'defend':
      return buildLinearRange(percentage, 'call');
    
    default:
      return {};
  }
}

/**
 * Calculate range equity vs opponent range
 * (Simplified - real implementation would need full equity calculations)
 */
export function calculateRangeVsRange(_hero: RangeData, _villain: RangeData): number {
  // Placeholder for equity calculation
  // In real implementation, would calculate equity for each combo matchup
  return 0.5;
}