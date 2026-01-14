import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../state/appStore';

type TimeEntry = {
  id: number;
  task: string;
  start_time: string;
  end_time?: string;
  duration: number;
  category: string;
};

const TimeTracker = () => {
  const { pendingSession, clearPendingSession, updateStreak } = useAppStore();
  
  const [isTracking, setIsTracking] = useState(false);
  const [currentTask, setCurrentTask] = useState('');
  const [currentCategory, setCurrentCategory] = useState('Work');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Track if we've already processed the pending session
  const pendingProcessedRef = useRef(false);

  const categories = ['Work', 'Study', 'Exercise', 'Personal', 'Meetings', 'Break', 'Other'];

  const loadTimeEntries = async () => {
    try {
      setIsLoading(true);
      const entries = await invoke<TimeEntry[]>('get_time_entries');
      setTimeEntries(entries);
    } catch (error) {
      console.error('Failed to load time entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTimeEntries();
  }, []);

  // Handle pending session from Focus Card
  useEffect(() => {
    if (pendingSession && pendingSession.autoStart && !isTracking && !pendingProcessedRef.current) {
      pendingProcessedRef.current = true;
      
      // Set the task and category
      setCurrentTask(pendingSession.taskName);
      setCurrentCategory(pendingSession.category);
      
      // Auto-start the timer after a brief delay to let state settle
      setTimeout(() => {
        const now = new Date();
        setStartTime(now);
        setElapsedTime(0);
        setIsTracking(true);
        
        // Clear the pending session
        clearPendingSession();
      }, 100);
    }
  }, [pendingSession, isTracking, clearPendingSession]);

  useEffect(() => {
    let interval: number;
    if (isTracking && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((new Date().getTime() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  const startTracking = () => {
    if (!currentTask.trim()) return;
    const now = new Date();
    setStartTime(now);
    setElapsedTime(0);
    setIsTracking(true);
  };

  const stopTracking = async () => {
    if (!startTime) return;
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    
    try {
      const newEntry: TimeEntry = {
        id: 0,
        task: currentTask,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration,
        category: currentCategory,
      };
      
      const updatedEntries = await invoke<TimeEntry[]>('add_time_entry', { entry: newEntry });
      setTimeEntries(updatedEntries);
      
      // Update study streak if this was a Study session
      if (currentCategory === 'Study') {
        updateStreak(true);
      }
      
      // Reset pending processed flag for future sessions
      pendingProcessedRef.current = false;
      
      setIsTracking(false);
      setCurrentTask('');
      setElapsedTime(0);
      setStartTime(null);
    } catch (error) {
      console.error('Failed to save time entry:', error);
    }
  };

  const deleteEntry = async (id: number) => {
    try {
      const updatedEntries = await invoke<TimeEntry[]>('delete_time_entry', { id });
      setTimeEntries(updatedEntries);
    } catch (error) {
      console.error('Failed to delete time entry:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTotalTimeByCategory = () => {
    const totals: { [key: string]: number } = {};
    timeEntries.forEach(entry => {
      totals[entry.category] = (totals[entry.category] || 0) + entry.duration;
    });
    return totals;
  };

  const getTotalTimeToday = () => {
    const today = new Date().toDateString();
    return timeEntries
      .filter(entry => new Date(entry.start_time).toDateString() === today)
      .reduce((total, entry) => total + entry.duration, 0);
  };

  const getAverageSessionTime = () => {
    if (timeEntries.length === 0) return 0;
    const totalTime = timeEntries.reduce((total, entry) => total + entry.duration, 0);
    return Math.floor(totalTime / timeEntries.length);
  };

  const categoryTotals = getTotalTimeByCategory();
  const todayTotal = getTotalTimeToday();
  const averageSession = getAverageSessionTime();

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 pt-20 md:pt-8 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 mx-auto mb-4" style={{ borderColor: 'var(--accent)' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading time entries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 pt-20 md:pt-8" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Time Tracker</h1>
        <p style={{ color: 'var(--text-muted)' }} className="text-sm sm:text-base">Track your time and boost your productivity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p style={{ color: 'var(--text-muted)' }} className="text-xs sm:text-sm font-medium mb-1">Today's Total</p>
              <p className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--accent)' }}>{formatTime(todayTotal)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--accent-dim)' }}>
              <svg className="w-5 h-5" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p style={{ color: 'var(--text-muted)' }} className="text-xs sm:text-sm font-medium mb-1">Total Sessions</p>
              <p className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{timeEntries.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--border-color)' }}>
              <svg className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p style={{ color: 'var(--text-muted)' }} className="text-xs sm:text-sm font-medium mb-1">Average Session</p>
              <p className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatTime(averageSession)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--border-color)' }}>
              <svg className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer Panel */}
        <div className="lg:col-span-1">
          <div className="panel">
            <div className="text-center mb-6">
              <div 
                className={`text-5xl font-mono font-bold mb-4 ${isTracking ? 'animate-glow' : ''}`}
                style={{ color: isTracking ? 'var(--accent)' : 'var(--text-primary)' }}
              >
                {formatTime(elapsedTime)}
              </div>
              {isTracking && (
                <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                  Tracking: {currentTask}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={currentTask}
                onChange={(e) => setCurrentTask(e.target.value)}
                placeholder="What are you working on?"
                disabled={isTracking}
                className="input"
              />

              <select
                value={currentCategory}
                onChange={(e) => setCurrentCategory(e.target.value)}
                disabled={isTracking}
                className="input"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <button
                onClick={isTracking ? stopTracking : startTracking}
                disabled={!currentTask.trim() && !isTracking}
                className={`btn w-full ${isTracking ? 'btn-danger' : 'btn-primary'}`}
              >
                {isTracking ? 'Stop Tracking' : 'Start Tracking'}
              </button>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="panel mt-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Category Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(categoryTotals).map(([category, duration]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--accent)' }}></div>
                    <span style={{ color: 'var(--text-secondary)' }}>{category}</span>
                  </div>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatTime(duration)}</span>
                </div>
              ))}
              {Object.keys(categoryTotals).length === 0 && (
                <p className="text-center py-4" style={{ color: 'var(--text-muted)' }}>No time tracked yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Time Entries List */}
        <div className="lg:col-span-2">
          <div className="panel">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Time Entries</h3>
            <div className="space-y-0">
              {timeEntries.length === 0 ? (
                <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  <p>No time entries yet. Start tracking to see your history!</p>
                </div>
              ) : (
                timeEntries.slice(0, 10).map((entry) => (
                  <div key={entry.id} className="list-item flex items-center justify-between group">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{entry.task}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="badge badge-primary">{entry.category}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(entry.start_time)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-medium" style={{ color: 'var(--accent)' }}>{formatTime(entry.duration)}</span>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="btn-danger p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeTracker;
