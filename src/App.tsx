import React, { useState } from 'react';
import { PostflopSolver } from './components/PostflopSolver';
import { RangeBuilder } from './components/RangeBuilder';
import { HandAnalyzer } from './components/HandAnalyzer';
import { StudyMode } from './components/StudyMode';
import { PracticeMode } from './components/PracticeMode';

type Tab = 'solver' | 'range' | 'analyzer' | 'study' | 'practice';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('solver');

  const tabs = [
    { id: 'solver' as Tab, label: 'Solver' },
    { id: 'range' as Tab, label: 'Range Builder' },
    { id: 'analyzer' as Tab, label: 'Hand Analyzer' },
    { id: 'study' as Tab, label: 'Study' },
    { id: 'practice' as Tab, label: 'Practice' },
  ];

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: '#1e1e2e' }}>
      {/* Header */}
      <header className="glass" style={{ borderBottom: '1px solid #45475a' }}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold" style={{ 
                background: 'linear-gradient(135deg, #a6e3a1, #94e2d5)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                PokerLobby
              </h1>
              <span className="text-xs font-mono" style={{ color: '#7f849c' }}>v1.0.0</span>
            </div>
            
            {/* Navigation Tabs */}
            <nav className="flex gap-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    backgroundColor: activeTab === tab.id ? 'rgba(166, 227, 161, 0.1)' : 'transparent',
                    color: activeTab === tab.id ? '#a6e3a1' : '#bac2de',
                    border: activeTab === tab.id ? '1px solid rgba(166, 227, 161, 0.3)' : '1px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.backgroundColor = 'rgba(69, 71, 90, 0.5)';
                      e.currentTarget.style.color = '#cdd6f4';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#bac2de';
                    }
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Settings */}
            <button 
              className="p-2 rounded-lg transition-colors"
              style={{ color: '#7f849c' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(69, 71, 90, 0.5)';
                e.currentTarget.style.color = '#cdd6f4';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#7f849c';
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'solver' && <PostflopSolver />}
        {activeTab === 'range' && <RangeBuilder />}
        {activeTab === 'analyzer' && <HandAnalyzer />}
        {activeTab === 'study' && <StudyMode />}
        {activeTab === 'practice' && <PracticeMode />}
      </main>

      {/* Status Bar */}
      <footer className="glass px-6 py-2" style={{ borderTop: '1px solid #45475a' }}>
        <div className="flex items-center justify-between text-xs" style={{ color: '#7f849c' }}>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#a6e3a1' }}></span>
              Solver Ready
            </span>
            <span>Memory: 124 MB</span>
            <span>CPU: 12%</span>
          </div>
          <div>
            <span>© 2025 PokerLobby - Ultimate Poker Training Platform</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;