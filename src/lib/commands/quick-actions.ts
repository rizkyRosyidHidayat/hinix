import type { AutocompleteItem } from './types';

export interface QuickAction {
	label: string;
	description: string;
	command: string;
	requiresInput: boolean;
	inputPlaceholder?: string;
	/** Keywords for search matching */
	keywords?: string[];
}

const quickActions: QuickAction[] = [
	// ── Create actions ──
	{
		label: 'Create Todo',
		description: 'Add a new task to your list',
		command: 'todo add',
		requiresInput: true,
		inputPlaceholder: 'What needs to be done?',
		keywords: ['task', 'add', 'new', 'todo']
	},
	{
		label: 'Create Todo with Deadline',
		description: 'Add a new task and specify a deadline',
		command: 'todo add --deadline',
		requiresInput: true,
		inputPlaceholder: 'HH:MM Task title...',
		keywords: ['task', 'add', 'new', 'todo', 'deadline', 'time']
	},
	{
		label: 'Create Note',
		description: 'Write a new note',
		command: 'notes add',
		requiresInput: true,
		inputPlaceholder: 'Note title...',
		keywords: ['note', 'add', 'new', 'write', 'memo']
	},
	{
		label: 'Create Habit',
		description: 'Start tracking a new habit',
		command: 'habits add',
		requiresInput: true,
		inputPlaceholder: 'What habit do you want to build?',
		keywords: ['habit', 'add', 'new', 'track']
	},
	{
		label: 'Schedule Event',
		description: 'Add a new event to your schedule',
		command: 'schedule add',
		requiresInput: true,
		inputPlaceholder: 'Event title...',
		keywords: ['event', 'schedule', 'add', 'new', 'meeting', 'calendar']
	},
	{
		label: 'Add Expense',
		description: 'Record a new expense',
		command: 'budget add',
		requiresInput: true,
		inputPlaceholder: 'amount category "description"',
		keywords: ['expense', 'budget', 'money', 'spend']
	},
	{
		label: 'Add Income',
		description: 'Record income',
		command: 'budget income',
		requiresInput: true,
		inputPlaceholder: 'amount "description"',
		keywords: ['income', 'salary', 'money', 'earn']
	},

	// ── Navigation actions ──
	{
		label: 'Open Todos',
		description: 'View your task list',
		command: 'todo list',
		requiresInput: false,
		keywords: ['tasks', 'todo', 'list', 'view']
	},
	{
		label: 'Open Notes',
		description: 'Browse your notes',
		command: 'notes list',
		requiresInput: false,
		keywords: ['notes', 'memo', 'view', 'list']
	},
	{
		label: 'Open Habits',
		description: "Check today's habits",
		command: 'habits today',
		requiresInput: false,
		keywords: ['habits', 'daily', 'today', 'view']
	},
	{
		label: 'Open Schedule',
		description: "View today's events",
		command: 'schedule list',
		requiresInput: false,
		keywords: ['schedule', 'calendar', 'events', 'view']
	},
	{
		label: 'Open Budget',
		description: 'View transactions and balance',
		command: 'budget list',
		requiresInput: false,
		keywords: ['budget', 'finance', 'money', 'view']
	},
	{
		label: 'Open Dashboard',
		description: 'Go to the home dashboard',
		command: 'dashboard',
		requiresInput: false,
		keywords: ['home', 'dashboard', 'overview']
	},
	{
		label: 'Open Settings',
		description: 'Configure modules and features',
		command: 'settings',
		requiresInput: false,
		keywords: ['settings', 'config', 'preferences']
	},
	{
		label: 'Open Help',
		description: 'View available commands and usage',
		command: 'help',
		requiresInput: false,
		keywords: ['help', 'commands', 'guide', 'how']
	},

	// ── Utility actions ──
	{
		label: 'Calculate',
		description: 'Quick math calculation',
		command: 'calc',
		requiresInput: true,
		inputPlaceholder: 'e.g. 100 + 50 * 2',
		keywords: ['calc', 'math', 'calculator', 'compute']
	},
	{
		label: 'Start Timer',
		description: 'Set a countdown timer',
		command: 'timer start',
		requiresInput: true,
		inputPlaceholder: 'Duration in minutes, e.g. 25m',
		keywords: ['timer', 'countdown', 'pomodoro', 'focus']
	}
];

/**
 * Get all quick actions as AutocompleteItems.
 */
export function getQuickActions(): AutocompleteItem[] {
	return quickActions.map((action) => ({
		name: action.label,
		description: action.description,
		type: 'action' as const,
		actionCommand: action.command,
		requiresInput: action.requiresInput,
		inputPlaceholder: action.inputPlaceholder
	}));
}

/**
 * Search quick actions by query, matching against label, description, and keywords.
 */
export function searchQuickActions(query: string): AutocompleteItem[] {
	const q = query.toLowerCase();
	return quickActions
		.filter(
			(action) =>
				action.label.toLowerCase().includes(q) ||
				action.description.toLowerCase().includes(q) ||
				action.keywords?.some((k) => k.includes(q))
		)
		.map((action) => ({
			name: action.label,
			description: action.description,
			type: 'action' as const,
			actionCommand: action.command,
			requiresInput: action.requiresInput,
			inputPlaceholder: action.inputPlaceholder
		}));
}
