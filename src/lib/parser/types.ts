export type Language = 'en';

export type Intent =
  | 'CREATE_TASK'
  | 'LIST_TASKS'
  | 'COMPLETE_TASK'
  | 'DELETE_TASK'
  | 'RESCHEDULE_TASK'
  | 'CREATE_HABIT'
  | 'LIST_HABITS'
  | 'COMPLETE_HABIT'
  | 'ADD_EXPENSE'
  | 'LIST_EXPENSES'
  | 'CREATE_EVENT'
  | 'LIST_EVENTS'
  | 'UNKNOWN';

export interface ParserContext {
  language?: Language;
  activeIntent?: Intent;
  activeEntity?: Record<string, unknown>;
}

export interface ParsedEntities {
  title?: string;
  taskId?: string;
  date?: string;
  time?: string;
  amount?: number;
  currency?: string;
  category?: string;
  frequency?: string;
  person?: string;
  rawDate?: string;
  rawTime?: string;
}

export interface ParsedCommand {
  intent: Intent;
  confidence: number;
  entities: ParsedEntities;
  originalInput: string;
  normalizedInput: string;
  requiresConfirmation: boolean;
  needsClarification: boolean;
  clarification?: string;
}

export interface TemporalResult {
  date?: string;
  time?: string;
  rawDate?: string;
  rawTime?: string;
  remainingText: string;
}

export interface IntentCandidate {
  intent: Intent;
  score: number;
  reasons: string[];
}
