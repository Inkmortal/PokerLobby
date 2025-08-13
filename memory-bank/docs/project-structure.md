# Project Structure Documentation

## Overview
Unified codebase that works for both desktop (Electron) and web deployment, with WASM solver that runs identically in both environments.

## Directory Structure
```
poker-lobby/
├── src/
│   ├── frontend/          # React UI (shared between web & desktop)
│   │   ├── App.tsx       # Main app component with routing
│   │   ├── main.tsx      # Entry point
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── contexts/     # React contexts (Theme, API)
│   │   └── styles/       # SCSS with Catppuccin theme
│   │
│   ├── api/              # Unified API layer
│   │   └── index.ts      # API adapter (WASM local, cloud remote)
│   │
│   ├── shared/           # Shared types and utilities
│   │   └── types.ts      # TypeScript interfaces for entire app
│   │
│   └── solver/           # Solver implementation
│       ├── rust/         # Postflop-solver Rust code (to be added)
│       └── wasm/         # Compiled WASM module
│
├── electron/             # Electron-specific code
│   ├── main.js          # Main process
│   └── preload.js       # Preload script for security
│
├── public/              # Static assets
│   └── icons/          # App icons
│
├── memory-bank/         # Project documentation
│   ├── docs/           # Technical documentation
│   └── *.md            # Memory files
│
├── scripts/            # Build scripts
│
├── dist/              # Built web app
├── dist-electron/     # Built electron app
│
├── package.json       # Dependencies and scripts
├── vite.config.ts    # Vite configuration
├── tsconfig.json     # TypeScript configuration
└── index.html        # HTML entry point
```

## Key Design Decisions

### 1. Unified API Layer
The API layer (`src/api/index.ts`) provides the same interface regardless of deployment:
- **Local (Electron/Dev)**: Directly calls WASM solver
- **Cloud (Production)**: Makes API calls to backend
- Frontend code doesn't change between deployments

### 2. WASM Solver
- Compiles from Rust to WebAssembly
- Runs identically in browser and Electron
- No server required for solving
- Same performance everywhere

### 3. Storage Abstraction
- **Electron**: Uses filesystem (via IPC)
- **Web**: Uses IndexedDB
- API automatically selects appropriate storage

### 4. Navigation Structure
```
Home
├── Solver
│   ├── Postflop Solver
│   ├── Preflop Solver
│   ├── Range Builder
│   └── Solutions
├── Training
│   ├── Practice
│   ├── Campaign
│   └── Review
├── Study
│   ├── Library
│   └── Explorer
├── Analysis
│   └── Hand History
├── Compete
│   └── Ranked
└── Settings
```

## Build & Deployment

### Development
```bash
npm run dev           # Web development server
npm run dev:electron  # Electron development
```

### Production
```bash
npm run build         # Build web app
npm run build:electron # Build desktop app
npm run build:wasm    # Compile solver to WASM
```

### Deployment Targets
1. **Desktop**: Single executable via Electron
2. **Web**: Static files for CDN hosting
3. **Future Cloud**: Same frontend, API backend

## Technology Stack

### Core
- **Frontend**: React 18 + TypeScript
- **Desktop**: Electron 28
- **Solver**: Rust → WebAssembly
- **Build**: Vite 5
- **Styling**: SCSS + Catppuccin theme

### Libraries
- **State**: Zustand
- **Routing**: React Router v6
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Drag & Drop**: @dnd-kit

### Development
- **Linting**: ESLint
- **Testing**: Vitest
- **Type Checking**: TypeScript strict mode

## API Architecture

### Local Adapter (WASM)
```typescript
class LocalWasmAdapter {
  async solvePostflop(config) {
    return wasmSolver.solve(config); // Direct WASM call
  }
}
```

### Cloud Adapter (Future)
```typescript
class CloudApiAdapter {
  async solvePostflop(config) {
    if (canSolveLocally(config)) {
      return wasmSolver.solve(config); // Simple solves
    }
    return fetch('/api/solve', config); // Complex solves
  }
}
```

## Security

### Electron Security
- Context isolation enabled
- Node integration disabled
- Preload script whitelists IPC channels
- Content Security Policy configured

### Web Security
- WASM runs in sandboxed environment
- No external API calls for solving
- Local storage only

## Next Steps
1. Copy postflop-solver Rust code
2. Set up WASM compilation
3. Implement basic UI components
4. Create Range Builder interface
5. Build Postflop Solver UI