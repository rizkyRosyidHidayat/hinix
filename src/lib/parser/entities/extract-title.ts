import type { Intent } from '../types';

const PREFIXES = [
  /^\s*(?:please\s+)?create\s+(?:a\s+)?task\s*(?:to\s+)?/i,
  /^\s*(?:please\s+)?add\s+(?:a\s+)?task\s*(?:to\s+)?/i,
  /^\s*(?:please\s+)?new\s+task\s*(?:to\s+)?/i,
  /^\s*(?:please\s+)?make\s+(?:a\s+)?task\s*(?:to\s+)?/i,
  /^\s*(?:please\s+)?create\s+(?:a\s+)?habit\s*(?:to\s+)?/i,
  /^\s*(?:please\s+)?add\s+(?:a\s+)?habit\s*(?:to\s+)?/i,
  /^\s*(?:please\s+)?schedule\s+(?:a\s+)?/i,
  /^\s*(?:please\s+)?create\s+(?:an\s+)?event\s*(?:for\s+)?/i,
];

const LEADING_TASK_PHRASES = [
  /^(?:i\s+)?(?:need|want|have)\s+to\s+/i,
  /^(?:i\s+)?(?:should|must|need\s+to)\s+/i,
  /^remind\s+me\s+to\s+/i
];

export function extractTitle(
  input: string,
  intent: Intent,
  rawDate?: string,
  rawTime?: string
): string | undefined {
  if (
    intent !== 'CREATE_TASK' &&
    intent !== 'CREATE_HABIT' &&
    intent !== 'CREATE_EVENT'
  ) {
    return undefined;
  }

  let title = input;

  for (const prefix of PREFIXES) title = title.replace(prefix, '');
  for (const prefix of LEADING_TASK_PHRASES) title = title.replace(prefix, '');

  if (rawDate) {
    title = title.replace(new RegExp(escapeRegex(rawDate), 'i'), ' ');
  }

  if (rawTime) {
    title = title.replace(new RegExp(escapeRegex(rawTime), 'i'), ' ');
  }

  title = title
    .replace(/\b(?:tomorrow|today|yesterday)\b/gi, ' ')
    .replace(/\b(?:next week)\b/gi, ' ')
    .replace(/\b(?:at)\s*$/i, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[,;:\-\s]+|[,;:\-\s]+$/g, '')
    .trim();

  if (!title) return undefined;

  return title.charAt(0).toUpperCase() + title.slice(1);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
