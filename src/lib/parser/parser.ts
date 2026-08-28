import { normalize } from './normalizer';
import { detectIntent } from './intent-detector';
import type { ParsedIntent } from './types';

export function parseSmartCommand(input: string): ParsedIntent {
  const normalized = normalize(input);
  if (!normalized) {
    return {
      intent: 'UNKNOWN',
      confidence: 0,
      entities: {},
      originalInput: input,
    };
  }

  return detectIntent(normalized, input);
}
