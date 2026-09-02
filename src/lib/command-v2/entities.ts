import type { CommandAction, CommandDomain, CommandEntities } from './types';
import { extractDateText, extractNumbers } from './nlp';
export function extractEntities(
	input: string,
	domain: CommandDomain,
	action: CommandAction
): CommandEntities {
	const dateText = extractDateText(input);
	let rest = input;
	if (dateText)
		rest = rest
			.replace(new RegExp(dateText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), ' ')
			.replace(/\s+/g, ' ')
			.trim();
	if (domain === 'budget') {
		const n = extractNumbers(input)[0];
		const currency = input.match(/(?:[$€£]|USD|EUR|GBP|IDR|Rp)\s*([\d,.]+)/i);
		return {
			amount: n?.number ?? (currency ? Number(currency[1].replace(/,/g, '')) : undefined),
			currency: currency?.[0]?.replace(/[\d,.\s]/g, '').toUpperCase(),
			category: rest.replace(/(?:spent|paid|expense|on)\b/gi, '').trim() || undefined,
			dateText
		};
	}
	const cleaned = action === 'create' ? rest : stripControl(rest, action);
	return action === 'create' ? { title: cleaned, dateText } : { search: cleaned, dateText };
}
function stripControl(s: string, action: CommandAction) {
	const words =
		{
			delete: ['delete', 'remove', 'cancel', 'clear'],
			update: ['update', 'change', 'edit', 'move', 'reschedule', 'rename'],
			list: ['list', 'show', 'display']
		}[action] ?? [];
	let out = s;
	for (const w of words) out = out.replace(new RegExp(`^${w}\\s+`, 'i'), '');
	return out.trim();
}
