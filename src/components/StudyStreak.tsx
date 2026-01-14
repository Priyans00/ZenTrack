import { useAppStore } from '../state/appStore';

/**
 * StudyStreak - Guilt-Free Streak Display
 * 
 * Shows current streak with breaks allowed.
 * "Paused" instead of "Broken" - reduces anxiety.
 */

const StudyStreak = () => {
  const { streak, updateStreak } = useAppStore();

  const { current_streak, longest_streak, paused, grace_days_used } = streak;

  // Determine streak status
  const getStreakStatus = () => {
    if (paused) {
      return {
        label: 'Paused',
        color: 'var(--warning)',
        bg: 'rgba(245, 158, 11, 0.1)',
        message: grace_days_used > 0 
          ? `${2 - grace_days_used} grace day${2 - grace_days_used !== 1 ? 's' : ''} left`
          : 'Take a break, streak is safe',
      };
    }
    if (current_streak === 0) {
      return {
        label: 'Start Today',
        color: 'var(--text-muted)',
        bg: 'var(--bg-secondary)',
        message: 'Begin your study streak',
      };
    }
    if (current_streak >= 7) {
      return {
        label: 'On Fire',
        color: 'var(--accent)',
        bg: 'var(--accent-dim)',
        message: 'Incredible consistency!',
      };
    }
    return {
      label: 'Active',
      color: 'var(--success)',
      bg: 'rgba(34, 197, 94, 0.1)',
      message: 'Keep it going!',
    };
  };

  const status = getStreakStatus();

  // Generate streak visualization (last 7 days)
  const getStreakDots = () => {
    const dots = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Simplified logic: show as "studied" if within current streak
      const daysFromToday = i;
      const wasStudied = daysFromToday < current_streak;
      const isToday = i === 0;
      
      dots.push({
        day: dayName,
        studied: wasStudied,
        isToday,
        isPaused: paused && isToday,
      });
    }
    
    return dots;
  };

  const dots = getStreakDots();

  return (
    <div className="panel">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: status.bg }}
          >
            {current_streak > 0 ? (
              <svg className="w-5 h-5" style={{ color: status.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" style={{ color: status.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Study Streak</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{status.message}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div 
          className="px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ 
            backgroundColor: status.bg,
            color: status.color,
          }}
        >
          {status.label}
        </div>
      </div>

      {/* Streak Count */}
      <div 
        className="text-center py-4 mb-4 rounded-lg"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <p 
          className="text-4xl font-bold mb-1"
          style={{ color: current_streak > 0 ? status.color : 'var(--text-muted)' }}
        >
          {current_streak}
        </p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          day{current_streak !== 1 ? 's' : ''} in a row
        </p>
        {longest_streak > current_streak && (
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            Best: {longest_streak} days
          </p>
        )}
      </div>

      {/* Week Visualization */}
      <div className="flex justify-between mb-4">
        {dots.map((dot, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1.5">
            <div 
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center
                ${dot.isToday ? 'ring-2' : ''}
              `}
              style={{ 
                backgroundColor: dot.studied 
                  ? status.bg
                  : dot.isPaused 
                    ? 'rgba(245, 158, 11, 0.1)'
                    : 'var(--bg-secondary)',
                color: dot.studied 
                  ? status.color 
                  : dot.isPaused
                    ? 'var(--warning)'
                    : 'var(--text-muted)',
                outline: dot.isToday ? `2px solid ${status.color}` : 'none',
                outlineOffset: '1px',
              }}
            >
              {dot.studied ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : dot.isPaused ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <span className="text-xs">-</span>
              )}
            </div>
            <span 
              className="text-xs"
              style={{ 
                color: dot.isToday ? status.color : 'var(--text-muted)',
                fontWeight: dot.isToday ? 600 : 400,
              }}
            >
              {dot.day.slice(0, 2)}
            </span>
          </div>
        ))}
      </div>

      {/* Grace Days Info */}
      {paused && (
        <div 
          className="flex items-center gap-2 p-3 rounded-lg mb-4"
          style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
        >
          <svg className="w-4 h-4" style={{ color: 'var(--warning)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Streak paused, not broken. Study today to continue.
          </p>
        </div>
      )}

      {/* Quick Action */}
      <button 
        className="btn btn-primary w-full"
        onClick={() => {
          updateStreak(true);
          // Navigate to time tracker
          window.location.href = '/time';
        }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Start Study Session
      </button>
    </div>
  );
};

/**
 * Compact version for dashboard
 */
export const StreakBadge = () => {
  const { streak } = useAppStore();
  
  if (streak.current_streak === 0 && !streak.paused) return null;

  return (
    <div 
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
      style={{ 
        backgroundColor: streak.paused ? 'rgba(245, 158, 11, 0.1)' : 'var(--accent-dim)',
        color: streak.paused ? 'var(--warning)' : 'var(--accent)',
      }}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      </svg>
      <span className="text-sm font-medium">
        {streak.paused ? 'Paused' : `${streak.current_streak} day streak`}
      </span>
    </div>
  );
};

export default StudyStreak;
