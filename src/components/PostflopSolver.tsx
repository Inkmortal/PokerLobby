import React, { useState } from 'react';
import { Api } from '../api';

interface SolverConfig {
  startingPot: number;
  effectiveStack: number;
  oopRange: string;
  ipRange: string;
  board: string;
  betSizes: string;
}

export function PostflopSolver() {
  const [config, setConfig] = useState<SolverConfig>({
    startingPot: 200,
    effectiveStack: 900,
    oopRange: 'QQ+,AKs',
    ipRange: 'JJ+,AKo+',
    board: 'Td9d6h',
    betSizes: '60%,100%,a'
  });

  const [solving, setSolving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exploitability, setExploitability] = useState<number | null>(null);
  const [iterations, setIterations] = useState(1000);

  const handleSolve = async () => {
    setSolving(true);
    setProgress(0);
    
    try {
      const api = Api.get();
      
      // Initialize game
      await api.solvePostflop({
        startingPot: config.startingPot,
        effectiveStack: config.effectiveStack,
        oopRange: config.oopRange,
        ipRange: config.ipRange,
        flop: config.board,
        betSizes: config.betSizes
      });

      // Simulate progress (in real app, would get updates from solver)
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Mock exploitability result
      setTimeout(() => {
        setExploitability(2.5);
        setSolving(false);
      }, 2000);
      
    } catch (error) {
      console.error('Solver error:', error);
      setSolving(false);
    }
  };

  const catppuccin = {
    base: '#1e1e2e',
    mantle: '#181825',
    crust: '#11111b',
    surface0: '#313244',
    surface1: '#45475a',
    surface2: '#585b70',
    overlay0: '#6c7086',
    overlay1: '#7f849c',
    overlay2: '#9399b2',
    subtext0: '#a6adc8',
    subtext1: '#bac2de',
    text: '#cdd6f4',
    green: '#a6e3a1',
    teal: '#94e2d5',
    blue: '#89b4fa',
    mauve: '#cba6f7',
    red: '#f38ba8',
    peach: '#fab387',
    yellow: '#f9e2af'
  };

  return (
    <div className="h-full flex" style={{ backgroundColor: catppuccin.base }}>
      {/* Left Sidebar - Configuration */}
      <div className="w-80 p-6 overflow-y-auto" style={{ 
        backgroundColor: catppuccin.mantle,
        borderRight: `1px solid ${catppuccin.surface1}`
      }}>
        <h2 className="text-xl font-bold mb-6" style={{ color: catppuccin.text }}>
          Game Configuration
        </h2>
        
        {/* Pot & Stack */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: catppuccin.subtext1 }}>
              Starting Pot
            </label>
            <input
              type="number"
              value={config.startingPot}
              onChange={(e) => setConfig({...config, startingPot: parseInt(e.target.value)})}
              className="w-full px-3 py-2 rounded-lg focus:outline-none"
              style={{
                backgroundColor: catppuccin.surface0,
                border: `1px solid ${catppuccin.surface1}`,
                color: catppuccin.text
              }}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: catppuccin.subtext1 }}>
              Effective Stack
            </label>
            <input
              type="number"
              value={config.effectiveStack}
              onChange={(e) => setConfig({...config, effectiveStack: parseInt(e.target.value)})}
              className="w-full px-3 py-2 rounded-lg focus:outline-none"
              style={{
                backgroundColor: catppuccin.surface0,
                border: `1px solid ${catppuccin.surface1}`,
                color: catppuccin.text
              }}
            />
          </div>
        </div>

        {/* Ranges */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: catppuccin.subtext1 }}>
              OOP Range
            </label>
            <textarea
              value={config.oopRange}
              onChange={(e) => setConfig({...config, oopRange: e.target.value})}
              className="w-full px-3 py-2 rounded-lg focus:outline-none h-20 font-mono text-sm"
              placeholder="e.g., QQ+,AKs"
              style={{
                backgroundColor: catppuccin.surface0,
                border: `1px solid ${catppuccin.surface1}`,
                color: catppuccin.text
              }}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: catppuccin.subtext1 }}>
              IP Range
            </label>
            <textarea
              value={config.ipRange}
              onChange={(e) => setConfig({...config, ipRange: e.target.value})}
              className="w-full px-3 py-2 rounded-lg focus:outline-none h-20 font-mono text-sm"
              placeholder="e.g., JJ+,AKo+"
              style={{
                backgroundColor: catppuccin.surface0,
                border: `1px solid ${catppuccin.surface1}`,
                color: catppuccin.text
              }}
            />
          </div>
        </div>

        {/* Board */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" style={{ color: catppuccin.subtext1 }}>
            Board
          </label>
          <input
            type="text"
            value={config.board}
            onChange={(e) => setConfig({...config, board: e.target.value})}
            className="w-full px-3 py-2 rounded-lg focus:outline-none font-mono"
            placeholder="e.g., Td9d6h"
            style={{
              backgroundColor: catppuccin.surface0,
              border: `1px solid ${catppuccin.surface1}`,
              color: catppuccin.text
            }}
          />
        </div>

        {/* Bet Sizes */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" style={{ color: catppuccin.subtext1 }}>
            Bet Sizes
          </label>
          <input
            type="text"
            value={config.betSizes}
            onChange={(e) => setConfig({...config, betSizes: e.target.value})}
            className="w-full px-3 py-2 rounded-lg focus:outline-none"
            placeholder="e.g., 60%,100%,a"
            style={{
              backgroundColor: catppuccin.surface0,
              border: `1px solid ${catppuccin.surface1}`,
              color: catppuccin.text
            }}
          />
        </div>

        {/* Iterations */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" style={{ color: catppuccin.subtext1 }}>
            Iterations: <span style={{ color: catppuccin.green }}>{iterations}</span>
          </label>
          <input
            type="range"
            min="100"
            max="10000"
            step="100"
            value={iterations}
            onChange={(e) => setIterations(parseInt(e.target.value))}
            className="w-full"
            style={{
              accentColor: catppuccin.green
            }}
          />
        </div>

        {/* Solve Button */}
        <button
          onClick={handleSolve}
          disabled={solving}
          className="w-full py-3 rounded-lg font-bold transition-all duration-200"
          style={{
            background: solving 
              ? catppuccin.surface1 
              : `linear-gradient(135deg, ${catppuccin.green}, ${catppuccin.teal})`,
            color: solving ? catppuccin.overlay1 : catppuccin.base,
            cursor: solving ? 'not-allowed' : 'pointer'
          }}
        >
          {solving ? 'Solving...' : 'Solve Game'}
        </button>

        {/* Progress Bar */}
        {solving && (
          <div className="mt-4">
            <div className="rounded-full h-2 overflow-hidden" style={{ backgroundColor: catppuccin.surface0 }}>
              <div 
                className="h-full transition-all duration-300"
                style={{ 
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${catppuccin.green}, ${catppuccin.teal})`
                }}
              />
            </div>
            <p className="text-xs mt-2 text-center" style={{ color: catppuccin.overlay1 }}>
              {progress}% Complete
            </p>
          </div>
        )}

        {/* Exploitability */}
        {exploitability !== null && (
          <div className="mt-4 p-4 rounded-lg" style={{
            backgroundColor: `${catppuccin.green}20`,
            border: `1px solid ${catppuccin.green}40`
          }}>
            <p className="text-sm" style={{ color: catppuccin.green }}>
              Exploitability: <span className="font-bold">{exploitability.toFixed(3)}</span>
            </p>
          </div>
        )}
      </div>

      {/* Main Content - Game Tree Visualization */}
      <div className="flex-1 flex flex-col">
        {/* Poker Table */}
        <div className="flex-1 p-8">
          <div className="h-full flex items-center justify-center">
            <div className="relative w-full max-w-4xl">
              {/* Table */}
              <div className="rounded-full aspect-[2/1] flex items-center justify-center relative" style={{
                background: `linear-gradient(135deg, ${catppuccin.surface0}, ${catppuccin.mantle})`,
                boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.5)'
              }}>
                {/* Pot */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="text-center">
                    <p className="text-sm mb-2" style={{ color: catppuccin.subtext0 }}>Pot</p>
                    <p className="text-2xl font-bold" style={{ color: catppuccin.text }}>
                      ${config.startingPot}
                    </p>
                  </div>
                </div>

                {/* Board Cards */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 flex gap-2">
                  {config.board.match(/.{2}/g)?.map((card, i) => (
                    <div key={i} className="w-16 h-24 rounded-lg shadow-lg flex items-center justify-center" style={{
                      backgroundColor: '#ffffff',
                      border: `2px solid ${catppuccin.surface1}`
                    }}>
                      <span className="text-2xl font-bold" style={{
                        color: card[1] === 'd' || card[1] === 'h' ? catppuccin.red : '#000000'
                      }}>
                        {card[0]}{card[1] === 'd' ? '♦' : card[1] === 'h' ? '♥' : card[1] === 'c' ? '♣' : '♠'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* OOP Player */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2" style={{
                      backgroundColor: catppuccin.surface1
                    }}>
                      <span className="font-bold" style={{ color: catppuccin.text }}>OOP</span>
                    </div>
                    <p className="text-sm" style={{ color: catppuccin.subtext0 }}>
                      Stack: ${config.effectiveStack}
                    </p>
                  </div>
                </div>

                {/* IP Player */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2" style={{
                      backgroundColor: catppuccin.surface1
                    }}>
                      <span className="font-bold" style={{ color: catppuccin.text }}>IP</span>
                    </div>
                    <p className="text-sm" style={{ color: catppuccin.subtext0 }}>
                      Stack: ${config.effectiveStack}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6" style={{ borderTop: `1px solid ${catppuccin.surface1}` }}>
          <div className="flex justify-center gap-4">
            {['Check', 'Bet 60%', 'Bet 100%', 'All-in'].map((action) => (
              <button
                key={action}
                className="px-6 py-2 rounded-lg font-medium transition-all"
                style={{
                  backgroundColor: catppuccin.surface0,
                  color: catppuccin.text,
                  border: `1px solid ${catppuccin.surface1}`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = catppuccin.surface1;
                  e.currentTarget.style.borderColor = catppuccin.green;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = catppuccin.surface0;
                  e.currentTarget.style.borderColor = catppuccin.surface1;
                }}
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Strategy */}
      <div className="w-80 p-6 overflow-y-auto" style={{
        backgroundColor: catppuccin.mantle,
        borderLeft: `1px solid ${catppuccin.surface1}`
      }}>
        <h2 className="text-xl font-bold mb-6" style={{ color: catppuccin.text }}>
          Strategy
        </h2>
        
        <div className="space-y-4">
          <div className="p-4 rounded-lg" style={{ backgroundColor: catppuccin.surface0 }}>
            <h3 className="text-sm font-medium mb-3" style={{ color: catppuccin.subtext1 }}>
              Action Frequencies
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span style={{ color: catppuccin.text }}>Check</span>
                <span style={{ color: catppuccin.green }}>45%</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: catppuccin.text }}>Bet 60%</span>
                <span style={{ color: catppuccin.yellow }}>35%</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: catppuccin.text }}>Bet 100%</span>
                <span style={{ color: catppuccin.peach }}>20%</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg" style={{ backgroundColor: catppuccin.surface0 }}>
            <h3 className="text-sm font-medium mb-2" style={{ color: catppuccin.subtext1 }}>
              Expected Value
            </h3>
            <p className="text-2xl font-bold" style={{ color: catppuccin.green }}>
              +24.5
            </p>
          </div>

          <div className="p-4 rounded-lg" style={{ backgroundColor: catppuccin.surface0 }}>
            <h3 className="text-sm font-medium mb-2" style={{ color: catppuccin.subtext1 }}>
              Equity
            </h3>
            <p className="text-2xl font-bold" style={{ color: catppuccin.blue }}>
              52.3%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}