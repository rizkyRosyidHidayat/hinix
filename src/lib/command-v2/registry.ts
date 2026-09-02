import type { CommandAction, CommandDomain } from './types';
export const domains: CommandDomain[] = ['todo', 'schedule', 'habit', 'budget', 'note'];
export const actions: CommandAction[] = ['create', 'list', 'update', 'delete'];
export const domainKeywords: Record<CommandDomain, string[]> = {
	todo: ['task', 'tasks', 'todo', 'todos', 'to do'],
	schedule: ['meeting', 'meetings', 'appointment', 'appointments', 'calendar event', 'calendar'],
	habit: ['habit', 'habits', 'routine', 'routines', 'every morning', 'every day', 'daily'],
	budget: ['expense', 'expenses', 'spent', 'spending', 'budget', 'income', 'paid', 'payment'],
	note: ['take a note', 'write a note', 'save a note', 'make a note', 'memo', 'note']
};
export const actionPhrases: Record<CommandAction, string[]> = {
	create: ['create', 'add', 'make', 'new', 'remind me to'],
	list: ['list', 'show', 'display', 'what do i have', 'what are my'],
	update: ['update', 'change', 'edit', 'move', 'reschedule', 'rename'],
	delete: ['delete', 'remove', 'cancel', 'clear']
};
export const strongActions: Record<Exclude<CommandAction, 'create'>, string[]> = {
	list: ['list', 'show', 'display', 'what do i have', 'what are my'],
	update: ['update', 'change', 'edit', 'move', 'reschedule', 'rename'],
	delete: ['delete', 'remove', 'cancel', 'clear']
};
