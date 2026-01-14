import { useMemo, useState } from 'react';
import { Task, useAppStore } from '../state/appStore';

/**
 * DeadlinePanicShield - Auto-breaks urgent tasks into manageable chunks
 * 
 * When a task is within 72 hours, this component shows a survival plan
 * without requiring user input. Designed to reduce panic.
 */

type StudyChunk = {
  id: number;
  title: string;
  duration_minutes: number;
  completed: boolean;
};

interface PanicShieldProps {
  task: Task;
  onClose?: () => void;
}

const DeadlinePanicShield = ({ task, onClose }: PanicShieldProps) => {
  const { timeEntries } = useAppStore();
  const [completedChunks, setCompletedChunks] = useState<Set<number>>(new Set());

  // Calculate time remaining until deadline
  const timeRemaining = useMemo(() => {
    if (!task.due_date) return null;
    
    const now = new Date();
    const due = new Date(task.due_date);
    const diffMs = due.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return { hours: 0, isOverdue: true };
    }
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    return { hours, isOverdue: false };
  }, [task.due_date]);

  // Generate study chunks based on estimated time and remaining time
  const chunks = useMemo((): StudyChunk[] => {
    const estimatedMinutes = task.estimated_minutes || 60;
    const timeSpent = timeEntries
      .filter(e => e.task === task.title)
      .reduce((sum, e) => sum + e.duration, 0) / 60;
    
    const remainingMinutes = Math.max(0, estimatedMinutes - timeSpent);
    
    if (remainingMinutes === 0) {
      return [];
    }

    // Break into 25-45 minute chunks (Pomodoro-ish)
    const chunkSize = 30; // 30 minute chunks
    const numChunks = Math.ceil(remainingMinutes / chunkSize);
    
    const generatedChunks: StudyChunk[] = [];
    
    for (let i = 0; i < numChunks; i++) {
      const isLastChunk = i === numChunks - 1;
      const duration = isLastChunk 
        ? remainingMinutes - (chunkSize * (numChunks - 1))
        : chunkSize;
      
      generatedChunks.push({
        id: i,
        title: getChunkTitle(i, numChunks, task.title),
        duration_minutes: Math.max(15, duration),
        completed: false,
      });
    }
    
    return generatedChunks;
  }, [task, timeEntries]);

  const toggleChunk = (id: number) => {
    setCompletedChunks(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const completedCount = completedChunks.size;
  const progressPercent = chunks.length > 0 ? (completedCount / chunks.length) * 100 : 0;

  // If not within danger zone, don't show
  if (!timeRemaining || timeRemaining.hours > 72) {
    return null;
  }

  return (
    <div 
      className="panel"
      style={{ 
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ 
              backgroundColor: timeRemaining.isOverdue 
                ? 'rgba(239, 68, 68, 0.1)' 
                : 'rgba(245, 158, 11, 0.1)',
            }}
          >
            <svg 
              className="w-5 h-5" 
              style={{ 
                color: timeRemaining.isOverdue ? 'var(--danger)' : 'var(--warning)' 
              }}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p 
              className="text-xs font-medium uppercase tracking-wide"
              style={{ color: 'var(--text-muted)' }}
            >
              Survival Plan
            </p>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {task.title}
            </h3>
          </div>
        </div>

        {onClose && (
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Time Remaining */}
      <div 
        className="flex items-center gap-2 mb-4 p-3 rounded-lg"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <svg className="w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {timeRemaining.isOverdue 
            ? 'Overdue - but you can still finish this' 
            : `${timeRemaining.hours} hours remaining`
          }
        </span>
      </div>

      {/* Progress */}
      {chunks.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {completedCount} of {chunks.length} chunks done
            </span>
            <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Chunks List */}
      <div className="space-y-2 mb-4">
        {chunks.map((chunk) => (
          <div
            key={chunk.id}
            onClick={() => toggleChunk(chunk.id)}
            className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all"
            style={{ 
              backgroundColor: completedChunks.has(chunk.id) 
                ? 'rgba(34, 197, 94, 0.1)' 
                : 'var(--bg-secondary)',
              opacity: completedChunks.has(chunk.id) ? 0.7 : 1,
            }}
          >
            <div 
              className={`
                w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0
                ${completedChunks.has(chunk.id) ? 'bg-green-500' : 'border-2'}
              `}
              style={{ 
                borderColor: completedChunks.has(chunk.id) ? 'transparent' : 'var(--border-color)',
              }}
            >
              {completedChunks.has(chunk.id) && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p 
                className={`text-sm ${completedChunks.has(chunk.id) ? 'line-through' : ''}`}
                style={{ 
                  color: completedChunks.has(chunk.id) 
                    ? 'var(--text-muted)' 
                    : 'var(--text-primary)',
                }}
              >
                {chunk.title}
              </p>
            </div>
            <span 
              className="text-xs px-2 py-1 rounded"
              style={{ 
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-muted)',
              }}
            >
              {chunk.duration_minutes}m
            </span>
          </div>
        ))}
      </div>

      {/* Encouragement */}
      <div 
        className="text-center p-3 rounded-lg"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {completedCount === chunks.length && chunks.length > 0
            ? "You've got this. All chunks planned!"
            : "Break it down. One chunk at a time."
          }
        </p>
      </div>
    </div>
  );
};

// Helper function to generate chunk titles
function getChunkTitle(index: number, total: number, taskTitle: string): string {
  const prefix = taskTitle.length > 20 ? taskTitle.slice(0, 20) + '...' : taskTitle;
  
  if (total === 1) {
    return `Complete ${prefix}`;
  }
  
  if (index === 0) {
    return `Start: Review & outline`;
  }
  
  if (index === total - 1) {
    return `Finish: Final review`;
  }
  
  return `Session ${index + 1}: Deep work`;
}

/**
 * Wrapper component that shows panic shields for all urgent tasks
 */
export const UrgentTasksPanel = () => {
  const { tasks } = useAppStore();
  
  const urgentTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter(task => {
      if (task.status === 'Done' || !task.due_date) return false;
      const due = new Date(task.due_date);
      const hoursUntil = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursUntil <= 72 && hoursUntil > -24; // Within 72h or up to 24h overdue
    });
  }, [tasks]);

  // Don't render anything if no urgent tasks - avoids empty space
  if (urgentTasks.length === 0) {
    return null;
  }

  return (
    <div 
      className="panel p-4 sm:p-6"
      style={{ 
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
          <svg className="w-4 h-4" style={{ color: 'var(--danger)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Due Soon ({urgentTasks.length})
        </h3>
      </div>
      <div className="space-y-4">
        {urgentTasks.map(task => (
          <DeadlinePanicShield key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
};

export default DeadlinePanicShield;
