import React from 'react';
import { Icon } from '../../components/Icon';

export const Campaign: React.FC = () => {
  const catppuccin = {
    base: '#1e1e2e',
    mantle: '#181825',
    surface0: '#313244',
    surface1: '#45475a',
    overlay1: '#7f849c',
    subtext0: '#a6adc8',
    text: '#cdd6f4',
    yellow: '#f9e2af',
    peach: '#fab387',
    red: '#f38ba8'
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
          background: `radial-gradient(circle, ${catppuccin.yellow}10 0%, transparent 70%)`,
          filter: 'blur(100px)',
          pointerEvents: 'none'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontSize: '4rem',
            fontWeight: '800',
            marginBottom: '1.5rem',
            background: `linear-gradient(135deg, ${catppuccin.text} 0%, ${catppuccin.yellow} 50%, ${catppuccin.peach} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em'
          }}>
            Campaign Mode
          </h1>
          
          <p style={{
            fontSize: '1.5rem',
            color: catppuccin.subtext0,
            marginBottom: '3rem',
            maxWidth: '600px',
            margin: '0 auto 3rem'
          }}>
            Structured lessons to master poker fundamentals
          </p>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section style={{
        padding: '0 3rem 4rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          background: catppuccin.surface0,
          borderRadius: '16px',
          border: `1px solid ${catppuccin.surface1}`,
          padding: '4rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Gradient accent */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(135deg, ${catppuccin.yellow}, ${catppuccin.peach})`
          }} />

          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: `linear-gradient(135deg, ${catppuccin.yellow}, ${catppuccin.peach})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem'
          }}>
            <Icon name="campaign" size={40} color={catppuccin.base} />
          </div>

          <h2 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: catppuccin.text,
            marginBottom: '1rem'
          }}>
            Coming Soon
          </h2>
          
          <p style={{
            fontSize: '1.125rem',
            color: catppuccin.subtext0,
            marginBottom: '3rem',
            maxWidth: '500px',
            margin: '0 auto 3rem',
            lineHeight: '1.6'
          }}>
            Follow a structured path from beginner to advanced
            with guided lessons and challenges.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '2rem',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            {[
              { icon: 'school', title: 'Guided Lessons', desc: 'Step-by-step learning' },
              { icon: 'trophy', title: 'Achievements', desc: 'Track your progress' },
              { icon: 'difficulty', title: 'Adaptive Difficulty', desc: 'Learn at your pace' }
            ].map((feature, i) => (
              <div key={i} style={{
                padding: '1.5rem',
                background: catppuccin.mantle,
                borderRadius: '12px',
                border: `1px solid ${catppuccin.surface1}`
              }}>
                <Icon name={feature.icon as any} size={24} color={catppuccin.yellow} />
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: catppuccin.text,
                  margin: '1rem 0 0.5rem'
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: catppuccin.overlay1
                }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};