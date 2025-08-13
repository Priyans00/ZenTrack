import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

type Task = {
  id: number;
  title: string;
  description: string;
  due_date?: string;
  tags: string[];
  priority: string;
  status: string;
};

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Fetch tasks
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

  // Update task status
  const updateTaskStatus = async (taskId: number, newStatus: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      await invoke("update_task", { 
        task: { ...task, status: newStatus } 
      });
      fetchTasks();
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  // Calendar navigation
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

  // Filter tasks for selected date
  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  // Generate calendar grid
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-4 border border-gray-100"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isSelected = date.toDateString() === selectedDate.toDateString();
      const dayTasks = getTasksForDate(date);

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`p-4 border border-gray-100 cursor-pointer transition-all hover:bg-blue-50 ${isSelected ? 'bg-blue-100' : ''}`}
        >
          <div className="font-semibold mb-2">{day}</div>
          {dayTasks.length > 0 && (
            <div className="text-xs text-blue-600">{dayTasks.length} tasks</div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Calendar Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-gradient">
            Calendar
          </h1>
          <p className="text-xl text-gray-600 font-light">View and manage your tasks by date</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Grid */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ←
              </button>
              <h2 className="text-xl font-bold">
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-4 text-center font-semibold text-gray-600">
                  {day}
                </div>
              ))}
              {generateCalendarDays()}
            </div>
          </div>

          {/* Tasks for Selected Date */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-6">
              Tasks for {selectedDate.toLocaleDateString()}
            </h3>

            <div className="space-y-4">
              {getTasksForDate(selectedDate).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No tasks scheduled for this date
                </div>
              ) : (
                getTasksForDate(selectedDate).map(task => (
                  <div key={task.id} className="border border-gray-200 rounded-xl p-4">
                    <h4 className="font-semibold mb-2">{task.title}</h4>
                    <p className="text-sm text-gray-600 mb-4">{task.description}</p>
                    
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={task.status === 'Done'}
                          onChange={() => updateTaskStatus(task.id, 'Done')}
                          className="text-green-500"
                        />
                        <span className="text-sm">Done</span>
                      </label>
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={task.status === 'In Progress'}
                          onChange={() => updateTaskStatus(task.id, 'In Progress')}
                          className="text-blue-500"
                        />
                        <span className="text-sm">In Progress</span>
                      </label>
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={task.status === 'Pending'}
                          onChange={() => updateTaskStatus(task.id, 'Pending')}
                          className="text-yellow-500"
                        />
                        <span className="text-sm">Pending</span>
                      </label>
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

export default Calendar;