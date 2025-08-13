# Player Profile System & Node-Locking

## Overview
The player profile system allows users to train against realistic opponents with specific tendencies, rather than just GTO vs GTO. This uses node-locking (constraint solving) to find exploitative strategies.

## Core Concept

Instead of solving for Nash equilibrium (GTO vs GTO), we:
1. **Fix one player's strategy** to match their tendencies
2. **Solve for best response** (exploitative strategy)
3. **Train against realistic opponents** from your stakes

## Player Profile Structure

```typescript
interface PlayerProfile {
  // Metadata
  id: string;
  name: string;
  category: 'Nit' | 'TAG' | 'LAG' | 'Fish' | 'Reg' | 'Whale' | 'Custom';
  stakes: '2NL' | '5NL' | '10NL' | '25NL' | '50NL' | '100NL' | '200NL+';
  
  // Preflop Ranges - FULL RANGES STORED
  preflop: {
    // Opening ranges by position
    ranges: {
      UTG_RFI: string;        // "AA-TT,AKs-AJs,AKo-AQo,KQs"
      UTG_FOLD: string;       // Everything else
      MP_RFI: string;
      MP_FOLD: string;
      CO_RFI: string;
      CO_FOLD: string;
      BTN_RFI: string;
      BTN_FOLD: string;
      SB_RFI: string;
      SB_LIMP: string;
      SB_FOLD: string;
      
      // 3-bet ranges for all position matchups
      BB_3BET_vs_UTG: string;
      BB_CALL_vs_UTG: string;
      BB_FOLD_vs_UTG: string;
      
      BB_3BET_vs_MP: string;
      BB_CALL_vs_MP: string;
      BB_FOLD_vs_MP: string;
      
      BB_3BET_vs_CO: string;
      BB_CALL_vs_CO: string;
      BB_FOLD_vs_CO: string;
      
      BB_3BET_vs_BTN: string;
      BB_CALL_vs_BTN: string;
      BB_FOLD_vs_BTN: string;
      
      BB_3BET_vs_SB: string;
      BB_CALL_vs_SB: string;
      BB_FOLD_vs_SB: string;
      
      // 4-bet ranges
      UTG_4BET_vs_MP: string;
      UTG_CALL_vs_MP_3BET: string;
      UTG_FOLD_vs_MP_3BET: string;
      // ... all position matchups
      
      // Squeeze ranges
      BB_SQUEEZE_vs_CO_BTN: string;
      // ... etc
    };
    
    // Quick-edit frequencies (for UI sliders)
    // These AUTO-UPDATE the ranges above
    frequencies: {
      UTG_RFI_FREQ: number;      // 15% → updates UTG_RFI range
      MP_RFI_FREQ: number;        // 18% → updates MP_RFI range
      CO_RFI_FREQ: number;        // 26% → updates CO_RFI range
      BTN_RFI_FREQ: number;       // 45% → updates BTN_RFI range
      
      // 3-bet frequencies
      BB_3BET_vs_BTN_FREQ: number;  // 12% → updates BB_3BET_vs_BTN range
      BB_3BET_vs_CO_FREQ: number;
      // ... etc
      
      // Global adjustments
      TIGHTNESS: number;        // 0.5 = 50% tighter, 2.0 = 2x looser
      AGGRESSION: number;       // Affects 3bet/4bet frequencies
    };
  };
  
  // Postflop Tendencies
  postflop: {
    // Detailed frequencies by spot
    flop: {
      // C-bet frequencies by texture
      cbet_dry_board: number;         // A72r
      cbet_wet_board: number;         // JT9tt
      cbet_paired_board: number;      // KK4
      
      // By position
      cbet_ip: number;
      cbet_oop: number;
      
      // Check-raise by texture
      check_raise_dry: number;
      check_raise_wet: number;
      
      // Donk betting
      donk_frequency: number;
      donk_sizing: number;           // As % of pot
    };
    
    turn: {
      barrel_frequency: number;       // After cbetting flop
      delayed_cbet: number;          // After checking flop
      check_raise: number;
      probe_bet: number;             // After opponent checks back
    };
    
    river: {
      triple_barrel: number;         // Complete all 3 streets
      bluff_frequency: number;       // % of bluffs in range
      thin_value_freq: number;       // How thin they value
      bluff_catch_freq: number;      // How often they call
      overbet_freq: number;
    };
    
    // Sizing tendencies (as multipliers of pot)
    sizing: {
      flop_cbet_size: number;        // 0.33 = 1/3 pot, 0.75 = 3/4 pot
      turn_barrel_size: number;
      river_bet_size: number;
      check_raise_size: number;      // Multiplier of opponent bet
      preferred_sizes: number[];     // [0.33, 0.75, 1.5] common sizes
    };
  };
  
  // Known exploits with NUMERICAL VALUES
  exploits: {
    // Preflop exploits
    folds_to_3bet: number;           // 0.65 = folds 65% to 3bets (GTO: 45%)
    folds_to_4bet: number;           // 0.80 = folds 80% to 4bets
    calls_3bets_too_wide: number;   // 1.5 = calls 50% more than GTO
    
    // Postflop exploits
    folds_to_cbet: {
      flop: number;                  // 0.55 = folds 55% (GTO: 42%)
      turn: number;                  // 0.65 = folds 65% (GTO: 45%)
      river: number;                 // 0.70 = folds 70% (GTO: 50%)
    };
    
    // Specific leaks
    overfolds_to_triple_barrel: number;  // 0.85 = folds 85% (GTO: 55%)
    underfolds_river: number;            // 0.25 = folds 25% (GTO: 50%)
    doesnt_bluff_river: number;         // 0.05 = 5% bluffs (GTO: 33%)
    always_cbets_aces: number;          // 0.95 = cbets AA 95% (GTO: 75%)
    
    // Timing tells (online)
    quick_fold_means_weak: number;      // 0.90 = 90% correlation
    tank_means_strong: number;          // 0.75 = 75% correlation
  };
}
```

## Range Construction System

### Automatic Range Generation from Frequencies

```typescript
class RangeGenerator {
  // Convert frequency to actual range
  generateRange(
    position: string, 
    action: string, 
    frequency: number,
    handRankings?: HandRanking[]  // Optional custom rankings
  ): string {
    // Default hand rankings (can be customized)
    const rankings = handRankings || this.getDefaultRankings(position, action);
    
    // Calculate how many combos we need
    const totalCombos = 1326;  // Total possible hands
    const targetCombos = Math.floor(totalCombos * frequency);
    
    // Build range from top hands
    let range = [];
    let currentCombos = 0;
    
    for (const hand of rankings) {
      if (currentCombos >= targetCombos) break;
      
      const combos = this.getCombos(hand);
      if (currentCombos + combos <= targetCombos) {
        range.push(hand);
        currentCombos += combos;
      } else {
        // Partial inclusion (e.g., "AQo:0.5" = 50% frequency)
        const needed = targetCombos - currentCombos;
        const weight = needed / combos;
        range.push(`${hand}:${weight.toFixed(2)}`);
        break;
      }
    }
    
    return range.join(',');
  }
  
  // Adjust existing range by percentage
  adjustRange(currentRange: string, multiplier: number): string {
    const hands = this.parseRange(currentRange);
    
    if (multiplier > 1) {
      // Make looser - add more hands
      return this.expandRange(hands, multiplier);
    } else {
      // Make tighter - remove weakest hands
      return this.tightenRange(hands, multiplier);
    }
  }
}
```

### UI Range Editor

```tsx
function ProfileRangeEditor({ profile, position }: Props) {
  const [frequency, setFrequency] = useState(15); // %
  const [range, setRange] = useState(profile.preflop.ranges.UTG_RFI);
  
  // Auto-update range when frequency changes
  const handleFrequencyChange = (newFreq: number) => {
    setFrequency(newFreq);
    const newRange = rangeGenerator.generateRange('UTG', 'RFI', newFreq / 100);
    setRange(newRange);
    profile.preflop.ranges.UTG_RFI = newRange;
    profile.preflop.frequencies.UTG_RFI_FREQ = newFreq;
  };
  
  return (
    <div>
      {/* Quick frequency slider */}
      <Slider
        label="RFI Frequency"
        value={frequency}
        onChange={handleFrequencyChange}
        min={0}
        max={100}
        marks={[
          { value: 8, label: 'Nit' },
          { value: 15, label: 'TAG' },
          { value: 25, label: 'LAG' },
          { value: 40, label: 'Maniac' }
        ]}
      />
      
      {/* Visual range grid */}
      <RangeGrid
        range={range}
        onChange={setRange}
        onFrequencyUpdate={(freq) => setFrequency(freq * 100)}
      />
      
      {/* Manual text input */}
      <TextField
        label="Range String"
        value={range}
        onChange={(e) => setRange(e.target.value)}
        placeholder="AA-TT,AKs-AJs,AKo-AQo"
      />
      
      {/* Quick presets */}
      <ButtonGroup>
        <Button onClick={() => loadPreset('GTO')}>GTO</Button>
        <Button onClick={() => loadPreset('Tight')}>Tight</Button>
        <Button onClick={() => loadPreset('Loose')}>Loose</Button>
        <Button onClick={() => loadPreset('Population')}>Population</Button>
      </ButtonGroup>
    </div>
  );
}
```

## Profile Creation Workflow

### Quick Profile Builder

```tsx
function QuickProfileBuilder() {
  const [baseProfile, setBaseProfile] = useState('TAG');
  const [adjustments, setAdjustments] = useState({
    tightness: 1.0,      // Multiplier
    aggression: 1.0,     // Multiplier
    position: 'standard' // or 'tight' or 'loose'
  });
  
  const buildProfile = () => {
    // Start with base profile
    let profile = profiles.getBase(baseProfile);
    
    // Apply global adjustments
    profile = profileAdjuster.adjust(profile, adjustments);
    
    // Generate all ranges
    for (const [spot, freq] of Object.entries(profile.preflop.frequencies)) {
      const range = rangeGenerator.generateRange(spot, freq);
      profile.preflop.ranges[spot] = range;
    }
    
    return profile;
  };
  
  return (
    <Wizard>
      <Step1>
        <h3>Choose Base Profile</h3>
        <Select value={baseProfile}>
          <Option value="NIT">Nit (Very Tight)</Option>
          <Option value="TAG">TAG (Tight Aggressive)</Option>
          <Option value="LAG">LAG (Loose Aggressive)</Option>
          <Option value="WHALE">Whale (Very Loose)</Option>
        </Select>
      </Step1>
      
      <Step2>
        <h3>Adjust Overall Tendencies</h3>
        <Slider 
          label="Tightness"
          value={adjustments.tightness}
          min={0.5}  // 50% tighter
          max={2.0}  // 2x looser
        />
        <Slider 
          label="Aggression"
          value={adjustments.aggression}
          min={0.5}  // 50% less aggressive
          max={2.0}  // 2x more aggressive
        />
      </Step2>
      
      <Step3>
        <h3>Fine-tune Specific Spots</h3>
        <RangeEditor position="UTG" />
        <RangeEditor position="BTN" />
        <FrequencyEditor spot="3bet_vs_BTN" />
      </Step3>
      
      <Step4>
        <h3>Set Exploits</h3>
        <NumberInput 
          label="Folds to 3-bet %"
          value={65}
          hint="GTO: 45%"
        />
        <NumberInput 
          label="River bluff %"
          value={15}
          hint="GTO: 33%"
        />
      </Step4>
    </Wizard>
  );
}
```

## Profile Templates

### Pre-built Profiles with Full Ranges

```typescript
const profiles = {
  NIT_2NL: {
    name: "Typical 2NL Nit",
    preflop: {
      ranges: {
        UTG_RFI: "AA-TT,AKs,AKo",  // 4.5%
        MP_RFI: "AA-TT,AKs-AQs,AKo",  // 6%
        CO_RFI: "AA-99,AKs-AJs,AKo-AQo,KQs",  // 9%
        BTN_RFI: "AA-77,AKs-ATs,AKo-AJo,KQs-KJs,QJs",  // 15%
        // ... all ranges defined
      },
      frequencies: {
        UTG_RFI_FREQ: 4.5,
        MP_RFI_FREQ: 6,
        // ... for UI sliders
      }
    },
    exploits: {
      folds_to_3bet: 0.75,  // Overfolds
      river_bluff_freq: 0.08,  // Under-bluffs
      // ... numerical exploits
    }
  },
  
  LAG_REG_100NL: {
    // ... full definition
  }
};
```

## Database Schema

```sql
-- Player profiles with full ranges
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    name VARCHAR(100),
    category VARCHAR(20),
    stakes VARCHAR(20),
    
    -- Store complete range strings
    preflop_ranges JSONB,  -- {"UTG_RFI": "AA-TT,AKs...", ...}
    preflop_frequencies JSONB,  -- {"UTG_RFI_FREQ": 15.5, ...}
    
    -- Detailed postflop stats
    postflop_stats JSONB,
    
    -- Numerical exploits
    exploits JSONB,  -- {"folds_to_3bet": 0.65, ...}
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    source VARCHAR(50)  -- 'manual', 'imported', 'population'
);

-- Quick templates for fast profile creation
CREATE TABLE profile_templates (
    id UUID PRIMARY KEY,
    name VARCHAR(100),
    category VARCHAR(20),
    base_ranges JSONB,
    base_frequencies JSONB,
    description TEXT
);
```

## Benefits of This Approach

1. **Full Range Storage**: Complete strategy, not just frequencies
2. **Quick Adjustments**: Sliders auto-generate appropriate ranges
3. **Numerical Exploits**: Precise values for accurate node-locking
4. **Fast Profile Creation**: Templates + adjustments = instant profiles
5. **Import/Export**: Share profiles with exact ranges
6. **Population Accuracy**: Extract exact ranges from hand histories