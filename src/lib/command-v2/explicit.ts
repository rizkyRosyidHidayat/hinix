import type { CommandAction, CommandDomain, ParsedCommand } from './types';
import { extractEntities } from './entities';
import { normalizeInput } from './nlp';
const aliases: Record<string, CommandDomain> = {
	todo: 'todo',
	task: 'todo',
	schedule: 'schedule',
	calendar: 'schedule',
	habit: 'habit',
	budget: 'budget',
	note: 'note'
};
const actions: Record<string, CommandAction> = {
	add: 'create',
	create: 'create',
	new: 'create',
	list: 'list',
	show: 'list',
	update: 'update',
	edit: 'update',
	change: 'update',
	delete: 'delete',
	remove: 'delete',
	cancel: 'delete'
};
export function parseExplicit(input: string): ParsedCommand | undefined {
	const p = normalizeInput(input).split(' ');
	if (p.length < 2) return;
	const domain = aliases[p[0].toLowerCase()];
	const action = actions[p[1].toLowerCase()];
	if (!domain || !action) return;
	const rest = p.slice(2).join(' ').trim();
	return {
		status: 'parsed',
		input,
		domain,
		action,
		entities: extractEntities(rest, domain, action),
		confidence: 1,
		alternatives: [],
		evidence: [{ source: 'explicit', value: `${p[0]} ${p[1]}`, weight: 1000 }],
		needsConfirmation: action === 'delete' || action === 'update',
		reason: 'Explicit HiNix command syntax matched.'
	};
}
