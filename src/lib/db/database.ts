import Dexie, { type Table } from 'dexie';
import type { Todo } from '../types/todo';
import type { BudgetTransaction } from '../types/budget';
import type { ScheduleItem } from '../types/schedule';

export interface CommandHistoryItem {
  id: string;
  command: string;
  createdAt: string;
}

export interface Setting {
  id: string;
  value: any;
}

export class HiNixDatabase extends Dexie {
  todos!: Table<Todo, string>;
  budgetTransactions!: Table<BudgetTransaction, string>;
  schedules!: Table<ScheduleItem, string>;
  commandHistory!: Table<CommandHistoryItem, string>;
  settings!: Table<Setting, string>;

  constructor() {
    super('hinix');
    
    this.version(1).stores({
      todos: 'id, title, completed, createdAt, completedAt',
      budgetTransactions: 'id, type, amount, category, date, createdAt',
      schedules: 'id, title, date, time, createdAt',
      commandHistory: 'id, command, createdAt',
      settings: 'id'
    });

    this.on('populate', () => {
      // Seed with mock data as requested
      this.todos.bulkAdd([
        { id: crypto.randomUUID(), title: 'Finish HiNix architecture', completed: false, createdAt: new Date().toISOString() },
        { id: crypto.randomUUID(), title: 'Buy groceries', completed: true, createdAt: new Date(Date.now() - 86400000).toISOString(), completedAt: new Date().toISOString() }
      ]);
      
      this.budgetTransactions.bulkAdd([
        { id: crypto.randomUUID(), type: 'income', amount: 15000000, description: 'Salary', category: 'Salary', date: new Date().toISOString().split('T')[0], createdAt: new Date().toISOString() },
        { id: crypto.randomUUID(), type: 'expense', amount: 50000, description: 'Lunch', category: 'Food', date: new Date().toISOString().split('T')[0], createdAt: new Date().toISOString() },
        { id: crypto.randomUUID(), type: 'expense', amount: 120000, description: 'Transport', category: 'Travel', date: new Date().toISOString().split('T')[0], createdAt: new Date().toISOString() }
      ]);

      this.schedules.bulkAdd([
        { id: crypto.randomUUID(), title: 'Team Meeting', date: new Date().toISOString().split('T')[0], time: '14:00', createdAt: new Date().toISOString() }
      ]);
    });
  }
}

// In SvelteKit, we only want to instantiate the DB on the client (browser)
import { browser } from '$app/environment';

export const db = browser ? new HiNixDatabase() : null as unknown as HiNixDatabase;
