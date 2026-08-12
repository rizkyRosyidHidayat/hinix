import type { ScheduleItem } from '../types/schedule';
import { db } from '../db/database';

export class ScheduleRepository {
  async create(item: ScheduleItem): Promise<ScheduleItem> {
    await db.schedules.add(item);
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

  async update(id: string, changes: Partial<ScheduleItem>): Promise<ScheduleItem> {
    await db.schedules.update(id, changes);
    const updated = await this.getById(id);
    if (!updated) throw new Error('Schedule item not found');
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.schedules.delete(id);
  }
}
