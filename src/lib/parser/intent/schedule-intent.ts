import type { IntentCandidate } from '../types';
import { SCHEDULE_ALIASES } from '../rules/schedule-rules';

export function detectScheduleIntent(input: string): IntentCandidate[] {
  const lower = input.toLowerCase();
  const candidates: IntentCandidate[] = [];

  if (matches(lower, SCHEDULE_ALIASES.list)) {
    candidates.push({
      intent: 'LIST_EVENTS',
      score: 0.98,
      reasons: ['schedule list phrase']
    });
  }

  if (
    matches(lower, SCHEDULE_ALIASES.create) ||
    /\b(?:meeting|appointment|meetup|schedules|events)\b/i.test(lower)
  ) {
    candidates.push({
      intent: 'CREATE_EVENT',
      score: 0.88,
      reasons: ['schedule/event phrase']
    });
  }

  return candidates;
}

function matches(input: string, aliases: string[]): boolean {
  return aliases.some((alias) => input.includes(alias));
}
