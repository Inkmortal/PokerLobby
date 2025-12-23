# Active Context

## Current Focus
**MAJOR ARCHITECTURE PIVOT**: Transitioning from Rust-only solver to hybrid Python/Rust architecture to support exploitative training against population-modeled opponents (fish, nits, whales, LAGs, calling stations).

The core insight: GTO training tools need to simulate realistic opponents, not just GTO vs GTO. Training against player archetypes with population tendencies is essential for practical skill development.

## Architecture Decision (2025-12-23)

### Why We're Pivoting
1. **Current Rust solver (postflop-solver)** is postflop-only, 2-player focused
2. **No exploitative profile support** - only node-locking (brittle, robotic play)
3. **Can't model opponent types** - fish who call too much, nits who fold too much
4. **Training requires dynamic opponents** - not static GTO strategies

### New Hybrid Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    PokerLobby Frontend                       │
│                  (React + TypeScript - KEEP)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Python Backend                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   RLCard        │  │   phevaluator   │  │  Custom      │ │
│  │   (Game Engine  │  │   (Hand Eval)   │  │  Profile     │ │
│  │    + CFR Base)  │  │                 │  │  System      │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│                              │                               │
│  ┌───────────────────────────┴───────────────────────────┐  │
│  │              Utility-Biased CFR Solver                 │  │
│  │         (Modified regret minimization formula)         │  │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Electron IPC Bridge                        │
│              (Python subprocess or HTTP API)                 │
└─────────────────────────────────────────────────────────────┘
```

## Technology Decisions

### Keeping
- **Frontend**: React + TypeScript (working well)
- **Desktop**: Electron (stable)
- **UI Components**: Range Builder, ActionSequenceBar, etc.

### Adding
- **Python Backend**: RLCard + phevaluator + custom profile system
- **Game Engine**: RLCard (supports NLHE, has CFR implementation)
- **Hand Evaluator**: phevaluator (100KB lookup tables, nanosecond eval)
- **Profile System**: Custom utility-bias implementation (GTO Wizard-style)

### Deprecating
- **Rust postflop-solver**: Keep for reference, but not primary engine
- **Native Node bindings**: Replace with Python subprocess/HTTP

## Key Concepts

### Utility-Biased CFR (vs Node-Locking)
Instead of hard constraints at specific nodes, we modify the regret formula globally:

```python
# Standard CFR: minimize regret R
# Biased CFR: minimize R + bias_tensor

PROFILES = {
    "fish": {"call": +0.08, "fold": -0.05, "raise": -0.03},
    "nit": {"fold": +0.10, "call": -0.05, "raise": -0.08},
    "whale": {"call": +0.15, "raise": +0.05, "fold": -0.20},
    "calling_station": {"call": +0.12, "fold": -0.15},
    "lag": {"raise": +0.10, "call": -0.05, "fold": -0.05},
    "maniac": {"raise": +0.20, "call": -0.10},
}

# Apply during CFR update step:
regret[action] = cfv[action] - node_value + bias[action] * pot
```

This creates organic, exploitable play patterns rather than robotic forced actions.

### Why This Matters for Training
- **GTO Wizard charges $39-100/month** for profile-based training
- **Real opponents aren't GTO** - they have exploitable tendencies
- **Learning to exploit** is as important as learning GTO
- **Population data** tells us how player types actually behave

## Refactoring Phases

### Phase 1: Foundation (Current Priority)
- [ ] Set up Python backend with RLCard
- [ ] Install phevaluator for hand evaluation
- [ ] Create Electron ↔ Python bridge (subprocess or HTTP)
- [ ] Basic game state communication

### Phase 2: Profile System
- [ ] Define player archetypes with utility biases
- [ ] Modify RLCard's CFR to accept bias tensors
- [ ] Build profile configuration UI in frontend
- [ ] Test exploitative solving

### Phase 3: Card Abstraction (For Speed)
- [ ] Implement EHS (Expected Hand Strength) calculator
- [ ] Build K-Means clustering for hand bucketing
- [ ] Configurable granularity (accuracy vs speed tradeoff)

### Phase 4: Training Mode
- [ ] Table simulation with mixed player types
- [ ] Real-time GTO comparison during play
- [ ] Session statistics and leak detection

### Phase 5: GPU Acceleration (Future)
- [ ] Migrate CFR to JAX using Pgx environments
- [ ] MCCFR with jax.vmap for vectorization
- [ ] Support for different GPU tiers (4090 vs 3060)

## Open Questions

1. **Python integration method**: Subprocess with JSON IPC vs FastAPI HTTP server?
2. **Keep Rust solver?**: Could maintain for pure GTO postflop analysis
3. **Profile complexity**: Start with 5-6 archetypes or full custom parameters?
4. **Real-time requirements**: How fast do training decisions need to be?

## Research Findings

### Libraries Evaluated
| Library | Purpose | Decision |
|---------|---------|----------|
| [RLCard](https://github.com/datamllab/rlcard) | Game engine + CFR | USE - Full NLHE support |
| [OpenSpiel](https://github.com/google-deepmind/open_spiel) | Alternative engine | BACKUP - More complex |
| [phevaluator](https://github.com/HenryRLee/PokerHandEvaluator) | Hand evaluation | USE - Fast, Python bindings |
| [cfrx](https://github.com/Egiob/cfrx) | JAX CFR | FUTURE - Only Kuhn/Leduc now |
| [Pgx](https://github.com/sotetsuk/pgx) | JAX game envs | FUTURE - GPU acceleration |
| [poker-hand-clustering](https://github.com/sammiya/poker-hand-clustering) | Card abstraction | USE - K-Means EHS |

### GTO Wizard's Approach (What We're Copying)
From [their blog](https://blog.gtowizard.com/profiles_explained_modeling_exploitable_opponents/):
- **Action Incentives**: Virtual bonuses/penalties on Check/Bet/Fold/Call
- **Global Propagation**: Biases apply across entire game tree
- **Percentage-Based**: e.g., "+5% pot incentive to calling"
- **EV-Neutral Solving**: Incentives influence computation but removed from final EV

## Learning and Insights

- **Node-locking is brittle** - creates robotic, exploitable AI
- **Utility bias is organic** - AI "wants" to play a certain way
- **GTO Wizard's moat** is their profile system, not their solver
- **RLCard already has CFR** - we just need to modify the update step
- **phevaluator is battle-tested** - used in production poker software
- **Card abstraction is the speed lever** - more buckets = more accurate but slower

## Current Blockers
None - ready to begin Phase 1 implementation