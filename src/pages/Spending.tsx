import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

type Expense = {
  id: number;
  amount: number;
  description: string;
  category: string;
  date: string;
  expense_type: 'expense' | 'income';
};

const Spending = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [form, setForm] = useState({
    amount: '',
    description: '',
    category: 'Food',
    type: 'expense' as 'expense' | 'income',
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const expenseCategories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Education', 'Other'];
  const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];

  const loadExpenses = async () => {
    try {
      setIsLoading(true);
      const dbExpenses = await invoke<Expense[]>('get_expenses');
      setExpenses(dbExpenses);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.description) return;

    try {
      const newExpense: Expense = {
        id: 0,
        amount: parseFloat(form.amount),
        description: form.description,
        category: form.category,
        date: new Date().toISOString(),
        expense_type: form.type,
      };

      const updatedExpenses = await invoke<Expense[]>('add_expense', { expense: newExpense });
      setExpenses(updatedExpenses);
      setForm({ amount: '', description: '', category: form.type === 'expense' ? 'Food' : 'Salary', type: form.type });
    } catch (error) {
      console.error('Failed to add expense:', error);
    }
  };

  const deleteExpense = async (id: number) => {
    try {
      const updatedExpenses = await invoke<Expense[]>('delete_expense', { id });
      setExpenses(updatedExpenses);
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  const getTotalByType = (type: 'expense' | 'income') => {
    return expenses
      .filter(exp => exp.expense_type === type)
      .reduce((total, exp) => total + exp.amount, 0);
  };

  const getThisMonthTotal = (type: 'expense' | 'income') => {
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    
    return expenses
      .filter(exp => {
        const expDate = new Date(exp.date);
        return exp.expense_type === type &&
          expDate.getMonth() === thisMonth &&
          expDate.getFullYear() === thisYear;
      })
      .reduce((total, exp) => total + exp.amount, 0);
  };

  const getCategoryTotals = () => {
    const totals: { [key: string]: number } = {};
    expenses
      .filter(exp => exp.expense_type === 'expense')
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const totalExpenses = getTotalByType('expense');
  const totalIncome = getTotalByType('income');
  const monthlyExpenses = getThisMonthTotal('expense');
  const monthlyIncome = getThisMonthTotal('income');
  const balance = totalIncome - totalExpenses;
  const categoryTotals = getCategoryTotals();

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 pt-20 md:pt-8 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 mx-auto mb-4" style={{ borderColor: 'var(--accent)' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 pt-20 md:pt-8" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Spending Tracker</h1>
        <p style={{ color: 'var(--text-muted)' }} className="text-sm sm:text-base">Monitor your income and expenses</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p style={{ color: 'var(--text-muted)' }} className="text-xs sm:text-sm font-medium mb-1">Total Income</p>
              <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--success)' }}>{formatCurrency(totalIncome)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
              <svg className="w-5 h-5" style={{ color: 'var(--success)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
          </div>
          <p style={{ color: 'var(--success)' }} className="text-xs font-medium">+{formatCurrency(monthlyIncome)} this month</p>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p style={{ color: 'var(--text-muted)' }} className="text-xs sm:text-sm font-medium mb-1">Total Expenses</p>
              <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--danger)' }}>{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
              <svg className="w-5 h-5" style={{ color: 'var(--danger)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
          </div>
          <p style={{ color: 'var(--danger)' }} className="text-xs font-medium">-{formatCurrency(monthlyExpenses)} this month</p>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p style={{ color: 'var(--text-muted)' }} className="text-xs sm:text-sm font-medium mb-1">Balance</p>
              <p className="text-xl sm:text-2xl font-bold" style={{ color: balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {formatCurrency(balance)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--accent-dim)' }}>
              <svg className="w-5 h-5" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p style={{ color: 'var(--text-muted)' }} className="text-xs sm:text-sm font-medium mb-1">Transactions</p>
              <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{expenses.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--border-color)' }}>
              <svg className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Transaction Form */}
        <div className="lg:col-span-1">
          <div className="panel">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Add Transaction</h3>
            
            {/* Type Toggle */}
            <div className="flex rounded-lg p-1 mb-4" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, type: 'expense', category: 'Food' }))}
                className="flex-1 py-2 rounded-md text-sm font-medium transition-all"
                style={{
                  backgroundColor: form.type === 'expense' ? 'var(--danger)' : 'transparent',
                  color: form.type === 'expense' ? 'white' : 'var(--text-secondary)',
                }}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, type: 'income', category: 'Salary' }))}
                className="flex-1 py-2 rounded-md text-sm font-medium transition-all"
                style={{
                  backgroundColor: form.type === 'income' ? 'var(--success)' : 'transparent',
                  color: form.type === 'income' ? 'white' : 'var(--text-secondary)',
                }}
              >
                Income
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="Amount"
                className="input"
                required
              />

              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Description"
                className="input"
                required
              />

              <select
                value={form.category}
                onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                className="input"
              >
                {(form.type === 'expense' ? expenseCategories : incomeCategories).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <button type="submit" className="btn btn-primary w-full">
                Add {form.type === 'expense' ? 'Expense' : 'Income'}
              </button>
            </form>
          </div>

          {/* Category Breakdown */}
          <div className="panel mt-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Expense Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(categoryTotals).map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--accent)' }}></div>
                    <span style={{ color: 'var(--text-secondary)' }}>{category}</span>
                  </div>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(amount)}</span>
                </div>
              ))}
              {Object.keys(categoryTotals).length === 0 && (
                <p className="text-center py-4" style={{ color: 'var(--text-muted)' }}>No expenses yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="lg:col-span-2">
          <div className="panel">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Transactions</h3>
            <div className="space-y-0">
              {expenses.length === 0 ? (
                <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  <p>No transactions yet. Add your first transaction!</p>
                </div>
              ) : (
                expenses.slice(0, 15).map((expense) => (
                  <div key={expense.id} className="list-item flex items-center justify-between group">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{expense.description}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="badge badge-neutral">{expense.category}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(expense.date)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span 
                        className="font-semibold"
                        style={{ color: expense.expense_type === 'income' ? 'var(--success)' : 'var(--danger)' }}
                      >
                        {expense.expense_type === 'income' ? '+' : '-'}{formatCurrency(expense.amount)}
                      </span>
                      <button
                        onClick={() => deleteExpense(expense.id)}
                        className="btn-danger p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
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

export default Spending;
