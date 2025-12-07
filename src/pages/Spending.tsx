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

  useEffect(() => {
    const savedExpenses = localStorage.getItem('expenses');
    if (savedExpenses) {
      const parsed = JSON.parse(savedExpenses);
      setExpenses(parsed.map((exp: any) => ({ ...exp, date: new Date(exp.date) })));
    }
  }, []);

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
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const totalExpenses = getTotalByType('expense');
  const totalIncome = getTotalByType('income');
  const monthlyExpenses = getThisMonthTotal('expense');
  const monthlyIncome = getThisMonthTotal('income');
  const balance = totalIncome - totalExpenses;
  const monthlyBalance = monthlyIncome - monthlyExpenses;
  const categoryTotals = getCategoryTotals();

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Food': 'bg-accent-coral',
      'Transport': 'bg-accent-blue',
      'Entertainment': 'bg-accent-purple',
      'Shopping': 'bg-accent-pink',
      'Bills': 'bg-accent-yellow',
      'Health': 'bg-accent-teal',
      'Education': 'bg-indigo-500',
      'Other': 'bg-gray-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-dark-primary p-4 sm:p-6 lg:p-8 pt-20 md:pt-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Expense Tracker</h1>
        <p className="text-gray-500 text-sm sm:text-base">Monitor your spending and manage your budget effectively</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Total Balance</p>
              <p className={`text-2xl sm:text-3xl font-bold ${balance >= 0 ? 'text-accent-teal' : 'text-accent-coral'}`}>
                {formatCurrency(balance)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-accent-teal/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Total Income</p>
              <p className="text-2xl sm:text-3xl font-bold text-accent-teal">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-accent-teal/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Total Expenses</p>
              <p className="text-2xl sm:text-3xl font-bold text-accent-coral">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-accent-coral/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">This Month</p>
              <p className={`text-2xl sm:text-3xl font-bold ${monthlyBalance >= 0 ? 'text-accent-teal' : 'text-accent-coral'}`}>
                {formatCurrency(monthlyBalance)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Transaction Form */}
        <div className="panel">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-accent-teal/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-accent-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Add Transaction</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Type Toggle */}
            <div className="flex bg-dark-card-hover rounded-xl p-1 border border-dark-border">
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, type: 'expense', category: 'Food' }))}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  form.type === 'expense'
                    ? 'bg-accent-coral text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, type: 'income', category: 'Salary' }))}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  form.type === 'income'
                    ? 'bg-accent-teal text-dark-primary'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Income
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  required
                  className="w-full px-4 py-3 bg-dark-card-hover border border-dark-border rounded-xl focus:border-accent-teal focus:ring-1 focus:ring-accent-teal/20 transition-all duration-200 outline-none text-white placeholder-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 bg-dark-card-hover border border-dark-border rounded-xl focus:border-accent-teal focus:ring-1 focus:ring-accent-teal/20 transition-all duration-200 outline-none text-white"
                >
                  {(form.type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                    <option key={cat} value={cat} className="bg-dark-card">{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description"
                required
                className="w-full px-4 py-3 bg-dark-card-hover border border-dark-border rounded-xl focus:border-accent-teal focus:ring-1 focus:ring-accent-teal/20 transition-all duration-200 outline-none text-white placeholder-gray-500"
              />
            </div>
            
            <button 
              type="submit" 
              className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-200 ${
                form.type === 'expense' 
                  ? 'bg-accent-coral hover:bg-accent-coral/90 text-white' 
                  : 'bg-accent-teal hover:bg-accent-teal/90 text-dark-primary'
              }`}
            >
              {form.type === 'expense' ? 'Add Expense' : 'Add Income'}
            </button>
          </form>
        </div>

        {/* Category Breakdown */}
        <div className="panel">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-accent-purple/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Spending by Category</h3>
          </div>
          
          {Object.keys(categoryTotals).length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-dark-card-hover flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">No expenses recorded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(categoryTotals)
                .sort(([,a], [,b]) => b - a)
                .map(([category, amount]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getCategoryColor(category)}`}></div>
                        <span className="text-gray-300 font-medium">{category}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-white font-semibold">{formatCurrency(amount)}</span>
                        <span className="text-gray-500 text-sm ml-2">
                          {((amount / totalExpenses) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className={`h-full ${getCategoryColor(category)} rounded-full transition-all duration-500`}
                        style={{ 
                          width: `${(amount / Math.max(...Object.values(categoryTotals))) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="panel mt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-blue/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
          </div>
        </div>
        
        {expenses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-dark-card-hover flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-white font-medium mb-1">No transactions yet</h3>
            <p className="text-gray-500 text-sm">Add your first transaction above!</p>
          </div>
        ) : (
          <div className="space-y-0">
            {expenses.slice(0, 15).map((expense) => (
              <div key={expense.id} className="list-item flex items-center justify-between group">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-2 h-10 rounded-full ${expense.type === 'income' ? 'bg-accent-teal' : 'bg-accent-coral'}`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{expense.description}</p>
                    <div className="flex items-center gap-3 text-gray-500 text-sm">
                      <span className={`badge ${expense.type === 'income' ? 'badge-teal' : 'badge-coral'}`}>
                        {expense.category}
                      </span>
                      <span>{formatDate(expense.date)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-semibold ${expense.type === 'income' ? 'text-accent-teal' : 'text-accent-coral'}`}>
                    {expense.type === 'income' ? '+' : '-'}{formatCurrency(expense.amount)}
                  </span>
                  <button
                    onClick={() => deleteExpense(expense.id)}
                    className="p-2 bg-accent-coral/20 text-accent-coral rounded-lg hover:bg-accent-coral/30 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Spending;
