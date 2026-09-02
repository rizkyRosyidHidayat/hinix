import type { CommandAction, CommandDomain, Evidence } from './types';
import { domains, domainKeywords, actionPhrases } from './registry';
import { actionSignals, domainSignals, nlpSignals } from './signals';
const domainMap = domainKeywords;
function actionOf(value: string): CommandAction {
	const v = value.toLowerCase();
	for (const action of Object.keys(actionPhrases) as CommandAction[]) {
		if (actionPhrases[action].includes(v)) return action;
	}
	return 'create';
}
export interface Classification {
	domain: CommandDomain;
	action: CommandAction;
	score: number;
	evidence: Evidence[];
	/** Total weight of all non-default evidence (0 means only baseline matched). */
	evidenceWeight: number;
	/** Whether the NLP layer detected at least one verb in the input. */
	hasVerb: boolean;
	/** Whether any domain keyword signals were found. */
	hasDomainEvidence: boolean;
	/** Whether any non-default action signals were found (phrase, weak-action, strong-action). */
	hasActionEvidence: boolean;
	/** Score gap between top domain and second-best domain. */
	domainGap: number;
	/** Score gap between top action and second-best action. */
	actionGap: number;
	/** Whether the second-best domain had actual evidence (score > 100). */
	hasCompetingDomain: boolean;
	/** Whether the second-best action had actual evidence. */
	hasCompetingAction: boolean;
	alternatives: Array<{ domain: CommandDomain; action: CommandAction; score: number }>;
}
export function classify(input: string): Classification {
	const ds = domainSignals(input),
		as = actionSignals(input),
		ns = nlpSignals(input);
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
		const a = actionOf(e.value);
		const row = actionScores.find((x) => x[0] === a)!;
		row[1] += e.weight;
		row[2].push(e);
	}
	actionScores.sort((a, b) => b[1] - a[1]);
	const d = domainScores[0],
		a = actionScores[0];
	const domainGap = d.score - (domainScores[1]?.score ?? 0);
	const actionGap = a[1] - (actionScores[1]?.[1] ?? 0);
	const hasCompetingDomain = (domainScores[1]?.score ?? 0) > 100;
	// actionScores[1] has evidence if it's 'create' (base 100) and > 100, or not 'create' (base 0) and > 0
	const hasCompetingAction =
		actionScores[1] !== undefined &&
		actionScores[1][1] > (actionScores[1][0] === 'create' ? 100 : 0);
	const alternatives = domainScores
		.flatMap((x) =>
			actionScores.map((y) => ({ domain: x.domain, action: y[0], score: x.score + y[1] - 100 }))
		)
		.filter((x) => !(x.domain === d.domain && x.action === a[0]))
		.sort((x, y) => y.score - x.score)
		.slice(0, 3);
	const allEvidence = [...d.evidence, ...a[2], ...ns];
	// Evidence weight excludes the built-in 'default' baseline (weight 100)
	const evidenceWeight = allEvidence
		.filter((e) => e.source !== 'default')
		.reduce((s, e) => s + e.weight, 0);
	return {
		domain: d.domain,
		action: a[0],
		score: d.score + a[1] - 100,
		evidence: allEvidence,
		evidenceWeight,
		hasVerb: ns.length > 0,
		hasDomainEvidence: ds.length > 0,
		hasActionEvidence: as.length > 0,
		domainGap,
		actionGap,
		hasCompetingDomain,
		hasCompetingAction,
		alternatives
	};
}
