import { db } from '../db/database';
import { dbState } from '../stores/db.svelte';
import { syncStore } from '../stores/sync.svelte';
import type { SyncableTable } from './sync.types';
import type { Habit } from '../types/habit';
import type { Note } from '$lib/types/note';
import type { Todo } from '$lib/types/todo';
import type { ScheduleItem } from '$lib/types/schedule';
import type { BudgetTransaction } from '$lib/types/budget';
import type { CommandResult } from '$lib/commands/types';

class SyncService {
  private debounceMap = new Map<string, NodeJS.Timeout>();

  private getUrl() {
    return syncStore.scriptUrl;
  }

  private isEnabled() {
    return syncStore.enabled && !!syncStore.scriptUrl;
  }

  private getSheetName(table: SyncableTable): string {
    switch (table) {
      case 'todos': return 'Tasks';
      case 'habits': return 'Habits';
      case 'schedules': return 'Schedule';
      case 'notes': return 'Notes';
      case 'budgetTransactions': return 'Budget';
    }
  }

  async pushRow(table: SyncableTable, row: Note | Habit | Todo | ScheduleItem | BudgetTransaction) {
    if (!this.isEnabled()) return;

    let rowData = { ...row };
    if (table === 'habits') {
      rowData = await this.enrichHabit(row as Habit);
    }

    const key = `push_${table}_${row.id}`;
    clearTimeout(this.debounceMap.get(key));

    this.debounceMap.set(key, setTimeout(async () => {
      try {
        await fetch(this.getUrl(), {
          method: 'POST',
          body: JSON.stringify({
            action: 'upsert',
            sheet: this.getSheetName(table),
            row: rowData
          })
        });
      } catch (err) {
        console.error(`Failed to push row to ${table}:`, err);
      }
    }, 1000));
  }

  async deleteRow(table: SyncableTable, id: string) {
    if (!this.isEnabled()) return;

    const key = `del_${table}_${id}`;
    clearTimeout(this.debounceMap.get(key));

    this.debounceMap.set(key, setTimeout(async () => {
      try {
        await fetch(this.getUrl(), {
          method: 'POST',
          body: JSON.stringify({
            action: 'delete',
            sheet: this.getSheetName(table),
            id
          })
        });
      } catch (err) {
        console.error(`Failed to delete row from ${table}:`, err);
      }
    }, 1000));
  }

  async pushAllTables(): Promise<CommandResult> {
    if (!this.isEnabled()) throw new Error("Sync is not configured or disabled");
    syncStore.setStatus('syncing');
    try {
      const tables: SyncableTable[] = ['todos', 'habits', 'schedules', 'notes', 'budgetTransactions'];
      for (const table of tables) {
        await this.pushTableAll(table);
      }
      syncStore.setStatus('success');
      syncStore.updateLastSync();
      return { type: 'success', output: 'Pushed all data to Google Sheets.' };
    } catch (err) {
      console.error("Push all failed", err);
      syncStore.setStatus('error');
      return { type: 'error', output: 'Sync failed' };
    }
  }

  async pullAllTables() {
    if (!this.isEnabled()) throw new Error("Sync is not configured or disabled");

    syncStore.setStatus('syncing');
    try {
      const tables: SyncableTable[] = ['todos', 'habits', 'schedules', 'notes', 'budgetTransactions'];
      for (const table of tables) {
        await this.pullTableAll(table);
      }
      syncStore.setStatus('success');
      syncStore.updateLastSync();
    } catch (err) {
      console.error("Pull all failed", err);
      syncStore.setStatus('error');
      throw err;
    }
  }

  private async pushTableAll(table: SyncableTable) {
    let rows = await db[table === 'budgetTransactions' ? 'budgetTransactions' : table].toArray();

    if (table === 'habits') {
      rows = await Promise.all(rows.map((h) => this.enrichHabit(h as Habit)));
    }

    await fetch(this.getUrl(), {
      method: 'POST',
      body: JSON.stringify({
        action: 'pushAll',
        sheet: this.getSheetName(table),
        rows
      })
    });
  }

  private async pullTableAll(table: SyncableTable) {
    const url = new URL(this.getUrl());
    url.searchParams.append('action', 'pull');
    url.searchParams.append('sheet', this.getSheetName(table));

    const res = await fetch(url.toString(), { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const remoteRows = await res.json();

    if (!Array.isArray(remoteRows)) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tableRef = db[table === 'budgetTransactions' ? 'budgetTransactions' : table] as any;

    for (const remote of remoteRows) {
      if (table === 'habits') {
        const { completions, ...habitData } = remote;
        const local = await db.habits.get(remote.id);

        if (!local || (remote.createdAt && local.createdAt && new Date(remote.createdAt) > new Date(local.createdAt))) {
          await db.habits.put(habitData);
        }

        if (completions && Array.isArray(completions)) {
          for (const c of completions) {
            await db.habitCompletions.put(c);
          }
        }
      } else {
        const local = await tableRef.get(remote.id);
        let shouldUpdate = true;

        if (local && local.updatedAt && remote.updatedAt) {
          shouldUpdate = new Date(remote.updatedAt) > new Date(local.updatedAt);
        } else if (local && local.createdAt && remote.createdAt && !local.updatedAt && !remote.updatedAt) {
          shouldUpdate = true;
        }

        if (shouldUpdate) {
          await tableRef.put(remote);
        }
      }
    }

    if (table === 'budgetTransactions') dbState.notify('budget');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    else dbState.notify(table as any);
  }

  private async enrichHabit(habit: Habit) {
    const completions = await db.habitCompletions.where('habitId').equals(habit.id).toArray();
    return { ...habit, completions };
  }
}

export const syncService = new SyncService();
