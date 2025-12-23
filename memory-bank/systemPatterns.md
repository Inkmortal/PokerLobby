# System Patterns

## Architecture Overview (Updated 2025-12-23)

### Hybrid Python/TypeScript Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                           │
│                    (React + TypeScript + Electron)               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ Range Builder│ │ Training UI  │ │ Profile Cfg  │            │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘            │
│         └────────────────┼────────────────┘                     │
│                          ▼                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    API Service Layer                       │  │
│  │              (TypeScript - IPC/HTTP abstraction)           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
                    IPC / HTTP / Subprocess
                               │
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND LAYER                            │
│                           (Python)                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Poker Engine Service                     │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │  │
│  │  │   RLCard    │ │ phevaluator │ │   Profile System    │  │  │
│  │  │ (Game Env)  │ │ (Hand Eval) │ │ (Utility Biasing)   │  │  │
│  │  └──────┬──────┘ └──────┬──────┘ └──────────┬──────────┘  │  │
│  │         └───────────────┼───────────────────┘              │  │
│  │                         ▼                                   │  │
│  │  ┌───────────────────────────────────────────────────────┐ │  │
│  │  │            Utility-Biased CFR Solver                   │ │  │
│  │  │    (Modified regret minimization with profile bias)    │ │  │
│  │  └───────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                Card Abstraction Layer                      │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │  │
│  │  │ EHS Calc    │ │ K-Means     │ │ Bucket Manager      │  │  │
│  │  │             │ │ Clustering  │ │ (Speed vs Accuracy) │  │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Core Design Patterns

### 1. Utility-Biased CFR Pattern

The key innovation for exploitative training. Instead of node-locking (which creates brittle, robotic play), we modify the CFR regret update globally:

```python
class BiasedCFRSolver:
    """CFR solver with utility bias for modeling player tendencies."""

    def __init__(self, game_env, profile_biases: dict):
        self.env = game_env
        self.biases = profile_biases  # {"call": 0.08, "fold": -0.05, ...}

    def update_regrets(self, node, action, cfv, node_value, pot_size):
        """Modified regret update with utility bias."""
        # Standard CFR regret
        base_regret = cfv[action] - node_value

        # Add utility bias (scaled by pot)
        action_type = self.get_action_type(action)  # "call", "fold", "raise"
        bias = self.biases.get(action_type, 0.0) * pot_size

        # Biased regret drives strategy toward player archetype
        return base_regret + bias
```

**Why this works:**
- Fish "wants" to call → positive call bias → naturally calls too much
- Nit "fears" action → positive fold bias → naturally folds too much
- Whale "loves action" → negative fold bias → stays in pots too long
- LAG "likes aggression" → positive raise bias → raises more than optimal

### 2. Player Profile Pattern

```python
@dataclass
class PlayerProfile:
    """Defines exploitable tendencies for a player archetype."""
    name: str
    biases: Dict[str, float]  # Action type -> bias value
    description: str

    # Optional: HUD stat targets for validation
    target_vpip: Optional[float] = None
    target_pfr: Optional[float] = None
    target_aggression: Optional[float] = None

# Predefined archetypes
PROFILES = {
    "fish": PlayerProfile(
        name="Fish",
        biases={"call": +0.08, "fold": -0.05, "raise": -0.03},
        description="Calls too much, doesn't fold enough",
        target_vpip=45.0,
        target_pfr=8.0,
    ),
    "nit": PlayerProfile(
        name="Nit",
        biases={"fold": +0.10, "call": -0.05, "raise": -0.08},
        description="Folds too much, only plays premium hands",
        target_vpip=12.0,
        target_pfr=10.0,
    ),
    "whale": PlayerProfile(
        name="Whale",
        biases={"call": +0.15, "raise": +0.05, "fold": -0.20},
        description="Loves action, hates folding, has money to burn",
        target_vpip=55.0,
    ),
    "calling_station": PlayerProfile(
        name="Calling Station",
        biases={"call": +0.12, "fold": -0.15, "raise": -0.05},
        description="Will call you down with anything",
        target_vpip=40.0,
        target_aggression=0.3,
    ),
    "lag": PlayerProfile(
        name="LAG (Loose-Aggressive)",
        biases={"raise": +0.10, "call": -0.05, "fold": -0.05},
        description="Plays many hands aggressively",
        target_vpip=30.0,
        target_pfr=25.0,
    ),
    "maniac": PlayerProfile(
        name="Maniac",
        biases={"raise": +0.20, "call": -0.10, "fold": -0.15},
        description="Raises everything, pure aggression",
        target_pfr=40.0,
    ),
    "tag": PlayerProfile(
        name="TAG (Tight-Aggressive)",
        biases={"raise": +0.03, "fold": +0.02, "call": -0.02},
        description="Solid player, slightly tight",
        target_vpip=22.0,
        target_pfr=18.0,
    ),
    "gto": PlayerProfile(
        name="GTO",
        biases={},  # No bias = equilibrium play
        description="Game-theory optimal play",
    ),
}
```

### 3. Card Abstraction Pattern

For real-time decisions, we bucket similar hands together:

```python
class CardAbstraction:
    """K-Means clustering for hand bucketing based on EHS."""

    def __init__(self, num_buckets: int = 10000):
        self.num_buckets = num_buckets
        self.bucket_map: Dict[str, int] = {}  # hand -> bucket_id

    def compute_ehs(self, hand: Tuple[Card, Card], board: List[Card]) -> float:
        """Expected Hand Strength against random opponent range."""
        # Use phevaluator for fast equity calculation
        return equity_calculator.evaluate(hand, board, opponent_range="random")

    def build_buckets(self, street: str):
        """Precompute buckets using K-Means on EHS distributions."""
        all_hands = generate_all_hands()
        ehs_values = [self.compute_ehs(h, []) for h in all_hands]

        # K-Means clustering
        kmeans = KMeans(n_clusters=self.num_buckets)
        buckets = kmeans.fit_predict(ehs_values)

        self.bucket_map = dict(zip(all_hands, buckets))
```

**Granularity tradeoffs:**
- **High-end (50k+ buckets)**: Near-perfect accuracy, slower
- **Standard (10k buckets)**: Good balance for training
- **Fast mode (1k buckets)**: Real-time capable, less precise

### 4. Table Simulation Pattern

For training against mixed player types:

```python
class TableSimulator:
    """Simulates a poker table with multiple player profiles."""

    def __init__(self, num_seats: int = 6):
        self.seats: List[PlayerProfile] = []
        self.human_seat: int = 0
        self.solver: BiasedCFRSolver = None

    def configure_table(self, seat_profiles: Dict[int, str]):
        """Set player types for each seat."""
        for seat, profile_name in seat_profiles.items():
            self.seats[seat] = PROFILES[profile_name]

    def get_opponent_action(self, seat: int, game_state: GameState) -> Action:
        """Get action from AI opponent based on their profile."""
        profile = self.seats[seat]

        # Solve with this player's biases
        self.solver.set_biases(profile.biases)
        strategy = self.solver.get_strategy(game_state)

        # Sample action from strategy distribution
        return self.sample_action(strategy)

    def compare_to_gto(self, player_action: Action, game_state: GameState) -> dict:
        """Compare player's action to GTO optimal."""
        gto_solver = BiasedCFRSolver(biases={})  # No bias = GTO
        gto_strategy = gto_solver.get_strategy(game_state)

        return {
            "player_action": player_action,
            "gto_strategy": gto_strategy,
            "ev_diff": self.calculate_ev_difference(player_action, gto_strategy),
        }
```

## Betting Logic (Preserved from Original)

### Raise Counting System
- **raiseCount** field tracks actual number of raises/bets per street
- Preflop starts at 1 (blinds count as first bet)
- Postflop starts at 0 (no bets yet)
- Increments on any aggressive action (open, bet, raise, all-in if raising)

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
1. **addAllInThreshold** (default 150%): Adds all-in when max bet/pot ratio < threshold
2. **forceAllInThreshold** (default 20%): Converts bets to all-in based on SPR
3. **mergingThreshold** (default 10%): Merges similar bet sizes

## Communication Patterns

### Electron ↔ Python Bridge

**Option A: Subprocess with JSON-RPC**
```typescript
// TypeScript side
class PythonBridge {
    private process: ChildProcess;

    async call(method: string, params: any): Promise<any> {
        const request = JSON.stringify({ method, params, id: uuid() });
        this.process.stdin.write(request + '\n');
        return this.waitForResponse();
    }
}

// Python side
class JsonRpcServer:
    def handle_request(self, request: dict):
        method = request['method']
        params = request['params']

        if method == 'solve':
            return self.solver.solve(**params)
        elif method == 'get_strategy':
            return self.solver.get_strategy(**params)
```

**Option B: FastAPI HTTP Server**
```python
from fastapi import FastAPI

app = FastAPI()

@app.post("/solve")
async def solve(config: SolverConfig):
    return solver.solve(config)

@app.post("/strategy")
async def get_strategy(game_state: GameState, profile: str):
    return solver.get_strategy(game_state, PROFILES[profile])
```

## Data Flow Patterns

### Training Session Flow
```
1. User configures table (seat assignments, profiles)
2. Frontend sends table config to Python backend
3. Backend initializes solvers for each seat profile
4. Game loop:
   a. Deal cards (frontend)
   b. For each decision point:
      - Get AI actions from backend (profile-biased)
      - Player makes decision (frontend)
      - Compare to GTO (backend)
      - Update statistics (frontend)
   c. Complete hand, update session stats
5. End session, show performance report
```

### Solver Request Flow
```
Frontend                    Backend
   │                           │
   ├──solve(state, profile)───►│
   │                           ├── Load profile biases
   │                           ├── Apply card abstraction
   │                           ├── Run biased CFR
   │                           ├── Extract strategy
   │◄──strategy distribution───┤
   │                           │
```

## Performance Patterns

### Caching Strategy
```python
class SolutionCache:
    """LRU cache for solved game states."""

    def __init__(self, max_size: int = 10000):
        self.cache = OrderedDict()
        self.max_size = max_size

    def get_key(self, state: GameState, profile: str) -> str:
        """Create unique key from state + profile."""
        return f"{state.hash()}:{profile}"

    def get(self, state: GameState, profile: str) -> Optional[Strategy]:
        key = self.get_key(state, profile)
        if key in self.cache:
            self.cache.move_to_end(key)
            return self.cache[key]
        return None
```

### Lazy Solving
- Only solve when user reaches decision point
- Pre-solve common spots in background
- Cache solutions for repeated positions

## Testing Patterns

### Profile Validation
```python
def validate_profile(profile: PlayerProfile, num_hands: int = 10000):
    """Validate that profile produces expected HUD stats."""
    simulator = HeadsUpSimulator(profile, PROFILES['gto'])
    stats = simulator.run(num_hands)

    if profile.target_vpip:
        assert abs(stats.vpip - profile.target_vpip) < 5.0
    if profile.target_pfr:
        assert abs(stats.pfr - profile.target_pfr) < 5.0
```

### CFR Convergence Testing
```python
def test_cfr_convergence():
    """Verify CFR converges to equilibrium with no bias."""
    solver = BiasedCFRSolver(biases={})
    solver.train(iterations=10000)

    exploitability = solver.compute_exploitability()
    assert exploitability < 0.01  # Less than 1% exploitable
```
