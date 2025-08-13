import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon, IconName } from './Icon';

interface NavItem {
  path: string;
  label: string;
  icon: IconName;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  {
    path: '/',
    label: 'Dashboard',
    icon: 'home'
  },
  {
    path: '/solver',
    label: 'Solver',
    icon: 'solver',
    children: [
      { path: '/solver/postflop', label: 'Postflop', icon: 'spade' },
      { path: '/solver/preflop', label: 'Preflop', icon: 'club' },
      { path: '/solver/ranges', label: 'Range Builder', icon: 'range' },
      { path: '/solver/solutions', label: 'Saved Solutions', icon: 'save' }
    ]
  },
  {
    path: '/training',
    label: 'Training',
    icon: 'practice',
    children: [
      { path: '/training/practice', label: 'Practice', icon: 'play' },
      { path: '/training/campaign', label: 'Campaign', icon: 'trophy' },
      { path: '/training/review', label: 'Review', icon: 'chart' }
    ]
  },
  {
    path: '/study',
    label: 'Study',
    icon: 'book',
    children: [
      { path: '/study/library', label: 'Library', icon: 'folder' },
      { path: '/study/explorer', label: 'Hand Explorer', icon: 'search' }
    ]
  },
  {
    path: '/analysis',
    label: 'Analysis',
    icon: 'chart',
    children: [
      { path: '/analysis/hands', label: 'Hand History', icon: 'history' }
    ]
  },
  {
    path: '/compete/ranked',
    label: 'Ranked Play',
    icon: 'sword'
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: 'settings'
  }
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = React.useState<string[]>(['/solver', '/training']);

  const toggleExpanded = (path: string) => {
    setExpandedItems(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const isActive = location.pathname === item.path || 
                    (item.children && item.children.some(child => location.pathname === child.path));
    const isExpanded = expandedItems.includes(item.path);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.path} className="nav-item">
        {hasChildren ? (
          <>
            <button
              onClick={() => toggleExpanded(item.path)}
              className={`nav-link ${isActive ? 'active' : ''}`}
              style={{ paddingLeft: `${1 + depth * 1}rem` }}
            >
              <span className="nav-icon">
                <Icon name={item.icon} size={18} />
              </span>
              <span className="nav-label">{item.label}</span>
              <span className="nav-chevron">
                <Icon name={isExpanded ? 'chevron-down' : 'chevron-right'} size={14} />
              </span>
            </button>
            {isExpanded && (
              <div className="nav-children">
                {item.children.map(child => renderNavItem(child, depth + 1))}
              </div>
            )}
          </>
        ) : (
          <Link
            to={item.path}
            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            style={{ paddingLeft: `${1 + depth * 1}rem` }}
          >
            <span className="nav-icon">
              <Icon name={item.icon} size={18} />
            </span>
            <span className="nav-label">{item.label}</span>
          </Link>
        )}
      </div>
    );
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="logo">
          <h1>PokerLobby</h1>
          <span className="version">v1.0.0</span>
        </div>
        
        <nav>
          {navigation.map(item => renderNavItem(item))}
        </nav>

        <div className="sidebar-footer">
          <div className="status">
            <span className="status-indicator online"></span>
            <span className="status-text">Solver Ready</span>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <div className="page-wrapper">
          {children}
        </div>
      </div>
    </div>
  );
};