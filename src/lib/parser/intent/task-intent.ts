import type { IntentCandidate, Language } from '../types';
import { TASK_ALIASES, TASK_ACTION_VERBS } from '../rules/task-rules';

export function detectTaskIntent(
  input: string,
  language: Language
): IntentCandidate[] {
  const lower = input.toLowerCase();
  const candidates: IntentCandidate[] = [];

  if (matchesAny(lower, TASK_ALIASES.create)) {
    candidates.push({
      intent: 'CREATE_TASK',
      score: 0.95,
      reasons: ['explicit task create phrase']
    });
  }

  if (matchesAny(lower, TASK_ALIASES.list)) {
    candidates.push({
      intent: 'LIST_TASKS',
      score: 0.98,
      reasons: ['task list phrase']
    });
  }

  if (matchesAny(lower, TASK_ALIASES.complete)) {
    candidates.push({
      intent: 'COMPLETE_TASK',
      score: 0.98,
      reasons: ['task completion phrase']
    });
  }

  if (matchesAny(lower, TASK_ALIASES.delete)) {
    candidates.push({
      intent: 'DELETE_TASK',
      score: 0.99,
      reasons: ['task delete phrase']
    });
  }

  if (matchesAny(lower, TASK_ALIASES.reschedule)) {
    candidates.push({
      intent: 'RESCHEDULE_TASK',
      score: 0.98,
      reasons: ['task reschedule phrase']
    });
  }

  const verbs = TASK_ACTION_VERBS[language];
  const startsWithAction = verbs.some((verb) =>
    new RegExp(`^${escapeRegex(verb)}\\b`, 'i').test(lower)
  );

  if (startsWithAction) {
    candidates.push({
      intent: 'CREATE_TASK',
      score: 0.82,
      reasons: ['recognized task action verb']
    });
  }

  if (/^(?:i\s+need\s+to|i\s+have\s+to|i\s+should|remind\s+me\s+to)\b/i.test(lower)) {
    candidates.push({
      intent: 'CREATE_TASK',
      score: 0.86,
      reasons: ['task-like natural language']
    });
  }

  return candidates;
}

function matchesAny(input: string, aliases: string[]): boolean {
  return aliases.some((alias) => input.includes(alias));
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
