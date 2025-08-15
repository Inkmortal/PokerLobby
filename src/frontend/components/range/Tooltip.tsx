import React, { useState } from 'react';
import ReactDOM from 'react-dom';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  delay?: number;
}

const catppuccin = {
  base: '#1e1e2e',
  text: '#cdd6f4',
  surface0: '#313244',
  overlay1: '#7f849c'
};

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [placement, setPlacement] = useState<'right' | 'left' | 'top' | 'bottom'>('right');

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipWidth = 250; // max width of tooltip
    const tooltipHeight = 80; // estimated height
    const gap = 8;
    
    // Determine best placement
    let bestPlacement: 'right' | 'left' | 'top' | 'bottom' = 'right';
    let x = 0;
    let y = 0;
    
    // Try right first (preferred)
    if (rect.right + gap + tooltipWidth < window.innerWidth) {
      bestPlacement = 'right';
      x = rect.right + gap;
      y = rect.top + rect.height / 2;
    }
    // Try left if right doesn't fit
    else if (rect.left - gap - tooltipWidth > 0) {
      bestPlacement = 'left';
      x = rect.left - gap;
      y = rect.top + rect.height / 2;
    }
    // Try top if horizontal doesn't work
    else if (rect.top - gap - tooltipHeight > 0) {
      bestPlacement = 'top';
      x = rect.left + rect.width / 2;
      y = rect.top - gap;
    }
    // Default to bottom
    else {
      bestPlacement = 'bottom';
      x = rect.left + rect.width / 2;
      y = rect.bottom + gap;
    }
    
    setPlacement(bestPlacement);
    setPosition({ x, y });
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <span 
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && ReactDOM.createPortal(
        <>
          <div
            style={{
              position: 'fixed',
              top: position.y,
              left: position.x,
              transform: (() => {
                switch (placement) {
                  case 'right':
                    return 'translateY(-50%)';
                  case 'left':
                    return 'translate(-100%, -50%)';
                  case 'top':
                    return 'translate(-50%, -100%)';
                  case 'bottom':
                    return 'translateX(-50%)';
                }
              })(),
              zIndex: 10000,
              padding: '0.5rem 0.75rem',
              background: catppuccin.base,
              border: `1px solid ${catppuccin.surface0}`,
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: catppuccin.text,
              maxWidth: '250px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
              pointerEvents: 'none',
              lineHeight: '1.4',
              whiteSpace: 'normal',
              animation: `fadeIn${placement} 0.2s ease-in`
            }}
          >
            {content}
          </div>
          <style>{`
            @keyframes fadeInright {
              from { opacity: 0; transform: translate(5px, -50%); }
              to { opacity: 1; transform: translateY(-50%); }
            }
            @keyframes fadeInleft {
              from { opacity: 0; transform: translate(calc(-100% - 5px), -50%); }
              to { opacity: 1; transform: translate(-100%, -50%); }
            }
            @keyframes fadeIntop {
              from { opacity: 0; transform: translate(-50%, calc(-100% - 5px)); }
              to { opacity: 1; transform: translate(-50%, -100%); }
            }
            @keyframes fadeInbottom {
              from { opacity: 0; transform: translate(-50%, 5px); }
              to { opacity: 1; transform: translateX(-50%); }
            }
          `}</style>
        </>,
        document.body
      )}
    </span>
  );
};

// Info icon component
export const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <span 
    className={className}
    style={{ 
      marginLeft: '4px', 
      cursor: 'help',
      display: 'inline-flex',
      alignItems: 'center',
      color: catppuccin.overlay1
    }}
    title="Hover for more info"
  >
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
      <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
    </svg>
  </span>
);