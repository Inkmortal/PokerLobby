# PokerLobby Solver Implementation Guide

## Based on TexasSolver Analysis

### Core Algorithm: Discounted CFR

#### Key Parameters (from TexasSolver)
```cpp
constexpr static float alpha = 1.5f;  // Positive regret weighting
constexpr static float beta = 0.5f;   // Negative regret weighting  
constexpr static float gamma = 2;     // Discount factor denominator
constexpr static float theta = 0.9f;  // Linear averaging weight
```

#### Algorithm Steps
1. **Initialize** all strategies uniformly
2. **Iterate** through game tree with CFR traversal
3. **Update regrets** with discounting: `r_t = r_{t-1} * (t/(t+1))^gamma`
4. **Compute strategy** via regret matching
5. **Average strategies** over iterations

### Critical Components to Implement

#### 1. Hand Evaluation System
- **Lookup Table**: 2,598,960 entries (all 5-card combinations)
- **Binary format**: 133KB compressed (vs 50MB+ uncompressed)
- **Ranking system**: Lower number = better hand (166 = quad 2s with 3 kicker)
- **Implementation**: Load once into memory, use for all evaluations

#### 2. Game Tree Structure
```typescript
interface GameTreeNode {
  type: 'action' | 'chance' | 'terminal' | 'showdown';
  pot: number;
  round: 'preflop' | 'flop' | 'turn' | 'river';
}

interface ActionNode extends GameTreeNode {
  player: 0 | 1;
  actions: Action[];
  trainable: Trainable[];  // Strategy storage
}
```

#### 3. Range Management
```typescript
interface PrivateCards {
  cards: [Card, Card];
  weight: number;  // Initial probability
  hashCode(): number;
}

interface RangeManager {
  ranges: PrivateCards[][];  // [player][hand]
  getCompatibleHands(board: Card[]): PrivateCards[];
}
```

#### 4. Strategy Storage Optimization
- **Half-floats**: Use Float16Array for 50% memory savings
- **Lazy allocation**: Only create trainables when needed
- **Compression**: Store only non-zero strategies

### WebAssembly Architecture

#### Module Structure
```
wasm/
├── solver.cpp         # Core CFR implementation
├── evaluator.cpp      # Hand evaluation
├── tree.cpp          # Game tree operations
└── bindings.cpp      # JS interface
```

#### Key Exports
```typescript
interface WASMSolver {
  createTree(config: TreeConfig): number;  // Returns tree pointer
  solve(treePtr: number, iterations: number): void;
  getStrategy(nodeId: number, hand: number[]): Float32Array;
  getEV(nodeId: number, hand: number[]): number;
  destroy(treePtr: number): void;
}
```

### Performance Optimizations

#### 1. Parallelization Strategy
```typescript
// Use Web Workers for parallel solving
class SolverWorkerPool {
  workers: Worker[] = [];
  
  constructor(threads: number = navigator.hardwareConcurrency) {
    for (let i = 0; i < threads; i++) {
      this.workers.push(new Worker('solver.worker.js'));
    }
  }
  
  async solveParallel(boards: Card[][]): Promise<Solution[]> {
    // Distribute boards across workers
  }
}
```

#### 2. Memory Management
- **Object pooling**: Reuse arrays to reduce GC
- **Typed arrays**: Use Float32Array/Uint8Array
- **Streaming**: Load large trees progressively
- **Compression**: zlib for storage/transfer

#### 3. Suit Isomorphism
```typescript
// Map equivalent boards (saves 4x computation)
function getIsomorphicBoard(board: Card[]): Card[] {
  // Normalize suits to canonical form
  // e.g., Ah Kh Qd -> As Ks Qd (hearts -> spades)
  const suitMap = computeSuitMapping(board);
  return board.map(card => mapCard(card, suitMap));
}
```

### Implementation Phases

#### Phase 1: Core Engine (Week 1)
```typescript
// Basic structures
class Card { rank: number; suit: number; }
class Deck { cards: Card[]; }
class Hand { evaluate(): number; }

// Game tree
class GameTree {
  root: GameTreeNode;
  build(config: GameConfig): void;
}
```

#### Phase 2: CFR Solver (Week 2)
```typescript
class CFRSolver {
  private tree: GameTree;
  private trainables: Map<string, Trainable>;
  
  solve(iterations: number): void {
    for (let i = 0; i < iterations; i++) {
      this.cfr(0, this.tree.root, [1, 1], i);
    }
  }
  
  private cfr(player: number, node: GameTreeNode, 
              reachProbs: number[], iter: number): number[] {
    // CFR implementation
  }
}
```

#### Phase 3: WebAssembly Port (Week 3)
```cpp
// solver.cpp
extern "C" {
  EMSCRIPTEN_KEEPALIVE
  void* create_solver(int p1_range_size, int p2_range_size) {
    return new Solver(p1_range_size, p2_range_size);
  }
  
  EMSCRIPTEN_KEEPALIVE
  void solve(void* solver_ptr, int iterations) {
    static_cast<Solver*>(solver_ptr)->solve(iterations);
  }
}
```

#### Phase 4: UI Integration (Week 4)
```typescript
// React component
function SolverUI() {
  const [solver] = useState(() => new WASMSolver());
  const [progress, setProgress] = useState(0);
  
  const handleSolve = async () => {
    solver.onProgress = setProgress;
    await solver.solve(config);
  };
}
```

### Testing Strategy

#### Unit Tests
- Hand evaluation accuracy
- Tree building correctness
- CFR convergence
- Memory leak detection

#### Integration Tests
- WASM module loading
- Worker communication
- UI responsiveness
- Solution accuracy vs TexasSolver

#### Performance Benchmarks
- Target: < 2s for common spots
- Memory: < 500MB for typical trees
- Accuracy: < 0.5% exploitability

### Risk Mitigation

#### Memory Constraints
- **Problem**: Browsers limit WASM memory
- **Solution**: Implement paging, use IndexedDB for large trees

#### Performance Gap
- **Problem**: JavaScript slower than C++
- **Solution**: Optimize hot paths in WASM, use SIMD

#### Complexity
- **Problem**: CFR implementation is complex
- **Solution**: Start simple, add optimizations incrementally

### Deliverables

#### Week 1-2: Foundation
- [ ] Basic game engine in TypeScript
- [ ] Hand evaluator with lookup tables
- [ ] Simple tree builder
- [ ] Unit test suite

#### Week 3-4: Solver Core
- [ ] CFR implementation
- [ ] WASM compilation pipeline
- [ ] Worker-based parallelization
- [ ] Accuracy validation

#### Week 5-6: UI & Polish
- [ ] React solver interface
- [ ] Range editor
- [ ] Solution browser
- [ ] Export functionality

### Success Metrics
1. **Accuracy**: Match TexasSolver within 0.1% exploitability
2. **Speed**: Solve standard spots in < 3 seconds
3. **Memory**: Use < 50% of TexasSolver's memory
4. **UX**: Clean, intuitive interface

### Next Steps
1. Set up TypeScript + WASM build pipeline
2. Implement basic card/deck/hand classes
3. Create hand evaluator with lookup tables
4. Build simple game tree
5. Implement basic CFR (no optimizations)
6. Add test suite
7. Optimize and parallelize