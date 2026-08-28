import type { Intent, ParsedIntent } from './types';
import nlp from './nlp';

// ─── Types ───────────────────────────────────────────────────────────────────

interface IntentRule {
  intent: Intent;
  /** compromise .match() patterns — first match wins within each layer */
  patterns: string[];
  confidence: number;
  /** Extract entities from the *original* doc. Return key/value pairs. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extract: (doc: any, input: string) => Record<string, any>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Strip a matched prefix from the input and return the remainder as the entity */
function titleAfterMatch(input: string, prefixPatterns: RegExp[]): string {
  for (const p of prefixPatterns) {
    const m = input.match(p);
    if (m) return input.slice(m[0].length).trim();
  }
  return input;
}

/** Extract date/time from a compromise document using compromise-dates */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractDate(doc: any): string | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dates = (doc as any).dates().get();
    if (dates && dates.length > 0) {
      return dates[0].start || undefined;
    }
  } catch {
    // compromise-dates not loaded or no dates found
  }
  return undefined;
}

/** Remove date-related text from a string to isolate the title */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function removeDateText(doc: any, input: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dateText = (doc as any).dates().text();
    if (dateText) {
      return input.replace(dateText, '').replace(/\s+/g, ' ').trim();
    }
  } catch {
    // no-op
  }
  return input;
}

/** Parse amounts like 50k, 50000, 50.5k */
function parseAmount(raw: string): string {
  const lower = raw.toLowerCase().replace(/,/g, '');
  if (lower.endsWith('k')) {
    return String(parseFloat(lower.replace('k', '')) * 1000);
  }
  if (lower.endsWith('m')) {
    return String(parseFloat(lower.replace('m', '')) * 1000000);
  }
  return lower;
}

/** Parse timer duration from natural text. Returns minutes. */
function parseDuration(input: string): number | undefined {
  // "25m", "25min", "25 minutes", "25 mins"
  const m = input.match(/(\d+)\s*(?:m(?:in(?:ute)?s?)?)\b/i);
  if (m) return parseInt(m[1], 10);
  // "1h", "1 hour", "1.5 hours"
  const h = input.match(/([\d.]+)\s*(?:h(?:(?:ou)?rs?)?)\b/i);
  if (h) return Math.round(parseFloat(h[1]) * 60);
  // "1h30m"
  const hm = input.match(/(\d+)\s*h\s*(\d+)\s*m/i);
  if (hm) return parseInt(hm[1], 10) * 60 + parseInt(hm[2], 10);
  return undefined;
}

// ─── Intent Rules ────────────────────────────────────────────────────────────
// Ordered by confidence (highest first). Within the same confidence, first match wins.

const rules: IntentRule[] = [
  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  LAYER 1 — Exact Commands (Confidence 1.0)                            ║
  // ╚══════════════════════════════════════════════════════════════════════════╝

  // ── Todo ──
  {
    intent: 'CREATE_TASK',
    patterns: ['create task .', 'create task .+'],
    confidence: 1.0,
    extract: (_doc, input) => ({
      title: titleAfterMatch(input, [/^create\s+task\s+/i]),
    }),
  },
  {
    intent: 'LIST_TASKS',
    patterns: ['show my tasks', 'list tasks', 'list my tasks', 'show tasks'],
    confidence: 1.0,
    extract: () => ({}),
  },
  {
    intent: 'VIEW_TASK',
    patterns: ['view task .', 'show task .'],
    confidence: 1.0,
    extract: (_doc, input) => ({
      id: titleAfterMatch(input, [/^(?:view|show)\s+task\s+/i]),
    }),
  },
  {
    intent: 'COMPLETE_TASK',
    patterns: ['complete task .', 'finish task .'],
    confidence: 1.0,
    extract: (_doc, input) => ({
      id: titleAfterMatch(input, [/^(?:complete|finish)\s+task\s+/i]),
    }),
  },
  {
    intent: 'UNCOMPLETE_TASK',
    patterns: ['undo task .', 'uncomplete task .', 'unmark task .'],
    confidence: 1.0,
    extract: (_doc, input) => ({
      id: titleAfterMatch(input, [/^(?:undo|uncomplete|unmark)\s+task\s+/i]),
    }),
  },
  {
    intent: 'UPDATE_TASK',
    patterns: ['update task .', 'edit task .'],
    confidence: 1.0,
    extract: (_doc, input) => ({
      id: titleAfterMatch(input, [/^(?:update|edit)\s+task\s+/i]),
    }),
  },
  {
    intent: 'DELETE_TASK',
    patterns: ['delete task .', 'remove task .'],
    confidence: 1.0,
    extract: (_doc, input) => ({
      id: titleAfterMatch(input, [/^(?:delete|remove)\s+task\s+/i]),
    }),
  },

  // ── Notes ──
  {
    intent: 'CREATE_NOTE',
    patterns: ['create note .', 'create note .+'],
    confidence: 1.0,
    extract: (_doc, input) => ({
      title: titleAfterMatch(input, [/^create\s+note\s+/i]),
    }),
  },
  {
    intent: 'LIST_NOTES',
    patterns: ['show my notes', 'list notes', 'list my notes', 'show notes', 'open notes'],
    confidence: 1.0,
    extract: () => ({}),
  },
  {
    intent: 'VIEW_NOTE',
    patterns: ['view note .', 'open note .', 'show note .'],
    confidence: 1.0,
    extract: (_doc, input) => ({
      id: titleAfterMatch(input, [/^(?:view|open|show)\s+note\s+/i]),
    }),
  },
  {
    intent: 'UPDATE_NOTE',
    patterns: ['update note .', 'edit note .'],
    confidence: 1.0,
    extract: (_doc, input) => ({
      id: titleAfterMatch(input, [/^(?:update|edit)\s+note\s+/i]),
    }),
  },
  {
    intent: 'DELETE_NOTE',
    patterns: ['delete note .', 'remove note .'],
    confidence: 1.0,
    extract: (_doc, input) => ({
      id: titleAfterMatch(input, [/^(?:delete|remove)\s+note\s+/i]),
    }),
  },
  {
    intent: 'PIN_NOTE',
    patterns: ['pin note .'],
    confidence: 1.0,
    extract: (_doc, input) => ({
      id: titleAfterMatch(input, [/^pin\s+note\s+/i]),
    }),
  },
  {
    intent: 'UNPIN_NOTE',
    patterns: ['unpin note .'],
    confidence: 1.0,
    extract: (_doc, input) => ({
      id: titleAfterMatch(input, [/^unpin\s+note\s+/i]),
    }),
  },

  // ── Budget ──
  {
    intent: 'ADD_EXPENSE',
    patterns: ['add expense .'],
    confidence: 1.0,
    extract: (_doc, input) => {
      const m = input.match(/^add\s+expense\s+(\S+)\s+(\S+)\s*(.*)?$/i);
      if (m) return { amount: parseAmount(m[1]), category: m[2], description: m[3]?.trim() || '' };
      return {};
    },
  },
  {
    intent: 'ADD_INCOME',
    patterns: ['add income .'],
    confidence: 1.0,
    extract: (_doc, input) => {
      const m = input.match(/^add\s+income\s+(\S+)\s*(.*)?$/i);
      if (m) return { amount: parseAmount(m[1]), description: m[2]?.trim() || '' };
      return {};
    },
  },
  {
    intent: 'LIST_TRANSACTIONS',
    patterns: ['show my expenses', 'list expenses', 'list transactions', 'show expenses', 'open budget', 'show my budget', 'show budget'],
    confidence: 1.0,
    extract: () => ({}),
  },

  // ── Schedule ──
  {
    intent: 'CREATE_EVENT',
    patterns: ['schedule event .', 'create event .', 'add event .', 'schedule meeting .'],
    confidence: 1.0,
    extract: (doc, input) => {
      const rest = titleAfterMatch(input, [/^(?:schedule|create|add)\s+(?:event|meeting)\s+/i]);
      const restDoc = nlp(rest);
      const date = extractDate(restDoc);
      const title = removeDateText(restDoc, rest);
      return { title, ...(date ? { date } : {}) };
    },
  },
  {
    intent: 'LIST_EVENTS',
    patterns: ['show my schedule', 'list events', 'show my events', 'show events', 'open schedule', 'open calendar', 'show schedule', 'show calendar'],
    confidence: 1.0,
    extract: () => ({}),
  },
  {
    intent: 'UPDATE_EVENT',
    patterns: ['update event .', 'edit event .', 'move event .'],
    confidence: 1.0,
    extract: (_doc, input) => ({
      id: titleAfterMatch(input, [/^(?:update|edit|move)\s+event\s+/i]),
    }),
  },
  {
    intent: 'DELETE_EVENT',
    patterns: ['delete event .', 'remove event .', 'cancel event .'],
    confidence: 1.0,
    extract: (_doc, input) => ({
      id: titleAfterMatch(input, [/^(?:delete|remove|cancel)\s+event\s+/i]),
    }),
  },

  // ── Habits ──
  {
    intent: 'CREATE_HABIT',
    patterns: ['create habit .', 'add habit .'],
    confidence: 1.0,
    extract: (_doc, input) => ({
      name: titleAfterMatch(input, [/^(?:create|add)\s+habit\s+/i]),
    }),
  },
  {
    intent: 'LIST_HABITS',
    patterns: ['show my habits', 'list habits', 'list my habits', 'show habits', 'open habits'],
    confidence: 1.0,
    extract: () => ({}),
  },
  {
    intent: 'COMPLETE_HABIT',
    patterns: ['complete habit .', 'done habit .', 'finish habit .'],
    confidence: 1.0,
    extract: (_doc, input) => ({
      name: titleAfterMatch(input, [/^(?:complete|done|finish)\s+habit\s+/i]),
    }),
  },
  {
    intent: 'UNCOMPLETE_HABIT',
    patterns: ['undo habit .', 'unmark habit .'],
    confidence: 1.0,
    extract: (_doc, input) => ({
      name: titleAfterMatch(input, [/^(?:undo|unmark)\s+habit\s+/i]),
    }),
  },
  {
    intent: 'SHOW_HABITS_TODAY',
    patterns: ['today habits', 'habits today', 'how are my habits', "today's habits"],
    confidence: 1.0,
    extract: () => ({}),
  },
  {
    intent: 'REMOVE_HABIT',
    patterns: ['remove habit .', 'delete habit .', 'stop tracking .'],
    confidence: 1.0,
    extract: (_doc, input) => ({
      name: titleAfterMatch(input, [/^(?:remove|delete)\s+habit\s+/i, /^stop\s+tracking\s+/i]),
    }),
  },

  // ── Timer ──
  {
    intent: 'START_TIMER',
    patterns: ['start timer .', 'set timer .', 'timer .'],
    confidence: 1.0,
    extract: (_doc, input) => {
      const minutes = parseDuration(input);
      return minutes ? { minutes } : {};
    },
  },
  {
    intent: 'STOP_TIMER',
    patterns: ['stop timer', 'cancel timer'],
    confidence: 1.0,
    extract: () => ({}),
  },
  {
    intent: 'PAUSE_TIMER',
    patterns: ['pause timer'],
    confidence: 1.0,
    extract: () => ({}),
  },
  {
    intent: 'RESUME_TIMER',
    patterns: ['resume timer', 'unpause timer'],
    confidence: 1.0,
    extract: () => ({}),
  },

  // ── Calculator ──
  {
    intent: 'CALCULATE',
    patterns: ['calculate .', 'calc .'],
    confidence: 1.0,
    extract: (_doc, input) => ({
      expression: titleAfterMatch(input, [/^(?:calculate|calc)\s+/i]),
    }),
  },

  // ── Navigation ──
  {
    intent: 'GO_DASHBOARD',
    patterns: ['go home', 'open dashboard', 'go to dashboard'],
    confidence: 1.0,
    extract: () => ({}),
  },
  {
    intent: 'GO_HELP',
    patterns: ['help', 'help me', 'show help', 'how to use'],
    confidence: 1.0,
    extract: () => ({}),
  },
  {
    intent: 'GO_ABOUT',
    patterns: ['about', 'show info', 'about hinix'],
    confidence: 1.0,
    extract: () => ({}),
  },

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  LAYER 2 — Aliases (Confidence 0.95)                                  ║
  // ╚══════════════════════════════════════════════════════════════════════════╝

  // ── Todo ──
  {
    intent: 'CREATE_TASK',
    patterns: ['(add|new|make) task .', '(add|new|make) a task .'],
    confidence: 0.95,
    extract: (_doc, input) => ({
      title: titleAfterMatch(input, [/^(?:add|new|make)\s+(?:a\s+)?task\s+/i]),
    }),
  },
  {
    intent: 'LIST_TASKS',
    patterns: ['what do i need to do', 'my tasks', 'my todos', 'open todos'],
    confidence: 0.95,
    extract: () => ({}),
  },
  {
    intent: 'COMPLETE_TASK',
    patterns: ['mark task . done', 'mark . as done', 'mark . done'],
    confidence: 0.95,
    extract: (_doc, input) => {
      const m = input.match(/^mark\s+(?:task\s+)?(\S+)\s+(?:as\s+)?done$/i);
      return m ? { id: m[1] } : {};
    },
  },
  {
    intent: 'DELETE_TASK',
    patterns: ['trash task .'],
    confidence: 0.95,
    extract: (_doc, input) => ({
      id: titleAfterMatch(input, [/^trash\s+task\s+/i]),
    }),
  },

  // ── Notes ──
  {
    intent: 'CREATE_NOTE',
    patterns: ['(write|add) note .', '(write|add) a note .', '(write|add) note about .'],
    confidence: 0.95,
    extract: (_doc, input) => ({
      title: titleAfterMatch(input, [/^(?:write|add)\s+(?:a\s+)?note\s+(?:about\s+)?/i]),
    }),
  },

  // ── Budget ──
  {
    intent: 'ADD_EXPENSE',
    patterns: ['(spent|paid) #Value .'],
    confidence: 0.95,
    extract: (_doc, input) => {
      const m = input.match(/^(?:spent|paid)\s+(\S+)\s+(?:on|for)\s+(.+)$/i);
      if (m) return { amount: parseAmount(m[1]), category: m[2] };
      // fallback: "spent 50k food"
      const m2 = input.match(/^(?:spent|paid)\s+(\S+)\s+(.+)$/i);
      if (m2) return { amount: parseAmount(m2[1]), category: m2[2] };
      return {};
    },
  },
  {
    intent: 'ADD_INCOME',
    patterns: ['(received|got|earned) #Value .'],
    confidence: 0.95,
    extract: (_doc, input) => {
      const m = input.match(/^(?:received|got|earned)\s+(\S+)\s*(.*)?$/i);
      if (m) return { amount: parseAmount(m[1]), description: m[2]?.trim() || '' };
      return {};
    },
  },

  // ── Schedule ──
  {
    intent: 'CREATE_EVENT',
    patterns: ['meeting with . .', 'meeting . .'],
    confidence: 0.95,
    extract: (doc, input) => {
      const date = extractDate(doc);
      const cleaned = removeDateText(doc, input);
      // Remove "meeting with" prefix
      const title = cleaned.replace(/^meeting\s+(?:with\s+)?/i, '').trim();
      return { title: `Meeting with ${title}`, ...(date ? { date } : {}) };
    },
  },

  // ── Habits ──
  {
    intent: 'CREATE_HABIT',
    patterns: ['start tracking .', 'track .'],
    confidence: 0.95,
    extract: (_doc, input) => ({
      name: titleAfterMatch(input, [/^(?:start\s+)?track(?:ing)?\s+/i]),
    }),
  },
  {
    intent: 'COMPLETE_HABIT',
    patterns: ['(completed|finished|done) .'],
    confidence: 0.95,
    extract: (_doc, input) => ({
      name: titleAfterMatch(input, [/^(?:completed|finished|done)\s+/i]),
    }),
  },

  // ── Timer ──
  {
    intent: 'START_TIMER',
    patterns: ['(set|start) a timer .', 'timer for .', 'countdown .'],
    confidence: 0.95,
    extract: (_doc, input) => {
      const minutes = parseDuration(input);
      return minutes ? { minutes } : {};
    },
  },

  // ── Calculator ──
  {
    intent: 'CALCULATE',
    patterns: ['what is #Value .', 'how much is .'],
    confidence: 0.95,
    extract: (_doc, input) => ({
      expression: titleAfterMatch(input, [/^what\s+is\s+/i, /^how\s+much\s+is\s+/i]),
    }),
  },

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  LAYER 3 — Natural Patterns (Confidence 0.85)                         ║
  // ╚══════════════════════════════════════════════════════════════════════════╝

  {
    intent: 'CREATE_TASK',
    patterns: ['(buy|call|email|fix|finish|do|send|prepare|clean|wash|book|order|pick) .'],
    confidence: 0.85,
    extract: (doc, input) => {
      const date = extractDate(doc);
      const title = date ? removeDateText(doc, input) : input;
      return { title, ...(date ? { date } : {}) };
    },
  },
  {
    intent: 'CREATE_TASK',
    patterns: ['remind me to .'],
    confidence: 0.85,
    extract: (doc, input) => {
      const rest = input.replace(/^remind\s+me\s+to\s+/i, '');
      const restDoc = nlp(rest);
      const date = extractDate(restDoc);
      const title = date ? removeDateText(restDoc, rest) : rest;
      return { title, ...(date ? { date } : {}) };
    },
  },
  {
    intent: 'LIST_TASKS',
    patterns: ['what should i do', 'what do i have to do', 'anything to do'],
    confidence: 0.85,
    extract: () => ({}),
  },
  {
    intent: 'LIST_EVENTS',
    patterns: ['what events do i have', "what's on my schedule", "what's my schedule"],
    confidence: 0.85,
    extract: () => ({}),
  },
];

// ─── Detector ────────────────────────────────────────────────────────────────

export function detectIntent(normalizedInput: string, originalInput: string): ParsedIntent {
  const doc = nlp(normalizedInput);

  let bestMatch: ParsedIntent | null = null;

  for (const rule of rules) {
    // Try each pattern
    for (const pattern of rule.patterns) {
      const matched = doc.match(pattern);
      if (matched.found) {
        // Only keep if higher confidence than current best
        if (!bestMatch || rule.confidence > bestMatch.confidence) {
          const entities = rule.extract(doc, normalizedInput);

          bestMatch = {
            intent: rule.intent,
            confidence: rule.confidence,
            entities,
            originalInput,
          };
        }

        // Stop trying more patterns for this rule once one matched
        break;
      }
    }

    // Optimization: stop early if we have a perfect match
    if (bestMatch && bestMatch.confidence === 1.0) break;
  }

  if (bestMatch) return bestMatch;

  // LAYER 4: Unknown — provide recommendations
  return {
    intent: 'UNKNOWN',
    confidence: 0,
    entities: {},
    originalInput,
    recommendations: [
      'Create a task → "create task <title>"',
      'Add an expense → "spent <amount> on <category>"',
      'Schedule an event → "meeting <title> tomorrow at 3pm"',
      'Write a note → "write note <title>"',
      'Start a timer → "start timer 25m"',
      'Type "help" for all available commands',
    ],
  };
}
