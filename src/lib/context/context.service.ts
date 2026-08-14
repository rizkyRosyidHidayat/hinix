/**
 * ContextService — aggregates data from all domain services
 * into a single HiNixContext for the dashboard and cross-tool queries.
 *
 * This is the boundary between the domain layer and the UI.
 * Components should consume ContextService, NOT query repositories directly.
 */
import type { HiNixContext } from './context.types';
import { TodoRepository } from '../repositories/todo.repository';
import { BudgetRepository } from '../repositories/budget.repository';
import { ScheduleRepository } from '../repositories/schedule.repository';
import { NoteRepository } from '../repositories/note.repository';
import { HabitService } from '../services/habit.service';
import { timerStore } from '../stores/timer.svelte';
import {
  getGreeting,
  getTodayDate,
  getPendingTaskCount,
  getCompletedTaskCount,
  getPendingTasks,
  getTodayExpenses,
  getMonthlyBudgetSummary,
  getUpcomingEvents,
} from './context.selectors';

export class ContextService {
  private todoRepo = new TodoRepository();
  private budgetRepo = new BudgetRepository();
  private scheduleRepo = new ScheduleRepository();
  private noteRepo = new NoteRepository();
  private habitService = new HabitService();
  public initContext: HiNixContext = {
    today: {
      date: getTodayDate(),
      greeting: getGreeting(),
      tasks: 0,
      completedTasks: 0,
      events: 0,
      expenses: 0,
    },
    upcoming: {
      schedules: [],
      todos: [],
    },
    recent: {
      pinnedNotes: [],
    },
    finance: {
      income: 0,
      expenses: 0,
      remaining: 0,
      byCategory: {},
    },
    active: {
      timer: timerStore.state,
    },
    habits: null
  }

  /** Full dashboard context — all data in one call */
  async getDashboardContext(): Promise<HiNixContext> {
    const today = getTodayDate();

    // Get first and last day of the current month for budget summary
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];

    // Parallel fetch
    const [todos, monthTransactions, schedules, notes, habits] = await Promise.all([
      this.todoRepo.list(),
      this.budgetRepo.listByDateRange(monthStart, monthEnd),
      this.scheduleRepo.list(),
      this.noteRepo.list(),
      this.habitService.getTodaySummary()
    ]);

    return {
      today: {
        date: today,
        greeting: getGreeting(),
        tasks: getPendingTaskCount(todos),
        completedTasks: getCompletedTaskCount(todos),
        events: schedules.filter(s => s.date === today).length,
        expenses: getTodayExpenses(monthTransactions, today),
      },
      upcoming: {
        schedules: getUpcomingEvents(schedules, today),
        todos: getPendingTasks(todos),
      },
      recent: {
        pinnedNotes: notes.filter(n => n.pinned),
      },
      finance: getMonthlyBudgetSummary(monthTransactions),
      active: {
        timer: timerStore.state,
      },
      habits
    };
  }
}
