import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { SavingsGoal } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target, PlusCircle, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [deadline, setDeadline] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('savings_goals').select('*').order('created_at', { ascending: false });
    if (data) setGoals(data);
    setLoading(false);
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const payload = {
      user_id: user.id,
      name,
      target_amount: parseFloat(targetAmount),
      current_amount: parseFloat(currentAmount),
      deadline: deadline || null
    };

    let response;
    if (editingId) {
      response = await supabase.from('savings_goals').update(payload).eq('id', editingId).select();
    } else {
      response = await supabase.from('savings_goals').insert(payload).select();
    }

    const { data, error } = response;

    if (!error && data) {
      if (editingId) {
        setGoals(goals.map(g => g.id === editingId ? data[0] : g));
        toast.success('Savings goal updated!');
      } else {
        setGoals([data[0], ...goals]);
        toast.success('Savings goal created!');
      }
      setShowModal(false);
      resetForm();
    } else {
      toast.error(`Failed to ${editingId ? 'update' : 'create'} goal`);
    }
  };

  const handleEdit = (goal: SavingsGoal) => {
    setEditingId(goal.id);
    setName(goal.name);
    setTargetAmount(goal.target_amount.toString());
    setCurrentAmount(goal.current_amount.toString());
    setDeadline(goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '');
    setShowModal(true);
  };

  const deleteGoal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    await supabase.from('savings_goals').delete().eq('id', id);
    setGoals(goals.filter(g => g.id !== id));
    toast.success('Goal deleted');
  };

  const resetForm = () => {
    setName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setDeadline('');
    setEditingId(null);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-muted-foreground animate-pulse">Loading goals...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Savings Goals</h1>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <PlusCircle className="h-4 w-4" /> New Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="flex flex-col items-center gap-4">
            <Target className="h-12 w-12 text-muted-foreground opacity-50" />
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Create your first savings goal</h2>
              <p className="text-muted-foreground">Start tracking progress toward your financial milestones.</p>
            </div>
            <Button onClick={() => setShowModal(true)} className="mt-4">Create Goal</Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
          initial="hidden"
          animate="show"
        >
          {goals.map(goal => {
            const progress = Math.min(100, Math.max(0, (goal.current_amount / goal.target_amount) * 100));
            const remaining = goal.target_amount - goal.current_amount;
            
            return (
              <motion.div key={goal.id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
                <Card className="relative overflow-hidden group hover:shadow-md transition-shadow h-full">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="truncate pr-12">{goal.name}</CardTitle>
                      <div className="flex gap-2 absolute right-4 top-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(goal)} className="text-muted-foreground hover:text-primary transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => deleteGoal(goal.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {goal.deadline && (
                      <CardDescription>Target: {new Date(goal.deadline).toLocaleDateString()}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-semibold text-primary">₹{goal.current_amount.toLocaleString()}</span>
                          <span className="text-muted-foreground">₹{goal.target_amount.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-in-out" 
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-muted-foreground">{progress.toFixed(1)}%</span>
                          <span className="text-muted-foreground">{remaining > 0 ? `₹${remaining.toLocaleString()} left` : 'Completed!'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-lg border-2">
            <CardHeader>
              <CardTitle>{editingId ? 'Edit' : 'Create'} Savings Goal</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddGoal} className="space-y-4">
                <div className="space-y-2">
                  <Label>Goal Name</Label>
                  <Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Emergency Fund, Laptop" />
                </div>
                <div className="space-y-2">
                  <Label>Target Amount (₹)</Label>
                  <Input type="number" min="1" step="0.01" required value={targetAmount} onChange={e => setTargetAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Current Saved Amount (₹)</Label>
                  <Input type="number" min="0" step="0.01" required value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Target Deadline (Optional)</Label>
                  <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
                  <Button type="submit">{editingId ? 'Update' : 'Save'} Goal</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
