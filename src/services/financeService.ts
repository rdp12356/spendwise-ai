import { Expense, Income, SavingsGoal } from '../types';

export function calculateBalance(income: Income[], expenses: Expense[]): number {
  const totalIncome = income.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  return totalIncome - totalExpenses;
}

export function calculatePurchaseRatio(purchasePrice: number, currentBalance: number): number {
  if (currentBalance <= 0) return 100; // If balance is 0 or negative, it consumes >= 100% basically
  return (purchasePrice / currentBalance) * 100;
}

export function calculateGoalImpact(
  purchasePrice: number,
  currentBalance: number,
  goals: SavingsGoal[]
): { scorePenalty: number; impactText: string } {
  if (goals.length === 0) {
    return { scorePenalty: 0, impactText: 'No savings goals to impact.' };
  }

  const projectedBalance = currentBalance - purchasePrice;
  let maxPenalty = 0;
  let impactText = 'No meaningful impact.';

  for (const goal of goals) {
    const remainingToSave = goal.target_amount - goal.current_amount;
    if (remainingToSave <= 0) continue; // Goal already met

    if (projectedBalance < goal.current_amount) {
      // Purchasing this means dipping into savings already set aside for a goal
      return { scorePenalty: -30, impactText: 'Severe impact. Consumes dedicated savings.' };
    } else if (projectedBalance - goal.current_amount < (purchasePrice * 0.5)) {
      maxPenalty = Math.max(maxPenalty, 20);
      impactText = 'Goal may be delayed.';
    } else {
      maxPenalty = Math.max(maxPenalty, 10);
      if (impactText === 'No meaningful impact.') {
        impactText = 'Minor impact on savings pace.';
      }
    }
  }

  return { scorePenalty: -maxPenalty, impactText };
}

export function calculateAffordabilityScore(
  purchasePrice: number,
  currentBalance: number,
  goals: SavingsGoal[]
): number {
  let score = 100;

  // 1. Purchase ratio penalties
  const ratio = calculatePurchaseRatio(purchasePrice, currentBalance);
  if (ratio > 80) score -= 40;
  else if (ratio >= 60) score -= 30;
  else if (ratio >= 40) score -= 20;
  else if (ratio >= 20) score -= 10;

  // 2. Goal impact penalties
  const goalImpact = calculateGoalImpact(purchasePrice, currentBalance, goals);
  score += goalImpact.scorePenalty;

  // 3. Remaining balance penalties
  const projected = currentBalance - purchasePrice;
  if (projected < 0) {
    score -= 40;
  } else if (projected < (currentBalance * 0.1)) {
    score -= 15; // Low balance (less than 10% left)
  }

  return Math.max(0, Math.min(100, score));
}

export function getRecommendationLevel(score: number): string {
  if (score >= 80) return 'Affordable';
  if (score >= 60) return 'Consider Carefully';
  if (score >= 40) return 'Not Recommended';
  return 'Avoid For Now';
}
