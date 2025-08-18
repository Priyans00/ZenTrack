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

  // Get today's date as string
  const today = new Date().toDateString();

  // Load todos from localStorage
  useEffect(() => {
    const savedTodos = localStorage.getItem('dailyTodos');
    if (savedTodos) {
      const parsed = JSON.parse(savedTodos) as Todo[];
      // Filter todos for today only and reset status if it's a new day
      const todaysTodos = parsed.filter(todo => todo.date === today);
      setTodos(todaysTodos);
    }
  }, [today]);

  // Save todos to localStorage
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
      // Update existing todo
      setTodos(prev => prev.map(todo => 
        todo.id === editId 
          ? { ...form, id: editId, date: today }
          : todo
      ));
      setEditId(null);
    } else {
      // Add new todo
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

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">Daily Checklist</h2>
        <p className="text-lg text-gray-600 mb-6">Stay on top of your daily tasks</p>
        <div className="flex justify-center items-center space-x-4">
          <div className="text-sm text-gray-500">{today}</div>
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium">
            {completedCount}/{totalCount} completed
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-green-500 to-emerald-600 h-full transition-all duration-500"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          ></div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Todo Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              {editId ? "Edit Todo" : "Add New Todo"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="title"
                placeholder="Todo title"
                value={form.title}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <textarea
                name="description"
                placeholder="Description (optional)"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {priorities.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {tagOptions.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        form.tags.includes(tag)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
              >
                {editId ? "Update Todo" : "Add Todo"}
              </button>
            </form>
          </div>
        </div>

        {/* Todo List */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {todos.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No daily todos yet</h3>
                <p className="text-gray-500">Add your first daily task to get started!</p>
              </div>
            ) : (
              todos.map(todo => (
                <div
                  key={todo.id}
                  className={`bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl ${
                    todo.status ? 'opacity-75' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <button
                      onClick={() => handleToggleStatus(todo.id)}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                        todo.status
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                    >
                      {todo.status && (
                        <svg className="w-4 h-4 m-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`text-lg font-semibold ${
                          todo.status ? 'line-through text-gray-500' : 'text-gray-800'
                        }`}>
                          {todo.title}
                        </h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          todo.priority === 'High' ? 'bg-red-100 text-red-800' :
                          todo.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {todo.priority}
                        </span>
                      </div>
                      
                      {todo.description && (
                        <p className={`text-gray-600 mb-3 ${
                          todo.status ? 'line-through' : ''
                        }`}>
                          {todo.description}
                        </p>
                      )}
                      
                      {todo.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {todo.tags.map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(todo)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(todo.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
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