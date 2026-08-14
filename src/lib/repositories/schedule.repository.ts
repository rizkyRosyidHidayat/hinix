import type { ScheduleItem } from '../types/schedule';
import { db } from '../db/database';
import { dbState } from '../stores/db.svelte';

export class ScheduleRepository {
  async create(item: ScheduleItem): Promise<ScheduleItem> {
    await db.schedules.add(item);
    dbState.notify('schedules');
    return item;
  }

  async list(): Promise<ScheduleItem[]> {
    return db.schedules.orderBy('date').toArray();
  }

  async listByDate(date: string): Promise<ScheduleItem[]> {
    return db.schedules.where('date').equals(date).toArray();
  }

  async getById(id: string): Promise<ScheduleItem | undefined> {
    return db.schedules.get(id);
  }

  async findByLinkedTodoId(todoId: string): Promise<ScheduleItem | undefined> {
    return db.schedules.where('linkedTodoId').equals(todoId).first();
  }

  async findByLinkedHabitId(habitId: string): Promise<ScheduleItem | undefined> {
    return db.schedules.where('linkedHabitId').equals(habitId).first();
  }

  async update(id: string, changes: Partial<ScheduleItem>): Promise<ScheduleItem> {
    await db.schedules.update(id, changes);
    dbState.notify('schedules');
    const updated = await this.getById(id);
    if (!updated) throw new Error('Schedule item not found');
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.schedules.delete(id);
    dbState.notify('schedules');
  }
}
