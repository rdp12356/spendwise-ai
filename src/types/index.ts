export type Profile = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export type Income = {
  id: string;
  user_id: string;
  amount: number;
  source: string;
  description: string | null;
  date: string;
  created_at: string;
}

export type Expense = {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  description: string | null;
  date: string;
  created_at: string;
}

export type SavingsGoal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  created_at: string;
}

export type PurchaseAnalysis = {
  id: string;
  user_id: string;
  product_name: string;
  price: number;
  purchase_date: string | null;
  score: number;
  recommendation: string;
  ai_advice: any;
  created_at: string;
}

export type Subscription = {
  id: string;
  user_id: string;
  name: string;
  cost: number;
  billing_cycle: 'monthly' | 'yearly';
  next_billing_date: string | null;
  created_at: string;
}
