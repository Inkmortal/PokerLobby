#!/bin/bash

# Build script for compiling Rust solver to native Node.js module

set -e

echo "Building native Node.js solver module..."

cd rust

# Install napi-cli if not already installed
if ! command -v napi &> /dev/null; then
    echo "Installing @napi-rs/cli..."
    npm install -g @napi-rs/cli
fi

# Build the native module
echo "Compiling native module..."
napi build --platform --release --output-dir ../native

echo "Native build complete!"
echo "Output files in src/solver/native/"

# Create TypeScript definitions
echo "Creating TypeScript bindings..."
cat > ../native/index.d.ts << 'EOF'
export interface GameConfig {
  startingPot: number;
  effectiveStack: number;
  rakeRate?: number;
  rakeCap?: number;
}

export class PostflopSolver {
  constructor();
  initTree(config: GameConfig, oopRange: string, ipRange: string, flop: string): void;
  solveIteration(): number;
  solve(maxIterations: number, targetExploitability: number): number;
  getStrategy(): number[];
  getEv(player: number): number[];
  getActions(): string[];
  playAction(actionIndex: number): void;
  backToRoot(): void;
  getMemoryUsage(): string;
  getExploitability(): number;
  getIterations(): number;
}

export function parseCard(s: string): number;
export function formatCard(card: number): string;
export function parseFlop(s: string): number[];
export function evaluateHand(cards: number[]): number;
EOF

echo "TypeScript bindings created!"
echo ""
echo "To use in the frontend:"
echo "  const { PostflopSolver } = require('@/solver/native');"
echo "  const solver = new PostflopSolver();"