# Solver Algorithms & Implementation

## Core Algorithm: Counterfactual Regret Minimization (CFR)

### The Universal Algorithm
**Key Insight**: The SAME CFR algorithm works for both preflop and postflop solving. The only difference is the size and structure of the game tree.

```typescript
// The core CFR algorithm - works for ANY poker game tree
function cfr(node: GameNode, player: number, reachProbs: number[]): number[] {
  if (node.isTerminal()) {
    return calculatePayoffs(node);
  }
  
  if (node.player === player) {
    // Calculate regrets for each action
    const regrets = [];
    for (const action of node.actions) {
      const utility = cfr(action.child, player, newReachProbs);
      const regret = utility - currentUtility;
      regrets.push(regret);
    }
    
    // Update strategy based on regrets
    node.strategy = regretMatching(regrets);
  }
  
  return expectedUtility;
}
```

## Postflop vs Preflop: Same Math, Different Scale

### Postflop Solving (Current Implementation)
```typescript
const postflopSolve = {
  treeSize: 10**6,        // ~1 million nodes
  players: 2,             // Heads-up only
  startingPoint: 'flop',  // Given ranges
  iterations: 1000,       // Converges quickly
  time: 'seconds',        // Fast
  memory: '500MB'         // Fits in RAM easily
};
```

### Preflop Heads-Up (Achievable)
```typescript
const preflopHUSolve = {
  treeSize: 10**9,        // ~1 billion nodes
  players: 2,             // BTN vs BB
  startingPoint: 'preflop',
  iterations: 10000,      // Needs more iterations
  time: 'hours',          // With 64GB RAM
  memory: '10-20GB'       // Still manageable
};
```

### Preflop 6-Max Full GTO (Very Hard)
```typescript
const preflop6MaxSolve = {
  treeSize: 10**15,       // Quadrillion nodes
  players: 6,             // All positions
  startingPoint: 'preflop',
  iterations: 100000,     // Many iterations
  time: 'weeks',          // Even with abstractions
  memory: 'terabytes'     // Requires abstractions
};
```

## Making Preflop Tractable

### 1. Abstraction Techniques

```typescript
class PreflopAbstraction {
  // Hand Bucketing: 1326 hands → 200 buckets
  bucketHands() {
    return {
      'premium': ['AA', 'KK', 'QQ', 'AKs'],
      'strong_broadway': ['AKo', 'AQs', 'AQo', 'KQs'],
      'medium_pairs': ['99', '88', '77'],
      'suited_wheel_aces': ['A5s', 'A4s', 'A3s', 'A2s'],  // Group together
      // ... ~200 total buckets
    };
  }
  
  // Flop Sampling: 1755 flops → 100 samples
  sampleFlops() {
    // Pick representative flops
    return [
      'AKQ',   // Broadway
      'A72r',  // Dry ace-high
      'JT9tt', // Wet connected
      '765tt', // Low connected
      'KK4',   // Paired
      // ... ~100 total
    ];
  }
  
  // Action Abstraction: Continuous → Discrete
  limitBetSizes() {
    return {
      preflop: [2.5, 3],      // RFI sizes only
      '3bet': [3, 3.5],       // Limited 3bet sizes
      '4bet': [2.2, 2.5],     // Limited 4bet sizes
    };
  }
}
```

### 2. Node-Locking Optimization

**Key Innovation**: Instead of solving for equilibrium among all players, fix some strategies and solve for best response.

```typescript
class FastPreflopSolver {
  // Traditional: Solve 6-player equilibrium (impossible)
  solveFullGTO(positions: Position[]) {
    // All 6 players optimize against each other
    // Complexity: O(n^6)
    // Time: Weeks
  }
  
  // Our approach: Fix 5, solve 1 (fast!)
  solveBestResponse(hero: Position, villains: PlayerProfile[]) {
    // Fix villain strategies from profiles
    const fixedStrategies = villains.map(v => v.ranges);
    
    // Only solve for hero's best response
    // Complexity: O(n)
    // Time: Minutes
    
    return cfr(tree, hero, fixedStrategies);
  }
  
  // Hybrid: Iterate toward equilibrium
  iterativeSolve(profiles: PlayerProfile[]) {
    // Round 1: Each player best-responds to current profiles
    for (let pos of positions) {
      profiles[pos] = solveBestResponse(pos, profiles);
    }
    // Round 2: Repeat with updated profiles
    // Converges to equilibrium but starts from realistic profiles
  }
}
```

## Constructing 6-Max from Smaller Solves

### Breaking Down the Problem

Instead of solving 6-max as one massive game, we decompose it into manageable pieces:

```typescript
class TableConstructor {
  build6MaxStrategy() {
    // 1. Opening ranges (single player decisions)
    const openingRanges = {
      UTG: solveOpening('UTG', stackSize, rake),
      MP: solveOpening('MP', stackSize, rake),
      CO: solveOpening('CO', stackSize, rake),
      BTN: solveOpening('BTN', stackSize, rake),
      SB: solveOpening('SB', stackSize, rake),
    };
    
    // 2. HU responses (most common)
    const huMatchups = [
      'UTG_vs_BB',    // UTG opens, only BB defends
      'MP_vs_BB',     // MP opens, only BB defends
      'CO_vs_BB',     // CO opens, only BB defends
      'BTN_vs_BB',    // BTN opens, only BB defends
      'BTN_vs_SB',    // BTN opens, only SB plays
      'SB_vs_BB',     // SB opens, BB defends
      // ... ~30 total HU matchups
    ];
    
    // 3. 3-way spots (less common)
    const threewaySpots = [
      'CO_BTN_BB',    // CO opens, BTN calls, BB plays
      'MP_CO_BB',     // MP opens, CO calls, BB plays
      'UTG_MP_BB',    // UTG opens, MP calls, BB plays
      // ... ~20 common 3-way scenarios
    ];
    
    // 4. Combine into complete strategy
    return combineStrategies(openingRanges, huMatchups, threewaySpots);
  }
}
```

### Why This Works

1. **Most spots reduce to HU**:
   - 6-max preflop → someone opens → usually 1 caller/3bettor → HU
   - Even multiway pots → usually HU by the turn

2. **Limited action sequences**:
   ```typescript
   // There are only ~50 common preflop sequences:
   const commonSequences = [
     'UTG_open_BB_defend',
     'BTN_open_BB_3bet_BTN_call',
     'CO_open_BTN_call_BB_squeeze',
     // ... finite and manageable!
   ];
   ```

3. **Precomputation is feasible**:
   ```typescript
   // Solve all common spots once
   // Store in database
   // Instant lookup during play!
   class PreflopDatabase {
     constructor() {
       this.solutions = new Map();
       // Pre-solve all common spots
       for (const spot of commonSequences) {
         this.solutions.set(spot, solve(spot));
       }
     }
     
     getStrategy(position, action, history) {
       // O(1) lookup - instant!
       return this.solutions.get(key);
     }
   }
   ```

## Implementation Phases

### Phase 1: Postflop (We Have This)
- Use postflop-solver
- Already works, fast, accurate

### Phase 2: Preflop HU (Next Step)
```typescript
class PreflopHUSolver {
  solve(stack: number, rake: RakeStructure) {
    const tree = buildPreflopTree({
      positions: ['BTN', 'BB'],
      stack,
      rake,
      betSizes: [2.5, 3],  // Limited for speed
    });
    
    // Same CFR algorithm!
    return cfr(tree, iterations = 10000);
  }
}
```

### Phase 3: Profile-Based 6-Max
```typescript
class Profile6MaxSolver {
  solve(hero: Position, table: TableProfiles) {
    // Fix everyone except hero
    const constraints = createNodeLocks(table);
    
    // Solve for hero's best response
    // 100x faster than full equilibrium
    return cfr(tree, hero, constraints);
  }
}
```

### Phase 4: Full 6-Max GTO (Future)
```typescript
class Full6MaxSolver {
  solve() {
    // Use all abstractions
    const abstractedTree = createAbstractedTree();
    
    // Run for many iterations
    // Possibly distributed computing
    return cfr(abstractedTree, iterations = 100000);
  }
}
```

## Key Advantages of Our Approach

1. **Same Core Algorithm**: CFR works for everything
2. **Incremental Development**: Start simple, add complexity
3. **Fast Practical Solutions**: Profile-based solving in minutes
4. **Future-Proof**: Can add full GTO later
5. **User-Focused**: Exploitative strategies for real games

## Performance Optimizations

### Memory Management
```typescript
// Use bit-packed strategies
class CompressedStrategy {
  // Instead of float[1326] for each node
  // Use uint16[200] with bucketing
  // 80% memory reduction
}
```

### Parallelization
```typescript
// CFR is embarrassingly parallel
class ParallelCFR {
  solve() {
    // Each thread handles different boards
    parallel.forEach(boards, board => {
      cfr(tree, board);
    });
  }
}
```

### Incremental Solving
```typescript
// Don't solve everything at once
class IncrementalSolver {
  // Solve common spots first
  solveCritical();    // BTN vs BB
  solveCommon();      // CO vs BTN
  solveRare();        // UTG vs UTG+1
}
```

## The Decomposition Strategy

The key insight is that 6-max poker naturally decomposes into smaller games:

1. **Opening decisions** (single-player)
2. **HU confrontations** (2-player) 
3. **Multiway pots** (3-4 player, rare)

By solving these ~50 smaller games and combining them intelligently, we get a complete 6-max strategy without ever solving the intractable full 6-player game!