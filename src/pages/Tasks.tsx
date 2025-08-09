import { useEffect, useState } from "react";
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
      } else {
        await invoke("update_task", { task: { ...form, id: editId } });
        setEditId(null);
      }
      setForm(defaultTask);
      fetchTasks();
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
      fetchTasks();
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    return (
      (!filter.status || task.status === filter.status) &&
      (!filter.priority || task.priority === filter.priority) &&
      (!filter.tag || task.tags.includes(filter.tag))
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-gradient">
          Task Manager
        </h1>
        <p className="text-xl text-gray-600 font-light">Organize your tasks with priorities, tags, and deadlines</p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Task Form */}
        <div className="lg:col-span-1">
          <div className="card sticky top-8">
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-3">
                  {tagOptions.map((tag) => (
                    <label key={tag} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.tags.includes(tag)}
                        onChange={() => handleTagChange(tag)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        form.tags.includes(tag) 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>
                        {tag}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br from-blue-500 via-purple-600 to-purple-800 flex-1">
                  {editId === null ? "Add Task" : "Update Task"}
                </button>
                {editId !== null && (
                  <button
                    type="button"
                    className="btn-secondary border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => { setEditId(null); setForm(defaultTask); }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Filters and Task List */}
        <div className="lg:col-span-2 space-y-8">
          {/* Filters */}
          <div className="card">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={filter.status}
                onChange={(e) => setFilter(f => ({ ...f, status: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 outline-none"
              >
                <option value="">All Statuses</option>
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              
              <select
                value={filter.priority}
                onChange={(e) => setFilter(f => ({ ...f, priority: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 outline-none"
              >
                <option value="">All Priorities</option>
                {priorities.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              
              <select
                value={filter.tag}
                onChange={(e) => setFilter(f => ({ ...f, tag: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 outline-none"
              >
                <option value="">All Tags</option>
                {tagOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Task List */}
          <div className="card">
            <h3 className="text-xl font-bold mb-6 text-gray-800">
              Tasks ({filteredTasks.length})
            </h3>
            {filteredTasks.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-500 text-lg">No tasks found. Create your first task!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className={`border-l-4 ${getStatusColor(task.status)} bg-white rounded-r-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-lg font-bold text-gray-800">{task.title}</h4>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(task)} 
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDelete(task.id)} 
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    {task.description && (
                      <p className="text-gray-600 mb-4 leading-relaxed">{task.description}</p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                        {getPriorityIcon(task.priority)} {task.priority}
                      </span>
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                        {getStatusIcon(task.status)} {task.status}
                      </span>
                      {task.due_date && (
                        <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                          📅 {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    {task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {task.tags.map((tag, index) => (
                          <span key={index} className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-medium rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tasks;
