import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../state/appStore';

/**
 * FocusCard - "What Should I Study Right Now?" Component
 * 
 * A calm, non-judgmental card that shows ONE task the student should focus on.
 * Designed to reduce decision fatigue and panic by giving clear direction.
 */
const FocusCard = () => {
  const navigate = useNavigate();
  const { 
    focusRecommendation, 
    computeFocusRecommendation,
    stressLevel,
    isLoading,
    setPendingSession,
  } = useAppStore();

  useEffect(() => {
    computeFocusRecommendation();
  }, [computeFocusRecommendation]);

  if (isLoading) {
    return (
      <div className="panel animate-pulse">
        <div className="h-6 w-48 rounded mb-4" style={{ backgroundColor: 'var(--border-color)' }}></div>
        <div className="h-4 w-full rounded mb-2" style={{ backgroundColor: 'var(--border-color)' }}></div>
        <div className="h-4 w-3/4 rounded" style={{ backgroundColor: 'var(--border-color)' }}></div>
      </div>
    );
  }

  if (!focusRecommendation || !focusRecommendation.task) {
    return (
      <div className="panel">
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
          >
            <svg className="w-5 h-5" style={{ color: 'var(--success)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>All caught up!</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No pending tasks right now.</p>
          </div>
        </div>
      </div>
    );
  }

  const { task, subject, reason, urgency, suggested_duration_minutes } = focusRecommendation;

  // Urgency-based styling (calm, not alarming)
  const getUrgencyStyle = () => {
    // When stress is high, use calmer colors
    if (stressLevel === 'high' || stressLevel === 'overwhelming') {
      return {
        bg: 'var(--bg-card)',
        border: 'var(--border-color)',
        accent: 'var(--text-secondary)',
      };
    }

    switch (urgency) {
      case 'critical':
        return {
          bg: 'rgba(239, 68, 68, 0.05)',
          border: 'rgba(239, 68, 68, 0.2)',
          accent: 'var(--danger)',
        };
      case 'high':
        return {
          bg: 'rgba(245, 158, 11, 0.05)',
          border: 'rgba(245, 158, 11, 0.2)',
          accent: 'var(--warning)',
        };
      case 'medium':
        return {
          bg: 'var(--accent-dim)',
          border: 'rgba(255, 107, 53, 0.2)',
          accent: 'var(--accent)',
        };
      default:
        return {
          bg: 'var(--bg-card)',
          border: 'var(--border-color)',
          accent: 'var(--text-secondary)',
        };
    }
  };

  const style = getUrgencyStyle();

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  return (
    <div 
      className="panel transition-all duration-300"
      style={{ 
        backgroundColor: style.bg,
        borderColor: style.border,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--accent-dim)' }}
          >
            <svg className="w-5 h-5" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Focus on this now
            </p>
            <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
              {task.title}
            </h3>
          </div>
        </div>

        {/* Suggested Duration */}
        {suggested_duration_minutes > 0 && (
          <div 
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ 
              backgroundColor: 'var(--accent-dim)',
              color: 'var(--accent)',
            }}
          >
            {formatDuration(suggested_duration_minutes)}
          </div>
        )}
      </div>

      {/* Subject Tag */}
      {subject && (
        <div className="mb-3">
          <span 
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium"
            style={{ 
              backgroundColor: `${subject.color}20`,
              color: subject.color,
            }}
          >
            <span 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: subject.color }}
            ></span>
            {subject.name}
          </span>
        </div>
      )}

      {/* Task Description (if any) */}
      {task.description && (
        <p 
          className="text-sm mb-4 line-clamp-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          {task.description}
        </p>
      )}

      {/* Reason - The "Why" */}
      <div 
        className="flex items-start gap-2 p-3 rounded-lg mb-4"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <svg 
          className="w-4 h-4 mt-0.5 flex-shrink-0" 
          style={{ color: style.accent }}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {reason}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button 
          className="btn btn-primary flex-1"
          onClick={() => {
            // Set pending session with task details and auto-start
            setPendingSession({
              taskName: task.title,
              category: 'Study',
              subjectId: task.subject_id,
              autoStart: true,
            });
            // Navigate to time tracker
            navigate('/time');
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Start Session
        </button>
        <button 
          className="btn btn-secondary"
          onClick={() => {
            // Skip and get next recommendation
            computeFocusRecommendation();
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Due Date if applicable */}
      {task.due_date && (
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>
              Due: {new Date(task.due_date).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusCard;
