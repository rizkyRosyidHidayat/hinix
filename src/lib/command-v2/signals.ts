import type { CommandAction, CommandDomain, Evidence } from './types';
import { actionPhrases, domainKeywords, strongActions } from './registry';
const has = (input: string, phrase: string) =>
	new RegExp(`(^|\\s)${phrase.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}(?=\\s|$)`, 'i').test(
		input
	) || input.toLowerCase().includes(phrase.toLowerCase());
export function actionSignals(input: string) {
	const e: Evidence[] = [];
	for (const action of Object.keys(actionPhrases) as CommandAction[]) {
		for (const p of actionPhrases[action])
			if (has(input, p))
				e.push({
					source: action === 'create' ? 'phrase' : 'weak-action',
					value: p,
					weight: action === 'create' ? 20 : 35
				});
	}
	for (const action of Object.keys(strongActions) as Array<Exclude<CommandAction, 'create'>>) {
		for (const p of strongActions[action])
			if (has(input, p)) e.push({ source: 'strong-action', value: p, weight: 130 });
	}
	return e;
}
export function domainSignals(input: string) {
	const e: Evidence[] = [];
	for (const domain of Object.keys(domainKeywords) as CommandDomain[]) {
		for (const p of domainKeywords[domain])
			if (has(input, p))
				e.push({
					source: domain === 'todo' ? 'weak-domain' : 'strong-domain',
					value: p,
					weight: domain === 'todo' ? 15 : 120
				});
	}
	return e;
}
