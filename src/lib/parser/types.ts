// All supported intents for the HiNix smart parser.
// Settings commands (theme, enable, disable, sync) are excluded — handled only by legacy parser.

export type Intent =
  | 'UNKNOWN'
  // ── Todo ──
  | 'CREATE_TASK'
  | 'LIST_TASKS'
  | 'VIEW_TASK'
  | 'COMPLETE_TASK'
  | 'UNCOMPLETE_TASK'
  | 'UPDATE_TASK'
  | 'DELETE_TASK'
  // ── Notes ──
  | 'CREATE_NOTE'
  | 'LIST_NOTES'
  | 'VIEW_NOTE'
  | 'UPDATE_NOTE'
  | 'DELETE_NOTE'
  | 'PIN_NOTE'
  | 'UNPIN_NOTE'
  // ── Budget ──
  | 'ADD_EXPENSE'
  | 'ADD_INCOME'
  | 'LIST_TRANSACTIONS'
  // ── Schedule ──
  | 'CREATE_EVENT'
  | 'LIST_EVENTS'
  | 'UPDATE_EVENT'
  | 'DELETE_EVENT'
  // ── Habits ──
  | 'CREATE_HABIT'
  | 'LIST_HABITS'
  | 'COMPLETE_HABIT'
  | 'UNCOMPLETE_HABIT'
  | 'SHOW_HABITS_TODAY'
  | 'REMOVE_HABIT'
  // ── Timer ──
  | 'START_TIMER'
  | 'STOP_TIMER'
  | 'PAUSE_TIMER'
  | 'RESUME_TIMER'
  // ── Calculator ──
  | 'CALCULATE'
  // ── Navigation ──
  | 'GO_DASHBOARD'
  | 'GO_HELP'
  | 'GO_ABOUT';

export interface ParsedIntent {
  intent: Intent;
  confidence: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entities: Record<string, any>;
  originalInput: string;
  /** Shown to user when intent is UNKNOWN */
  recommendations?: string[];
}
