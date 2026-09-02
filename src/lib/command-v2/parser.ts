import type { ParsedCommand, ParseStatus } from './types';
import { normalizeInput, extractDate } from './nlp';
import { classify } from './classifier';
import { extractEntities } from './entities';
import { parseExplicit } from './explicit';
export function parseCommand(input: string): ParsedCommand {
	const normalized = normalizeInput(input);
	const explicit = parseExplicit(normalized);
	if (explicit) return explicit;
	const c = classify(normalized);
	const evidence = [...c.evidence];
	const dateInfo = extractDate(normalized);
	if (dateInfo.dateText) evidence.push({ source: 'date', value: dateInfo.dateText, weight: 25 });
	// Invalid: no real evidence at all (only baseline default) and NLP found no verb
	const isInvalid = c.evidenceWeight === 0 && !c.hasVerb && !dateInfo.dateText;
	// Ambiguous: the classifier found competing evidence for domain or action
	// but the top two are close, so the user should pick one.
	// NOT ambiguous when there's no domain/action evidence (that's just defaulting).
	const ambiguous =
		!isInvalid &&
		((c.hasCompetingDomain && c.domainGap < 20) ||
			(c.hasCompetingAction && c.actionGap < 20));
	// Confidence formula: base from gap + bonus from evidence weight
	// Guard against NaN with fallback to 0
	const gap = Math.max(0, c.domainGap + c.actionGap);
	const gapComponent = Math.min(gap / 400, 0.44);
	const evidenceComponent = Math.min(c.evidenceWeight / 300, 0.45);
	const rawConfidence = 0.1 + gapComponent + evidenceComponent;
	const confidence = isInvalid ? 0 : Math.max(0.1, Math.min(0.99, rawConfidence)) || 0;
	const status: ParseStatus = isInvalid ? 'invalid' : ambiguous ? 'ambiguous' : 'parsed';
	const entities = extractEntities(normalized, c.domain, c.action, {
		hasActionEvidence: c.hasActionEvidence,
		hasDomainEvidence: c.hasDomainEvidence
	});
	return {
		status,
		input,
		domain: c.domain,
		action: c.action,
		entities,
		confidence,
		alternatives: c.alternatives,
		evidence,
		needsConfirmation: isInvalid || c.action === 'delete' || c.action === 'update' || ambiguous,
		reason: isInvalid
			? 'The input could not be understood as a valid command.'
			: ambiguous
				? 'Multiple interpretations found; please select the correct one.'
				: 'Default-first parsing selected todo.create unless strong action/domain evidence overrode it.'
	};
}
