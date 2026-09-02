import nlp from 'compromise';
import type { CommandAction, CommandDomain, CommandEntities } from './types';
import { extractDate, cleanText, removePhrases } from './nlp';
import { actionPhrases, domains } from './registry';
// ── Amount extraction (ported from v1) ──
function extractAmount(input: string): { amount?: number; currency?: string } {
	const currencyMatch =
		input.match(/(?:\$|usd\s*)(\d+(?:\.\d{1,2})?)/i) ||
		input.match(/(\d+(?:\.\d{1,2})?)\s*(usd|dollars?)/i);
	if (currencyMatch) return { amount: Number(currencyMatch[1]), currency: 'USD' };
	const idrMatch =
		input.match(/(?:Rp\.?\s*|IDR\s*)(\d[\d,.]*)/i) ||
		input.match(/(\d[\d,.]*)\s*(?:rupiah|idr)/i);
	if (idrMatch) return { amount: Number(idrMatch[1].replace(/[,.]/g, '')), currency: 'IDR' };
	const eurMatch = input.match(/(?:€|EUR\s*)(\d+(?:\.\d{1,2})?)/i);
	if (eurMatch) return { amount: Number(eurMatch[1]), currency: 'EUR' };
	const gbpMatch = input.match(/(?:£|GBP\s*)(\d+(?:\.\d{1,2})?)/i);
	if (gbpMatch) return { amount: Number(gbpMatch[1]), currency: 'GBP' };
	// Standalone number (strip times/dates first to avoid false matches)
	const stripped = input
		.replace(/\b([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?\b/g, '')
		.replace(/\b\d{1,4}[-/]\d{1,2}[-/]\d{1,4}\b/g, '')
		.replace(/\b\d{1,2}\/\d{1,2}\b/g, '');
	const naked = stripped.match(/\b(\d+(?:\.\d{1,2})?)\b/);
	if (naked) return { amount: Number(naked[1]) };
	return {};
}
// ── Frequency extraction ──
function extractFrequency(input: string): string | undefined {
	const lower = input.toLowerCase();
	if (/every\s+(day|morning|evening|night)/.test(lower) || /daily/.test(lower)) return 'daily';
	if (/every\s+(weekday|weekdays)/.test(lower)) return 'weekdays';
	if (/every\s+(week|weekly)/.test(lower)) return 'weekly';
	if (/every\s+(month|monthly)/.test(lower)) return 'monthly';
	return undefined;
}
// ── Day-of-week extraction ──
function extractDays(input: string): string[] | undefined {
	const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
	const found = days.filter((d) => new RegExp(`\\b${d}\\b`, 'i').test(input));
	return found.length ? found : undefined;
}
// ── Category extraction ──
function extractCategory(input: string): string | undefined {
	const match = input.match(/\b(?:on|for|category)\s+([a-z][a-z\s-]{1,40})$/i);
	return match?.[1]?.trim();
}
// ── Update target extraction ("change X to Y") ──
function extractUpdateTarget(input: string): { search?: string; title?: string } {
	const toMatch = input.match(/^change\s+(.+?)\s+to\s+(.+)$/i);
	if (toMatch) return { search: toMatch[1].trim(), title: toMatch[2].trim() };
	const renameMatch = input.match(/^rename\s+(.+?)\s+to\s+(.+)$/i);
	if (renameMatch) return { search: renameMatch[1].trim(), title: renameMatch[2].trim() };
	const moveMatch = input.match(/^(?:move|reschedule)\s+(.+?)\s+(?:to|for)\s+(.+)$/i);
	if (moveMatch) return { search: moveMatch[1].trim() };
	return {};
}
// ── Main entry ──
export function extractEntities(
	input: string,
	domain: CommandDomain,
	action: CommandAction,
	options?: { hasActionEvidence?: boolean; hasDomainEvidence?: boolean }
): CommandEntities {
	const dateInfo = extractDate(input);
	const amountInfo = extractAmount(input);
	const frequency = extractFrequency(input);
	const days = extractDays(input);
	const updateTarget = action === 'update' ? extractUpdateTarget(input) : {};
	// Strip control words from the remaining text (after date removal)
	let remaining = dateInfo.remainingText;
	const phrase = [...actionPhrases[action], ...domains];
	if (action !== 'create') {
		remaining = removePhrases(remaining, phrase);
	}
	const entities: CommandEntities = {
		date: dateInfo.date,
		time: dateInfo.time,
		datetime: dateInfo.datetime,
		dateText: dateInfo.dateText,
		amount: amountInfo.amount,
		currency: amountInfo.currency,
		frequency,
		days
	};
	if (action === 'list') {
		entities.search = cleanText(remaining) || undefined;
	} else if (action === 'update') {
		entities.search = (updateTarget.search ?? cleanText(remaining)) || undefined;
		if (updateTarget.title) entities.title = updateTarget.title;
	} else if (action === 'delete') {
		entities.search = cleanText(remaining) || undefined;
	} else {
		// create
		if (domain === 'budget') {
			const spent = input.match(/spent\s+(?:\$|usd\s*)?\d+(?:\.\d{1,2})?\s+on\s+(.+)/i);
			entities.category = spent?.[1]?.trim() ?? extractCategory(input);
			entities.description = nlp(input).nouns().toSingular().out('text') || undefined;
		} else {
			const isDefaultFallback = !options?.hasActionEvidence || !options?.hasDomainEvidence;
			if (isDefaultFallback) {
				entities.title = cleanText(remaining) || undefined;
			} else {
				entities.title = cleanText(removePhrases(remaining, phrase)) || undefined;
			}
		}
	}
	// Remove undefined and empty-string entries
	return Object.fromEntries(
		Object.entries(entities).filter(([, v]) => v !== undefined && v !== '')
	) as CommandEntities;
}
