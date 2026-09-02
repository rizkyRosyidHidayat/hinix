import nlp from 'compromise';
import type { CommandAction, CommandDomain, CommandEntities, ParseOptions } from '../types';
import { extractDate } from './dates';
import { cleanText, removePhrases } from '../utils/text';

function extractAmount(input: string): { amount?: number; currency?: string } {
	// 1. Try to find amount with currency symbol
	const currencyMatch =
		input.match(/(?:\$|usd\s*)(\d+(?:\.\d{1,2})?)/i) ||
		input.match(/(\d+(?:\.\d{1,2})?)\s*(usd|dollars?)/i);
	if (currencyMatch) {
		return { amount: Number(currencyMatch[1]), currency: 'USD' };
	}

	// 2. Try to find standalone number
	// Strip out times and dates first to avoid falsely extracting them as amounts
	const stripped = input
		.replace(/\b([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?\b/g, '') // times (HH:mm or HH:mm:ss)
		.replace(/\b\d{1,4}[-/]\d{1,2}[-/]\d{1,4}\b/g, '') // dates (DD-MM-YYYY, YYYY-MM-DD, etc)
		.replace(/\b\d{1,2}\/\d{1,2}\b/g, ''); // short dates MM/DD

	const nakedMatch = stripped.match(/\b(\d+(?:\.\d{1,2})?)\b/);
	if (nakedMatch) {
		return { amount: Number(nakedMatch[1]) };
	}

	return {};
}

function extractFrequency(input: string): string | undefined {
	const lower = input.toLowerCase();
	if (/every\s+(day|morning|evening|night)/.test(lower) || /daily/.test(lower)) return 'daily';
	if (/every\s+(weekday|weekdays)/.test(lower)) return 'weekdays';
	if (/every\s+(week|weekly)/.test(lower)) return 'weekly';
	if (/every\s+(month|monthly)/.test(lower)) return 'monthly';
	return undefined;
}

function extractDays(input: string): string[] | undefined {
	const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
	const found = days.filter((day) => new RegExp(`\\b${day}\\b`, 'i').test(input));
	return found.length ? found : undefined;
}

function extractCategory(input: string): string | undefined {
	const match = input.match(/\b(?:on|for|category)\s+([a-z][a-z\s-]{1,40})$/i);
	return match?.[1]?.trim();
}

function extractUpdateTarget(input: string): { search?: string; title?: string } {
	const toMatch = input.match(/^change\s+(.+?)\s+to\s+(.+)$/i);
	if (toMatch) return { search: toMatch[1].trim(), title: toMatch[2].trim() };

	const renameMatch = input.match(/^rename\s+(.+?)\s+to\s+(.+)$/i);
	if (renameMatch) return { search: renameMatch[1].trim(), title: renameMatch[2].trim() };

	const moveMatch = input.match(/^(?:move|reschedule)\s+(.+?)\s+(?:to|for)\s+(.+)$/i);
	if (moveMatch) return { search: moveMatch[1].trim() };

	return {};
}

export function extractEntities(
	input: string,
	domain: CommandDomain,
	action: CommandAction,
	options: ParseOptions = {}
): CommandEntities {
	const dateInfo = extractDate(input, options);
	const amountInfo = extractAmount(input);
	const frequency = extractFrequency(input);
	const days = extractDays(input);
	const updateTarget = action === 'update' ? extractUpdateTarget(input) : {};
	const doc = nlp(input);

	let remaining = dateInfo.remainingText;
	remaining = removePhrases(remaining, [
		'show my',
		'list my',
		'what do i have',
		'what do i need to do',
		'what is scheduled',
		'what’s scheduled',
		'how much did i spend',
		'delete',
		'remove',
		'cancel',
		'forget',
		'change',
		'update',
		'modify',
		'edit',
		'move',
		'rename',
		'reschedule',
		'add',
		'create',
		'make',
		'schedule',
		'set',
		'remember to',
		'remember'
	]);

	const entities: CommandEntities = {
		date: dateInfo.date,
		time: dateInfo.time,
		datetime: dateInfo.datetime,
		amount: amountInfo.amount,
		currency: amountInfo.currency,
		frequency,
		days
	};

	if (action === 'list') {
		entities.search = cleanText(remaining);
	} else if (action === 'update') {
		entities.search = updateTarget.search ?? cleanText(remaining);
		if (updateTarget.title) entities.title = updateTarget.title;
	} else if (action === 'delete') {
		entities.search = cleanText(remaining);
	} else {
		if (domain === 'budget') {
			const spent = input.match(/spent\s+(?:\$|usd\s*)?\d+(?:\.\d{1,2})?\s+on\s+(.+)/i);
			entities.category = spent?.[1]?.trim() ?? extractCategory(input);
			entities.description = doc.nouns().toSingular().out('text');
		} else {
			entities.title = cleanText(remaining);
		}
	}

	return Object.fromEntries(
		Object.entries(entities).filter(([, value]) => value !== undefined && value !== '')
	) as CommandEntities;
}
