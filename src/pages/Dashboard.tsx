import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Income, Expense } from '../types';
import { calculateBalance } from '../services/financeService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { PlusCircle, MinusCircle, Target, ReceiptText, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [insertingDemo, setInsertingDemo] = useState(false);

  // Modal states
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Form states
  const [amount, setAmount] = useState('');
  const [sourceOrCategory, setSourceOrCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const [incomeRes, expenseRes] = await Promise.all([
      supabase.from('income').select('*').order('date', { ascending: false }),
      supabase.from('expenses').select('*').order('date', { ascending: false })
    ]);
    
    if (incomeRes.data) setIncomes(incomeRes.data);
    if (expenseRes.data) setExpenses(expenseRes.data);
    setLoading(false);
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const { data, error } = await supabase.from('income').insert({
      user_id: user.id,
      amount: parseFloat(amount),
      source: sourceOrCategory,
      description,
      date
    }).select();

    if (!error && data) {
      setIncomes([data[0], ...incomes]);
      setShowIncomeModal(false);
      resetForm();
      toast.success('Income added successfully');
    } else {
      toast.error('Failed to add income');
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const { data, error } = await supabase.from('expenses').insert({
      user_id: user.id,
      amount: parseFloat(amount),
      category: sourceOrCategory,
      description,
      date
    }).select();

    if (!error && data) {
      setExpenses([data[0], ...expenses]);
      setShowExpenseModal(false);
      resetForm();
      toast.success('Expense added successfully');
    } else {
      toast.error('Failed to add expense');
    }
  };

  const deleteTransaction = async (id: string, type: 'income' | 'expense') => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    
    if (type === 'income') {
      await supabase.from('income').delete().eq('id', id);
      setIncomes(incomes.filter(i => i.id !== id));
      toast.success('Income deleted');
    } else {
      await supabase.from('expenses').delete().eq('id', id);
      setExpenses(expenses.filter(e => e.id !== id));
      toast.success('Expense deleted');
    }
  };

  const resetForm = () => {
    setAmount('');
    setSourceOrCategory('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const insertDemoData = async () => {
    if (!user) return;
    if (!confirm('This will insert sample data. Proceed?')) return;
    setInsertingDemo(true);
    
    // Insert Income
    await supabase.from('income').insert({
      user_id: user.id,
      amount: 50000,
      source: 'Salary',
      description: 'Monthly Salary',
      date: new Date().toISOString().split('T')[0]
    });

    // Insert Expenses
    await supabase.from('expenses').insert([
      { user_id: user.id, amount: 5000, category: 'Food', description: 'Groceries', date: new Date().toISOString().split('T')[0] },
      { user_id: user.id, amount: 2500, category: 'Transport', description: 'Fuel', date: new Date().toISOString().split('T')[0] },
      { user_id: user.id, amount: 4000, category: 'Shopping', description: 'Clothes', date: new Date().toISOString().split('T')[0] },
      { user_id: user.id, amount: 3500, category: 'Education', description: 'Courses', date: new Date().toISOString().split('T')[0] },
    ]);

    // Insert Savings Goal
    await supabase.from('savings_goals').insert({
      user_id: user.id,
      name: 'Gaming Laptop',
      target_amount: 60000,
      current_amount: 20000,
      deadline: null
    });

    await fetchData();
    setInsertingDemo(false);
    toast.success('Demo data loaded successfully!');
  };

  const totalIncome = useMemo(() => incomes.reduce((acc, curr) => acc + curr.amount, 0), [incomes]);
  const totalExpenses = useMemo(() => expenses.reduce((acc, curr) => acc + curr.amount, 0), [expenses]);
  const balance = useMemo(() => calculateBalance(incomes, expenses), [incomes, expenses]);

  // Group expenses for chart
  const expenseByCategory = useMemo(() => expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>), [expenses]);

  const chartData = useMemo(() => Object.entries(expenseByCategory).map(([name, value]) => ({ name, value })), [expenseByCategory]);
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff7c43', '#f95d6a', '#d45087'];

  const comparisonData = useMemo(() => [
    { name: 'Income', amount: totalIncome, fill: '#16a34a' },
    { name: 'Expenses', amount: totalExpenses, fill: '#dc2626' },
  ], [totalIncome, totalExpenses]);

  const allTransactions = useMemo(() => [
    ...incomes.map(i => ({ ...i, type: 'income' as const })),
    ...expenses.map(e => ({ ...e, type: 'expense' as const }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10), [incomes, expenses]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-muted-foreground animate-pulse">Loading your dashboard...</p>
    </div>
  );

  const hasData = incomes.length > 0 || expenses.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          {!hasData && (
            <Button onClick={insertDemoData} variant="outline" className="gap-2 border-primary/50 text-primary hover:bg-primary/10" disabled={insertingDemo}>
              {insertingDemo ? 'Loading...' : 'Load Demo Data'}
            </Button>
          )}
          <Button onClick={() => setShowIncomeModal(true)} variant="outline" className="gap-2">
            <PlusCircle className="h-4 w-4" /> Add Income
          </Button>
          <Button onClick={() => setShowExpenseModal(true)} className="gap-2">
            <MinusCircle className="h-4 w-4" /> Add Expense
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                Current Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{balance.toLocaleString()}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                Total Income <ArrowUpCircle className="h-4 w-4 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">₹{totalIncome.toLocaleString()}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                Total Expenses <ArrowDownCircle className="h-4 w-4 text-red-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">₹{totalExpenses.toLocaleString()}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Button asChild variant="secondary" className="gap-2">
          <Link to="/goals"><Target className="h-4 w-4" /> New Goal</Link>
        </Button>
        <Button asChild variant="secondary" className="gap-2 text-primary">
          <Link to="/advisor"><ReceiptText className="h-4 w-4" /> Purchase Advisor</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No expenses yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Cash Flow Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {totalIncome > 0 || totalExpenses > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(val) => `₹${val}`} />
                  <RechartsTooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {allTransactions.length > 0 ? (
              <motion.div className="space-y-4" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show">
                {allTransactions.map(t => (
                  <motion.div key={t.id} variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 hover:bg-muted/50 p-2 rounded-md transition-colors">
                    <div>
                      <p className="font-medium">{t.description || (t.type === 'income' ? t.source : t.category)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString()} • {t.type === 'income' ? t.source : t.category}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                      </span>
                      <button onClick={() => deleteTransaction(t.id, t.type)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No transactions found.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {(showIncomeModal || showExpenseModal) && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-lg border-2">
            <CardHeader>
              <CardTitle>{showIncomeModal ? 'Add Income' : 'Add Expense'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={showIncomeModal ? handleAddIncome : handleAddExpense} className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input type="number" min="0.01" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{showIncomeModal ? 'Source' : 'Category'}</Label>
                  {showIncomeModal ? (
                    <Input required value={sourceOrCategory} onChange={e => setSourceOrCategory(e.target.value)} placeholder="e.g. Salary, Freelance" />
                  ) : (
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      required
                      value={sourceOrCategory} 
                      onChange={e => setSourceOrCategory(e.target.value)}
                    >
                      <option value="">Select category</option>
                      <option value="Food">Food</option>
                      <option value="Transport">Transport</option>
                      <option value="Shopping">Shopping</option>
                      <option value="Education">Education</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Bills">Bills</option>
                      <option value="Health">Health</option>
                      <option value="Other">Other</option>
                    </select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" required value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => { setShowIncomeModal(false); setShowExpenseModal(false); resetForm(); }}>Cancel</Button>
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
