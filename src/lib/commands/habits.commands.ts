import type { CommandDefinition, CommandContext } from './types';
import { HabitService } from '../services/habit.service';

const service = new HabitService();

export const habitsCommand: CommandDefinition = {
	name: 'habits',
	namespace: 'habits',
	category: 'productivity',
	description: 'Manage your daily habits',
	usage: 'habits [add <name> [--deadline <[DD-MM-YYYY] HH:MM>] | list | update <name> [--deadline <[DD-MM-YYYY] HH:MM>] | done <name> | undo <name> | today | remove <name>]',
	subcommands: [
		{ name: 'add', description: 'Create a habit', usage: 'add <name> [--deadline <[DD-MM-YYYY] HH:MM>]', example: 'add exercise --deadline 09:00' },
		{ name: 'list', description: 'List habits and today\'s completion state' },
		{
			name: 'done',
			description: 'Mark a habit as completed today',
			usage: 'done <habit>',
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
			name: 'update',
			description: 'Update a habit\'s deadline',
			usage: 'update <name> [--deadline <[DD-MM-YYYY] HH:MM>]',
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
		{
			name: 'undo',
			description: 'Undo today\'s completion',
			usage: 'undo <habit>',
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
		{ name: 'today', description: 'Show today\'s progress' },
		{
			name: 'remove',
			description: 'Remove a habit',
			usage: 'remove <habit>',
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
		{ name: 'help', description: 'Show available commands' },
		{ name: 'exit', description: 'Leave habits context' }
	],
	async execute(args: string[], context: CommandContext) {
		if (args.length === 0) {
			return { type: 'navigate', path: '/habits' };
		}

		const subCommand = args[0].toLowerCase();
		const service = new HabitService(context.repositories.habits, context.repositories.schedule);

		switch (subCommand) {
			case 'add': {
				let deadline: string | undefined;

				// Parse flags
				const deadlineIndex = args.indexOf('--deadline');
				if (deadlineIndex !== -1 && deadlineIndex + 1 < args.length) {
					const part1 = args[deadlineIndex + 1];
					const part2 = deadlineIndex + 2 < args.length ? args[deadlineIndex + 2] : undefined;
					
					const timeRegex = /^([01]?\d|2[0-3]):[0-5]\d$/;
					const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
					
					let parsedDeadline = '';
					let spliceCount = 2;

					if (part1.includes(' ')) {
						 const [d, t] = part1.split(' ');
						 if (dateRegex.test(d) && timeRegex.test(t)) {
								 parsedDeadline = part1;
						 } else {
								 return { type: 'error', output: 'Invalid --deadline format. Format: [DD-MM-YYYY] HH:MM' };
						 }
					} else if (dateRegex.test(part1)) {
						if (part2 && timeRegex.test(part2)) {
							parsedDeadline = `${part1} ${part2}`;
							spliceCount = 3;
						} else {
							return { type: 'error', output: 'Time is required when specifying a date for --deadline. Format: [DD-MM-YYYY] HH:MM' };
						}
					} else if (timeRegex.test(part1)) {
						const today = new Date();
						const yyyy = today.getFullYear();
						const mm = String(today.getMonth() + 1).padStart(2, '0');
						const dd = String(today.getDate()).padStart(2, '0');
						parsedDeadline = `${dd}-${mm}-${yyyy} ${part1}`;
					} else {
						return { type: 'error', output: 'Invalid --deadline format. Format: [DD-MM-YYYY] HH:MM' };
					}
					
					deadline = parsedDeadline;
					args.splice(deadlineIndex, spliceCount);
				}

				const name = args.slice(1).join(' ');
				if (!name) return { type: 'error', output: 'Habit name is required. Usage: habits add <name> [--deadline [DD-MM-YYYY] HH:MM]' };

				try {
					const habit = await service.createHabit(name, deadline);
					return { type: 'success', output: `Habit created: ${habit.name}${deadline ? ` (Deadline: ${deadline})` : ''}` };
				} catch (e: any) {
					return { type: 'error', output: e.message };
				}
			}
			case 'list':
			case 'today': {
				const summary = await service.getTodaySummary();
				if (summary.habits.length === 0) {
					return {
						type: 'text',
						output: `NO HABITS\n\nYou haven't created any habits yet.\n\nTry:\n\n  add exercise\n  add reading`
					};
				}

				let header = 'TODAY';
				if (subCommand === 'today') {
					const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
					header = `TODAY — ${dateStr}`;
				}

				const lines = [header, ''];
				summary.habits.forEach(h => {
					lines.push(`${h.completed ? '✓' : '○'} ${h.habit.name}`);
				});
				lines.push('');
				lines.push(`${summary.completed} / ${summary.total} completed`);
				return { type: 'text', output: lines.join('\n') };
			}
			case 'update': {
				let deadline: string | undefined;

				// Parse flags
				const deadlineIndex = args.indexOf('--deadline');
				if (deadlineIndex !== -1 && deadlineIndex + 1 < args.length) {
					const part1 = args[deadlineIndex + 1];
					const part2 = deadlineIndex + 2 < args.length ? args[deadlineIndex + 2] : undefined;
					
					const timeRegex = /^([01]?\d|2[0-3]):[0-5]\d$/;
					const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
					
					let parsedDeadline = '';
					let spliceCount = 2;

					if (part1.includes(' ')) {
						 const [d, t] = part1.split(' ');
						 if (dateRegex.test(d) && timeRegex.test(t)) {
								 parsedDeadline = part1;
						 } else {
								 return { type: 'error', output: 'Invalid --deadline format. Format: [DD-MM-YYYY] HH:MM' };
						 }
					} else if (dateRegex.test(part1)) {
						if (part2 && timeRegex.test(part2)) {
							parsedDeadline = `${part1} ${part2}`;
							spliceCount = 3;
						} else {
							return { type: 'error', output: 'Time is required when specifying a date for --deadline. Format: [DD-MM-YYYY] HH:MM' };
						}
					} else if (timeRegex.test(part1)) {
						const today = new Date();
						const yyyy = today.getFullYear();
						const mm = String(today.getMonth() + 1).padStart(2, '0');
						const dd = String(today.getDate()).padStart(2, '0');
						parsedDeadline = `${dd}-${mm}-${yyyy} ${part1}`;
					} else {
						return { type: 'error', output: 'Invalid --deadline format. Format: [DD-MM-YYYY] HH:MM' };
					}
					
					deadline = parsedDeadline;
					args.splice(deadlineIndex, spliceCount);
				}

				const habitName = args.slice(1).join(' ');
				if (!habitName) return { type: 'error', output: 'Usage:\nupdate <habit> [--deadline <[DD-MM-YYYY] HH:MM>]' };
				try {
					const updated = await service.updateHabit(habitName, deadline);
					return { type: 'success', output: `Habit updated: ${updated.name}${deadline ? ` (Deadline: ${deadline})` : ' (Deadline cleared)'}` };
				} catch (e: any) {
					return { type: 'error', output: e.message };
				}
			}
			case 'done': {
				const habitName = args.slice(1).join(' ');
				if (!habitName) return { type: 'error', output: 'Usage:\ndone <habit>' };
				try {
					await service.completeHabit(habitName);
					return { type: 'success', output: `✓ ${habitName} completed today` };
				} catch (e: any) {
					if (e.message.includes('not found')) {
						return { type: 'error', output: `Habit "${habitName}" not found.\n\nTry:\n  list\n  add ${habitName}` };
					}
					return { type: 'error', output: e.message };
				}
			}
			case 'undo': {
				const habitName = args.slice(1).join(' ');
				if (!habitName) return { type: 'error', output: 'Usage:\nundo <habit>' };
				try {
					await service.undoHabit(habitName);
					return { type: 'success', output: `↩ ${habitName} marked incomplete` };
				} catch (e: any) {
					return { type: 'error', output: e.message };
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
				} catch (e: any) {
					return { type: 'error', output: e.message };
				}
			}
			case 'help': {
				return {
					type: 'text',
					output: `HABITS COMMANDS\n\nadd <name>       Create a habit\nlist             List habits\ndone <habit>     Mark habit as completed\nundo <habit>     Undo today's completion\ntoday            Show today's progress\nremove <habit>   Remove a habit\nhelp             Show available commands\nexit             Leave habits`
				};
			}
			case 'exit': {
				return { type: 'navigate', path: '/' };
			}
			default:
				return { type: 'error', output: `Unknown subcommand: ${subCommand}. Type "help" for available commands.` };
		}
	}
};
