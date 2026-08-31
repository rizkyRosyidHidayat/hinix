import type { CommandAction, CommandDomain } from '../types';

/**
 * The registry is the product ontology. It deliberately lives outside the
 * classifier so the classification strategy can be replaced later by a local
 * zero-shot model or an LLM without changing the rest of the command pipeline.
 */
export interface IntentExample {
  phrase: string;
  weight?: number;
}

export const ACTION_EXAMPLES: Record<CommandAction, IntentExample[]> = {
  create: [
    { phrase: 'add something', weight: 1 },
    { phrase: 'create something', weight: 1 },
    { phrase: 'make something', weight: 0.9 },
    { phrase: 'new item', weight: 0.8 },
    { phrase: 'start something', weight: 0.7 }
  ],
  list: [
    { phrase: 'show my items', weight: 1 },
    { phrase: 'list my items', weight: 1 },
    { phrase: 'what do I have', weight: 0.9 },
    { phrase: 'what is scheduled', weight: 0.9 },
    { phrase: 'how much did I spend', weight: 0.9 },
    { phrase: 'find my items', weight: 0.8 }
  ],
  update: [
    { phrase: 'change something', weight: 1 },
    { phrase: 'update something', weight: 1 },
    { phrase: 'modify something', weight: 0.9 },
    { phrase: 'edit something', weight: 0.9 },
    { phrase: 'move something', weight: 0.9 },
    { phrase: 'rename something', weight: 0.9 },
    { phrase: 'reschedule something', weight: 1 },
    { phrase: 'set something', weight: 0.6 }
  ],
  delete: [
    { phrase: 'delete something', weight: 1 },
    { phrase: 'remove something', weight: 1 },
    { phrase: 'cancel something', weight: 1 },
    { phrase: 'forget something', weight: 0.9 },
    { phrase: 'clear something', weight: 0.8 }
  ]
};

export const DOMAIN_EXAMPLES: Record<CommandDomain, IntentExample[]> = {
  todo: [
    { phrase: 'task to do', weight: 1 },
    { phrase: 'todo', weight: 1 },
    { phrase: 'reminder', weight: 0.8 },
    { phrase: 'buy something', weight: 0.75 },
    { phrase: 'finish something', weight: 0.75 },
    { phrase: 'do something', weight: 0.7 }
  ],
  schedule: [
    { phrase: 'meeting', weight: 1 },
    { phrase: 'appointment', weight: 1 },
    { phrase: 'calendar', weight: 1 },
    { phrase: 'event', weight: 0.9 },
    { phrase: 'schedule', weight: 0.9 },
    { phrase: 'lunch with someone', weight: 0.7 }
  ],
  habit: [
    { phrase: 'habit', weight: 1 },
    { phrase: 'routine', weight: 1 },
    { phrase: 'every day', weight: 0.9 },
    { phrase: 'every morning', weight: 0.9 },
    { phrase: 'every week', weight: 0.8 },
    { phrase: 'daily activity', weight: 0.8 }
  ],
  budget: [
    { phrase: 'budget', weight: 1 },
    { phrase: 'expense', weight: 1 },
    { phrase: 'spending', weight: 1 },
    { phrase: 'spent money', weight: 1 },
    { phrase: 'income', weight: 0.9 },
    { phrase: 'dollars', weight: 0.6 },
    { phrase: 'price', weight: 0.6 }
  ],
  note: [
    { phrase: 'note', weight: 1 },
    { phrase: 'memo', weight: 1 },
    { phrase: 'remember this', weight: 1 },
    { phrase: 'write down', weight: 0.9 },
    { phrase: 'information to remember', weight: 0.9 }
  ]
};

/** Strong lexical hints for implicit commands. */
export const DOMAIN_HINTS: Record<CommandDomain, string[]> = {
  todo: ['buy', 'finish', 'complete', 'task', 'todo', 'remind me', 'do '],
  schedule: ['meeting', 'appointment', 'calendar', 'event', 'schedule', 'lunch with'],
  habit: ['habit', 'routine', 'every day', 'every morning', 'every weekday', 'weekly'],
  budget: ['spent', 'spend', 'expense', 'budget', 'income', 'cost', '$', 'usd', 'dollars'],
  note: ['note', 'memo', 'remember', 'write down', 'keep a note']
};

export const ACTION_HINTS: Record<CommandAction, string[]> = {
  create: ['add ', 'create ', 'make ', 'new ', 'buy ', 'spent ', 'remember ', 'schedule '],
  list: ['show ', 'list ', 'what ', 'which ', 'how much ', 'find ', 'display '],
  update: ['change ', 'update ', 'modify ', 'edit ', 'move ', 'rename ', 'reschedule ', 'set '],
  delete: ['delete ', 'remove ', 'cancel ', 'forget ', 'clear ']
};
