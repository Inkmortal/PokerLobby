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
      title: 'Learn the Basics',
      description: 'Start with simple concepts and gradually build your poker knowledge',
      icon: 'solver' as const,
      link: '/solver/postflop',
      gradient: `linear-gradient(135deg, ${catppuccin.green}, ${catppuccin.teal})`,
      stats: 'Start Here'
    },
    {
      title: 'Build Your Ranges',
      description: 'Understand which hands to play and when - made simple and visual',
      icon: 'range' as const,
      link: '/solver/ranges',
      gradient: `linear-gradient(135deg, ${catppuccin.blue}, ${catppuccin.sapphire})`,
      stats: 'Visual Tools'
    },
    {
      title: 'Practice & Play',
      description: 'Apply what you learned in a fun, no-pressure environment',
      icon: 'practice' as const,
      link: '/training/practice',
      gradient: `linear-gradient(135deg, ${catppuccin.mauve}, ${catppuccin.blue})`,
      stats: 'Have Fun'
    }
  ];

  const quickStats = [
    { 
      value: 'Beginner', 
      label: 'Friendly', 
      sublabel: 'made for learners',
      color: catppuccin.green 
    },
    { 
      value: 'Simple', 
      label: 'Interface', 
      sublabel: 'no complexity',
      color: catppuccin.blue 
    },
    { 
      value: 'Visual', 
      label: 'Learning', 
      sublabel: 'see your plays',
      color: catppuccin.mauve 
    },
    { 
      value: 'Affordable', 
      label: 'Pricing', 
      sublabel: 'worth the investment',
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
            maxWidth: '700px',
            margin: '0 auto 3rem'
          }}>
            The casual way to learn poker strategy - perfect for beginners and improving players
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
                title: 'Pick a Scenario',
                description: 'Choose a common poker situation to explore'
              },
              {
                step: '02',
                title: 'See the Strategy',
                description: 'Visual guides show you what to do and why'
              },
              {
                step: '03',
                title: 'Practice & Learn',
                description: 'Try it yourself with friendly feedback'
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

      {/* Why PokerLobby Section */}
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
              Why We Built This
            </h2>
            <p style={{
              fontSize: '1.125rem',
              color: catppuccin.subtext0,
              marginBottom: '2rem',
              lineHeight: '1.6'
            }}>
              We wanted to learn poker strategy without getting overwhelmed. Most tools are made for pros - 
              PokerLobby is made for the rest of us who just want to get better at the game we love.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'Learn at Your Pace', value: 'No pressure, no rush' },
                { label: 'Visual Learning', value: 'See strategies, not just numbers' },
                { label: 'Beginner Focus', value: 'Start simple, grow from there' },
                { label: 'Actually Fun', value: 'Enjoy the learning process' }
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
              fontSize: '1.125rem',
              color: catppuccin.text,
              fontWeight: '600',
              marginBottom: '1.5rem'
            }}>
              Perfect For:
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {[
                '🎮 Casual players wanting to improve',
                '📚 Visual learners who like to see concepts',
                '🎯 People who want focused practice',
                '💡 Anyone curious about poker strategy',
                '🌱 Complete beginners welcome!'
              ].map((item, i) => (
                <div key={i} style={{
                  color: catppuccin.subtext0,
                  fontSize: '0.95rem',
                  lineHeight: '1.5'
                }}>
                  {item}
                </div>
              ))}
            </div>
            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              background: catppuccin.mantle,
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: catppuccin.overlay1,
              textAlign: 'center'
            }}>
              No poker jargon required - we explain everything
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};