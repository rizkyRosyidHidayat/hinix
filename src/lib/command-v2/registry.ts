import type { CommandAction, CommandDomain } from './types';
export const domains: CommandDomain[] = ['todo', 'schedule', 'habit', 'budget', 'note'];
export const actions: CommandAction[] = ['create', 'list', 'update', 'delete'];
export const domainKeywords: Record<CommandDomain, string[]> = {
	todo: ['task', 'tasks', 'todo', 'todos', 'to do'],
	schedule: ['meeting', 'meetings', 'appointment', 'appointments', 'calendar event', 'calendar', 'schedule'],
	habit: ['habit', 'habits', 'routine', 'routines', 'every morning', 'every day', 'daily'],
	budget: ['expense', 'expenses', 'spent', 'spending', 'budget', 'income', 'paid', 'payment'],
	note: ['take a note', 'write a note', 'save a note', 'make a note', 'memo', 'note']
};
export const actionPhrases: Record<CommandAction, string[]> = {
	create: ['create', 'add', 'make', 'set', 'new', 'remind me to', 'remember to', 'remember'],
	delete: ['delete', 'remove', 'cancel', 'clear', 'erase', 'forget'],
	update: ['update', 'change', 'edit', 'move', 'reschedule', 'rename', 'modify'],
	list: ['list', 'show', 'display', 'view', 'see', 'what do i have', 'what do i need to do', 'what is scheduled', 'what is', 'show my', 'list my', 'how much did i spend']
};
export const strongActions: Record<Exclude<CommandAction, 'create'>, string[]> = {
	list: ['list', 'show', 'display', 'what do i have', 'what are my'],
	update: ['update', 'change', 'edit', 'move', 'reschedule', 'rename'],
	delete: ['delete', 'remove', 'cancel', 'clear']
};
