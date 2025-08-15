# Active Context

## Current Focus
Range Builder betting logic complete! All betting levels (2-bet through 6-bet+) working correctly with proper raise counting. Table settings fully integrated with game engine. Ready to add range persistence and postflop functionality.

## Technology Decisions Made
- **Frontend**: React + TypeScript (chosen for AI coding efficiency and mature ecosystem)
- **Desktop**: Electron (chosen over Tauri for stability)
- **Solver**: Postflop-solver (Rust) - superior performance to TexasSolver
- **Backend**: Native Rust binary compiled to .node module (NOT WASM)
- **Native Bindings**: napi-rs for direct Node.js integration
- **No Server-Side Solving**: All computation happens client-side
- **Database**: SQLite for local storage
- **Mobile**: React Native Web + Expo (future consideration)

## Next Immediate Steps
1. ✅ ~~Copy postflop-solver Rust code into project~~ DONE
2. ✅ ~~Set up React + TypeScript + Electron project structure~~ DONE
3. ✅ ~~Create Rust-to-JS communication layer~~ DONE
4. Compile native solver module: `cd src/solver/rust && npm install && npm run build`
5. Wire up Electron main process to load native solver
6. Build Range Builder UI component
7. Build Solver Configuration UI
8. Import standard preflop ranges (GTO Wizard free/purchased)

## Key Patterns and Preferences

### Development Approach
- Solver-first development (most important to user)
- Client-side only (no server dependencies)
- Clean UI is paramount (addressing market gap)
- TypeScript for everything (better for AI assistance)

### UI/UX Principles
- Minimalist design over feature-rich interfaces
- Visual feedback over text explanations
- Dark mode by default with light mode option
- Smooth animations without being distracting

### Code Organization
- Component-based architecture
- Clear separation between solver, UI, and game logic
- TypeScript interfaces for all data structures
- Functional components with hooks

## Recent Decisions and Rationale

### Why Postflop-Solver over TexasSolver
- 2x faster performance in benchmarks
- Better memory efficiency (16-bit compression)
- Cleaner Rust codebase
- Already has WASM version working
- More accurate CFR implementation

### Dynamic Game Configuration Strategy
- **Not hardcoded for 6-max**: System supports ANY configuration
- **User-defined parameters**:
  - Table size (2-10 players)
  - Stack depths (10bb-1000bb)
  - Rake structure (%, cap, no rake)
  - Custom bet sizings per street
  - Ante/straddle/BB ante
- **Tree construction**: Build game trees dynamically based on parameters
- **Solving approach**:
  - Postflop: Real-time solving with custom trees
  - Preflop: Initially pre-computed, later dynamic generation
- **Future preflop solver**: Will generate optimal ranges based on ALL parameters (stack size, rake, etc.)

### Why Native Rust Binary
- Full performance (no WASM overhead)
- Simpler implementation
- Can add WASM later for web

## Important Considerations

### Performance Requirements
- Solver must respond in < 2 seconds for common spots
- UI must maintain 60fps during animations
- Support importing 100k+ hands
- WebAssembly initialization must be fast

### User Experience Goals
- First-time user can use solver within 1 minute
- No account/registration required
- Works offline after initial download
- Responsive on all screen sizes

## Current Blockers
None - solver code integrated, ready to compile and build UI

## Recent Progress (2025-08-15)
- **COMPLETE**: Fixed all betting logic bugs
  - Proper raise counting system (raiseCount field)
  - All-in appears correctly for 6-bet+ situations
  - SPR-based forceAllInThreshold implementation
  - Call option shows when call amount exceeds stack
  - No more duplicate all-ins
- **COMPLETE**: Table settings integration
  - Settings changes now update game engine in real-time
  - Position-specific overrides working
  - Solver thresholds (add/force all-in, merging) implemented
- **COMPLETE**: UI improvements
  - Removed drag scrolling from ActionSequenceBar
  - Added beautiful custom scrollbar with hover states
  - Smooth scrolling with visual feedback

## Recent Progress (2025-08-13)
- Created unified codebase architecture
- Single frontend codebase for web + Electron
- API layer updated for native solver (NOT WASM)
- Electron configured with proper IPC handlers
- Shared types for entire application
- Positions corrected to: UTG, UTG+1, HJ, LJ, CO, BTN, SB, BB
- **MAJOR**: Complete postflop-solver source code integrated
- **MAJOR**: Native Node.js bindings created with napi-rs
- **MAJOR**: NativeSolver class wrapping PostFlopGame functionality

## Learning and Insights
- Existing poker software (GTO Wizard, PioSolver, MonkerSolver) has significant UX issues
- GTO Wizard charges $39-100/month for subscription
- Users want to own their solver, not rent it
- Clean UI is a major differentiator in this market
- Population-based training is underserved
- Most training is GTO vs GTO, but players want to exploit real opponents
- Node-locking enables exploitative solving against specific tendencies
- Postflop-solver already supports node-locking functionality
- CFR algorithm works identically for preflop and postflop (just different tree sizes)
- Storing player profiles with ranges makes preflop solving 100x-1000x faster
- Can solve "best response vs profiles" instead of full equilibrium

## Project-Specific Patterns
- All solving happens client-side (native Rust binary for desktop)
- Electron app with potential future mobile expansion
- Dynamic game tree construction based on user parameters
- Focus on solver functionality before training features
- MMR/multiplayer is stretch goal, not MVP

## Questions to Resolve
- Preferred UI styling approach (CSS modules, styled-components, Tailwind?)
- Initial target poker variant (NLHE cash games, but system supports any)
- Specific hand history formats to support first (Ignition, PokerTracker4)
- Preflop range sources (GTO Wizard free ranges, purchase, or generate?)