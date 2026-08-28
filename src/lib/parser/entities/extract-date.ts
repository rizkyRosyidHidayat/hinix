import type { TemporalResult } from '../types';

const DAYS_EN: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6
};

function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function nextWeekday(day: number, base = new Date()): string {
  const date = new Date(base);
  const delta = (day - date.getDay() + 7) % 7 || 7;
  date.setDate(date.getDate() + delta);
  return isoDate(date);
}

export function extractDate(input: string): TemporalResult {
  const lower = input.toLowerCase();
  const now = new Date();
  let date: string | undefined;
  let rawDate: string | undefined;
  let remaining = input;

  const direct: Array<[RegExp, number, string]> = [
    [/\btoday\b/i, 0, 'today'],
    [/\btomorrow\b/i, 1, 'tomorrow'],
    [/\byesterday\b/i, -1, 'yesterday'],
  ];

  for (const [regex, offset, raw] of direct) {
    if (regex.test(lower)) {
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      date = isoDate(d);
      rawDate = raw;
      remaining = remaining.replace(regex, ' ');
      return { date, rawDate, remainingText: cleanRemaining(remaining) };
    }
  }

  const nextWeek = /\b(next week)\b/i;
  if (nextWeek.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    date = isoDate(d);
    rawDate = lower.match(nextWeek)?.[0];
    remaining = remaining.replace(nextWeek, ' ');
    return { date, rawDate, remainingText: cleanRemaining(remaining) };
  }

  const inDays = /\b(?:in)\s+(\d+)\s+(day|days)\b/i;
  const matchDays = lower.match(inDays);
  if (matchDays) {
    const d = new Date(now);
    d.setDate(d.getDate() + Number(matchDays[1]));
    date = isoDate(d);
    rawDate = matchDays[0];
    remaining = remaining.replace(inDays, ' ');
    return { date, rawDate, remainingText: cleanRemaining(remaining) };
  }

  const weekdayRegex = /\b(?:next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;
  const weekdayMatch = lower.match(weekdayRegex);
  if (weekdayMatch) {
    const name = weekdayMatch[1].toLowerCase();
    const day = DAYS_EN[name];
    date = nextWeekday(day, now);
    rawDate = weekdayMatch[0];
    remaining = remaining.replace(weekdayRegex, ' ');
    return { date, rawDate, remainingText: cleanRemaining(remaining) };
  }

  const explicit = /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/;
  const explicitMatch = lower.match(explicit);
  if (explicitMatch) {
    const d = new Date(
      Number(explicitMatch[1]),
      Number(explicitMatch[2]) - 1,
      Number(explicitMatch[3])
    );
    date = isoDate(d);
    rawDate = explicitMatch[0];
    remaining = remaining.replace(explicit, ' ');
  }

  return { date, rawDate, remainingText: cleanRemaining(remaining) };
}

function cleanRemaining(input: string): string {
  return input
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?])/g, '$1')
    .trim();
}
