import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Expense, Income } from '../types';
import { getSpendingVibeCheck } from '../services/aiService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VibeCheck() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [analyzing, setAnalyzing] = useState(false);
  const [vibeCheckResult, setVibeCheckResult] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const [incRes, expRes] = await Promise.all([
      supabase.from('income').select('*').order('date', { ascending: false }).limit(20),
      supabase.from('expenses').select('*').order('date', { ascending: false }).limit(20)
    ]);
    
    if (incRes.data) setIncomes(incRes.data);
    if (expRes.data) setExpenses(expRes.data);
    setLoading(false);
  };

  const generateVibeCheck = async () => {
    setAnalyzing(true);
    try {
      const result = await getSpendingVibeCheck(expenses, incomes);
      setVibeCheckResult(result);
    } catch (error) {
      console.error(error);
      setVibeCheckResult("Bruh, our AI is sleeping right now. Check back later.");
    }
    setAnalyzing(false);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-muted-foreground animate-pulse">Loading data...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="flex flex-col gap-2 text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight flex items-center justify-center gap-2">
          Financial Vibe Check <Flame className="h-8 w-8 text-orange-500" />
        </h1>
        <p className="text-lg text-muted-foreground">Let our Gen-Z AI roast your recent spending habits.</p>
      </div>

      {!vibeCheckResult && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <Button 
            size="lg" 
            className="h-16 px-8 text-lg font-bold w-full max-w-md mx-auto" 
            onClick={generateVibeCheck}
            disabled={analyzing || expenses.length === 0}
          >
            {analyzing ? (
              <span className="flex items-center gap-2"><Sparkles className="h-5 w-5 animate-pulse" /> Generating Roast...</span>
            ) : (
              <span className="flex items-center gap-2"><Flame className="h-5 w-5" /> Roast My Spending</span>
            )}
          </Button>
          {expenses.length === 0 && (
            <p className="text-muted-foreground text-sm mt-4">You need to add some expenses first before we can roast you!</p>
          )}
        </motion.div>
      )}

      {vibeCheckResult && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ type: "spring", bounce: 0.5 }}
        >
          <Card className="border-orange-500/30 bg-gradient-to-b from-orange-500/10 to-transparent overflow-hidden">
            <CardHeader className="text-center border-b border-orange-500/20 pb-6 bg-orange-500/5">
              <CardTitle className="text-2xl font-black text-orange-600 dark:text-orange-400">
                The Verdict
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 pb-10 px-8 text-center">
              <p className="text-xl leading-relaxed font-medium">
                "{vibeCheckResult}"
              </p>
              
              <Button 
                variant="outline" 
                className="mt-8 border-orange-500/50 hover:bg-orange-500/10" 
                onClick={() => setVibeCheckResult(null)}
              >
                Hide before my parents see this
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
