import { useState, useEffect } from 'react';

type TimeEntry = {
  id: number;
  task: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  category: string;
};

const TimeTracker = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentTask, setCurrentTask] = useState('');
  const [currentCategory, setCurrentCategory] = useState('Work');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);

  const categories = ['Work', 'Study', 'Exercise', 'Personal', 'Meetings', 'Break', 'Other'];

  useEffect(() => {
    const savedEntries = localStorage.getItem('timeEntries');
    if (savedEntries) {
      const parsed = JSON.parse(savedEntries);
      setTimeEntries(parsed.map((entry: any) => ({
        ...entry,
        startTime: new Date(entry.startTime),
        endTime: entry.endTime ? new Date(entry.endTime) : undefined,
      })));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('timeEntries', JSON.stringify(timeEntries));
  }, [timeEntries]);

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

  const stopTracking = () => {
    if (!startTime) return;
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    
    const newEntry: TimeEntry = {
      id: Date.now(),
      task: currentTask,
      startTime,
      endTime,
      duration,
      category: currentCategory,
    };
    
    setTimeEntries(prev => [newEntry, ...prev]);
    setIsTracking(false);
    setCurrentTask('');
    setElapsedTime(0);
    setStartTime(null);
  };

  const deleteEntry = (id: number) => {
    setTimeEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      .filter(entry => new Date(entry.startTime).toDateString() === today)
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

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Work': 'bg-accent-blue',
      'Study': 'bg-accent-purple',
      'Exercise': 'bg-accent-teal',
      'Personal': 'bg-accent-pink',
      'Meetings': 'bg-accent-yellow',
      'Break': 'bg-accent-coral',
      'Other': 'bg-gray-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-dark-primary p-4 sm:p-6 lg:p-8 pt-20 md:pt-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Time Tracker</h1>
        <p className="text-gray-500 text-sm sm:text-base">Track your time and boost your productivity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Today's Total</p>
              <p className="text-2xl sm:text-3xl font-bold text-accent-teal">{formatTime(todayTotal)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-accent-teal/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Total Sessions</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">{timeEntries.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Average Session</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">{formatTime(averageSession)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timer Section */}
        <div className="panel">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-accent-teal/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-accent-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Current Session</h3>
          </div>
          
          <div className="text-center mb-8">
            <div className="text-5xl sm:text-6xl font-mono font-bold text-white mb-4">
              {formatTime(elapsedTime)}
            </div>
            <div className={`w-3 h-3 rounded-full mx-auto ${isTracking ? 'bg-accent-coral animate-pulse' : 'bg-gray-600'}`}></div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Task Description</label>
              <input
                type="text"
                value={currentTask}
                onChange={(e) => setCurrentTask(e.target.value)}
                placeholder="What are you working on?"
                disabled={isTracking}
                className="w-full px-4 py-3 bg-dark-card-hover border border-dark-border rounded-xl focus:border-accent-teal focus:ring-1 focus:ring-accent-teal/20 transition-all duration-200 outline-none text-white placeholder-gray-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
              <select
                value={currentCategory}
                onChange={(e) => setCurrentCategory(e.target.value)}
                disabled={isTracking}
                className="w-full px-4 py-3 bg-dark-card-hover border border-dark-border rounded-xl focus:border-accent-teal focus:ring-1 focus:ring-accent-teal/20 transition-all duration-200 outline-none text-white disabled:opacity-50"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className="bg-dark-card">{cat}</option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              {!isTracking ? (
                <button
                  onClick={startTracking}
                  disabled={!currentTask.trim()}
                  className="w-full bg-accent-teal hover:bg-accent-teal/90 text-dark-primary py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Start Timer
                </button>
              ) : (
                <button
                  onClick={stopTracking}
                  className="w-full bg-accent-coral hover:bg-accent-coral/90 text-white py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 6h12v12H6z" />
                  </svg>
                  Stop Timer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="panel">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-accent-purple/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Time by Category</h3>
          </div>
          
          {Object.keys(categoryTotals).length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-dark-card-hover flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">No time tracked yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(categoryTotals)
                .sort(([,a], [,b]) => b - a)
                .map(([category, seconds]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getCategoryColor(category)}`}></div>
                        <span className="text-gray-300 font-medium">{category}</span>
                      </div>
                      <span className="text-white font-semibold">{formatTime(seconds)}</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className={`h-full ${getCategoryColor(category)} rounded-full transition-all duration-500`}
                        style={{ 
                          width: `${(seconds / Math.max(...Object.values(categoryTotals))) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="panel mt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-blue/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Recent Sessions</h3>
          </div>
        </div>
        
        {timeEntries.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-dark-card-hover flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-white font-medium mb-1">No sessions yet</h3>
            <p className="text-gray-500 text-sm">Start your first session above!</p>
          </div>
        ) : (
          <div className="space-y-0">
            {timeEntries.slice(0, 10).map((entry) => (
              <div key={entry.id} className="list-item flex items-center justify-between group">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-2 h-10 rounded-full ${getCategoryColor(entry.category)}`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{entry.task}</p>
                    <div className="flex items-center gap-3 text-gray-500 text-sm">
                      <span className="badge badge-purple">{entry.category}</span>
                      <span>{formatDate(entry.startTime)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-accent-teal font-semibold">{formatTime(entry.duration)}</span>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="p-2 bg-accent-coral/20 text-accent-coral rounded-lg hover:bg-accent-coral/30 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeTracker;
