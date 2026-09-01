import type { Habit, HabitCompletion } from '../types/habit';
import { db } from '../db/database';
import { dbState } from '../stores/db.svelte';
import { syncService } from '../sync/sync.service';

export class HabitRepository {
	async create(habit: Habit): Promise<Habit> {
		await db.habits.add(habit);
		dbState.notify('habits');
		syncService.pushRow('habits', habit);
		return habit;
	}

	async update(id: string, changes: Partial<Habit>): Promise<Habit> {
		await db.habits.update(id, changes);
		dbState.notify('habits');
		const updated = await this.getById(id);
		if (!updated) throw new Error('Habit not found');
		syncService.pushRow('habits', updated);
		return updated;
	}

	async getById(id: string): Promise<Habit | undefined> {
		return db.habits.get(id);
	}

	async findByNormalizedName(normalizedName: string): Promise<Habit | undefined> {
		return db.habits.where('normalizedName').equals(normalizedName).first();
	}

	async list(): Promise<Habit[]> {
		return db.habits.toArray();
	}

	// Completion methods
	async addCompletion(completion: HabitCompletion): Promise<HabitCompletion> {
		await db.habitCompletions.add(completion);
		dbState.notify('habits');

		// Push the full habit to sync the new completion
		const habit = await this.getById(completion.habitId);
		if (habit) syncService.pushRow('habits', habit);

		return completion;
	}

	async removeCompletion(id: string): Promise<void> {
		const completion = await db.habitCompletions.get(id);
		if (completion) {
			await db.habitCompletions.delete(id);
			dbState.notify('habits');

			const habit = await this.getById(completion.habitId);
			if (habit) syncService.pushRow('habits', habit);
		}
	}

	async findCompletionsByHabit(habitId: string): Promise<HabitCompletion[]> {
		return db.habitCompletions.where('habitId').equals(habitId).toArray();
	}

	async findCompletionsByDate(date: string): Promise<HabitCompletion[]> {
		return db.habitCompletions.where('date').equals(date).toArray();
	}

	async delete(habitId: string): Promise<void> {
		await db.habits.delete(habitId);
		dbState.notify('habits');
		syncService.deleteRow('habits', habitId);
	}
}
