# Solver Integration Documentation

## Overview
Complete integration of postflop-solver (Rust) into PokerLobby using native Node.js bindings for maximum performance.

## Architecture Decision: Native vs WASM
- **Chosen**: Native Node.js bindings using napi-rs
- **Rejected**: WebAssembly (20% performance penalty)
- **Reason**: Desktop-first application needs maximum solver performance

## Integration Structure

```
PokerLobby/
├── src/
│   ├── solver/
│   │   ├── rust/               # Complete postflop-solver source
│   │   │   ├── src/
│   │   │   │   ├── action_tree.rs    # Tree configuration
│   │   │   │   ├── bet_size.rs       # Bet sizing options
│   │   │   │   ├── card.rs           # Card operations
│   │   │   │   ├── range.rs          # Range parsing
│   │   │   │   ├── hand.rs           # Hand evaluation
│   │   │   │   ├── hand_table.rs     # Lookup tables
│   │   │   │   ├── solver.rs         # Discounted CFR
│   │   │   │   ├── utility.rs        # Helper functions
│   │   │   │   ├── game/             # Game logic
│   │   │   │   │   ├── base.rs       # PostFlopGame
│   │   │   │   │   ├── evaluation.rs # Terminal evaluation
│   │   │   │   │   ├── node.rs       # Node structures
│   │   │   │   │   └── interpreter.rs # Game state
│   │   │   │   ├── sliceop.rs        # SIMD operations
│   │   │   │   ├── node_bindings.rs  # Node.js interface
│   │   │   │   └── lib.rs            # Main library
│   │   │   ├── Cargo.toml            # Rust dependencies
│   │   │   └── package.json          # Node build config
│   │   └── native/             # Compiled .node output
│   └── api/
│       └── index.ts            # Updated for native calls
```

## Key Components

### 1. PostFlopGame (from postflop-solver)
- Full game tree representation
- Discounted CFR algorithm (γ = 3.0)
- Memory compression (16-bit integers)
- Isomorphism detection
- Bunching effect support

### 2. NativeSolver (our wrapper)
```rust
pub struct NativeSolver {
    game: Option<PostFlopGame>,
}

impl NativeSolver {
    pub fn init_game(&mut self, config: GameConfig)
    pub fn solve(&mut self, max_iterations: u32, target_exploitability: f64)
    pub fn get_strategy(&self) -> Vec<f64>
    pub fn get_ev(&self, player: u32) -> Vec<f64>
    // ... etc
}
```

### 3. Electron Integration
```javascript
// Main process loads native module
const { NativeSolver } = require('./solver/native/poker_solver.node');

// IPC handlers call solver directly
ipcMain.handle('solve-postflop', async (event, config) => {
    solver.initGame(config);
    return solver.solve(1000, 0.01);
});
```

## Build Process

### Requirements
- Rust toolchain installed
- Node.js 18+
- @napi-rs/cli

### Build Steps
```bash
cd src/solver/rust
npm install           # Install napi dependencies
npm run build        # Compile to native .node module
```

### Output
- `src/solver/native/poker_solver.node` - Native module
- Direct loading in Electron main process
- No WASM, no network calls, pure native speed

## Performance Characteristics

### Speed
- **Native**: Full CPU performance
- **Multithreading**: Rayon parallelization
- **SIMD**: Optimized vector operations
- **No overhead**: Direct memory access

### Memory
- **Compression**: 16-bit storage option
- **Efficient**: Custom allocator available
- **Scalable**: Handles large game trees

## API Surface

### Configuration
```typescript
interface GameConfig {
    starting_pot: number;
    effective_stack: number;
    oop_range: string;      // "AA,KK,QQ,AKs..."
    ip_range: string;       
    flop: string;           // "Td9d6h"
    turn?: string;          // "Qc"
    river?: string;         // "7s"
    bet_sizes?: string;     // "60%,100%,a"
}
```

### Methods Available
- `initGame(config)` - Initialize game tree
- `solve(iterations, exploitability)` - Run solver
- `solveStep(iteration)` - Single iteration
- `getExploitability()` - Current exploitability
- `getActions()` - Available actions
- `playAction(index)` - Navigate tree
- `getStrategy()` - Current node strategy
- `getEV(player)` - Expected values
- `getEquity(player)` - Equity values
- `saveToFile(filename)` - Persist solution
- `loadFromFile(filename)` - Load solution

## Next Steps

1. **Compile Module**: Run build process
2. **Wire Main Process**: Load native module in Electron
3. **Create IPC Bridge**: Connect UI to solver
4. **Build UI Components**: 
   - Range Builder
   - Solver Config
   - Solution Browser
   - Strategy Viewer

## Notes

- Solver runs in main process for maximum performance
- UI remains responsive via async IPC
- Solutions can be cached/saved
- Memory usage scales with tree complexity