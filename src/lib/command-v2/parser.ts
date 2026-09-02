import type { ParsedCommand } from './types';
import { normalizeInput, extractDateText } from './nlp';
import { classify } from './classifier';
import { extractEntities } from './entities';
import { parseExplicit } from './explicit';
export function parseCommand(input: string): ParsedCommand {
	const normalized = normalizeInput(input);
	const explicit = parseExplicit(normalized);
	if (explicit) return explicit;
	const c = classify(normalized);
	const evidence = [...c.evidence];
	const dateText = extractDateText(normalized);
	if (dateText) evidence.push({ source: 'date', value: dateText, weight: 25 });
	const top = c.score,
		second = c.alternatives[0]?.score ?? 0;
	const confidence = Math.max(0.5, Math.min(0.99, 0.55 + (top - second) / 200));
	const ambiguous = top - second < 20;
	const status = ambiguous ? 'ambiguous' : 'parsed';
	const entities = extractEntities(normalized, c.domain, c.action);
	return {
		status,
		input,
		domain: c.domain,
		action: c.action,
		entities,
		confidence,
		alternatives: c.alternatives,
		evidence,
		needsConfirmation: c.action === 'delete' || c.action === 'update' || ambiguous,
		reason: ambiguous
			? 'The input is close to another interpretation; confirm before execution.'
			: 'Default-first parsing selected todo.create unless strong action/domain evidence overrode it.'
	};
}
