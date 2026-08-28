import nlp from 'compromise';
import type { ParsedCommand, ParserContext, ParsedEntities } from './types';
import { normalizeInput } from './normalize';
import { detectIntent } from './intent/detect-intent';
import { extractDate } from './entities/extract-date';
import { extractTime } from './entities/extract-time';
import { extractMoney } from './entities/extract-money';
import { extractFrequency } from './entities/extract-frequency';
import { extractPerson } from './entities/extract-person';
import { extractTitle } from './entities/extract-title';
import {
  calculateConfidence,
  needsClarification,
  requiresConfirmation
} from './confidence';

export * from './types';
export * from './context';
export { normalizeInput } from './normalize';

export function parseCommand(
  input: string,
  context?: ParserContext
): ParsedCommand {
  const originalInput = input;
  const normalizedInput = normalizeInput(input);

  if (!normalizedInput) {
    return unknownResult(originalInput, normalizedInput, 'Please tell me what you want to do.');
  }

  const language = context?.language ?? 'en';

  // Compromise is the NLP analysis layer.
  // Intent is deliberately decided by HiNix rules, not by the NLP library.
  const doc = nlp(normalizedInput);

  const dateResult = extractDate(normalizedInput);
  const timeResult = extractTime(dateResult.remainingText);

  const money = extractMoney(normalizedInput);
  const frequency = extractFrequency(normalizedInput);
  const person = extractPerson(normalizedInput);

  const candidate = detectIntent(
    normalizedInput,
    language,
    context
  );

  const entities: ParsedEntities = {
    ...money,
    frequency,
    person,
    date: dateResult.date,
    time: timeResult.time,
    rawDate: dateResult.rawDate,
    rawTime: timeResult.rawTime
  };

  if (
    ['CREATE_TASK', 'CREATE_HABIT', 'CREATE_EVENT'].includes(candidate.intent)
  ) {
    entities.title = extractTitle(
      timeResult.remainingText,
      candidate.intent,
      dateResult.rawDate,
      dateResult.rawTime
    );
  }

  if (
    ['COMPLETE_TASK', 'DELETE_TASK', 'RESCHEDULE_TASK', 'COMPLETE_HABIT'].includes(
      candidate.intent
    )
  ) {
    const id = normalizedInput.match(/\b(?:task|habit)?\s*#?(\d+)\b/i);
    if (id) entities.taskId = id[1];
  }

  if (candidate.intent === 'ADD_EXPENSE') {
    entities.category = detectCategory(normalizedInput);
  }

  // Prevent unused NLP analysis from being tree-shaken away in future
  // when developers inspect/debug this pipeline.
  void doc;

  const confidence = calculateConfidence(
    candidate.intent,
    entities,
    candidate.score
  );

  const clarificationNeeded = needsClarification(
    candidate.intent,
    confidence,
    entities
  );

  return {
    intent: candidate.intent,
    confidence,
    entities,
    originalInput,
    normalizedInput,
    requiresConfirmation: requiresConfirmation(candidate.intent),
    needsClarification: clarificationNeeded,
    clarification: clarificationNeeded
      ? buildClarification(candidate.intent, entities)
      : undefined
  };
}

function detectCategory(input: string): string | undefined {
  const categories: Record<string, string[]> = {
    food: ['food', 'lunch', 'dinner', 'breakfast', 'groceries'],
    transport: ['transport', 'transportation', 'gas', 'fuel'],
    shopping: ['shopping'],
    coffee: ['coffee'],
    bills: ['bill', 'bills'],
    entertainment: ['entertainment']
  };

  const lower = input.toLowerCase();

  for (const [category, words] of Object.entries(categories)) {
    if (words.some((word) => lower.includes(word))) {
      return category;
    }
  }

  return undefined;
}

function buildClarification(
  intent: ParsedCommand['intent'],
  entities: ParsedEntities
): string {
  if (intent === 'UNKNOWN') {
    return 'I am not sure what you want me to do.';
  }

  if (
    ['CREATE_TASK', 'CREATE_HABIT', 'CREATE_EVENT'].includes(intent) &&
    !entities.title
  ) {
    if (intent === 'CREATE_TASK') return 'What task would you like to create?';
    if (intent === 'CREATE_HABIT') return 'What habit would you like to create?';
    return 'What event would you like to schedule?';
  }

  return 'Could you clarify what you want me to do?';
}

function unknownResult(
  originalInput: string,
  normalizedInput: string,
  clarification: string
): ParsedCommand {
  return {
    intent: 'UNKNOWN',
    confidence: 0,
    entities: {},
    originalInput,
    normalizedInput,
    requiresConfirmation: false,
    needsClarification: true,
    clarification
  };
}
