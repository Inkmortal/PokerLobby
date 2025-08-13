import React from 'react';
import { Icon } from '../components/Icon';

export const Settings: React.FC = () => {
  const catppuccin = {
    base: '#1e1e2e',
    mantle: '#181825',
    surface0: '#313244',
    surface1: '#45475a',
    overlay1: '#7f849c',
    subtext0: '#a6adc8',
    text: '#cdd6f4',
    green: '#a6e3a1',
    blue: '#89b4fa',
    mauve: '#cba6f7',
    peach: '#fab387'
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: `linear-gradient(180deg, ${catppuccin.base} 0%, ${catppuccin.mantle} 100%)`
    }}>
      {/* Hero Section */}
      <section style={{
        padding: '4rem 3rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background gradient orb */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '800px',
          background: `radial-gradient(circle, ${catppuccin.mauve}10 0%, transparent 70%)`,
          filter: 'blur(100px)',
          pointerEvents: 'none'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontSize: '4rem',
            fontWeight: '800',
            marginBottom: '1.5rem',
            background: `linear-gradient(135deg, ${catppuccin.text} 0%, ${catppuccin.mauve} 50%, ${catppuccin.peach} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em'
          }}>
            Settings
          </h1>
          
          <p style={{
            fontSize: '1.5rem',
            color: catppuccin.subtext0,
            marginBottom: '3rem',
            maxWidth: '600px',
            margin: '0 auto 3rem'
          }}>
            Customize your poker training experience
          </p>
        </div>
      </section>

      {/* Settings Preview */}
      <section style={{
        padding: '0 3rem 4rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '2rem'
        }}>
          {[
            {
              title: 'General',
              icon: 'settings',
              color: catppuccin.blue,
              items: ['Theme preferences', 'Sound settings', 'Display options', 'Language']
            },
            {
              title: 'Solver',
              icon: 'solver',
              color: catppuccin.green,
              items: ['Accuracy settings', 'Memory limits', 'CPU threads', 'Auto-save']
            },
            {
              title: 'Training',
              icon: 'practice',
              color: catppuccin.mauve,
              items: ['Difficulty level', 'Feedback timing', 'Practice modes', 'Statistics']
            },
            {
              title: 'Data',
              icon: 'database',
              color: catppuccin.peach,
              items: ['Import/Export', 'Backup settings', 'Storage location', 'Clear cache']
            }
          ].map((section, i) => (
            <div key={i} style={{
              background: catppuccin.surface0,
              borderRadius: '16px',
              border: `1px solid ${catppuccin.surface1}`,
              padding: '2rem',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Gradient accent */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: section.color
              }} />

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: `${section.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon name={section.icon as any} size={24} color={section.color} />
                </div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: catppuccin.text
                }}>
                  {section.title}
                </h3>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {section.items.map((item, j) => (
                  <div key={j} style={{
                    padding: '0.75rem 1rem',
                    background: catppuccin.mantle,
                    borderRadius: '8px',
                    color: catppuccin.subtext0,
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span>{item}</span>
                    <span style={{ color: catppuccin.overlay1 }}>Coming soon</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};