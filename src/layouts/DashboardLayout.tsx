import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, Target, ShoppingBag, LogOut, ReceiptText, Repeat, Flame } from 'lucide-react';
import { ModeToggle } from '../components/mode-toggle';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardLayout() {
  const { session, loading, signOut } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-muted/30">
      <aside className="w-full md:w-64 bg-card border-r border-border md:h-screen sticky top-0">
        <div className="p-6 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary">
            <ShoppingBag className="h-6 w-6" />
            SpendWise AI
          </Link>
          <div className="md:hidden">
            <ModeToggle />
          </div>
        </div>
        <nav className="px-4 py-2 flex flex-col gap-2">
          <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors font-medium">
            <LayoutDashboard className="h-5 w-5" /> Dashboard
          </Link>
          <Link to="/goals" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors font-medium">
            <Target className="h-5 w-5" /> Goals
          </Link>
          <Link to="/advisor" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors font-medium">
            <ReceiptText className="h-5 w-5" /> Purchase Advisor
          </Link>
          <Link to="/subscriptions" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors font-medium">
            <Repeat className="h-5 w-5" /> Subscriptions
          </Link>
          <Link to="/vibe-check" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors font-medium text-orange-500">
            <Flame className="h-5 w-5" /> Vibe Check
          </Link>
        </nav>
        <div className="absolute bottom-4 left-0 w-full px-4 flex items-center gap-2">
          <button 
            onClick={signOut}
            className="flex-1 flex items-center gap-3 px-3 py-2 text-left rounded-md hover:bg-destructive/10 text-destructive transition-colors font-medium"
          >
            <LogOut className="h-5 w-5" /> Logout
          </button>
          <div className="hidden md:block">
            <ModeToggle />
          </div>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={window.location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
