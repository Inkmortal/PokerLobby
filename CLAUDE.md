# PokerLobby - Ultimate Poker Training Platform

## CRITICAL DEVELOPMENT RULES
- **NEVER create new versions of files (no V2, _new, etc.)**
- When improving/updating features: MODIFY the existing file
- Only create new files when adding completely new features
- If major refactor needed: ASK PERMISSION before creating new version

## Project Overview
Building the ultimate poker training program that surpasses existing tools like GTO Wizard with:
- Clean, modern UI (addressing the poor UX of existing poker software)
- GTO solver with intuitive interface
- Training drills against reconstructed opponent ranges
- Hand history import and analysis
- Multiplayer competitive lobby with MMR/leaderboard system

## Technology Stack
- **Frontend**: React + TypeScript
- **Desktop**: Electron
- **Mobile/Web**: React Native Web + Expo (future)
- **Solver**: C++ solver compiled to WebAssembly (no server-side solving)
- **Database**: SQLite for local storage
- **Real-time**: WebSockets for multiplayer

## Development Priorities
1. **Solver First** - Most important component
   - Port existing C++ solver to WebAssembly
   - Build comprehensive solver UI
   - Implement solver export functionality
   - Configuration options for different game types
   
2. **Training Features**
   - Import hand histories from major sites
   - Reconstruct opponent ranges from population data
   - Drill mode with real-time GTO feedback
   
3. **Multiplayer Lobby** (Stretch Goal)
   - 100BB starting stacks
   - MMR-based matchmaking
   - Competitive leaderboard

## Key Differentiators
- **Superior UI/UX**: Clean, responsive interface vs cluttered existing tools
- **Population-Adjusted Training**: Train against actual opponent tendencies, not just GTO
- **All-in-One Platform**: Solver, trainer, and multiplayer in single app
- **Cross-Platform**: Desktop initially, mobile/web support planned

## Architecture Decisions
- Client-side only solving (WebAssembly for performance)
- Electron for desktop distribution
- TypeScript for type safety and better AI coding assistance
- Component-based React architecture for maintainable UI

## Project Structure
```
poker-lobby/
├── src/
│   ├── components/     # React UI components
│   ├── screens/        # Main app screens
│   ├── solver/         # Solver logic and WASM bindings
│   ├── engine/         # Poker game engine
│   ├── services/       # Data persistence, import/export
│   └── utils/          # Helper functions
├── wasm/              # C++ solver compiled to WebAssembly
├── electron/          # Electron main process
└── public/            # Static assets
```

## Performance Requirements
- Solver response time < 2 seconds for common spots
- Smooth 60fps UI animations
- Support for large hand history imports (100k+ hands)
- Real-time multiplayer with < 100ms latency

## Testing Commands
```bash
npm run lint        # Run linter
npm run typecheck   # TypeScript type checking
npm test           # Run tests
npm run build      # Build for production
```

## Development Notes
- Always maintain clean, readable code
- Prioritize user experience over complex features
- Keep solver accuracy while optimizing for speed
- Design for extensibility (future mobile support)

@memory-bank-instructions.md
