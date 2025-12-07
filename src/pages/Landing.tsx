import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";

type Task = {
  id: number;
  title: string;
  description: string;
  due_date?: string;
  tags: string[];
  priority: string;
  status: string;
};

const Landing = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    // Fetch tasks
    invoke<Task[]>("get_tasks").then(setTasks).catch(console.error);
    
    // Load time entries from localStorage
    const savedTimeEntries = localStorage.getItem('timeEntries');
    if (savedTimeEntries) {
      setTimeEntries(JSON.parse(savedTimeEntries));
    }
    
    // Load expenses from localStorage
    const savedExpenses = localStorage.getItem('expenses');
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    }
  }, []);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Done').length;
  const pendingTasks = tasks.filter(t => t.status === 'Pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
  
  const totalTimeToday = timeEntries
    .filter((entry: any) => new Date(entry.startTime).toDateString() === new Date().toDateString())
    .reduce((total: number, entry: any) => total + (entry.duration || 0), 0);
  
  const totalExpenses = expenses.filter((e: any) => e.type === 'expense').reduce((sum: number, e: any) => sum + e.amount, 0);
  const totalIncome = expenses.filter((e: any) => e.type === 'income').reduce((sum: number, e: any) => sum + e.amount, 0);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  };

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const recentTasks = tasks.slice(0, 5);

  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      title: 'Task Management',
      description: 'Organize your tasks with priorities, tags, and deadlines.',
      link: '/tasks',
      color: 'teal'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Time Tracking',
      description: 'Track time spent on activities and boost productivity.',
      link: '/time',
      color: 'blue'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Expense Tracking',
      description: 'Monitor your spending and manage your budget effectively.',
      link: '/spend',
      color: 'coral'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Analytics',
      description: 'Get insights into your productivity and spending patterns.',
      link: '/about',
      color: 'purple'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; iconBg: string }> = {
      teal: { bg: 'bg-accent-teal-dim', text: 'text-accent-teal', iconBg: 'bg-accent-teal/20' },
      blue: { bg: 'bg-accent-blue-dim', text: 'text-accent-blue', iconBg: 'bg-accent-blue/20' },
      coral: { bg: 'bg-accent-coral-dim', text: 'text-accent-coral', iconBg: 'bg-accent-coral/20' },
      purple: { bg: 'bg-accent-purple-dim', text: 'text-accent-purple', iconBg: 'bg-accent-purple/20' },
    };
    return colors[color] || colors.teal;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Done': return 'badge-teal';
      case 'In Progress': return 'badge-blue';
      case 'Pending': return 'badge-yellow';
      default: return 'badge-purple';
    }
  };

  return (
    <div className="min-h-screen bg-dark-primary p-4 sm:p-6 lg:p-8 pt-20 md:pt-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Dashboard Overview</h1>
            <p className="text-gray-500 text-sm sm:text-base">Real-time monitoring of your productivity and finances</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="badge badge-teal flex items-center gap-2">
              <span className="w-2 h-2 bg-accent-teal rounded-full animate-pulse"></span>
              Active Session
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card group hover:border-accent-teal/50 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Total Tasks</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">{totalTasks}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-accent-teal/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-accent-teal text-xs sm:text-sm font-medium">
            +{inProgressTasks} in progress
          </p>
        </div>

        <div className="stat-card group hover:border-accent-coral/50 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Completed</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">{completedTasks}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-accent-coral/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-accent-coral text-xs sm:text-sm font-medium">
            {completionRate}% completion rate
          </p>
        </div>

        <div className="stat-card group hover:border-accent-blue/50 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Time Today</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">{formatTime(totalTimeToday)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-accent-blue text-xs sm:text-sm font-medium">
            {timeEntries.length} sessions total
          </p>
        </div>

        <div className="stat-card group hover:border-accent-purple/50 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Balance</p>
              <p className={`text-2xl sm:text-3xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-accent-teal' : 'text-accent-coral'}`}>
                {formatCurrency(totalIncome - totalExpenses)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-accent-purple text-xs sm:text-sm font-medium">
            {expenses.length} transactions
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Tasks Panel */}
        <div className="panel">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-teal/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-accent-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white">Recent Tasks</h2>
            </div>
            <Link to="/tasks" className="text-accent-teal text-sm hover:underline">View all</Link>
          </div>
          <div className="space-y-0">
            {recentTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No tasks yet. Create your first task!</p>
                <Link to="/tasks" className="text-accent-teal hover:underline mt-2 inline-block">Add Task</Link>
              </div>
            ) : (
              recentTasks.map((task) => (
                <div key={task.id} className="list-item flex items-center justify-between">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-white font-medium truncate">{task.title}</p>
                    <p className="text-gray-500 text-sm truncate">{task.description || 'No description'}</p>
                  </div>
                  <span className={`badge ${getStatusBadge(task.status)} shrink-0`}>{task.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Task Status Panel */}
        <div className="panel">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-purple/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white">Task Status</h2>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-card-hover">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-accent-yellow"></div>
                <span className="text-gray-300">Pending</span>
              </div>
              <span className="text-white font-semibold">{pendingTasks}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-card-hover">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-accent-blue"></div>
                <span className="text-gray-300">In Progress</span>
              </div>
              <span className="text-white font-semibold">{inProgressTasks}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-card-hover">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-accent-teal"></div>
                <span className="text-gray-300">Completed</span>
              </div>
              <span className="text-white font-semibold">{completedTasks}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Completion Progress</span>
              <span className="text-accent-teal font-medium">{completionRate}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="h-full bg-gradient-to-r from-accent-teal to-accent-blue rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions / Features Grid */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => {
            const colors = getColorClasses(feature.color);
            return (
              <Link
                key={index}
                to={feature.link}
                className="panel group hover:border-dark-border transition-all duration-200 hover:scale-[1.02]"
              >
                <div className={`w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <span className={colors.text}>{feature.icon}</span>
                </div>
                <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Landing;
