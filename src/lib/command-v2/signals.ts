import type { CommandAction, CommandDomain, Evidence } from './types';
import { actionPhrases, domainKeywords, strongActions } from './registry';
import { doc } from './nlp';
const has = (input: string, phrase: string) =>
	new RegExp(`(^|\\s)${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$)`, 'i').test(
		input
	);
export function actionSignals(input: string) {
	const e: Evidence[] = [];
	// Collect strong-action matches first so we can skip duplicates in the phrase pass
	const strongMatched = new Set<string>();
	for (const action of Object.keys(strongActions) as Array<Exclude<CommandAction, 'create'>>) {
		for (const p of strongActions[action])
			if (has(input, p)) {
				e.push({ source: 'strong-action', value: p, weight: 130 });
				strongMatched.add(p.toLowerCase());
			}
	}
	// Only emit phrase/weak-action for words NOT already matched as strong-action
	for (const action of Object.keys(actionPhrases) as CommandAction[]) {
		for (const p of actionPhrases[action])
			if (!strongMatched.has(p.toLowerCase()) && has(input, p))
				e.push({
					source: action === 'create' ? 'phrase' : 'weak-action',
					value: p,
					weight: action === 'create' ? 20 : 35
				});
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
export function nlpSignals(input: string): Evidence[] {
	const verbs = doc(input).verbs();
	if (verbs.length === 0) return [];
	return [{ source: 'nlp-verb', value: verbs.text().trim(), weight: 30 }];
}
