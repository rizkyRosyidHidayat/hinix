import nlp from 'compromise';
import dates from 'compromise-dates';
import type { ParseOptions } from '../types';
import { cleanText } from '../utils/text';

// compromise-dates is a plugin for compromise. Keeping date handling in its
// own module makes it easy to swap date parsing later without touching intent logic.
nlp.extend(dates);

export interface ExtractedDate {
  date?: string;
  time?: string;
  datetime?: string;
  remainingText: string;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
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
  const match = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (!match) return undefined;

  let hour = Number(match[1]);
  const minute = Number(match[2] ?? '00');
  const meridiem = match[3].toLowerCase();

  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;

  return `${pad(hour)}:${pad(minute)}`;
}

export function extractDate(input: string, options: ParseOptions = {}): ExtractedDate {
  const now = options.now ?? new Date();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = nlp(input) as any;
  const dateText = doc.dates().text();
  const time = parseTime(input);
  const relative = parseRelativeDate(input, now);

  // compromise-dates is consulted first. Relative parsing below is a small
  // deterministic fallback for expressions that vary between plugin versions.
  let date: Date | undefined = relative;

  if (!date && dateText) {
    const parsed = new Date(dateText);
    if (!Number.isNaN(parsed.getTime())) date = parsed;
  }

  if (!date && dateText) {
    const weekday = dateText.toLowerCase();
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const target = weekdays.indexOf(weekday);
    if (target >= 0) {
      date = new Date(now);
      const delta = (target - now.getDay() + 7) % 7 || 7;
      date.setDate(date.getDate() + delta);
    }
  }

  const dateValue = date ? formatDate(date) : undefined;
  const datetime = dateValue && time ? `${dateValue}T${time}:00` : undefined;

  // Remove only recognized temporal phrases. The remaining text is later used
  // as the title/search phrase, so this step is intentionally conservative.
  let remainingText = input;
  if (dateText) remainingText = remainingText.replace(dateText, ' ');
  remainingText = remainingText.replace(/\b(today|tomorrow|yesterday|day after tomorrow)\b/gi, ' ');
  remainingText = remainingText.replace(/\bin\s+\d+\s+days?\b/gi, ' ');
  remainingText = remainingText.replace(/\bat\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi, ' ');

  return {
    date: dateValue,
    time,
    datetime,
    remainingText: cleanText(remainingText)
  };
}
