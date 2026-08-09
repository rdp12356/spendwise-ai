import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Target, TrendingUp, Sparkles } from 'lucide-react';

export default function LandingPage() {
  const { session, loading } = useAuth();

  if (!loading && session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center border-b border-border/50">
        <div className="flex items-center gap-2 text-2xl font-bold text-primary">
          <Sparkles className="h-6 w-6" />
          SpendWise AI
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">Login</Link>
          <Button asChild>
            <Link to="/signup">Get Started</Link>
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-20 flex flex-col items-center text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight">
          Know what you spend.<br />
          <span className="text-primary">Know what you can afford.</span>
        </h1>
        <p className="mt-6 text-xl text-muted-foreground max-w-2xl">
          SpendWise AI helps you understand your finances and make smarter purchasing decisions using your income, expenses and savings goals.
        </p>
        <div className="mt-10 flex gap-4 flex-col sm:flex-row">
          <Button size="lg" asChild className="text-lg px-8">
            <Link to="/signup">Check My Finances</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-lg px-8">
            <Link to="/login">Try Purchase Advisor</Link>
          </Button>
        </div>

        <div className="mt-32 grid md:grid-cols-3 gap-10 text-left max-w-5xl w-full">
          <div className="flex flex-col gap-4 p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Track Everything</h3>
            <p className="text-muted-foreground">Keep tabs on your income and expenses to understand exactly where your money goes.</p>
          </div>
          <div className="flex flex-col gap-4 p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Target className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Hit Your Goals</h3>
            <p className="text-muted-foreground">Set savings goals and watch your progress grow without sacrificing your lifestyle.</p>
          </div>
          <div className="flex flex-col gap-4 p-6 rounded-2xl bg-card border border-border/50 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Sparkles className="h-32 w-32" />
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">AI Purchase Advisor</h3>
            <p className="text-muted-foreground">Before you buy that gaming laptop, ask our AI if it fits your financial reality.</p>
          </div>
        </div>

        <div className="mt-32 w-full max-w-5xl rounded-3xl bg-primary/5 border border-primary/20 p-10 flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold">Make smarter spending decisions.</h2>
          <p className="text-muted-foreground mt-4 max-w-xl">
            Stop relying on simple bank charts that only show you the past. Take control of your financial future today.
          </p>
          <Button size="lg" asChild className="mt-8 text-lg px-8">
            <Link to="/signup">Get Started</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
