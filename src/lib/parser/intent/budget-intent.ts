import type { IntentCandidate } from '../types';
import { BUDGET_ALIASES } from '../rules/budget-rules';

export function detectBudgetIntent(input: string): IntentCandidate[] {
  const lower = input.toLowerCase();
  const candidates: IntentCandidate[] = [];

  if (matches(lower, BUDGET_ALIASES.list)) {
    candidates.push({
      intent: 'LIST_EXPENSES',
      score: 0.98,
      reasons: ['expense list phrase']
    });
  }

  if (matches(lower, BUDGET_ALIASES.add)) {
    candidates.push({
      intent: 'ADD_EXPENSE',
      score: 0.85,
      reasons: ['expense phrase']
    });
  }

  if (
    /\b(?:spent|spend)\b/i.test(lower) &&
    /\d/.test(lower)
  ) {
    candidates.push({
      intent: 'ADD_EXPENSE',
      score: 0.92,
      reasons: ['expense verb + numeric amount']
    });
  }

  return candidates;
}

function matches(input: string, aliases: string[]): boolean {
  return aliases.some((alias) => input.includes(alias));
}
