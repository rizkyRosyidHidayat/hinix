export interface BudgetTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category?: string;
  description?: string;
  date: string;
  createdAt: string;
}

export interface BudgetSummary {
  income: number;
  expenses: number;
  remaining: number;
  byCategory: Record<string, number>;
}
