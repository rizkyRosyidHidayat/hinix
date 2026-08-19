import type { CommandDefinition, CommandContext } from './types';
import { HabitService } from '../services/habit.service';

export const habitsCommand: CommandDefinition = {
	name: 'habits',
	namespace: 'habits',
	category: 'productivity',
	description: 'Manage your daily habits',
	usage: 'habits [add <name> | list | done <name> | undo <name> | today | remove <name>]',
	subcommands: [
		{ name: 'add', description: 'Create a habit', usage: 'add <name>', example: 'add exercise' },
		{ name: 'list', description: 'List habits and today\'s completion state', usage: 'list', example: 'list' },
		{
			name: 'done',
			description: 'Mark a habit as completed today',
			usage: 'done <habit>',
			example: 'done exercise',
			suggest: async (input: string, context: CommandContext) => {
				const service = new HabitService(context.repositories.habits);
				const summary = await service.getTodaySummary();
				return summary.habits.filter(h => !h.completed).map(h => ({
					name: h.habit.name,
					description: 'Not completed today',
					type: 'data' as const
				}));
			}
		},

		{
			name: 'undo',
			description: 'Undo today\'s completion',
			usage: 'undo <habit>',
			example: 'undo exercise',
			suggest: async (input: string, context: CommandContext) => {
				const service = new HabitService(context.repositories.habits);
				const summary = await service.getTodaySummary();
				return summary.habits.filter(h => h.completed).map(h => ({
					name: h.habit.name,
					description: 'Completed today',
					type: 'data' as const
				}));
			}
		},
		{ name: 'today', description: 'Show today\'s progress', usage: 'today', example: 'today' },
		{
			name: 'remove',
			description: 'Remove a habit',
			usage: 'remove <habit>',
			example: 'remove exercise',
			suggest: async (input: string, context: CommandContext) => {
				const service = new HabitService(context.repositories.habits);
				const habits = await service.listHabits();
				return habits.map(h => ({
					name: h.name,
					description: 'Active habit',
					type: 'data' as const
				}));
			}
		},
	],
	async execute(args: string[], context: CommandContext) {
		if (args.length === 0 || args[0].toLowerCase() === 'list' || args[0].toLowerCase() === 'today') {
			return { type: 'navigate', path: '/habits' };
		}

		const subCommand = args[0].toLowerCase();
		const service = new HabitService(context.repositories.habits);

		switch (subCommand) {
			case 'add': {
				const name = args.slice(1).join(' ');
				if (!name) return { type: 'error', output: 'Habit name is required. Usage: habits add <name>' };

				try {
					const habit = await service.createHabit(name);
					return { type: 'success', output: `Habit created: ${habit.name}` };
				} catch (e) {
					return { type: 'error', output: e instanceof Error ? e.message : 'Unknown error' };
				}
			}

			case 'done': {
				const habitName = args.slice(1).join(' ');
				if (!habitName) return { type: 'error', output: 'Usage:\ndone <habit>' };
				try {
					await service.completeHabit(habitName);
					return { type: 'success', output: `✓ ${habitName} completed today` };
				} catch (e) {
					if (e instanceof Error && e.message.includes('not found')) {
						return { type: 'error', output: `Habit "${habitName}" not found.\n\nTry:\n  list\n  add ${habitName}` };
					}
					return { type: 'error', output: e instanceof Error ? e.message : 'Unknown error' };
				}
			}
			case 'undo': {
				const habitName = args.slice(1).join(' ');
				if (!habitName) return { type: 'error', output: 'Usage:\nundo <habit>' };
				try {
					await service.undoHabit(habitName);
					return { type: 'success', output: `↩ ${habitName} marked incomplete` };
				} catch (e) {
					return { type: 'error', output: e instanceof Error ? e.message : 'Unknown error' };
				}
			}
			case 'remove': {
				const habitName = args.slice(1).join(' ');
				if (!habitName) return { type: 'error', output: 'Usage:\nremove <habit>' };

				// Optional: In a full CLI we would prompt.
				// Since we don't have interactive prompts wired up here yet, 
				// we just execute it directly.
				try {
					await service.removeHabit(habitName);
					return { type: 'success', output: `✓ Habit removed: ${habitName}` };
				} catch (e) {
					return { type: 'error', output: e instanceof Error ? e.message : 'Unknown error' };
				}
			}
			default:
				return { type: 'error', output: `Unknown subcommand: ${subCommand}. Type "help" for available commands.` };
		}
	}
};
