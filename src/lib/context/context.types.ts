import type { Todo } from '../types/todo';
import type { BudgetSummary } from '../types/budget';
import type { ScheduleItem } from '../types/schedule';
import type { TimerState } from '../types/timer';
import type { Note } from '../types/note';
import type { TodaySummary } from '../types/habit';

/** Aggregated context for the dashboard and cross-tool queries */
export interface HiNixContext {
  today: {
    date: string;
    greeting: string;
    tasks: number;
    completedTasks: number;
    events: number;
    expenses: number;
  };

  upcoming: {
    schedules: ScheduleItem[];
    todos: Todo[];
  };

  recent: {
    pinnedNotes: Note[];
  };

  finance: BudgetSummary;

  active: {
    timer: TimerState;
  };
  
  habits: TodaySummary | null;
}
