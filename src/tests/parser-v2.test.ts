import { describe, expect, it } from 'vitest';
import { parseCommand } from '../lib/command-v2/parser';
import type { CommandAction, CommandDomain, ParsedCommand } from '../lib/command-v2/types';

function parse(input: string): ParsedCommand {
  return parseCommand(input);
}

function expectIntent(
  input: string,
  domain: CommandDomain,
  action: CommandAction
): ParsedCommand {
  const result = parse(input);

  expect(result.status).toBe('parsed');
  expect(result.domain).toBe(domain);
  expect(result.action).toBe(action);

  return result;
}

describe('HiNix command parser', () => {
  describe('default intent', () => {
    it('defaults plain text to todo.create', () => {
      const result = expectIntent('buy milk', 'todo', 'create');

      expect(result.entities.title).toBe('buy milk');
    });

    it('keeps command-looking words as todo content', () => {
      const result = expectIntent('create new report', 'todo', 'create');

      expect(result.entities.title).toBe('create new report');
    });

    it('keeps "add" as content when there is no strong command evidence', () => {
      const result = expectIntent('add new project idea', 'todo', 'create');

      expect(result.entities.title).toBe('add new project idea');
    });

    it('does not turn a date-only signal into schedule.create', () => {
      const result = expectIntent('finish report tomorrow', 'todo', 'create');

      expect(result.entities.title).toContain('finish report');
      expect(result.entities.dateText).toBeDefined();
    });
  });

  describe('domain detection', () => {
    it('detects schedule from strong schedule vocabulary', () => {
      const result = expectIntent(
        'schedule meeting tomorrow at 10am',
        'schedule',
        'create'
      );

      expect(result.entities.dateText).toBeDefined();
    });

    it('detects budget from expense language', () => {
      const result = expectIntent('spent $20 on lunch', 'budget', 'create');

      expect(result.entities.amount).toBe(20);
    });

    it('detects habit from recurrence language', () => {
      expectIntent('run every morning', 'habit', 'create');
    });

    it('detects note from explicit note language', () => {
      const result = expectIntent('take a note call John', 'note', 'create');

      expect(result.entities.title).toContain('call John');
    });

    it('detects todo from explicit todo vocabulary', () => {
      expectIntent('todo add buy milk', 'todo', 'create');
    });
  });

  describe('action detection', () => {
    it('detects list from "show"', () => {
      expectIntent('show my tasks', 'todo', 'list');
    });

    it('detects list from "list"', () => {
      expectIntent('list my tasks', 'todo', 'list');
    });

    it('detects delete from "remove"', () => {
      const result = expectIntent('remove buy milk', 'todo', 'delete');

      expect(result.entities.search).toBe('buy milk');
      expect(result.needsConfirmation).toBe(true);
    });

    it('detects delete from "delete"', () => {
      const result = expectIntent('delete old report', 'todo', 'delete');

      expect(result.entities.search).toBe('old report');
      expect(result.needsConfirmation).toBe(true);
    });

    it('detects update from "rename"', () => {
      const result = expectIntent('rename buy milk', 'todo', 'update');

      expect(result.entities.search).toBe('buy milk');
      expect(result.needsConfirmation).toBe(true);
    });

    it('detects update from "change"', () => {
      expectIntent('change my report', 'todo', 'update');
    });

    it('detects rescheduling as an update action', () => {
      const result = expectIntent(
        'reschedule dentist appointment to tomorrow',
        'schedule',
        'update'
      );

      expect(result.needsConfirmation).toBe(true);
      expect(result.entities.dateText).toBeDefined();
    });
  });

  describe('explicit command syntax', () => {
    it('gives explicit commands priority over natural-language inference', () => {
      const result = expectIntent(
        'todo add create new report',
        'todo',
        'create'
      );

      expect(result.entities.title).toBe('create new report');
      expect(result.confidence).toBe(1);
    });

    it('supports explicit schedule create', () => {
      expectIntent('schedule create team meeting tomorrow', 'schedule', 'create');
    });

    it('supports explicit habit create', () => {
      expectIntent('habit add exercise every morning', 'habit', 'create');
    });

    it('supports explicit budget create', () => {
      const result = expectIntent('budget add $50 groceries', 'budget', 'create');

      expect(result.entities.amount).toBe(50);
    });

    it('supports explicit note create', () => {
      expectIntent('note add call John tomorrow', 'note', 'create');
    });

    it('supports explicit todo delete', () => {
      const result = expectIntent('todo delete buy milk', 'todo', 'delete');

      expect(result.entities.search).toBe('buy milk');
      expect(result.needsConfirmation).toBe(true);
    });

    it('supports explicit todo list', () => {
      expectIntent('todo list', 'todo', 'list');
    });
  });

  describe('entity extraction', () => {
    it('extracts a date from a todo without changing its domain', () => {
      const result = expectIntent('buy milk tomorrow', 'todo', 'create');

      expect(result.entities.title).toContain('buy milk');
      expect(result.entities.dateText).toBeDefined();
    });

    it('extracts time from a scheduled item', () => {
      const result = expectIntent(
        'schedule standup tomorrow at 9am',
        'schedule',
        'create'
      );

      expect(result.entities.dateText).toBeDefined();
    });

    it('extracts a currency amount from budget input', () => {
      const result = expectIntent('spent $125 on groceries', 'budget', 'create');

      expect(result.entities.amount).toBe(125);
    });

    it('extracts search text for destructive actions', () => {
      const result = expectIntent('remove finish quarterly report', 'todo', 'delete');

      expect(result.entities.search).toBe('finish quarterly report');
      expect(result.entities.title).toBeUndefined();
    });
  });

  describe('safety and ambiguity', () => {
    it('marks destructive actions for confirmation', () => {
      for (const input of ['delete buy milk', 'remove buy milk', 'cancel meeting']) {
        const result = parse(input);

        expect(result.needsConfirmation).toBe(true);
      }
    });

    it('marks update actions for confirmation', () => {
      const result = parse('change buy milk');

      expect(result.action).toBe('update');
      expect(result.needsConfirmation).toBe(true);
    });

    it('returns a confidence value between 0 and 1 (never NaN)', () => {
      const inputs = [
        'buy milk',
        'create new report',
        'schedule meeting tomorrow',
        'spent $20 on lunch',
        'remove buy milk',
        'show my tasks',
        '',
        '   ',
        '123'
      ];

      for (const input of inputs) {
        const result = parse(input);

        expect(result.confidence).not.toBeNaN();
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('does not mark default-domain inputs as ambiguous', () => {
      // These have no competing domain/action evidence, they just default to todo.create
      for (const input of ['buy milk', 'create new report', 'add new project idea']) {
        const result = parse(input);

        expect(result.status).toBe('parsed');
      }
    });

    it('marks input as ambiguous when domain evidence is close', () => {
      // "note about my routine" → note domain (keyword: "note") vs habit domain (keyword: "routine")
      const result = parse('note about my routine');

      expect(result.status).toBe('ambiguous');
      expect(result.needsConfirmation).toBe(true);
      expect(result.alternatives.length).toBeGreaterThan(0);
    });

    it('marks input as ambiguous when multiple domains compete equally', () => {
      // "schedule my routine" → schedule (keyword: "schedule") vs habit (keyword: "routine")
      const result = parse('schedule my routine');

      expect(result.status).toBe('ambiguous');
      expect(result.needsConfirmation).toBe(true);
    });
  });

  describe('invalid input detection', () => {
    it('marks random gibberish as invalid with confidence 0', () => {
      for (const input of ['jhgfdyfdg', 'asdfasdf', 'xyzqwert']) {
        const result = parse(input);

        expect(result.status).toBe('invalid');
        expect(result.confidence).toBe(0);
        expect(result.needsConfirmation).toBe(true);
        expect(result.reason).toContain('could not be understood');
      }
    });

    it('does NOT mark verb-based input as invalid', () => {
      const result = parse('buy milk');

      expect(result.status).not.toBe('invalid');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('gives "create new report" higher confidence than gibberish', () => {
      const report = parse('create new report');
      const gibberish = parse('jhgfdyfdg');

      expect(report.confidence).toBeGreaterThan(gibberish.confidence);
    });

    it('gives inputs with domain keywords higher confidence than generic verb input', () => {
      const withDomain = parse('show my tasks');
      const generic = parse('buy milk');

      expect(withDomain.confidence).toBeGreaterThan(generic.confidence);
    });
  });

  describe('regression cases', () => {
    const cases: Array<{
      input: string;
      domain: CommandDomain;
      action: CommandAction;
    }> = [
        { input: 'create new report', domain: 'todo', action: 'create' },
        { input: 'make a presentation', domain: 'todo', action: 'create' },
        { input: 'add new project', domain: 'todo', action: 'create' },
        { input: 'finish report tomorrow', domain: 'todo', action: 'create' },
        {
          input: 'schedule meeting tomorrow at 10am',
          domain: 'schedule',
          action: 'create'
        },
        { input: 'spent $20 on lunch', domain: 'budget', action: 'create' },
        { input: 'run every morning', domain: 'habit', action: 'create' },
        { input: 'take a note call John', domain: 'note', action: 'create' },
        { input: 'remove buy milk', domain: 'todo', action: 'delete' },
        { input: 'show my tasks', domain: 'todo', action: 'list' }
      ];

    it.each(cases)('$input → $domain.$action', ({ input, domain, action }) => {
      expectIntent(input, domain, action);
    });
  });
});
