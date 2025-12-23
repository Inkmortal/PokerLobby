# Progress

## Current Status
**Project Phase**: Architecture Pivot - Hybrid Python/TypeScript
**Date Started**: 2025-08-13
**Last Updated**: 2025-12-23

## Major Architecture Decision (2025-12-23)

### The Pivot
Transitioning from Rust-only solver to **hybrid Python/TypeScript architecture** to support exploitative training against population-modeled opponents.

### Why
1. Current Rust solver (postflop-solver) is postflop-only, 2-player focused
2. No exploitative profile support - only node-locking (creates brittle, robotic play)
3. Training requires modeling opponent types (fish, nits, whales, LAGs)
4. GTO vs GTO training is incomplete - real value is learning to exploit

### New Stack
- **Keep**: React + TypeScript frontend, Electron, existing UI components
- **Add**: Python backend with RLCard + phevaluator + custom profile system
- **Deprecate**: Rust postflop-solver (keep for reference)

## What Works

### Frontend (Complete - Keep As-Is)
- **Range Builder UI** - Visual 169-combo hand matrix
- **ActionSequenceBar** - Betting tree visualization
- **Table Settings** - Game configuration
- **Paint Tools** - Range frequency adjustment
- **Game Engine (TypeScript)** - Betting logic, position ordering

### Infrastructure (Complete)
- React + TypeScript + Vite build system
- Electron desktop app
- Memory bank documentation system
- Git repository with proper structure

### Betting Logic (Complete)
- Raise counting system (raiseCount field)
- All betting levels (2-bet through 6-bet+)
- SPR-based all-in thresholds
- Position-specific settings overrides

## What's Being Replaced

### Rust Solver (Deprecated)
- **Status**: Keep code for reference, not primary engine
- **Reason**:
  - Postflop only
  - No exploitative profiles
  - Development suspended by author
  - Node-locking is inferior to utility biasing

## Refactoring Roadmap

### Phase 1: Python Backend Foundation
**Goal**: Set up Python backend with basic solver capability

- [ ] Create `src/backend/` directory structure
- [ ] Set up Python virtual environment
- [ ] Install RLCard + phevaluator
- [ ] Create JSON-RPC or FastAPI server
- [ ] Build Electron ↔ Python subprocess bridge
- [ ] Basic game state communication test

**Deliverable**: Python backend responds to solve requests from Electron

### Phase 2: Profile System (Core Feature)
**Goal**: Implement GTO Wizard-style utility biasing

- [ ] Define PlayerProfile dataclass
- [ ] Create predefined archetypes:
  - Fish (calls too much)
  - Nit (folds too much)
  - Whale (never folds)
  - Calling Station (passive caller)
  - LAG (loose-aggressive)
  - Maniac (hyper-aggressive)
  - TAG (solid regular)
  - GTO (no bias)
- [ ] Modify RLCard CFR to accept bias tensors
- [ ] Implement biased regret update formula
- [ ] Build profile configuration UI in frontend
- [ ] Test profile behavior matches expected HUD stats

**Deliverable**: Solver produces different strategies based on profile

### Phase 3: Card Abstraction (Speed)
**Goal**: Enable real-time decisions via hand bucketing

- [ ] Implement EHS (Expected Hand Strength) calculator
- [ ] Use phevaluator for equity computation
- [ ] Build K-Means clustering for hand abstraction
- [ ] Create bucket precomputation pipeline
- [ ] Implement configurable granularity levels:
  - High (50k+ buckets) - Analysis mode
  - Standard (10k buckets) - Training mode
  - Fast (1k buckets) - Real-time mode
- [ ] Connect abstraction to solver

**Deliverable**: Solver runs fast enough for training sessions

### Phase 4: Training Mode Integration
**Goal**: Connect solver to training UI

- [ ] Table simulation engine (mixed player types)
- [ ] Real-time GTO comparison during play
- [ ] EV difference display
- [ ] Session statistics tracking
- [ ] Leak detection and suggestions
- [ ] Hand replay with solver analysis

**Deliverable**: Complete training loop with AI opponents

### Phase 5: GPU Acceleration (Future)
**Goal**: JAX-based solver for maximum performance

- [ ] Evaluate Pgx game environments
- [ ] Migrate CFR to JAX
- [ ] Implement MCCFR with jax.vmap
- [ ] GPU memory management for different hardware
- [ ] Dynamic bucketing based on GPU tier

**Deliverable**: Real-time solving on consumer GPUs

## Technical Decisions Made

### Utility Biasing > Node Locking
**Decision**: Use utility bias (GTO Wizard approach) instead of node-locking
**Reason**: Node-locking creates robotic play; utility bias creates organic tendencies
**Implementation**: Modify CFR regret formula: `regret = cfv - node_value + bias * pot`

### RLCard as Game Engine
**Decision**: Use RLCard instead of custom engine or OpenSpiel
**Reason**: Full NLHE support, built-in CFR, active development, simpler than OpenSpiel

### phevaluator for Hand Evaluation
**Decision**: Use phevaluator instead of building custom evaluator
**Reason**: 100KB lookup tables, nanosecond evaluation, battle-tested

### Python Subprocess Communication
**Decision**: Use subprocess with JSON-RPC over HTTP API
**Reason**: Simpler bundling, no network overhead, better for desktop app

## Known Issues / Blockers

### Current
- None - ready to begin Phase 1

### Resolved
- ~~Rust solver doesn't support exploitative profiles~~ → Pivoting to Python
- ~~Node-locking creates brittle AI~~ → Using utility biasing instead

## Research Findings

### Libraries Evaluated
| Library | Purpose | Decision |
|---------|---------|----------|
| RLCard | Game engine + CFR | **USE** |
| OpenSpiel | Alternative engine | Backup (more complex) |
| phevaluator | Hand evaluation | **USE** |
| cfrx | JAX CFR | Future (Phase 5) |
| Pgx | JAX game envs | Future (Phase 5) |
| poker-hand-clustering | Card abstraction | **USE** |
| postflop-solver (Rust) | Current solver | **DEPRECATE** |

### Key Insights
1. GTO Wizard's moat is their profile system, not the solver
2. Utility bias propagates across entire game tree (unlike node-locking)
3. Card abstraction is the speed lever (accuracy vs performance tradeoff)
4. K-Means with EHS + EMD is state-of-the-art for abstraction
5. Pluribus architecture validates multi-player biased solving

## Metrics

### Performance Targets
- Solver response: < 2 seconds for common spots
- Training mode: 60 FPS UI with < 500ms AI decisions
- Card abstraction precompute: < 5 minutes startup

### Quality Targets
- Profile behavior matches target HUD stats (±5%)
- CFR converges to < 1% exploitability with no bias
- GTO strategy identical to reference solver

## Next Actions

1. **Create Python backend structure**
   - `src/backend/` directory
   - `requirements.txt` with dependencies
   - Basic `server.py` skeleton

2. **Install and test RLCard**
   - Verify NLHE environment works
   - Test vanilla CFR implementation
   - Understand CFR internals for modification

3. **Build Electron-Python bridge**
   - Subprocess spawning in `electron/pythonBridge.js`
   - JSON-RPC protocol implementation
   - Basic ping/pong communication test

4. **Implement first profile**
   - Start with "Fish" profile
   - Modify CFR update step
   - Verify increased calling frequency