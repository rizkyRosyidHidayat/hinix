export interface Habit {
	id: string;
	name: string;
	normalizedName: string;
	createdAt: string;
	archived: boolean;
	interval?: 'everyday' | 'weekday' | 'weekend';
}

export interface HabitCompletion {
	id: string;
	habitId: string;
	date: string;
	completedAt: string;
}

export interface TodayHabit {
	habit: Habit;
	completed: boolean;
	completedAt?: string;
}

export interface TodaySummary {
	date: string;
	total: number;
	completed: number;
	remaining: number;
	habits: TodayHabit[];
}
