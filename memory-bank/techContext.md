# Tech Context

## Core Technology Stack

### Frontend Framework
**React 18+ with TypeScript**
- Chosen for component reusability
- Strong typing for complex poker logic
- Excellent ecosystem for UI components
- Best AI coding support

### Desktop Framework
**Electron**
- Mature and stable
- Good WebAssembly support
- Extensive documentation
- Easy distribution

### Language
**TypeScript**
- Type safety for complex domain
- Better IDE support
- Reduces runtime errors
- Optimal for AI assistance

### Solver Technology
**WebAssembly (WASM)**
- Near-native performance
- Runs in browser/Electron
- Sandboxed security
- Cross-platform

### State Management
**Zustand or Redux Toolkit**
- Zustand: Simpler, less boilerplate
- Redux Toolkit: More features, DevTools
- Decision pending based on complexity

### Database
**SQLite**
- Local-first approach
- No server required
- Fast queries
- Portable data

### Styling
**Options under consideration:**
- Tailwind CSS (utility-first)
- CSS Modules (scoped styles)
- Styled Components (CSS-in-JS)
- Emotion (CSS-in-JS alternative)

## Development Tools

### Build Tools
```json
{
  "build": {
    "webpack": "5.x",
    "vite": "alternative option",
    "esbuild": "for fast builds"
  }
}
```

### Package Manager
**npm or pnpm**
- npm: Standard, widely supported
- pnpm: Faster, disk efficient

### Version Control
**Git with GitHub**
- Standard branching strategy
- PR-based workflow
- CI/CD via GitHub Actions

### Code Quality
```json
{
  "linting": "ESLint",
  "formatting": "Prettier",
  "typeChecking": "TypeScript strict mode",
  "testing": {
    "unit": "Jest or Vitest",
    "component": "React Testing Library",
    "e2e": "Playwright or Cypress"
  }
}
```

## Dependencies

### Core Dependencies
```json
{
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "electron": "^27.0.0",
  "typescript": "^5.0.0",
  "sqlite3": "^5.0.0",
  "better-sqlite3": "alternative"
}
```

### UI Libraries (Potential)
```json
{
  "ui": {
    "charts": "recharts or victory",
    "tables": "react-table or ag-grid",
    "animations": "framer-motion",
    "icons": "react-icons",
    "tooltips": "react-tooltip"
  }
}
```

### Solver Dependencies
```json
{
  "wasm": {
    "emscripten": "for C++ to WASM",
    "wasm-bindgen": "alternative for Rust",
    "comlink": "for worker communication"
  }
}
```

## Development Environment

### Required Software
- Node.js 18+ LTS
- npm/pnpm
- Git
- VS Code (recommended)
- C++ compiler (for solver)
- Emscripten SDK

### VS Code Extensions
- ESLint
- Prettier
- TypeScript Vue Plugin
- C/C++ Extension
- WebAssembly Support

### Project Structure
```
poker-lobby/
├── src/
│   ├── main/           # Electron main process
│   ├── renderer/       # React app
│   │   ├── components/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── utils/
│   ├── shared/         # Shared types/constants
│   └── wasm/          # WASM module
├── public/            # Static assets
├── electron/          # Electron configuration
├── scripts/           # Build scripts
└── tests/            # Test files
```

## Build Configuration

### WebAssembly Build
```bash
# Compile C++ to WASM
emcc solver.cpp -o solver.js \
  -s WASM=1 \
  -s MODULARIZE=1 \
  -s EXPORT_ES6=1 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -O3
```

### Electron Build
```json
{
  "build": {
    "appId": "com.pokerlobby.app",
    "productName": "PokerLobby",
    "directories": {
      "output": "dist"
    },
    "files": [
      "dist/**/*",
      "electron/**/*"
    ],
    "mac": {
      "category": "public.app-category.games"
    },
    "win": {
      "target": "nsis"
    },
    "linux": {
      "target": "AppImage"
    }
  }
}
```

## Performance Considerations

### WebAssembly Optimization
- Compile with -O3 flag
- Use SIMD instructions where possible
- Minimize memory allocations
- Implement worker threads

### React Optimization
- Code splitting with lazy loading
- Memoization with useMemo/useCallback
- Virtual scrolling for large lists
- Minimize re-renders

### Electron Optimization
- Preload scripts for security
- Context isolation
- Minimize main/renderer communication
- Efficient IPC usage

## Deployment Strategy

### Desktop Distribution
- **Windows**: NSIS installer
- **macOS**: DMG with code signing
- **Linux**: AppImage/Snap

### Auto-Updates
- electron-updater for patches
- Differential updates
- Background downloads
- Rollback capability

### Future Web Deployment
- Progressive Web App
- Service workers for offline
- WebAssembly streaming
- CDN distribution

## Security Considerations

### Electron Security
```javascript
// Main process
const win = new BrowserWindow({
  webPreferences: {
    contextIsolation: true,
    preload: path.join(__dirname, 'preload.js'),
    nodeIntegration: false
  }
});
```

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'wasm-unsafe-eval'">
```

### Data Protection
- Local storage encryption
- Secure IPC communication
- Input sanitization
- No external API keys

## Testing Strategy

### Unit Tests
- Pure functions
- Poker logic
- Range calculations
- Import parsers

### Integration Tests
- Solver integration
- Database operations
- State management
- IPC communication

### E2E Tests
- Complete workflows
- Cross-platform testing
- Performance benchmarks
- Memory leak detection

## Development Workflow

### Git Flow
```
main
├── develop
│   ├── feature/solver-ui
│   ├── feature/training-drills
│   └── feature/multiplayer
└── release/v1.0.0
```

### CI/CD Pipeline
1. Push to feature branch
2. Run tests
3. Build WASM module
4. Build Electron app
5. Create artifacts
6. Deploy to beta channel

## Monitoring and Analytics

### Performance Metrics
- Solver execution time
- Memory usage
- Frame rate
- Load times

### User Analytics (Privacy-Focused)
- Feature usage (anonymous)
- Error tracking
- Performance metrics
- Opt-in only