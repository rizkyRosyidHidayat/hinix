import { HabitRepository } from '../repositories/habit.repository';
import type { ScheduleRepository } from '../repositories/schedule.repository';
import type { Habit, TodaySummary } from '../types/habit';

export class HabitService {
	private repository: HabitRepository;
	private scheduleRepo?: ScheduleRepository;

	constructor(repository?: HabitRepository, scheduleRepo?: ScheduleRepository) {
		this.repository = repository ?? new HabitRepository();
		this.scheduleRepo = scheduleRepo;
	}

	// Utility for today's date in YYYY-MM-DD
	private getTodayDateString(): string {
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	async createHabit(name: string, deadlineTime?: string): Promise<Habit> {
		if (!name.trim()) throw new Error('Habit name cannot be empty');

		const normalizedName = name.trim().toLowerCase();
		const existing = await this.repository.findByNormalizedName(normalizedName);
		
		if (existing && !existing.archived) {
			throw new Error(`Habit "${existing.name}" already exists.`);
		}

		const newHabit: Habit = {
			id: crypto.randomUUID(),
			name: name.trim(),
			normalizedName,
			createdAt: new Date().toISOString(),
			archived: false,
			deadlineTime
		};

		let createdHabit: Habit;
		if (existing && existing.archived) {
			// Restore archived habit instead of creating a new one
			await this.repository.update(existing.id, { archived: false, deadlineTime });
			newHabit.id = existing.id;
			createdHabit = newHabit;
		} else {
			createdHabit = await this.repository.create(newHabit);
		}

		if (deadlineTime && this.scheduleRepo) {
			const [date, time] = deadlineTime.includes(' ') ? deadlineTime.split(' ') : [deadlineTime, undefined];
			await this.scheduleRepo.create({
				id: crypto.randomUUID(),
				title: `Habit: ${newHabit.name}`,
				date,
				time,
				createdAt: new Date().toISOString(),
				linkedHabitId: createdHabit.id
			});
		}

		return createdHabit;
	}

	async updateHabit(name: string, deadlineTime?: string): Promise<Habit> {
		const normalizedName = name.trim().toLowerCase();
		const habit = await this.repository.findByNormalizedName(normalizedName);

		if (!habit || habit.archived) {
			throw new Error(`Habit "${name}" not found.`);
		}

		await this.repository.update(habit.id, { deadlineTime });
		
		if (this.scheduleRepo) {
			const linked = await this.scheduleRepo.findByLinkedHabitId(habit.id);
			if (deadlineTime) {
				const [date, time] = deadlineTime.includes(' ') ? deadlineTime.split(' ') : [deadlineTime, undefined];
				if (linked) {
					await this.scheduleRepo.update(linked.id, { date, time });
				} else {
					await this.scheduleRepo.create({
						id: crypto.randomUUID(),
						title: `Habit: ${habit.name}`,
						date,
						time,
						createdAt: new Date().toISOString(),
						linkedHabitId: habit.id
					});
				}
			} else if (linked) {
				await this.scheduleRepo.delete(linked.id);
			}
		}

		return { ...habit, deadlineTime };
	}

	async listHabits(): Promise<Habit[]> {
		const all = await this.repository.list();
		return all.filter(h => !h.archived);
	}

	async completeHabit(name: string): Promise<void> {
		const normalizedName = name.trim().toLowerCase();
		const habit = await this.repository.findByNormalizedName(normalizedName);

		if (!habit || habit.archived) {
			throw new Error(`Habit "${name}" not found.`);
		}

		const today = this.getTodayDateString();
		const completions = await this.repository.findCompletionsByHabit(habit.id);
		const existingCompletion = completions.find(c => c.date === today);

		if (existingCompletion) {
			throw new Error(`Habit "${habit.name}" is already completed today.`);
		}

		await this.repository.addCompletion({
			id: crypto.randomUUID(),
			habitId: habit.id,
			date: today,
			completedAt: new Date().toISOString()
		});
	}

	async undoHabit(name: string): Promise<void> {
		const normalizedName = name.trim().toLowerCase();
		const habit = await this.repository.findByNormalizedName(normalizedName);

		if (!habit || habit.archived) {
			throw new Error(`Habit "${name}" not found.`);
		}

		const today = this.getTodayDateString();
		const completions = await this.repository.findCompletionsByHabit(habit.id);
		const existingCompletion = completions.find(c => c.date === today);

		if (!existingCompletion) {
			throw new Error(`Habit "${habit.name}" is not completed today.`);
		}

		await this.repository.removeCompletion(existingCompletion.id);
	}

	async removeHabit(name: string): Promise<void> {
		const normalizedName = name.trim().toLowerCase();
		const habit = await this.repository.findByNormalizedName(normalizedName);

		if (!habit || habit.archived) {
			throw new Error(`Habit "${name}" not found.`);
		}

		await this.repository.update(habit.id, { archived: true });
	}

	async getTodaySummary(): Promise<TodaySummary> {
		const today = this.getTodayDateString();
		const activeHabits = await this.listHabits();
		
		const completions = await this.repository.findCompletionsByDate(today);
		const completedMap = new Map(completions.map(c => [c.habitId, c.completedAt]));

		const todayHabits = activeHabits.map(habit => {
			const completedAt = completedMap.get(habit.id);
			return {
				habit,
				completed: !!completedAt,
				completedAt
			};
		});

		const completedCount = todayHabits.filter(h => h.completed).length;

		return {
			date: today,
			total: activeHabits.length,
			completed: completedCount,
			remaining: activeHabits.length - completedCount,
			habits: todayHabits
		};
	}
}
