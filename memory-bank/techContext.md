# Tech Context

## Core Technology Stack (Updated 2025-12-23)

### Frontend Layer (Keeping)
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18+ | UI components |
| TypeScript | 5.x | Type safety |
| Electron | 28+ | Desktop app |
| Vite | 5.x | Build tool |
| Zustand | 4.x | State management |

### Backend Layer (NEW - Python)
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.10+ | Backend runtime |
| RLCard | latest | Game engine + CFR base |
| phevaluator | 0.5+ | Hand evaluation |
| NumPy | latest | Numerical operations |
| FastAPI | latest | HTTP API (optional) |

### Libraries Being Added

#### RLCard (Game Engine + CFR)
- **Repository**: https://github.com/datamllab/rlcard
- **Purpose**: Provides NLHE environment and vanilla CFR implementation
- **Why chosen**:
  - Full No-Limit Texas Hold'em support
  - Built-in CFR algorithm we can modify
  - Active development, good documentation
  - Extensible agent architecture

```bash
pip install rlcard
```

#### phevaluator (Hand Evaluation)
- **Repository**: https://github.com/HenryRLee/PokerHandEvaluator
- **Purpose**: Ultra-fast hand strength evaluation
- **Why chosen**:
  - ~100KB lookup tables
  - Nanosecond evaluation time
  - Python bindings available
  - Supports 5-7 card hands + Omaha

```bash
pip install phevaluator
```

#### poker-hand-clustering (Card Abstraction)
- **Repository**: https://github.com/sammiya/poker-hand-clustering
- **Purpose**: K-Means clustering for EHS-based hand bucketing
- **Why chosen**:
  - Implements EMD (Earth Mover's Distance)
  - Based on academic research (CMU/Alberta)
  - Ready-to-use abstraction

### Libraries for Future Phases

#### Pgx (GPU Game Environments)
- **Repository**: https://github.com/sotetsuk/pgx
- **Purpose**: JAX-based game simulators for GPU acceleration
- **When**: Phase 5 (GPU acceleration)
- **Note**: Currently supports "two-suit, limited deck poker"

#### cfrx (JAX CFR)
- **Repository**: https://github.com/Egiob/cfrx
- **Purpose**: Hardware-accelerated CFR in JAX
- **When**: Phase 5 (GPU acceleration)
- **Note**: Currently only Kuhn/Leduc poker

### Deprecated/Removed

#### Rust postflop-solver
- **Status**: Deprecated as primary solver
- **Reason**:
  - Postflop only, no preflop
  - 2-player focused
  - No exploitative profile support (only node-locking)
  - Development suspended by author
- **Keep for**: Reference, potential pure GTO analysis

## Development Environment

### Required Software
```bash
# Node.js (frontend)
node >= 18.0.0
npm >= 9.0.0

# Python (backend)
python >= 3.10
pip >= 23.0

# Optional
git
VS Code
```

### Python Environment Setup
```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate

# Activate (Unix)
source venv/bin/activate

# Install dependencies
pip install rlcard phevaluator numpy fastapi uvicorn
```

### Project Structure (Updated)
```
poker-lobby/
├── src/
│   ├── frontend/           # React + TypeScript (KEEP)
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   │
│   ├── backend/            # NEW: Python backend
│   │   ├── __init__.py
│   │   ├── server.py       # FastAPI or JSON-RPC server
│   │   ├── solver/
│   │   │   ├── __init__.py
│   │   │   ├── biased_cfr.py    # Utility-biased CFR
│   │   │   ├── profiles.py       # Player archetypes
│   │   │   └── abstraction.py    # Card abstraction
│   │   ├── engine/
│   │   │   ├── __init__.py
│   │   │   └── game.py          # RLCard wrapper
│   │   └── evaluator/
│   │       ├── __init__.py
│   │       └── hands.py         # phevaluator wrapper
│   │
│   ├── api/                # TypeScript API layer (KEEP)
│   │   └── index.ts
│   │
│   ├── shared/             # Shared types (KEEP)
│   │   └── types.ts
│   │
│   └── solver/rust/        # DEPRECATED: Keep for reference
│       └── ...
│
├── electron/               # Electron main process (KEEP)
│   ├── main.js
│   ├── preload.js
│   └── pythonBridge.js     # NEW: Python subprocess manager
│
├── memory-bank/            # Documentation (KEEP)
├── public/                 # Static assets (KEEP)
├── package.json            # Node dependencies
├── requirements.txt        # NEW: Python dependencies
└── vite.config.ts
```

### requirements.txt (NEW)
```
rlcard>=1.0.0
phevaluator>=0.5.0
numpy>=1.24.0
fastapi>=0.100.0
uvicorn>=0.23.0
scikit-learn>=1.3.0  # For K-Means clustering
```

## Communication Architecture

### Option A: Python Subprocess (Recommended for Desktop)
```
Electron Main Process
        │
        ├── spawn Python subprocess
        │
        ▼
Python Backend (stdin/stdout JSON-RPC)
        │
        ├── RLCard game environment
        ├── Biased CFR solver
        └── phevaluator
```

**Pros**: Simple, no network overhead, bundleable
**Cons**: Need to bundle Python with app

### Option B: FastAPI HTTP Server (Alternative)
```
Electron Renderer
        │
        ├── HTTP requests
        │
        ▼
FastAPI Server (localhost:8000)
        │
        ├── RLCard game environment
        ├── Biased CFR solver
        └── phevaluator
```

**Pros**: Standard REST API, easy debugging
**Cons**: Network overhead, separate process management

## Build Configuration

### Python Backend Build
```bash
# Development
cd src/backend
python -m uvicorn server:app --reload

# Production (bundle with PyInstaller)
pyinstaller --onefile server.py
```

### Electron Build (Updated)
```json
{
  "build": {
    "appId": "com.pokerlobby.app",
    "productName": "PokerLobby",
    "extraResources": [
      {
        "from": "src/backend/dist",
        "to": "backend"
      }
    ],
    "files": [
      "dist/**/*",
      "electron/**/*"
    ]
  }
}
```

## Performance Considerations

### Python Backend Optimization
- Use NumPy vectorized operations
- Cache solved game states (LRU cache)
- Pre-compute card abstraction buckets
- Lazy evaluation where possible

### Card Abstraction Levels
| Level | Buckets | Use Case | Speed |
|-------|---------|----------|-------|
| High | 50,000+ | Analysis | Slow |
| Standard | 10,000 | Training | Medium |
| Fast | 1,000 | Real-time | Fast |

### Memory Management
- RLCard environments are lightweight
- phevaluator uses ~100KB lookup tables
- CFR regret tables scale with game tree size
- Use 16-bit floats for large games

## Testing Strategy

### Python Backend Tests
```python
# tests/test_solver.py
def test_cfr_convergence():
    solver = BiasedCFRSolver(biases={})
    solver.train(iterations=1000)
    assert solver.exploitability < 0.05

def test_profile_bias():
    fish = PROFILES['fish']
    solver = BiasedCFRSolver(biases=fish.biases)
    strategy = solver.get_strategy(some_state)
    # Fish should call more than GTO
    assert strategy['call'] > gto_strategy['call']
```

### Integration Tests
```typescript
// tests/integration/solver.test.ts
test('Python backend responds to solve request', async () => {
    const result = await pythonBridge.call('solve', {
        gameState: mockState,
        profile: 'fish'
    });
    expect(result.strategy).toBeDefined();
});
```

## Security Considerations

### Python Backend Security
- Run as subprocess with limited permissions
- No network access (subprocess mode)
- Validate all input from frontend
- Sanitize game state data

### Electron Security (Unchanged)
```javascript
const win = new BrowserWindow({
    webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, 'preload.js')
    }
});
```

## Deployment Strategy

### Desktop Distribution
1. Build React frontend with Vite
2. Bundle Python backend with PyInstaller
3. Package with Electron Builder
4. Code sign for Windows/macOS

### Python Bundling Options
- **PyInstaller**: Single executable, cross-platform
- **Nuitka**: Compiled Python, faster startup
- **Embedded Python**: Ship Python runtime with app

## Migration Path

### Phase 1: Add Python Backend
1. Create `src/backend/` structure
2. Install RLCard + phevaluator
3. Build JSON-RPC server
4. Create Electron subprocess bridge

### Phase 2: Implement Profile System
1. Define player archetypes
2. Modify RLCard CFR for bias
3. Add profile configuration UI

### Phase 3: Connect Frontend
1. Update API layer for Python calls
2. Wire Range Builder to new solver
3. Add training mode UI

### Phase 4: Deprecate Rust
1. Remove Rust solver from build
2. Keep code for reference
3. Update documentation