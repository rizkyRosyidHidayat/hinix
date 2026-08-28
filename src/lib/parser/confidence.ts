import type { Intent, ParsedEntities } from './types';

export function calculateConfidence(
  intent: Intent,
  entities: ParsedEntities,
  baseScore: number
): number {
  if (intent === 'UNKNOWN') return 0;

  let score = baseScore;

  const hasTitle = Boolean(entities.title);
  const hasDate = Boolean(entities.date);
  const hasAmount = typeof entities.amount === 'number';

  if (
    ['CREATE_TASK', 'CREATE_HABIT', 'CREATE_EVENT'].includes(intent) &&
    hasTitle
  ) {
    score += 0.04;
  }

  if (intent === 'ADD_EXPENSE' && hasAmount) {
    score += 0.05;
  }

  if (
    ['CREATE_TASK', 'CREATE_EVENT', 'RESCHEDULE_TASK'].includes(intent) &&
    hasDate
  ) {
    score += 0.01;
  }

  return Math.min(1, Number(score.toFixed(2)));
}

export function needsClarification(
  intent: Intent,
  confidence: number,
  entities: ParsedEntities
): boolean {
  if (intent === 'UNKNOWN') return true;

  if (
    ['CREATE_TASK', 'CREATE_HABIT', 'CREATE_EVENT'].includes(intent) &&
    !entities.title
  ) {
    return true;
  }

  return confidence < 0.7;
}

export function requiresConfirmation(intent: Intent): boolean {
  return ['DELETE_TASK', 'RESCHEDULE_TASK'].includes(intent);
}
