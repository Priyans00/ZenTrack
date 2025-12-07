import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import DailyChecklist from "../components/DailyChecklist";

type Task = {
  id: number;
  title: string;
  description: string;
  due_date?: string;
  tags: string[];
  priority: string;
  status: string;
};

const defaultTask: Omit<Task, "id"> = {
  title: "",
  description: "",
  due_date: "",
  tags: [],
  priority: "Medium",
  status: "Pending",
};

const priorities = ["Low", "Medium", "High"];
const statuses = ["Pending", "In Progress", "Done"];
const tagOptions = ["Work", "Study", "Personal"];

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState<Omit<Task, "id">>(defaultTask);
  const [editId, setEditId] = useState<number | null>(null);
  const [filter, setFilter] = useState({ status: "", priority: "", tag: "" });
  const [activeTab, setActiveTab] = useState<'tasks' | 'daily'>('tasks');

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleTagChange = (tag: string) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId === null) {
        await invoke("add_task", { task: { ...form, id: 0 } });
        setForm(defaultTask);
        await fetchTasks();
      } else {
        await invoke("update_task", { task: { ...form, id: editId } });
        setEditId(null);
        setForm(defaultTask);
        await fetchTasks();
      }
    } catch (error) {
      console.error("Failed to save task:", error);
    }
  };

  const handleEdit = (task: Task) => {
    setForm({ ...task });
    setEditId(task.id);
  };

  const handleDelete = async (id: number) => {
    try {
      await invoke("delete_task", { id });
      await fetchTasks();
      if (editId === id) {
        setEditId(null);
        setForm(defaultTask);
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    return (
      (filter.status === "" || task.status === filter.status) &&
      (filter.priority === "" || task.priority === filter.priority) &&
      (filter.tag === "" || task.tags.includes(filter.tag))
    );
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "High": return "badge-coral";
      case "Medium": return "badge-yellow";
      case "Low": return "badge-teal";
      default: return "badge-blue";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Done": return "badge-teal";
      case "In Progress": return "badge-blue";
      case "Pending": return "badge-yellow";
      default: return "badge-purple";
    }
  };

  const TasksView = () => (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Task Form */}
      <div className="lg:col-span-1 order-2 lg:order-1">
        <div className="panel lg:sticky lg:top-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-accent-teal/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-accent-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">
              {editId === null ? "Add New Task" : "Edit Task"}
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Title *</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter task title"
                required
                className="w-full px-4 py-3 bg-dark-card-hover border border-dark-border rounded-xl focus:border-accent-teal focus:ring-1 focus:ring-accent-teal/20 transition-all duration-200 outline-none text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter task description"
                rows={3}
                className="w-full px-4 py-3 bg-dark-card-hover border border-dark-border rounded-xl focus:border-accent-teal focus:ring-1 focus:ring-accent-teal/20 transition-all duration-200 outline-none resize-none text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Due Date</label>
              <input
                name="due_date"
                type="datetime-local"
                value={form.due_date || ""}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-dark-card-hover border border-dark-border rounded-xl focus:border-accent-teal focus:ring-1 focus:ring-accent-teal/20 transition-all duration-200 outline-none text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Priority</label>
                <select 
                  name="priority" 
                  value={form.priority} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 bg-dark-card-hover border border-dark-border rounded-xl focus:border-accent-teal focus:ring-1 focus:ring-accent-teal/20 transition-all duration-200 outline-none text-white"
                >
                  {priorities.map((p) => (
                    <option key={p} value={p} className="bg-dark-card">{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                <select 
                  name="status" 
                  value={form.status} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 bg-dark-card-hover border border-dark-border rounded-xl focus:border-accent-teal focus:ring-1 focus:ring-accent-teal/20 transition-all duration-200 outline-none text-white"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s} className="bg-dark-card">{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tagOptions.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagChange(tag)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      form.tags.includes(tag)
                        ? 'bg-accent-teal/20 text-accent-teal border border-accent-teal/50'
                        : 'bg-dark-card-hover text-gray-400 border border-dark-border hover:border-gray-500'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-accent-teal hover:bg-accent-teal/90 text-dark-primary py-3.5 rounded-xl font-semibold transition-all duration-200 text-sm"
            >
              {editId === null ? "Add Task" : "Update Task"}
            </button>
            
            {editId !== null && (
              <button
                type="button"
                onClick={() => { setEditId(null); setForm(defaultTask); }}
                className="w-full bg-dark-card-hover hover:bg-dark-border text-gray-400 py-3 rounded-xl font-medium transition-all duration-200 text-sm"
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Tasks List */}
      <div className="lg:col-span-2 order-1 lg:order-2">
        {/* Filters */}
        <div className="panel mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent-purple/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Filter Tasks</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={filter.status}
              onChange={(e) => setFilter(f => ({ ...f, status: e.target.value }))}
              className="px-4 py-2.5 bg-dark-card-hover border border-dark-border rounded-lg focus:border-accent-teal outline-none text-white text-sm"
            >
              <option value="" className="bg-dark-card">All Status</option>
              {statuses.map((s) => <option key={s} value={s} className="bg-dark-card">{s}</option>)}
            </select>
            <select
              value={filter.priority}
              onChange={(e) => setFilter(f => ({ ...f, priority: e.target.value }))}
              className="px-4 py-2.5 bg-dark-card-hover border border-dark-border rounded-lg focus:border-accent-teal outline-none text-white text-sm"
            >
              <option value="" className="bg-dark-card">All Priority</option>
              {priorities.map((p) => <option key={p} value={p} className="bg-dark-card">{p}</option>)}
            </select>
            <select
              value={filter.tag}
              onChange={(e) => setFilter(f => ({ ...f, tag: e.target.value }))}
              className="px-4 py-2.5 bg-dark-card-hover border border-dark-border rounded-lg focus:border-accent-teal outline-none text-white text-sm"
            >
              <option value="" className="bg-dark-card">All Tags</option>
              {tagOptions.map((t) => <option key={t} value={t} className="bg-dark-card">{t}</option>)}
            </select>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="panel text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-dark-card-hover flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No tasks found</h3>
              <p className="text-gray-500 text-sm">Create your first task to get started!</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="panel hover:border-dark-border transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-white font-medium truncate">{task.title}</h4>
                      <span className={`badge ${getPriorityBadge(task.priority)} shrink-0`}>
                        {task.priority}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-gray-500 text-sm mb-3 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`badge ${getStatusBadge(task.status)}`}>{task.status}</span>
                      {task.due_date && (
                        <span className="text-gray-500 text-xs flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                      {task.tags.map((tag) => (
                        <span key={tag} className="badge badge-purple">{tag}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => handleEdit(task)}
                      className="p-2 bg-accent-blue/20 text-accent-blue rounded-lg hover:bg-accent-blue/30 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-2 bg-accent-coral/20 text-accent-coral rounded-lg hover:bg-accent-coral/30 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-primary p-4 sm:p-6 lg:p-8 pt-20 md:pt-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
              {activeTab === 'tasks' ? 'Task Manager' : 'Daily Checklist'}
            </h1>
            <p className="text-gray-500 text-sm sm:text-base">
              {activeTab === 'tasks' 
                ? 'Organize your tasks with priorities, tags, and deadlines' 
                : 'Stay on top of your daily tasks and habits'
              }
            </p>
          </div>
          
          {/* Tab Switcher */}
          <div className="flex bg-dark-card rounded-xl p-1 border border-dark-border">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'tasks'
                  ? 'bg-accent-teal text-dark-primary'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Tasks
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'daily'
                  ? 'bg-accent-teal text-dark-primary'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Daily
            </button>
          </div>
        </div>
      </div>

      {/* Conditional Rendering */}
      {activeTab === 'tasks' ? <TasksView /> : <DailyChecklist />}
    </div>
  );
};

export default Tasks;
