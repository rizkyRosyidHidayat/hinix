import type { Intent, ParserContext } from './types';

export interface ActiveContext {
  intent?: Intent;
  entities: Record<string, unknown>;
  expiresAt: number;
}

const DEFAULT_TTL = 5 * 60 * 1000;

export function createContext(
  intent?: Intent,
  entities: Record<string, unknown> = {},
  ttl = DEFAULT_TTL
): ActiveContext {
  return {
    intent,
    entities,
    expiresAt: Date.now() + ttl
  };
}

export function toParserContext(context?: ActiveContext): ParserContext | undefined {
  if (!context || context.expiresAt < Date.now()) return undefined;

  return {
    activeIntent: context.intent,
    activeEntity: context.entities
  };
}

export function clearContext(): undefined {
  return undefined;
}
