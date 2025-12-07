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
        <div key={`empty-${i}`} className="p-2 sm:p-3 border border-dark-border/50 bg-dark-secondary/30"></div>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isSelected = date.toDateString() === selectedDate.toDateString();
      const dayTasks = getTasksForDate(date);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isTodayDate = isToday(date);

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`p-2 sm:p-3 border border-dark-border/50 cursor-pointer transition-all duration-200 min-h-[70px] sm:min-h-[90px] ${
            isSelected 
              ? 'bg-accent-teal/10 border-accent-teal/50' 
              : 'hover:bg-dark-card-hover'
          } ${isTodayDate ? 'ring-1 ring-accent-teal/30' : ''}`}
        >
          <div className={`font-medium text-sm mb-1 ${
            isTodayDate 
              ? 'text-accent-teal' 
              : isWeekend 
                ? 'text-accent-coral/70' 
                : 'text-gray-300'
          }`}>
            {day}
          </div>
          {dayTasks.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {dayTasks.slice(0, 2).map((_, idx) => (
                <div key={idx} className="w-1.5 h-1.5 rounded-full bg-accent-teal"></div>
              ))}
              {dayTasks.length > 2 && (
                <span className="text-xs text-gray-500">+{dayTasks.length - 2}</span>
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
      case "Done": return "badge-teal";
      case "In Progress": return "badge-blue";
      case "Pending": return "badge-yellow";
      default: return "badge-purple";
    }
  };

  return (
    <div className="min-h-screen bg-dark-primary p-4 sm:p-6 lg:p-8 pt-20 md:pt-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Calendar</h1>
        <p className="text-gray-500 text-sm sm:text-base">View and manage your tasks by date</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 panel">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-dark-card-hover rounded-lg transition-colors text-gray-400 hover:text-white"
              aria-label="Previous month"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-white">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-dark-card-hover rounded-lg transition-colors text-gray-400 hover:text-white"
              aria-label="Next month"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <div 
                key={day} 
                className={`p-2 sm:p-3 text-center font-medium text-xs sm:text-sm border-b border-dark-border ${
                  index === 0 || index === 6 ? 'text-accent-coral/70' : 'text-gray-400'
                }`}
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
            <div className="w-8 h-8 rounded-lg bg-accent-teal/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-accent-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Tasks</h3>
              <p className="text-gray-500 text-sm">{selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
            </div>
          </div>

          <div className="space-y-3">
            {getTasksForDate(selectedDate).length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-dark-card-hover flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">No tasks scheduled for this date</p>
              </div>
            ) : (
              getTasksForDate(selectedDate).map(task => (
                <div 
                  key={task.id} 
                  className="p-4 bg-dark-card-hover border border-dark-border rounded-xl hover:border-accent-teal/30 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-white">{task.title}</h4>
                    <span className={`badge ${getStatusBadge(task.status)}`}>{task.status}</span>
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {task.due_date && (
                        <span>Due: {new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                    <button
                      onClick={() => setActiveTask(task)}
                      className="px-3 py-1.5 rounded-lg bg-accent-teal/20 text-accent-teal text-sm font-medium hover:bg-accent-teal/30 transition-colors"
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
