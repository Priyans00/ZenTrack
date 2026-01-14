import { useEffect } from 'react';
import { useAppStore } from '../state/appStore';

/**
 * TimeRealityCheck - Weekly Summary of Planned vs Actual Time
 * 
 * Brutally honest about study time discrepancies.
 * Designed to be informative, not shame-inducing.
 */
const TimeRealityCheck = () => {
  const { weeklyStats, computeWeeklyStats, isLoading } = useAppStore();

  useEffect(() => {
    computeWeeklyStats();
  }, [computeWeeklyStats]);

  if (isLoading || !weeklyStats) {
    return (
      <div className="panel animate-pulse">
        <div className="h-5 w-40 rounded mb-4" style={{ backgroundColor: 'var(--border-color)' }}></div>
        <div className="h-8 w-full rounded" style={{ backgroundColor: 'var(--border-color)' }}></div>
      </div>
    );
  }

  const { planned_minutes, actual_minutes, completion_rate, on_track, pace_warning } = weeklyStats;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Determine status color (calm, not alarming)
  const getStatusStyle = () => {
    if (planned_minutes === 0) {
      return { color: 'var(--text-secondary)', bg: 'var(--bg-card)' };
    }
    if (completion_rate >= 80) {
      return { color: 'var(--success)', bg: 'rgba(34, 197, 94, 0.1)' };
    }
    if (completion_rate >= 50) {
      return { color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)' };
    }
    return { color: 'var(--text-secondary)', bg: 'var(--bg-secondary)' };
  };

  const statusStyle = getStatusStyle();

  return (
    <div className="panel">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--border-color)' }}
          >
            <svg className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>This Week</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Time reality check</p>
          </div>
        </div>

        {/* Status Badge */}
        <div 
          className="px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ 
            backgroundColor: statusStyle.bg,
            color: statusStyle.color,
          }}
        >
          {on_track ? 'On Track' : 'Behind'}
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div 
          className="p-3 rounded-lg"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Planned</p>
          <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {formatTime(planned_minutes)}
          </p>
        </div>
        <div 
          className="p-3 rounded-lg"
          style={{ backgroundColor: statusStyle.bg }}
        >
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Actual</p>
          <p className="text-xl font-bold" style={{ color: statusStyle.color }}>
            {formatTime(actual_minutes)}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Progress</span>
          <span className="text-xs font-medium" style={{ color: statusStyle.color }}>
            {Math.round(completion_rate)}%
          </span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-bar-fill"
            style={{ 
              width: `${Math.min(100, completion_rate)}%`,
              background: on_track 
                ? 'linear-gradient(90deg, var(--success), #34d399)'
                : completion_rate >= 50 
                  ? 'linear-gradient(90deg, var(--warning), #fbbf24)'
                  : 'linear-gradient(90deg, var(--text-muted), var(--text-secondary))',
            }}
          ></div>
        </div>
      </div>

      {/* Pace Warning - Honest but not scary */}
      {pace_warning && (
        <div 
          className="flex items-start gap-2 p-3 rounded-lg"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <svg 
            className="w-4 h-4 mt-0.5 flex-shrink-0" 
            style={{ color: 'var(--text-muted)' }}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {pace_warning}
          </p>
        </div>
      )}

      {/* Empty State */}
      {planned_minutes === 0 && (
        <div 
          className="text-center p-4 rounded-lg"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No tasks scheduled this week yet.
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Add tasks with due dates to track progress.
          </p>
        </div>
      )}
    </div>
  );
};

export default TimeRealityCheck;
