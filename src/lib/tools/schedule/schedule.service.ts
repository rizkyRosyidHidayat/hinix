import type { ScheduleItem } from '../../types/schedule';
import type { ScheduleRepository } from '../../repositories/schedule.repository';
import type { HabitRepository } from '../../repositories/habit.repository';

export class ScheduleService {
	constructor(
		private repository: ScheduleRepository,
		private habitRepo?: HabitRepository
	) { }

	async create(
		title: string,
		date: string,
		time?: string,
		linkedNoteId?: string
	): Promise<ScheduleItem> {
		const item: ScheduleItem = {
			id: crypto.randomUUID(),
			title,
			date,
			time,
			linkedNoteId,
			createdAt: new Date().toISOString()
		};
		return await this.repository.create(item);
	}

	async update(id: string, title: string): Promise<ScheduleItem> {
		return await this.repository.update(id, { title });
	}

	async linkNote(scheduleId: string, noteId: string): Promise<ScheduleItem> {
		return await this.repository.update(scheduleId, { linkedNoteId: noteId });
	}

	async unlinkNote(scheduleId: string): Promise<ScheduleItem> {
		return await this.repository.update(scheduleId, { linkedNoteId: undefined });
	}

	async listByDate(date: string): Promise<ScheduleItem[]> {
		const items = await this.repository.listByDate(date);

		if (this.habitRepo) {
			const activeHabits = (await this.habitRepo.list()).filter((h) => !h.archived);
			const completions = await this.habitRepo.findCompletionsByDate(date);
			const completedIds = new Set(completions.map((c) => c.habitId));

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

	async findNextEvent(): Promise<ScheduleItem | null> {
		const now = new Date();
		const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
		const todayStr = now.toISOString().split('T')[0];

		const items = await this.listByDate(todayStr);

		// Find the first event that is scheduled for the current time or later
		const nextEvent = items
			.filter((e) => e.date === todayStr && e.time && e.time > currentTimeStr)
			.sort((a, b) => a.time!.localeCompare(b.time!))[0];

		return nextEvent;
	}
}
