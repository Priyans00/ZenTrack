import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import TaskModal, { Task } from "../components/TaskModal";

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const fetchTasks = async () => {
    try {
      const res = await invoke<Task[]>("get_tasks");
      setTasks(res);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const updateTaskStatus = async (taskId: number, newStatus: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      await invoke("update_task", { 
        task: { ...task, status: newStatus } 
      });
      fetchTasks();
      setActiveTask((prev) => (prev && prev.id === taskId ? { ...prev, status: newStatus } : prev));
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + (direction === 'next' ? 1 : -1)));
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div 
          key={`empty-${i}`} 
          className="p-2 sm:p-3 min-h-[70px] sm:min-h-[90px]"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid var(--border-color)' }}
        ></div>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isSelected = date.toDateString() === selectedDate.toDateString();
      const dayTasks = getTasksForDate(date);
      const isTodayDate = isToday(date);

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className="p-2 sm:p-3 cursor-pointer transition-all duration-200 min-h-[70px] sm:min-h-[90px]"
          style={{
            backgroundColor: isSelected ? 'var(--accent-dim)' : 'var(--bg-card)',
            border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border-color)'}`,
            boxShadow: isTodayDate ? '0 0 0 2px var(--accent-glow)' : 'none',
          }}
        >
          <div 
            className="font-medium text-sm mb-1"
            style={{ color: isTodayDate ? 'var(--accent)' : 'var(--text-secondary)' }}
          >
            {day}
          </div>
          {dayTasks.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {dayTasks.slice(0, 2).map((_, idx) => (
                <div key={idx} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }}></div>
              ))}
              {dayTasks.length > 2 && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>+{dayTasks.length - 2}</span>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Done": return "badge-success";
      case "In Progress": return "badge-warning";
      case "Pending": return "badge-neutral";
      default: return "badge-neutral";
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 pt-20 md:pt-8" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Calendar</h1>
        <p style={{ color: 'var(--text-muted)' }} className="text-sm sm:text-base">View and manage your tasks by date</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 panel">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Previous month"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Next month"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div 
                key={day} 
                className="p-2 sm:p-3 text-center font-medium text-xs sm:text-sm"
                style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}
              >
                {day}
              </div>
            ))}
            {generateCalendarDays()}
          </div>
        </div>

        {/* Tasks for Selected Date */}
        <div className="panel">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-dim)' }}>
              <svg className="w-4 h-4" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Tasks</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {getTasksForDate(selectedDate).length === 0 ? (
              <div className="text-center py-12">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'var(--bg-card-hover)' }}
                >
                  <svg className="w-8 h-8" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No tasks scheduled for this date</p>
              </div>
            ) : (
              getTasksForDate(selectedDate).map(task => (
                <div 
                  key={task.id} 
                  className="p-4 rounded-xl transition-all duration-200"
                  style={{ 
                    backgroundColor: 'var(--bg-card-hover)', 
                    border: '1px solid var(--border-color)' 
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>{task.title}</h4>
                    <span className={`badge ${getStatusBadge(task.status)}`}>{task.status}</span>
                  </div>
                  {task.description && (
                    <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{task.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {task.due_date && (
                        <span>Due: {new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                    <button
                      onClick={() => setActiveTask(task)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)' }}
                    >
                      Open
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <TaskModal
        task={activeTask}
        open={!!activeTask}
        onClose={() => setActiveTask(null)}
        onStatusChange={updateTaskStatus}
      />
    </div>
  );
};

export default Calendar;
