# PokerLobby

A premium poker training platform combining a professional-grade GTO solver with an intuitive, modern interface.

## Why PokerLobby?

- **One-time purchase** - No monthly subscriptions
- **Clean, modern UI** - Designed for usability, not complexity
- **Population-based training** - Train against actual opponent tendencies
- **All-in-one platform** - Solver, trainer, and analysis in a single app
- **Offline-first** - Client-side solving means your ranges never leave your machine

## Features

### Range Builder (90% Complete)
- Visual 169-combo hand matrix for defining ranges
- Interactive decision tree with betting action visualization
- Support for 6-max, 9-max, and heads-up formats
- Multi-street support (preflop through river)
- Standard format import/export
- Configurable bet sizes, raise multipliers, and all-in thresholds

### Native Solver
- Rust-based postflop solver compiled to native Node.js module
- Discounted CFR algorithm for fast convergence
- Memory-efficient 16-bit integer compression
- Isomorphism detection for reduced computation
- Bunching effect calculations

### Planned Features
- Training drills with real-time GTO feedback
- Hand history import from major poker sites
- Population-adjusted opponent modeling
- Competitive multiplayer lobby with MMR matchmaking

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript |
| Desktop | Electron 28 |
| Solver | Rust (native Node.js bindings) |
| Build | Vite 5 |
| Styling | SCSS + Catppuccin theme |
| State | Zustand |
| Charts | Recharts |

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Rust toolchain (for building solver)

### Installation

```bash
# Clone the repository
git clone https://github.com/Inkmortal/PokerLobby.git
cd PokerLobby

# Install dependencies
npm install

# Start development server (web)
npm run dev

# Start with Electron (desktop)
npm run dev:electron
```

### Building

```bash
# Build solver (requires Rust)
npm run build:solver

# Build web version
npm run build

# Build desktop app
npm run build:electron

# Build everything
npm run build:all
```

## Project Structure

```
PokerLobby/
├── src/
│   ├── frontend/
│   │   ├── components/
│   │   │   └── range/          # Range Builder UI
│   │   │       ├── RangeBuilder.tsx
│   │   │       ├── RangeGrid.tsx
│   │   │       ├── ActionSequenceBar.tsx
│   │   │       ├── TableSettings.tsx
│   │   │       └── engine/PokerGameEngine.ts
│   │   ├── pages/              # App screens
│   │   └── styles/             # SCSS styles
│   ├── api/                    # Unified API layer
│   └── solver/rust/            # Rust solver source
├── electron/
│   ├── main.js                 # Electron main process
│   ├── preload.js              # IPC security layer
│   └── solverHandler.js        # Solver IPC handlers
├── memory-bank/                # Project documentation
└── public/                     # Static assets
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run dev:electron` | Start Electron dev mode |
| `npm run build` | Build for production |
| `npm run build:electron` | Build desktop app |
| `npm run build:solver` | Compile Rust solver |
| `npm run test` | Run tests |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type checking |

## Configuration

The Range Builder supports extensive configuration:

**Preflop Settings**
- Open sizes (multiple options per position)
- 3-bet, 4-bet, 5-bet sizes
- Position-specific overrides
- Limping and open-shove options

**Postflop Settings**
- Flop/turn/river bet sizes (% of pot)
- OOP vs IP bet size distinctions
- Raise multipliers
- Donk bet options

**Solver Thresholds**
- `addAllInThreshold` (150% default) - adds all-in option when pot is large
- `forceAllInThreshold` (20% default) - converts large bets to all-in based on SPR
- `mergingThreshold` (10% default) - merges similar bet sizes

## Architecture Decisions

**Native Rust over WASM**: Desktop-first means we prioritize performance. WASM can be added later for web support.

**Electron**: React expertise + mature ecosystem.

**Client-side solving**: No server dependency, works offline, no latency. Privacy preserved - your ranges never leave your machine.

## License

MIT

## Contributing

This project is in active development. See [CLAUDE.md](CLAUDE.md) for development guidelines.
