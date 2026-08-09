import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { SavingsGoal, Income, Expense, PurchaseAnalysis } from '../types';
import { calculateBalance, calculateAffordabilityScore, calculateGoalImpact } from '../services/financeService';
import { getAIRecommendation } from '../services/aiService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ReceiptText, Sparkles, Info } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function PurchaseAdvisor() {
  const { user } = useAuth();
  
  // Data
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PurchaseAnalysis | null>(null);

  // Form
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const [incRes, expRes, goalsRes] = await Promise.all([
      supabase.from('income').select('*'),
      supabase.from('expenses').select('*'),
      supabase.from('savings_goals').select('*')
    ]);
    
    if (incRes.data) setIncomes(incRes.data);
    if (expRes.data) setExpenses(expRes.data);
    if (goalsRes.data) setGoals(goalsRes.data);
    setLoading(false);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setAnalyzing(true);
    
    const purchasePrice = parseFloat(price);
    const currentBalance = calculateBalance(incomes, expenses);
    const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    
    const score = calculateAffordabilityScore(purchasePrice, currentBalance, goals);
    const goalImpact = calculateGoalImpact(purchasePrice, currentBalance, goals);

    const aiRes = await getAIRecommendation(
      productName,
      purchasePrice,
      currentBalance,
      totalIncome,
      totalExpenses,
      score,
      goalImpact.impactText
    );

    const { data, error } = await supabase.from('purchase_analyses').insert({
      user_id: user.id,
      product_name: productName,
      price: purchasePrice,
      purchase_date: purchaseDate || null,
      score,
      recommendation: aiRes.recommendation,
      ai_advice: aiRes
    }).select();

    if (!error && data) {
      setResult(data[0]);
      toast.success('Analysis complete!');
    } else {
      toast.error('Failed to save analysis');
    }
    setAnalyzing(false);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-muted-foreground animate-pulse">Loading financial data...</p>
    </div>
  );

  const currentBalance = calculateBalance(incomes, expenses);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 max-w-3xl mx-auto text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight">Can I afford this?</h1>
        <p className="text-lg text-muted-foreground">Tell us what you want to buy and we'll analyze its impact on your finances.</p>
      </div>

      {!result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="max-w-xl mx-auto shadow-md">
          <CardHeader>
            <CardTitle>Purchase Details</CardTitle>
            <CardDescription>We will use your tracked income, expenses, and savings goals to calculate affordability.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAnalyze} className="space-y-5">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input required value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. Gaming Laptop" />
              </div>
              <div className="space-y-2">
                <Label>Price (₹)</Label>
                <Input type="number" min="1" step="0.01" required value={price} onChange={e => setPrice(e.target.value)} placeholder="60000" />
              </div>
              <div className="space-y-2">
                <Label>Desired Purchase Date (Optional)</Label>
                <Input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Reason (Optional)</Label>
                <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. College and development work" />
              </div>
              <Button type="submit" className="w-full text-lg h-12 mt-4" disabled={analyzing}>
                {analyzing ? (
                  <span className="flex items-center gap-2"><Sparkles className="h-5 w-5 animate-pulse" /> Analyzing your purchase...</span>
                ) : (
                  <span className="flex items-center gap-2"><ReceiptText className="h-5 w-5" /> Analyze Purchase</span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        </motion.div>
      )}

      {result && (
        <motion.div 
          className="max-w-4xl mx-auto space-y-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Analysis Results</h2>
            <Button variant="outline" onClick={() => {
              setResult(null);
              setProductName('');
              setPrice('');
              setPurchaseDate('');
              setReason('');
            }}>
              Analyze Another Purchase
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 border-primary/20 bg-primary/5 flex flex-col items-center justify-center p-6 text-center">
              <h3 className="font-semibold text-muted-foreground uppercase tracking-wider text-sm mb-2">Affordability Score</h3>
              <div className={`text-6xl font-black mb-4 ${
                result.score >= 80 ? 'text-green-600' :
                result.score >= 60 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {result.score} <span className="text-2xl text-muted-foreground">/ 100</span>
              </div>
              <div className={`px-4 py-2 rounded-full font-bold uppercase text-sm tracking-wider ${
                result.score >= 80 ? 'bg-green-100 text-green-800' :
                result.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {result.recommendation}
              </div>
            </Card>

            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" /> AI Recommendation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-relaxed">
                  <p>{result.ai_advice?.reason || 'Based on deterministic calculation.'}</p>
                  
                  <div className="bg-muted/50 p-4 rounded-lg border border-border">
                    <h4 className="font-semibold mb-1 flex items-center gap-2"><Info className="h-4 w-4" /> Financial Impact</h4>
                    <p className="text-muted-foreground">{result.ai_advice?.financialImpact}</p>
                    
                    <div className="mt-3 grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-muted-foreground uppercase block">Current Balance</span>
                        <span className="font-medium">₹{currentBalance.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground uppercase block">After Purchase</span>
                        <span className={`font-medium ${currentBalance - result.price < 0 ? 'text-destructive' : ''}`}>
                          ₹{(currentBalance - result.price).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {result.ai_advice?.suggestedAction && (
                    <div className="bg-primary/10 text-primary-foreground p-4 rounded-lg">
                      <h4 className="font-semibold text-primary mb-1">Suggested Action</h4>
                      <p className="text-primary/90">{result.ai_advice.suggestedAction}</p>
                    </div>
                  )}

                  {result.ai_advice?.savingStrategy && (
                    <div>
                      <h4 className="font-semibold mb-1">Saving Strategy</h4>
                      <p className="text-muted-foreground">{result.ai_advice.savingStrategy}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
