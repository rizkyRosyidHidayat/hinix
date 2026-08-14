import Dexie, { type Table } from 'dexie';
import type { Todo } from '../types/todo';
import type { BudgetTransaction } from '../types/budget';
import type { ScheduleItem } from '../types/schedule';
import type { Note } from '../types/note';
import type { Habit, HabitCompletion } from '../types/habit';

export interface CommandHistoryItem {
  id: string;
  command: string;
  createdAt: string;
}

export interface Setting {
  id: string;
  value: string | number | boolean;
}

export class HiNixDatabase extends Dexie {
  todos!: Table<Todo, string>;
  budgetTransactions!: Table<BudgetTransaction, string>;
  schedules!: Table<ScheduleItem, string>;
  commandHistory!: Table<CommandHistoryItem, string>;
  settings!: Table<Setting, string>;
  notes!: Table<Note, string>;
  habits!: Table<Habit, string>;
  habitCompletions!: Table<HabitCompletion, string>;

  constructor() {
    super('hinix');

    this.version(1).stores({
      todos: 'id, title, completed, createdAt, completedAt',
      budgetTransactions: 'id, type, amount, category, date, createdAt',
      schedules: 'id, title, date, time, createdAt',
      commandHistory: 'id, command, createdAt',
      settings: 'id'
    });

    // v0.2 Phase 3: Notes
    this.version(2).stores({
      notes: 'id, title, createdAt, updatedAt',
    });

    // v0.3 Phase 4: Habits
    this.version(3).stores({
      habits: 'id, normalizedName, createdAt, archived',
      habitCompletions: 'id, habitId, date, completedAt'
    });
  }
}

// In SvelteKit, we only want to instantiate the DB on the client (browser)
import { browser } from '$app/environment';

export const db = browser ? new HiNixDatabase() : null as unknown as HiNixDatabase;

