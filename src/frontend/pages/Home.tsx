import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';

export const Home: React.FC = () => {
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
    sapphire: '#74c7ec',
    mauve: '#cba6f7',
    red: '#f38ba8',
    peach: '#fab387',
    yellow: '#f9e2af',
    rosewater: '#f5e0dc'
  };

  const features = [
    {
      title: 'Postflop Solver',
      description: 'Quick and easy solver to help you understand optimal play',
      icon: 'solver' as const,
      link: '/solver/postflop',
      gradient: `linear-gradient(135deg, ${catppuccin.green}, ${catppuccin.teal})`,
      stats: 'Fast & Simple'
    },
    {
      title: 'Range Builder',
      description: 'Visual tools to build and explore different hand ranges',
      icon: 'range' as const,
      link: '/solver/ranges',
      gradient: `linear-gradient(135deg, ${catppuccin.blue}, ${catppuccin.sapphire})`,
      stats: 'Easy to Use'
    },
    {
      title: 'Practice Mode',
      description: 'Learn by playing against solved strategies at your own pace',
      icon: 'practice' as const,
      link: '/training/practice',
      gradient: `linear-gradient(135deg, ${catppuccin.mauve}, ${catppuccin.blue})`,
      stats: 'Learn & Improve'
    }
  ];

  const quickStats = [
    { 
      value: 'Free', 
      label: 'Forever', 
      sublabel: 'no subscriptions',
      color: catppuccin.green 
    },
    { 
      value: 'Fast', 
      label: 'Solving', 
      sublabel: 'quick results',
      color: catppuccin.blue 
    },
    { 
      value: 'Easy', 
      label: 'To Use', 
      sublabel: 'simple interface',
      color: catppuccin.mauve 
    },
    { 
      value: 'Fun', 
      label: 'Learning', 
      sublabel: 'enjoy the journey',
      color: catppuccin.yellow 
    }
  ];

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
          background: `radial-gradient(circle, ${catppuccin.green}10 0%, transparent 70%)`,
          filter: 'blur(100px)',
          pointerEvents: 'none'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontSize: '4rem',
            fontWeight: '800',
            marginBottom: '1.5rem',
            background: `linear-gradient(135deg, ${catppuccin.text} 0%, ${catppuccin.green} 50%, ${catppuccin.teal} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em'
          }}>
            Welcome to PokerLobby
          </h1>
          
          <p style={{
            fontSize: '1.5rem',
            color: catppuccin.subtext0,
            marginBottom: '3rem',
            maxWidth: '600px',
            margin: '0 auto 3rem'
          }}>
            Your friendly poker training companion with all the tools you need
          </p>

          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            marginBottom: '4rem'
          }}>
            <Link
              to="/solver/postflop"
              style={{
                padding: '1rem 2rem',
                background: `linear-gradient(135deg, ${catppuccin.green}, ${catppuccin.teal})`,
                color: catppuccin.base,
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '1.125rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: `0 10px 30px ${catppuccin.green}30`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 15px 40px ${catppuccin.green}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 10px 30px ${catppuccin.green}30`;
              }}
            >
              <Icon name="play" size={20} color={catppuccin.base} />
              Start Solving
            </Link>

            <Link
              to="/training/practice"
              style={{
                padding: '1rem 2rem',
                background: 'transparent',
                color: catppuccin.text,
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '1.125rem',
                border: `2px solid ${catppuccin.surface1}`,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = catppuccin.green;
                e.currentTarget.style.color = catppuccin.green;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = catppuccin.surface1;
                e.currentTarget.style.color = catppuccin.text;
              }}
            >
              Practice Mode
            </Link>
          </div>

          {/* Quick Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '2rem',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            {quickStats.map((stat, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: stat.color,
                  marginBottom: '0.25rem'
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: catppuccin.text,
                  fontWeight: '600'
                }}>
                  {stat.label}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: catppuccin.overlay1
                }}>
                  {stat.sublabel}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        padding: '0 3rem 4rem',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '2rem'
        }}>
          {features.map((feature, i) => (
            <Link
              key={i}
              to={feature.link}
              style={{
                display: 'block',
                padding: '2rem',
                background: catppuccin.surface0,
                borderRadius: '16px',
                border: `1px solid ${catppuccin.surface1}`,
                textDecoration: 'none',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = catppuccin.green;
                e.currentTarget.style.boxShadow = `0 20px 40px ${catppuccin.base}80`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = catppuccin.surface1;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Gradient background */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: feature.gradient
              }} />

              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1.5rem'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: feature.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon name={feature.icon} size={24} color={catppuccin.base} />
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: catppuccin.text,
                    marginBottom: '0.5rem'
                  }}>
                    {feature.title}
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: catppuccin.subtext0,
                    marginBottom: '1rem',
                    lineHeight: '1.5'
                  }}>
                    {feature.description}
                  </p>
                  <div style={{
                    fontSize: '0.75rem',
                    color: catppuccin.overlay1,
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {feature.stats}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Getting Started Section */}
      <section style={{
        padding: '4rem 3rem',
        background: catppuccin.mantle,
        borderTop: `1px solid ${catppuccin.surface1}`
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: catppuccin.text,
            marginBottom: '3rem'
          }}>
            Getting Started
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '3rem'
          }}>
            {[
              {
                step: '01',
                title: 'Configure Game',
                description: 'Set stack sizes, ranges, and board texture'
              },
              {
                step: '02',
                title: 'Run Solver',
                description: 'Get GTO solutions in under 2 seconds'
              },
              {
                step: '03',
                title: 'Analyze & Train',
                description: 'Study strategies and practice implementation'
              }
            ].map((item, i) => (
              <div key={i}>
                <div style={{
                  fontSize: '3rem',
                  fontWeight: '800',
                  background: `linear-gradient(135deg, ${catppuccin.green}, ${catppuccin.teal})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '1rem'
                }}>
                  {item.step}
                </div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: catppuccin.text,
                  marginBottom: '0.5rem'
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: catppuccin.subtext0
                }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Performance Section */}
      <section style={{
        padding: '4rem 3rem',
        background: catppuccin.base
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4rem',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: catppuccin.text,
              marginBottom: '1.5rem'
            }}>
              Built for Performance
            </h2>
            <p style={{
              fontSize: '1.125rem',
              color: catppuccin.subtext0,
              marginBottom: '2rem',
              lineHeight: '1.6'
            }}>
              Native Rust solver compiled to machine code delivers unmatched speed. 
              No cloud dependency, no subscription fees, just pure performance on your machine.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'Native Performance', value: '20% faster than WASM' },
                { label: 'Memory Efficient', value: 'Optimized data structures' },
                { label: 'Parallel Processing', value: 'Multi-threaded solving' },
                { label: 'Instant Save/Load', value: 'Binary serialization' }
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: catppuccin.green
                  }} />
                  <div>
                    <span style={{
                      color: catppuccin.text,
                      fontWeight: '600'
                    }}>
                      {item.label}:
                    </span>
                    <span style={{
                      color: catppuccin.subtext0,
                      marginLeft: '0.5rem'
                    }}>
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: catppuccin.surface0,
            borderRadius: '16px',
            padding: '2rem',
            border: `1px solid ${catppuccin.surface1}`
          }}>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              color: catppuccin.subtext0
            }}>
              <div style={{ color: catppuccin.overlay1, marginBottom: '0.5rem' }}>
                // Solver Performance
              </div>
              <div>
                <span style={{ color: catppuccin.blue }}>const</span>
                <span style={{ color: catppuccin.text }}> solver = </span>
                <span style={{ color: catppuccin.blue }}>new</span>
                <span style={{ color: catppuccin.yellow }}> NativeSolver</span>
                <span style={{ color: catppuccin.text }}>(); </span>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <span style={{ color: catppuccin.text }}>solver.</span>
                <span style={{ color: catppuccin.green }}>initGame</span>
                <span style={{ color: catppuccin.text }}>(config);</span>
              </div>
              <div>
                <span style={{ color: catppuccin.text }}>solver.</span>
                <span style={{ color: catppuccin.green }}>solve</span>
                <span style={{ color: catppuccin.text }}>(</span>
                <span style={{ color: catppuccin.peach }}>1000</span>
                <span style={{ color: catppuccin.text }}>, </span>
                <span style={{ color: catppuccin.peach }}>0.5</span>
                <span style={{ color: catppuccin.text }}>);</span>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <span style={{ color: catppuccin.overlay1 }}>// Exploitability: 2.497</span>
              </div>
              <div>
                <span style={{ color: catppuccin.overlay1 }}>// Time: 1.8 seconds</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};