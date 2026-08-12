import type { ScheduleItem } from '../../types/schedule';
import type { ScheduleRepository } from '../../repositories/schedule.repository';

export class ScheduleService {
  constructor(private repository: ScheduleRepository) {}

  async create(title: string, date: string, time?: string): Promise<ScheduleItem> {
    const item: ScheduleItem = {
      id: crypto.randomUUID(),
      title,
      date,
      time,
      createdAt: new Date().toISOString()
    };
    return await this.repository.create(item);
  }

  async listByDate(date: string): Promise<ScheduleItem[]> {
    return await this.repository.listByDate(date);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
