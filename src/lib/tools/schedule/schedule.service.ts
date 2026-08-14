import type { ScheduleItem } from '../../types/schedule';
import type { ScheduleRepository } from '../../repositories/schedule.repository';
import type { HabitRepository } from '../../repositories/habit.repository';

export class ScheduleService {
  constructor(
    private repository: ScheduleRepository,
    private habitRepo?: HabitRepository
  ) { }

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
    const items = await this.repository.listByDate(date);

    if (this.habitRepo) {
      const activeHabits = (await this.habitRepo.list()).filter(h => !h.archived);
      const completions = await this.habitRepo.findCompletionsByDate(date);
      const completedIds = new Set(completions.map(c => c.habitId));

      for (const habit of activeHabits) {
        if (!completedIds.has(habit.id)) {
          items.push({
            id: `habit-${habit.id}-${date}`,
            title: `Habit: ${habit.name}`,
            date,
            createdAt: habit.createdAt,
            linkedHabitId: habit.id
          });
        }
      }
      
      // Sort items by time
      items.sort((a, b) => {
        const timeA = a.time || '23:59';
        const timeB = b.time || '23:59';
        return timeA.localeCompare(timeB);
      });
    }

    return items;
  }

  async list(): Promise<ScheduleItem[]> {
    return await this.repository.list();
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
