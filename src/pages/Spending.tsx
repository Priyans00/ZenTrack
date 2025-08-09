import { useState, useEffect } from 'react';

type Expense = {
  id: number;
  amount: number;
  description: string;
  category: string;
  date: Date;
  type: 'expense' | 'income';
};

const Spending = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [form, setForm] = useState({
    amount: '',
    description: '',
    category: 'Food',
    type: 'expense' as 'expense' | 'income',
  });
  
  const expenseCategories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Education', 'Other'];
  const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];

  // Load data from localStorage
  useEffect(() => {
    const savedExpenses = localStorage.getItem('expenses');
    if (savedExpenses) {
      const parsed = JSON.parse(savedExpenses);
      setExpenses(parsed.map((exp: any) => ({ ...exp, date: new Date(exp.date) })));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.description) return;

    const newExpense: Expense = {
      id: Date.now(),
      amount: parseFloat(form.amount),
      description: form.description,
      category: form.category,
      date: new Date(),
      type: form.type,
    };

    setExpenses(prev => [newExpense, ...prev]);
    setForm({ amount: '', description: '', category: form.type === 'expense' ? 'Food' : 'Salary', type: form.type });
  };

  const deleteExpense = (id: number) => {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
  };

  const getTotalByType = (type: 'expense' | 'income') => {
    return expenses
      .filter(exp => exp.type === type)
      .reduce((total, exp) => total + exp.amount, 0);
  };

  const getThisMonthTotal = (type: 'expense' | 'income') => {
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    
    return expenses
      .filter(exp => 
        exp.type === type &&
        exp.date.getMonth() === thisMonth &&
        exp.date.getFullYear() === thisYear
      )
      .reduce((total, exp) => total + exp.amount, 0);
  };

  const getCategoryTotals = () => {
    const totals: { [key: string]: number } = {};
    expenses
      .filter(exp => exp.type === 'expense')
      .forEach(exp => {
        totals[exp.category] = (totals[exp.category] || 0) + exp.amount;
      });
    return totals;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const totalExpenses = getTotalByType('expense');
  const totalIncome = getTotalByType('income');
  const monthlyExpenses = getThisMonthTotal('expense');
  const monthlyIncome = getThisMonthTotal('income');
  const balance = totalIncome - totalExpenses;
  const monthlyBalance = monthlyIncome - monthlyExpenses;
  const categoryTotals = getCategoryTotals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-gradient">
          Expense Tracker
        </h1>
        <p className="text-xl text-gray-600 font-light">Monitor your spending and manage your budget effectively</p>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-2xl">
              💰
            </div>
            <div>
              <div className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(balance)}
              </div>
              <div className="text-gray-600 font-medium">Total Balance</div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-2xl">
              📈
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</div>
              <div className="text-gray-600 font-medium">Total Income</div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center text-2xl">
              📉
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
              <div className="text-gray-600 font-medium">Total Expenses</div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
              📅
            </div>
            <div>
              <div className={`text-2xl font-bold ${monthlyBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(monthlyBalance)}
              </div>
              <div className="text-gray-600 font-medium">This Month</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Transaction Form */}
          <div className="bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Add Transaction</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      type: e.target.value as 'expense' | 'income',
                      category: e.target.value === 'expense' ? 'Food' : 'Salary'
                    }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 outline-none"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 outline-none"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 outline-none"
                  >
                    {(form.type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter description"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 outline-none"
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                className={`px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1 w-full ${
                  form.type === 'expense' 
                    ? 'bg-gradient-to-r from-red-500 to-pink-600' 
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600'
                }`}
              >
                {form.type === 'expense' ? '💸 Add Expense' : '💰 Add Income'}
              </button>
            </form>
          </div>

          {/* Category Breakdown */}
          {Object.keys(categoryTotals).length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">Spending by Category</h3>
              <div className="space-y-6">
                {Object.entries(categoryTotals)
                  .sort(([,a], [,b]) => b - a)
                  .map(([category, amount]) => (
                    <div key={category} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-800">{category}</span>
                        <div className="text-right">
                          <div className="font-bold text-cyan-600">{formatCurrency(amount)}</div>
                          <div className="text-sm text-gray-500">
                            {((amount / totalExpenses) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-cyan-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(amount / Math.max(...Object.values(categoryTotals))) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
          <h3 className="text-2xl font-bold mb-8 text-gray-800">Recent Transactions</h3>
          {expenses.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">💳</div>
              <p className="text-gray-500 text-lg">No transactions yet. Add your first transaction above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {expenses.slice(0, 20).map((expense) => (
                <div 
                  key={expense.id} 
                  className={`border-l-4 ${
                    expense.type === 'income' ? 'border-l-emerald-500' : 'border-l-red-500'
                  } bg-gray-50 rounded-r-xl p-6 hover:bg-gray-100 transition-colors`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-lg font-bold text-gray-800 mb-2">{expense.description}</div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className={`px-3 py-1 rounded-full font-medium ${
                          expense.type === 'income' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {expense.category}
                        </span>
                        <span>{formatDate(expense.date)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`text-xl font-bold ${
                        expense.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {expense.type === 'income' ? '+' : '-'}{formatCurrency(expense.amount)}
                      </div>
                      <button
                        onClick={() => deleteExpense(expense.id)}
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

export default Spending;
