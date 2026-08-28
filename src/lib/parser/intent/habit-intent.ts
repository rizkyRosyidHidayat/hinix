import type { IntentCandidate } from '../types';
import { HABIT_ALIASES } from '../rules/habit-rules';

export function detectHabitIntent(input: string): IntentCandidate[] {
  const lower = input.toLowerCase();
  const candidates: IntentCandidate[] = [];

  if (matches(lower, HABIT_ALIASES.create)) {
    candidates.push({
      intent: 'CREATE_HABIT',
      score: 0.96,
      reasons: ['explicit habit create phrase']
    });
  }

  if (matches(lower, HABIT_ALIASES.list)) {
    candidates.push({
      intent: 'LIST_HABITS',
      score: 0.98,
      reasons: ['habit list phrase']
    });
  }

  if (matches(lower, HABIT_ALIASES.complete)) {
    candidates.push({
      intent: 'COMPLETE_HABIT',
      score: 0.98,
      reasons: ['habit completion phrase']
    });
  }

  if (/\b(?:every day|daily)\b/i.test(lower)) {
    candidates.push({
      intent: 'CREATE_HABIT',
      score: 0.75,
      reasons: ['habit frequency detected']
    });
  }

  return candidates;
}

function matches(input: string, aliases: string[]): boolean {
  return aliases.some((alias) => input.includes(alias));
}
