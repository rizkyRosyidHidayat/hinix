import nlp from 'compromise';
import dates from 'compromise-dates';
const parser = nlp.extend(dates);
// ── Text helpers ──
export function normalizeInput(input: string) {
	return input.trim().replace(/\s+/g, ' ');
}
export function cleanText(value: string): string {
	return value.replace(/\s+/g, ' ').trim();
}
export function removePhrases(input: string, phrases: string[]): string {
	let out = input;
	for (const p of phrases) {
		out = out.replace(new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'), ' ');
	}
	return cleanText(out);
}
// ── NLP document ──
export function doc(input: string) {
	return parser(input);
}
// ── Date extraction (ported from v1 dates.ts) ──
export interface ExtractedDate {
	date?: string;
	time?: string;
	datetime?: string;
	dateText?: string;
	remainingText: string;
}
function pad(v: number): string {
	return String(v).padStart(2, '0');
}
function formatDate(d: Date): string {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function parseRelativeDate(text: string, now: Date): Date | undefined {
	const lower = text.toLowerCase();
	const result = new Date(now);
	if (lower.includes('today')) return result;
	if (lower.includes('tomorrow')) {
		result.setDate(result.getDate() + 1);
		return result;
	}
	if (lower.includes('day after tomorrow')) {
		result.setDate(result.getDate() + 2);
		return result;
	}
	if (lower.includes('yesterday')) {
		result.setDate(result.getDate() - 1);
		return result;
	}
	const inDays = lower.match(/in\s+(\d+)\s+days?/);
	if (inDays) {
		result.setDate(result.getDate() + Number(inDays[1]));
		return result;
	}
	return undefined;
}
function parseTime(text: string): string | undefined {
	const m24 = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b(?!\s*(?:am|pm))/i);
	if (m24) return `${pad(Number(m24[1]))}:${pad(Number(m24[2]))}`;
	const m12 = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
	if (!m12) return undefined;
	let hour = Number(m12[1]);
	const minute = Number(m12[2] ?? '00');
	const meridiem = m12[3].toLowerCase();
	if (meridiem === 'pm' && hour < 12) hour += 12;
	if (meridiem === 'am' && hour === 12) hour = 0;
	return `${pad(hour)}:${pad(minute)}`;
}
export function extractDate(input: string, now = new Date()): ExtractedDate {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const d = (parser(input) as any).dates();
	const dateText = d.text().trim() || undefined;
	const time = parseTime(input);
	const relative = parseRelativeDate(input, now);
	let date: Date | undefined = relative;
	if (!date && dateText) {
		const parsed = new Date(dateText);
		if (!Number.isNaN(parsed.getTime())) date = parsed;
	}
	if (!date) {
		const m = input.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/);
		if (m) date = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
	}
	if (!date && dateText) {
		const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
		const target = weekdays.indexOf(dateText.toLowerCase());
		if (target >= 0) {
			date = new Date(now);
			const delta = (target - now.getDay() + 7) % 7 || 7;
			date.setDate(date.getDate() + delta);
		}
	}
	const dateValue = date ? formatDate(date) : undefined;
	const datetime = dateValue && time ? `${dateValue}T${time}:00` : undefined;
	// Strip temporal phrases from remaining text
	let remaining = input;
	if (dateText) remaining = remaining.replace(dateText, ' ');
	remaining = remaining.replace(/\b(today|tomorrow|yesterday|day after tomorrow)\b/gi, ' ');
	remaining = remaining.replace(/\bin\s+\d+\s+days?\b/gi, ' ');
	remaining = remaining.replace(/\bat\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi, ' ');
	remaining = remaining.replace(/\b\d{1,2}[-/]\d{1,2}[-/]\d{4}\b/gi, ' ');
	remaining = remaining.replace(/\b([01]?\d|2[0-3]):([0-5]\d)\b/gi, ' ');
	return {
		date: dateValue,
		time,
		datetime,
		dateText,
		remainingText: cleanText(remaining)
	};
}
