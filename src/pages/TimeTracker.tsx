import { useState, useEffect } from 'react';

type TimeEntry = {
  id: number;
  task: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
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

  // Load data from localStorage
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

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('timeEntries', JSON.stringify(timeEntries));
  }, [timeEntries]);

  // Update elapsed time
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
    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Time Tracker
        </h1>
        <p className="text-xl text-gray-600 font-light">Track your time and boost your productivity</p>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
              ⏱️
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">{formatTime(todayTotal)}</div>
              <div className="text-gray-600 font-medium">Today's Total</div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-2xl">
              📊
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">{timeEntries.length}</div>
              <div className="text-gray-600 font-medium">Total Sessions</div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center text-2xl">
              ⏰
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">{formatTime(averageSession)}</div>
              <div className="text-gray-600 font-medium">Average Session</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Timer Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Current Session</h3>
            
            <div className="text-center mb-8">
              <div className="text-6xl font-mono font-bold text-emerald-600 mb-4">
                {formatTime(elapsedTime)}
              </div>
              <div className={`w-4 h-4 rounded-full mx-auto ${isTracking ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Task Description</label>
                <input
                  type="text"
                  value={currentTask}
                  onChange={(e) => setCurrentTask(e.target.value)}
                  placeholder="What are you working on?"
                  disabled={isTracking}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 outline-none disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <select
                  value={currentCategory}
                  onChange={(e) => setCurrentCategory(e.target.value)}
                  disabled={isTracking}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 outline-none disabled:bg-gray-50"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                {!isTracking ? (
                  <button
                    onClick={startTracking}
                    disabled={!currentTask.trim()}
                    className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-gradient-to-r from-emerald-500 to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-xl px-12 py-4 min-w-48"
                  >
                    ▶️ Start Timer
                  </button>
                ) : (
                  <button
                    onClick={stopTracking}
                    className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-gradient-to-r from-red-500 to-pink-600 text-xl px-12 py-4 min-w-48"
                  >
                    ⏹️ Stop Timer
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          {Object.keys(categoryTotals).length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">Time by Category</h3>
              <div className="space-y-6">
                {Object.entries(categoryTotals)
                  .sort(([,a], [,b]) => b - a)
                  .map(([category, seconds]) => (
                    <div key={category} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-800">{category}</span>
                        <div className="text-right">
                          <div className="font-bold text-emerald-600">{formatTime(seconds)}</div>
                          <div className="text-sm text-gray-500">
                            {((seconds / Math.max(...Object.values(categoryTotals))) * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-teal-600 h-3 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(seconds / Math.max(...Object.values(categoryTotals))) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Time Entries */}
        <div className="bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
          <h3 className="text-2xl font-bold mb-8 text-gray-800">Recent Sessions</h3>
          {timeEntries.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">⏰</div>
              <p className="text-gray-500 text-lg">No time entries yet. Start your first session above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {timeEntries.slice(0, 10).map((entry) => (
                <div 
                  key={entry.id} 
                  className="border-l-4 border-l-emerald-500 bg-gray-50 rounded-r-xl p-6 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-lg font-bold text-gray-800 mb-2">{entry.task}</div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                          {entry.category}
                        </span>
                        <span>{formatDate(entry.startTime)}</span>
                        {entry.endTime && <span>to {formatDate(entry.endTime)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-xl font-bold text-emerald-600">
                        {formatTime(entry.duration)}
                      </div>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeTracker;
