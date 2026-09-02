import type { CommandAction, CommandDomain, Evidence } from './types';
import { domains } from './registry';
import { actionSignals, domainSignals } from './signals';
const domainMap: Record<CommandDomain, string[]> = {
	todo: ['task', 'tasks', 'todo', 'todos', 'to do'],
	schedule: ['meeting', 'meetings', 'appointment', 'appointments', 'calendar event', 'calendar'],
	habit: ['habit', 'habits', 'routine', 'routines', 'every morning', 'every day', 'daily'],
	budget: ['expense', 'expenses', 'spent', 'spending', 'budget', 'income', 'paid', 'payment'],
	note: ['take a note', 'write a note', 'save a note', 'make a note', 'memo', 'note']
};
function actionOf(value: string): CommandAction {
	const v = value.toLowerCase();
	if (v === 'list' || v === 'show' || v === 'display' || v.startsWith('what do')) return 'list';
	if (
		v === 'update' ||
		v === 'change' ||
		v === 'edit' ||
		v === 'move' ||
		v === 'reschedule' ||
		v === 'rename'
	)
		return 'update';
	return 'delete';
}
export interface Classification {
	domain: CommandDomain;
	action: CommandAction;
	score: number;
	evidence: Evidence[];
	alternatives: Array<{ domain: CommandDomain; action: CommandAction; score: number }>;
}
export function classify(input: string): Classification {
	const ds = domainSignals(input),
		as = actionSignals(input);
	const domainScores = domains
		.map((domain) => ({
			domain,
			score:
				100 +
				ds.filter((e) => domainMap[domain].includes(e.value)).reduce((s, e) => s + e.weight, 0),
			evidence: ds.filter((e) => domainMap[domain].includes(e.value))
		}))
		.sort((a, b) => b.score - a.score);
	const actionScores: [CommandAction, number, Evidence[]][] = [
		['create', 100, [{ source: 'default', value: 'todo.create default', weight: 100 }]],
		['list', 0, []],
		['update', 0, []],
		['delete', 0, []]
	];
	for (const e of as) {
		if (e.source === 'strong-action') {
			const a = actionOf(e.value);
			const row = actionScores.find((x) => x[0] === a)!;
			row[1] += e.weight;
			row[2].push(e);
		}
	}
	actionScores.sort((a, b) => b[1] - a[1]);
	const d = domainScores[0],
		a = actionScores[0];
	const alternatives = domainScores
		.flatMap((x) =>
			actionScores.map((y) => ({ domain: x.domain, action: y[0], score: x.score + y[1] - 100 }))
		)
		.filter((x) => !(x.domain === d.domain && x.action === a[0]))
		.sort((x, y) => y.score - x.score)
		.slice(0, 3);
	return {
		domain: d.domain,
		action: a[0],
		score: d.score + a[1] - 100,
		evidence: [...d.evidence, ...a[2]],
		alternatives
	};
}
