# System Patterns

## Betting Logic Implementation

### Raise Counting System
- **raiseCount** field tracks actual number of raises/bets per street
- Preflop starts at 1 (blinds count as first bet)
- Postflop starts at 0 (no bets yet)
- Increments on any aggressive action (open, bet, raise, all-in if raising)
- Used to determine what betting level comes next

### Betting Level Mapping
```
Preflop:
- raiseCount 1 → Next action is 2-bet (open)
- raiseCount 2 → Next action is 3-bet
- raiseCount 3 → Next action is 4-bet
- raiseCount 4 → Next action is 5-bet
- raiseCount 5+ → Next action is 6-bet+

Postflop:
- raiseCount 0 → Next action is bet
- raiseCount 1 → Next action is raise (2-bet)
- raiseCount 2 → Next action is 3-bet
```

### Solver Thresholds
1. **addAllInThreshold** (default 150%)
   - Adds all-in option when max bet/pot ratio < threshold
   - Ensures all-in is available in large pot situations

2. **forceAllInThreshold** (default 20%)
   - Converts bets to all-in based on SPR after opponent calls
   - Formula: SPR after call = remaining stack / new pot
   - If SPR < threshold, replace bet with all-in

3. **mergingThreshold** (default 10%)
   - Merges similar bet sizes to reduce complexity
   - Formula: (100 + X) / (100 + Y) < 1.0 + threshold

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Electron Main Process                 │
│  - Window Management                                     │
│  - File System Access                                    │
│  - Native Menus                                         │
└────────────────────┬────────────────────────────────────┘
                     │ IPC
┌────────────────────▼────────────────────────────────────┐
│                   Electron Renderer                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │                 React Application                │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐    │   │
│  │  │  Solver   │ │  Training │ │   Lobby   │    │   │
│  │  │    UI     │ │   Drills  │ │ Multiplayer│    │   │
│  │  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘    │   │
│  │        │             │             │            │   │
│  │  ┌─────▼─────────────▼─────────────▼─────┐    │   │
│  │  │          Core Services Layer           │    │   │
│  │  │  - State Management (Redux/Zustand)    │    │   │
│  │  │  - Data Persistence (SQLite)           │    │   │
│  │  │  - WebSocket Client                    │    │   │
│  │  └─────┬───────────────────────────────┘  │    │   │
│  │        │                                   │    │   │
│  │  ┌─────▼───────────────────────────────┐  │    │   │
│  │  │    WebAssembly Solver Module        │  │    │   │
│  │  │  - C++ Solver Compiled to WASM      │  │    │   │
│  │  │  - TypeScript Bindings              │  │    │   │
│  │  │  - Worker Thread Execution          │  │    │   │
│  │  └─────────────────────────────────────┘  │    │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Component Patterns

### Solver Architecture
```typescript
interface SolverConfig {
  gameType: 'NLHE' | 'PLO';
  stakes: StakeLevel;
  players: PlayerConfig[];
  board: Card[];
  betSizings: BetSizing[];
}

class SolverService {
  private wasmModule: WASMSolver;
  private workerPool: Worker[];
  
  async solve(config: SolverConfig): Promise<Solution>;
  async cancel(): void;
  getProgress(): number;
}
```

### State Management Pattern
Using Redux Toolkit or Zustand for:
- Solver configuration state
- Solution cache
- Training progress
- User preferences
- Hand history database

### Data Flow
1. **User Input** → React Component
2. **Action Dispatch** → State Manager
3. **State Update** → Component Re-render
4. **Heavy Computation** → WebAssembly Worker
5. **Result** → State Update → UI Update

## Key Design Patterns

### 1. Worker Thread Pattern for Solver
```typescript
// Main thread
const solver = new Worker('./solver.worker.js');
solver.postMessage({ type: 'SOLVE', config });
solver.onmessage = (e) => {
  if (e.data.type === 'PROGRESS') updateProgress(e.data.value);
  if (e.data.type === 'SOLUTION') displaySolution(e.data.solution);
};

// Worker thread
self.onmessage = async (e) => {
  if (e.data.type === 'SOLVE') {
    const solution = await wasmSolver.solve(e.data.config);
    self.postMessage({ type: 'SOLUTION', solution });
  }
};
```

### 2. Repository Pattern for Data Access
```typescript
interface HandHistoryRepository {
  save(hands: Hand[]): Promise<void>;
  query(filters: FilterOptions): Promise<Hand[]>;
  aggregate(metric: AggregateType): Promise<Stats>;
}

class SQLiteHandRepository implements HandHistoryRepository {
  // Implementation using SQLite
}
```

### 3. Strategy Pattern for Import Parsers
```typescript
interface HandHistoryParser {
  canParse(content: string): boolean;
  parse(content: string): Hand[];
}

class PokerStarsParser implements HandHistoryParser {}
class GGPokerParser implements HandHistoryParser {}

class ImportService {
  private parsers: HandHistoryParser[] = [
    new PokerStarsParser(),
    new GGPokerParser(),
  ];
  
  import(content: string): Hand[] {
    const parser = this.parsers.find(p => p.canParse(content));
    return parser.parse(content);
  }
}
```

### 4. Observable Pattern for Real-time Updates
```typescript
class SolverProgress extends EventEmitter {
  updateProgress(percent: number) {
    this.emit('progress', percent);
  }
  
  complete(solution: Solution) {
    this.emit('complete', solution);
  }
}
```

## Performance Patterns

### WebAssembly Optimization
- Load WASM module once at startup
- Keep in memory for entire session
- Use SharedArrayBuffer for large data
- Implement progress callbacks

### React Performance
- Memoize expensive computations
- Virtual scrolling for large lists
- Lazy load heavy components
- Code splitting by route

### Data Management
- Index SQLite properly for queries
- Batch inserts for hand histories
- Cache frequently accessed solutions
- Compress stored solutions

## Security Patterns

### Local-First Security
- All data stored locally
- No external API calls for solving
- Encrypted local storage for sensitive data
- Sanitize imported hand histories

### WebAssembly Sandboxing
- WASM runs in isolated environment
- No direct file system access
- Memory-safe by design
- Controlled through TypeScript API

## Testing Patterns

### Component Testing
```typescript
// React Testing Library
test('SolverConfig updates bet sizings', () => {
  render(<SolverConfig />);
  // Test implementation
});
```

### Integration Testing
```typescript
// Solver integration
test('Solver returns valid solution', async () => {
  const solution = await solver.solve(mockConfig);
  expect(solution).toMatchSchema(solutionSchema);
});
```

### E2E Testing
```typescript
// Playwright/Cypress
test('Complete solver workflow', async ({ page }) => {
  await page.goto('/solver');
  // Test full workflow
});
```

## Error Handling Patterns

### Graceful Degradation
- Fallback UI for WASM load failure
- Offline mode for multiplayer
- Partial imports for corrupted files
- Default ranges for missing data

### User Feedback
- Toast notifications for actions
- Progress bars for long operations
- Clear error messages
- Retry mechanisms

## Deployment Patterns

### Electron Distribution
- Auto-updater for patches
- Code signing for security
- Platform-specific builds
- Portable vs installed versions

### Asset Management
- Bundle WASM with app
- Lazy load heavy assets
- CDN for future web version
- Local caching strategies