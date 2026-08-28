import type { ParsedIntent } from './types';
import type { ParsedCommand } from '../commands/parser';
import { format } from 'date-fns';

/**
 * Convert a ParsedIntent into a legacy ParsedCommand
 * so the existing command executor can handle it without changes.
 */
export function adaptIntentToCommand(parsed: ParsedIntent): ParsedCommand | null {
  const { intent, entities } = parsed;

  switch (intent) {
    // ── Todo ──────────────────────────────────────────────────────────────────
    case 'CREATE_TASK': {
      const args = ['add'];
      if (entities.title) args.push(entities.title);
      if (entities.date) {
        const deadline = formatDateToLegacy(entities.date);
        if (deadline) args.push('--deadline', ...deadline);
      }
      return { command: 'todo', args };
    }
    case 'LIST_TASKS':
      return { command: 'todo', args: ['list'] };
    case 'VIEW_TASK':
      return entities.id ? { command: 'todo', args: ['view', entities.id] } : null;
    case 'COMPLETE_TASK':
      return entities.id ? { command: 'todo', args: ['done', entities.id] } : null;
    case 'UNCOMPLETE_TASK':
      return entities.id ? { command: 'todo', args: ['undo', entities.id] } : null;
    case 'UPDATE_TASK':
      return entities.id ? { command: 'todo', args: ['update', entities.id] } : null;
    case 'DELETE_TASK':
      return entities.id ? { command: 'todo', args: ['delete', entities.id] } : null;

    // ── Notes ─────────────────────────────────────────────────────────────────
    case 'CREATE_NOTE': {
      const args = ['add'];
      if (entities.title) args.push(entities.title);
      return { command: 'notes', args };
    }
    case 'LIST_NOTES':
      return { command: 'notes', args: ['list'] };
    case 'VIEW_NOTE':
      return entities.id ? { command: 'notes', args: ['view', entities.id] } : null;
    case 'UPDATE_NOTE':
      return entities.id ? { command: 'notes', args: ['update', entities.id] } : null;
    case 'DELETE_NOTE':
      return entities.id ? { command: 'notes', args: ['delete', entities.id] } : null;
    case 'PIN_NOTE':
      return entities.id ? { command: 'notes', args: ['pin', entities.id] } : null;
    case 'UNPIN_NOTE':
      return entities.id ? { command: 'notes', args: ['unpin', entities.id] } : null;

    // ── Budget ────────────────────────────────────────────────────────────────
    case 'ADD_EXPENSE': {
      const args = ['add'];
      if (entities.amount) args.push(entities.amount);
      if (entities.category) args.push(entities.category);
      if (entities.description) args.push(entities.description);
      return { command: 'budget', args };
    }
    case 'ADD_INCOME': {
      const args = ['income'];
      if (entities.amount) args.push(entities.amount);
      if (entities.description) args.push(entities.description);
      return { command: 'budget', args };
    }
    case 'LIST_TRANSACTIONS':
      return { command: 'budget', args: ['list'] };

    // ── Schedule ──────────────────────────────────────────────────────────────
    case 'CREATE_EVENT': {
      const args = ['add'];
      if (entities.title) args.push(entities.title);
      if (entities.date) {
        // Schedule expects time as last arg and --date flag for date
        const d = new Date(entities.date);
        if (!isNaN(d.getTime())) {
          const time = format(d, 'HH:mm');
          const dateStr = format(d, 'dd-MM-yyyy');
          args.push(time, '--date', dateStr);
        }
      }
      return { command: 'schedule', args };
    }
    case 'LIST_EVENTS':
      return { command: 'schedule', args: ['list'] };
    case 'UPDATE_EVENT':
      return entities.id ? { command: 'schedule', args: ['update', entities.id] } : null;
    case 'DELETE_EVENT':
      return entities.id ? { command: 'schedule', args: ['delete', entities.id] } : null;

    // ── Habits ────────────────────────────────────────────────────────────────
    case 'CREATE_HABIT': {
      const args = ['add'];
      if (entities.name) args.push(entities.name);
      return { command: 'habits', args };
    }
    case 'LIST_HABITS':
      return { command: 'habits', args: ['list'] };
    case 'COMPLETE_HABIT': {
      const args = ['done'];
      if (entities.name) args.push(entities.name);
      return { command: 'habits', args };
    }
    case 'UNCOMPLETE_HABIT': {
      const args = ['undo'];
      if (entities.name) args.push(entities.name);
      return { command: 'habits', args };
    }
    case 'SHOW_HABITS_TODAY':
      return { command: 'habits', args: ['today'] };
    case 'REMOVE_HABIT': {
      const args = ['remove'];
      if (entities.name) args.push(entities.name);
      return { command: 'habits', args };
    }

    // ── Timer ─────────────────────────────────────────────────────────────────
    case 'START_TIMER': {
      if (entities.minutes) {
        return { command: 'timer', args: [`${entities.minutes}m`] };
      }
      return { command: 'timer', args: [] };
    }
    case 'STOP_TIMER':
      return { command: 'timer', args: ['stop'] };
    case 'PAUSE_TIMER':
      return { command: 'timer', args: ['pause'] };
    case 'RESUME_TIMER':
      return { command: 'timer', args: ['resume'] };

    // ── Calculator ────────────────────────────────────────────────────────────
    case 'CALCULATE':
      return entities.expression
        ? { command: 'calc', args: [entities.expression] }
        : { command: 'calc', args: [] };

    // ── Navigation ────────────────────────────────────────────────────────────
    case 'GO_DASHBOARD':
      return { command: 'dashboard', args: [] };
    case 'GO_HELP':
      return { command: 'help', args: [] };
    case 'GO_ABOUT':
      return { command: 'about', args: [] };

    default:
      return null;
  }
}

/**
 * Convert an ISO date string from compromise-dates into the legacy
 * `--deadline` format: `[HH:MM] [DD-MM-YYYY]`.
 * Returns an array of args.
 */
function formatDateToLegacy(isoDate: string): string[] | null {
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return null;

    const time = format(d, 'HH:mm');
    const date = format(d, 'dd-MM-yyyy');
    return [time, date];
  } catch {
    return null;
  }
}
