import { useEffect, useState } from "react";

type Todo = {
    id: number;
    title: string;
    description: string;
    priority: string;
    status: boolean;
    tags: string[];
    date: string;
}

const defaultTodo: Omit<Todo, "id"> = {
    title: "",
    description: "",
    tags: [],
    priority: "Medium",
    status: false,
    date: new Date().toDateString(),
};

const priorities = ["Low", "Medium", "High"];
const tagOptions = ["Work", "Study", "Personal", "Health", "Shopping", "Other"];

const DailyChecklist = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [form, setForm] = useState<Omit<Todo, "id">>(defaultTodo);
  const [editId, setEditId] = useState<number | null>(null);

  const today = new Date().toDateString();

  useEffect(() => {
    const savedTodos = localStorage.getItem('dailyTodos');
    if (savedTodos) {
      const parsed = JSON.parse(savedTodos) as Todo[];
      const todaysTodos = parsed.filter(todo => todo.date === today);
      setTodos(todaysTodos);
    }
  }, [today]);

  useEffect(() => {
    localStorage.setItem('dailyTodos', JSON.stringify(todos));
  }, [todos]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleTagToggle = (tag: string) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) 
        ? f.tags.filter(t => t !== tag)
        : [...f.tags, tag]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    if (editId !== null) {
      setTodos(prev => prev.map(todo => 
        todo.id === editId 
          ? { ...form, id: editId, date: today }
          : todo
      ));
      setEditId(null);
    } else {
      const newTodo: Todo = {
        ...form,
        id: Date.now(),
        date: today
      };
      setTodos(prev => [...prev, newTodo]);
    }

    setForm(defaultTodo);
  };

  const handleEdit = (todo: Todo) => {
    setForm({
      title: todo.title,
      description: todo.description,
      tags: todo.tags,
      priority: todo.priority,
      status: todo.status,
      date: todo.date,
    });
    setEditId(todo.id);
  };

  const handleDelete = (id: number) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
    if (editId === id) {
      setForm(defaultTodo);
      setEditId(null);
    }
  };

  const handleToggleStatus = (id: number) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, status: !todo.status } : todo
    ));
  };

  const completedCount = todos.filter(todo => todo.status).length;
  const totalCount = todos.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "High": return "badge-coral";
      case "Medium": return "badge-yellow";
      case "Low": return "badge-teal";
      default: return "badge-blue";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Today's Date</p>
              <p className="text-lg font-semibold text-white">{new Date().toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Progress</p>
              <p className="text-lg font-semibold text-accent-teal">{completedCount}/{totalCount} done</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-accent-teal/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Completion</p>
              <p className="text-lg font-semibold text-white">{Math.round(progressPercent)}%</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="progress-bar">
            <div 
              className="h-full bg-gradient-to-r from-accent-teal to-accent-blue rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Todo Form */}
        <div className="lg:col-span-1">
          <div className="panel lg:sticky lg:top-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-accent-teal/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-accent-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">
                {editId ? "Edit Todo" : "Add New Todo"}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Title *</label>
                <input
                  type="text"
                  name="title"
                  placeholder="What needs to be done?"
                  value={form.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-dark-card-hover border border-dark-border rounded-xl focus:border-accent-teal focus:ring-1 focus:ring-accent-teal/20 transition-all duration-200 outline-none text-white placeholder-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                <textarea
                  name="description"
                  placeholder="Add details (optional)"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-dark-card-hover border border-dark-border rounded-xl focus:border-accent-teal focus:ring-1 focus:ring-accent-teal/20 transition-all duration-200 outline-none resize-none text-white placeholder-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Priority</label>
                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-dark-card-hover border border-dark-border rounded-xl focus:border-accent-teal focus:ring-1 focus:ring-accent-teal/20 transition-all duration-200 outline-none text-white"
                >
                  {priorities.map(p => (
                    <option key={p} value={p} className="bg-dark-card">{p}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {tagOptions.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
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
                className="w-full bg-accent-teal hover:bg-accent-teal/90 text-dark-primary py-3.5 rounded-xl font-semibold transition-all duration-200"
              >
                {editId ? "Update Todo" : "Add Todo"}
              </button>
              
              {editId && (
                <button
                  type="button"
                  onClick={() => { setEditId(null); setForm(defaultTodo); }}
                  className="w-full bg-dark-card-hover hover:bg-dark-border text-gray-400 py-3 rounded-xl font-medium transition-all duration-200"
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Todo List */}
        <div className="lg:col-span-2">
          <div className="space-y-3">
            {todos.length === 0 ? (
              <div className="panel text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-dark-card-hover flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No daily todos yet</h3>
                <p className="text-gray-500 text-sm">Add your first daily task to get started!</p>
              </div>
            ) : (
              todos.map(todo => (
                <div
                  key={todo.id}
                  className={`panel group transition-all duration-200 ${
                    todo.status ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => handleToggleStatus(todo.id)}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                        todo.status
                          ? 'bg-accent-teal border-accent-teal text-dark-primary'
                          : 'border-gray-600 hover:border-accent-teal'
                      }`}
                    >
                      {todo.status && (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className={`font-medium ${
                          todo.status ? 'line-through text-gray-500' : 'text-white'
                        }`}>
                          {todo.title}
                        </h4>
                        <span className={`badge ${getPriorityBadge(todo.priority)}`}>
                          {todo.priority}
                        </span>
                      </div>
                      
                      {todo.description && (
                        <p className={`text-sm mb-3 ${
                          todo.status ? 'line-through text-gray-600' : 'text-gray-500'
                        }`}>
                          {todo.description}
                        </p>
                      )}
                      
                      {todo.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {todo.tags.map(tag => (
                            <span key={tag} className="badge badge-purple">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => handleEdit(todo)}
                        className="p-2 bg-accent-blue/20 text-accent-blue rounded-lg hover:bg-accent-blue/30 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(todo.id)}
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
    </div>
  );
};

export default DailyChecklist;
