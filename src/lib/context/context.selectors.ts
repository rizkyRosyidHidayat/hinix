/**
 * Pure selector functions that derive dashboard-ready data
 * from raw domain entities. No side-effects, no DB access.
 */
import type { Todo } from '../types/todo';
import type { BudgetTransaction, BudgetSummary } from '../types/budget';
import type { ScheduleItem } from '../types/schedule';

/** Get the time-aware greeting */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Today as YYYY-MM-DD */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/** Formatted date string for display: "Wednesday, August 13" */
export function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/** Count pending (not completed) tasks */
export function getPendingTaskCount(todos: Todo[]): number {
  return todos.filter(t => !t.completed).length;
}

/** Count completed tasks */
export function getCompletedTaskCount(todos: Todo[]): number {
  return todos.filter(t => t.completed).length;
}

/** Get pending tasks (up to limit) */
export function getPendingTasks(todos: Todo[], limit = 5): Todo[] {
  return todos.filter(t => !t.completed).slice(0, limit);
}

/** Sum today's expenses */
export function getTodayExpenses(transactions: BudgetTransaction[], today: string): number {
  return transactions
    .filter(t => t.type === 'expense' && t.date === today)
    .reduce((sum, t) => sum + t.amount, 0);
}

/** Compute monthly budget summary from transactions */
export function getMonthlyBudgetSummary(transactions: BudgetTransaction[]): BudgetSummary {
  let income = 0;
  let expenses = 0;
  const byCategory: Record<string, number> = {};

  for (const t of transactions) {
    if (t.type === 'income') {
      income += t.amount;
    } else {
      expenses += t.amount;
      const cat = t.category || 'Uncategorized';
      byCategory[cat] = (byCategory[cat] || 0) + t.amount;
    }
  }

  return { income, expenses, remaining: income - expenses, byCategory };
}

/** Get upcoming events (sorted by time, filtered to today or later) */
export function getUpcomingEvent(schedules: ScheduleItem[], today: string, limit: number = 5): ScheduleItem[] {
  return schedules
    .filter(s => s.date >= today)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.time || '').localeCompare(b.time || '');
    }).slice(0, limit);
}
export function getUpcomingNextEvent(schedules: ScheduleItem[], today: string): ScheduleItem | null {
  const now = new Date();
  const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  return schedules
    .filter(s => s.date >= today)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.time || '').localeCompare(b.time || '');
    })
    .filter((e) => e.date === today && e.time && e.time > currentTimeStr)
    .sort((a, b) => a.time!.localeCompare(b.time!))[0] || null;
}
