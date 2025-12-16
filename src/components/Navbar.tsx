import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )},
    { path: '/tasks', label: 'Tasks', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    )},
    { path: '/calendar', label: 'Calendar', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )},
    { path: '/time', label: 'Time Tracker', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { path: '/spend', label: 'Spending', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { path: '/about', label: 'About', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
  ];

  return (
    <>
      {/* Mobile Header */}
      <div 
        className="md:hidden fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-4"
        style={{ 
          backgroundColor: 'var(--bg-secondary)', 
          borderBottom: '1px solid var(--border-color)' 
        }}
      >
        <Link to="/" className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <span className="font-bold text-sm text-black">Z</span>
          </div>
          <span style={{ color: 'var(--text-primary)' }} className="font-semibold text-lg">ZenTrack</span>
        </Link>
        <button 
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-primary)' }}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 pt-16"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setIsMenuOpen(false)}
        >
          <nav 
            className="h-full w-64 py-4"
            style={{ 
              backgroundColor: 'var(--bg-secondary)', 
              borderRight: '1px solid var(--border-color)' 
            }} 
            onClick={e => e.stopPropagation()}
          >
            <div className="px-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
                  style={{
                    backgroundColor: location.pathname === item.path ? 'var(--accent-dim)' : 'transparent',
                    color: location.pathname === item.path ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside 
        className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col z-50 overflow-hidden"
        style={{ 
          backgroundColor: 'var(--bg-secondary)', 
          borderRight: '1px solid var(--border-color)' 
        }}
      >
        {/* Logo Section */}
        <div className="p-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <Link to="/" className="flex items-center gap-3 group">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:shadow-lg"
              style={{ 
                backgroundColor: 'var(--accent)',
                boxShadow: 'none',
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 20px var(--accent-glow)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <span className="font-bold text-xl text-black">Z</span>
            </div>
            <div>
              <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Zen</span>
              <span className="font-bold text-lg" style={{ color: 'var(--accent)' }}>Track</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto scrollbar-thin">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group"
                style={{
                  backgroundColor: location.pathname === item.path ? 'var(--accent-dim)' : 'transparent',
                  color: location.pathname === item.path ? 'var(--accent)' : 'var(--text-secondary)',
                  borderLeft: location.pathname === item.path ? '2px solid var(--accent)' : '2px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== item.path) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== item.path) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 space-y-3" style={{ borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={toggleTheme}
            className="w-full px-3 py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            style={{ 
              backgroundColor: 'var(--bg-card)', 
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)'
            }}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="text-sm font-medium">Light</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <span className="text-sm font-medium">Dark</span>
              </>
            )}
          </button>
          <div 
            className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer"
            style={{ backgroundColor: 'var(--bg-card-hover)' }}
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <span className="font-semibold text-sm text-black">U</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>User</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Local Session</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Spacer */}
      <div className="md:hidden h-16"></div>
    </>
  );
};

export default Navbar;
