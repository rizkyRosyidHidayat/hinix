import type { TemporalResult } from '../types';

export function extractTime(input: string): TemporalResult {
  let remaining = input;
  let time: string | undefined;
  let rawTime: string | undefined;

  const ampm = /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i;
  const match = input.match(ampm);

  if (match) {
    let hour = Number(match[1]);
    const minute = Number(match[2] ?? 0);
    const period = match[3].toLowerCase();

    if (period === 'pm' && hour < 12) hour += 12;
    if (period === 'am' && hour === 12) hour = 0;

    time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    rawTime = match[0];
    remaining = remaining.replace(ampm, ' ');
    return { time, rawTime, remainingText: clean(remaining) };
  }

  const twentyFour = /\b(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)\b/i;
  const match24 = input.match(twentyFour);

  if (match24) {
    time = `${String(Number(match24[1])).padStart(2, '0')}:${match24[2]}`;
    rawTime = match24[0];
    remaining = remaining.replace(twentyFour, ' ');
    return { time, rawTime, remainingText: clean(remaining) };
  }

  const dayPart = /\b(?:in\s+the\s+)?(morning|afternoon|evening|night)\b/i;
  const part = input.match(dayPart);

  if (part) {
    const map: Record<string, string> = {
      morning: '09:00',
      afternoon: '14:00',
      evening: '18:00',
      night: '20:00',
    };

    time = map[part[1].toLowerCase()];
    rawTime = part[0];
    remaining = remaining.replace(dayPart, ' ');
  }

  return { time, rawTime, remainingText: clean(remaining) };
}

function clean(input: string): string {
  return input.replace(/\s+/g, ' ').replace(/\s+([,.!?])/g, '$1').trim();
}
