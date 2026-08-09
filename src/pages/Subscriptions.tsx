import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Subscription } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw, PlusCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Subscriptions() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [nextBillingDate, setNextBillingDate] = useState('');

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('subscriptions').select('*').order('created_at', { ascending: false });
    if (data) setSubscriptions(data);
    setLoading(false);
  };

  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { data, error } = await supabase.from('subscriptions').insert({
      user_id: user.id,
      name,
      cost: parseFloat(cost),
      billing_cycle: billingCycle,
      next_billing_date: nextBillingDate || null
    }).select();

    if (!error && data) {
      setSubscriptions([data[0], ...subscriptions]);
      setShowModal(false);
      resetForm();
      toast.success('Subscription added successfully!');
    } else {
      toast.error('Failed to add subscription');
    }
  };

  const deleteSubscription = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscription?')) return;
    await supabase.from('subscriptions').delete().eq('id', id);
    setSubscriptions(subscriptions.filter(s => s.id !== id));
    toast.success('Subscription deleted');
  };

  const resetForm = () => {
    setName('');
    setCost('');
    setBillingCycle('monthly');
    setNextBillingDate('');
  };

  const totalMonthlyCost = useMemo(() => subscriptions.reduce((acc, sub) => {
    return acc + (sub.billing_cycle === 'monthly' ? sub.cost : sub.cost / 12);
  }, 0), [subscriptions]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-muted-foreground animate-pulse">Loading subscriptions...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <PlusCircle className="h-4 w-4" /> Add Subscription
        </Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-muted-foreground flex items-center gap-2">
              <RefreshCw className="h-5 w-5" /> Total Monthly Drain
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-primary">₹{totalMonthlyCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            <p className="text-sm text-muted-foreground mt-1">This is how much leaves your account passively every month.</p>
          </CardContent>
        </Card>
      </motion.div>

      {subscriptions.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="flex flex-col items-center gap-4">
            <RefreshCw className="h-12 w-12 text-muted-foreground opacity-50" />
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">No Subscriptions yet</h2>
              <p className="text-muted-foreground">Track Netflix, Gym, Spotify, and see your total monthly cost.</p>
            </div>
            <Button onClick={() => setShowModal(true)} className="mt-4">Add Subscription</Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
          initial="hidden"
          animate="show"
        >
          {subscriptions.map(sub => (
            <motion.div key={sub.id} variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }}>
              <Card className="relative overflow-hidden group hover:shadow-md transition-all h-full border-border/50">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="truncate pr-4">{sub.name}</CardTitle>
                    <button onClick={() => deleteSubscription(sub.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-6">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {sub.next_billing_date && (
                    <CardDescription>Next bill: {new Date(sub.next_billing_date).toLocaleDateString()}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{sub.cost.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">/ {sub.billing_cycle === 'yearly' ? 'yr' : 'mo'}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
            <Card className="shadow-lg border-2">
              <CardHeader>
                <CardTitle>Add Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddSubscription} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Subscription Name</Label>
                    <Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Netflix, Spotify, Gym" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cost (₹)</Label>
                    <Input type="number" min="1" step="0.01" required value={cost} onChange={e => setCost(e.target.value)} placeholder="199" />
                  </div>
                  <div className="space-y-2">
                    <Label>Billing Cycle</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={billingCycle} 
                      onChange={e => setBillingCycle(e.target.value as 'monthly' | 'yearly')}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Next Billing Date (Optional)</Label>
                    <Input type="date" value={nextBillingDate} onChange={e => setNextBillingDate(e.target.value)} />
                  </div>
                  <div className="flex gap-2 justify-end pt-4">
                    <Button type="button" variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
                    <Button type="submit">Save Subscription</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
