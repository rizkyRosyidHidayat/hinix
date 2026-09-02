import nlp from 'compromise';
import dates from 'compromise-dates';
const parser = nlp.extend(dates);
export function normalizeInput(input: string) {
	return input.trim().replace(/\s+/g, ' ');
}
export function doc(input: string) {
	return parser(input);
}
export function extractDateText(input: string) {
	const d = doc(input).dates();
	const text = d.text().trim();
	return text || undefined;
}
export function extractNumbers(input: string) {
	return doc(input).numbers().out('array') as Array<{ number: number; text: string }>;
}
