# PokerLobby Project Brief

## Project Vision
Create the ultimate poker training platform that surpasses existing tools (particularly GTO Wizard) by combining superior UI/UX with comprehensive training features and competitive multiplayer gameplay.

## Core Problem
Existing poker training software suffers from:
- Poor, cluttered user interfaces
- Steep learning curves
- Limited population-based training
- Lack of integrated competitive play
- Expensive subscriptions without owning the solver

## Target Users
- Serious poker players wanting to improve their game
- Players frustrated with existing poker software UX
- Competitive players seeking skill-based practice
- Self-improvement focused players needing analysis tools

## Key Requirements

### Must Have (MVP)
1. **GTO Solver**
   - Client-side only (no server dependency)
   - Native Rust binary for performance
   - Dynamic game tree construction (any config)
   - Export capabilities for solutions
   - < 2 second solve time for common spots
   - Node-locking for exploitative solving

2. **Player Profile System**
   - Define player tendencies (preflop & postflop)
   - Select profiles for each table position
   - Allow table position shuffling during drills
   - Population tendencies from hand histories
   - Exploitative strategy generation
   - Profile library (Nit, TAG, LAG, Fish, etc.)

3. **Solver UI**
   - Clean, modern interface
   - Visual range display
   - EV visualization
   - Strategy comparison tools
   - Solution browsing and navigation

4. **Training System**
   - Hand history import (Ignition, PokerTracker4)
   - Population range reconstruction
   - Drill mode with profile-based opponents
   - Exploitative feedback (not just GTO)
   - Mistake analysis

### Should Have
1. **Analysis Tools**
   - Session review
   - Leak detection
   - Range vs range analysis
   - Equity calculations

2. **Data Management**
   - Local solution caching
   - Hand history database
   - Custom range saving
   - Training progress tracking

### Nice to Have (Stretch Goals)
1. **Multiplayer Lobby**
   - 100BB starting stacks
   - MMR-based matchmaking
   - Competitive leaderboard
   - Various game formats

2. **Advanced Features**
   - Custom drill creation
   - Population tendency analysis
   - Multi-table support
   - Tournament ICM calculations

## Technical Constraints
- Must run entirely client-side (no server solving)
- Cross-platform compatibility (desktop first, mobile later)
- Performance: 60fps UI, <2s solver response
- Support 100k+ hand history imports
- <100ms multiplayer latency (when implemented)

## Success Metrics
- Solver accuracy comparable to PioSolver/MonkerSolver
- UI responsiveness and clarity exceeding GTO Wizard
- Training effectiveness through measurable improvement
- User retention through engaging features
- Community adoption through competitive play

## Project Scope
### In Scope
- GTO solver with comprehensive UI
- Training and drill systems
- Hand history import/analysis
- Desktop application (Electron)
- Future mobile/web support

### Out of Scope
- Server-side solving
- Paid subscription model (initially)
- Live hand tracking/HUD
- Real money transactions
- Bot play assistance

## Development Philosophy
- **Solver First**: Core solver functionality is top priority
- **User Experience**: Every feature must have intuitive, clean UI
- **Performance**: Speed and responsiveness over feature bloat
- **Ownership**: Users own their solver, no subscription locks
- **Extensibility**: Design for future mobile/web expansion