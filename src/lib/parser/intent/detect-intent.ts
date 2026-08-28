import type { IntentCandidate, Language, ParserContext } from '../types';
import { detectTaskIntent } from './task-intent';
import { detectHabitIntent } from './habit-intent';
import { detectBudgetIntent } from './budget-intent';
import { detectScheduleIntent } from './schedule-intent';

export function detectIntent(
  input: string,
  language: Language,
  context?: ParserContext
): IntentCandidate {
  const candidates: IntentCandidate[] = [
    ...detectTaskIntent(input, language),
    ...detectHabitIntent(input),
    ...detectBudgetIntent(input),
    ...detectScheduleIntent(input)
  ];

  if (context?.activeIntent) {
    const contextual = candidates.find(
      (candidate) => candidate.intent === context.activeIntent
    );

    if (contextual) {
      contextual.score = Math.min(1, contextual.score + 0.05);
    } else if (context.activeIntent === 'CREATE_TASK') {
      candidates.push({
        intent: 'CREATE_TASK',
        score: 0.72,
        reasons: ['active task context']
      });
    } else if (context.activeIntent === 'CREATE_HABIT') {
      candidates.push({
        intent: 'CREATE_HABIT',
        score: 0.72,
        reasons: ['active habit context']
      });
    } else if (context.activeIntent === 'CREATE_EVENT') {
      candidates.push({
        intent: 'CREATE_EVENT',
        score: 0.72,
        reasons: ['active event context']
      });
    }
  }

  if (candidates.length === 0) {
    return {
      intent: 'UNKNOWN',
      score: 0,
      reasons: ['no matching intent']
    };
  }

  candidates.sort((a, b) => b.score - a.score);

  return candidates[0];
}
