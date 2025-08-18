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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "High": return "🔴";
      case "Medium": return "🟡";
      case "Low": return "🟢";
      default: return "⚪";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Done": return "✅";
      case "In Progress": return "🔄";
      case "Pending": return "⏳";
      default: return "📋";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "border-red-500 bg-red-50";
      case "Medium": return "border-yellow-500 bg-yellow-50";
      case "Low": return "border-green-500 bg-green-50";
      default: return "border-gray-300 bg-gray-50";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Done": return "border-l-green-500";
      case "In Progress": return "border-l-blue-500";
      case "Pending": return "border-l-yellow-500";
      default: return "border-l-gray-300";
    }
  };

  const TasksView = () => (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Task Form */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
          <h3 className="text-xl font-bold mb-6 text-gray-800">
            {editId === null ? "Add New Task" : "Edit Task"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter task title"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter task description"
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
                <input
                  name="due_date"
                  type="datetime-local"
                  value={form.due_date || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                <select name="priority" value={form.priority} onChange={handleChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 outline-none">
                  {priorities.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select name="status" value={form.status} onChange={handleChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 outline-none">
                  {statuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tagOptions.map((tag) => (
                  <label key={tag} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.tags.includes(tag)}
                      onChange={() => handleTagChange(tag)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      form.tags.includes(tag)
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tag}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl font-bold hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
            >
              {editId === null ? "Add Task" : "Update Task"}
            </button>
          </form>
        </div>
      </div>

      {/* Tasks List */}
      <div className="lg:col-span-2">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Filter Tasks</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filter.status}
              onChange={(e) => setFilter(f => ({ ...f, status: e.target.value }))}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
            >
              <option value="">All Status</option>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={filter.priority}
              onChange={(e) => setFilter(f => ({ ...f, priority: e.target.value }))}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
            >
              <option value="">All Priority</option>
              {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select
              value={filter.tag}
              onChange={(e) => setFilter(f => ({ ...f, tag: e.target.value }))}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
            >
              <option value="">All Tags</option>
              {tagOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-6">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No tasks found</h3>
              <p className="text-gray-500">Create your first task to get started!</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-l-4 ${getStatusColor(task.status)}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getStatusIcon(task.status)}</span>
                    <div>
                      <h4 className="text-xl font-bold text-gray-800">{task.title}</h4>
                      <p className="text-gray-600 mt-1">{task.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(task.priority)}`}>
                      {getPriorityIcon(task.priority)} {task.priority}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between">
                  <div className="flex items-center space-x-4 mb-2">
                    {task.due_date && (
                      <span className="text-sm text-gray-500">
                        📅 Due: {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      task.status === 'Done' ? 'bg-green-100 text-green-800' :
                      task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {task.status}
                    </span>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(task)}
                      className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {task.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-gradient">
          {activeTab === 'tasks' ? 'Task Manager' : 'Daily Checklist'}
        </h1>
        <p className="text-xl text-gray-600 font-light">
          {activeTab === 'tasks' 
            ? 'Organize your tasks with priorities, tags, and deadlines' 
            : 'Stay on top of your daily tasks and habits'
          }
        </p>
      </div>

      {/* Toggle Switch */}
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-full p-1 shadow-lg border">
          <div className="flex">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
                activeTab === 'tasks'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📋 Tasks
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
                activeTab === 'daily'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              ✅ Daily Todos
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
