import { describe, expect, it } from 'vitest';
import { parseCommand } from '../index';

describe('HiNix Smart Parser v0.2', () => {
  it('parses simple natural task', () => {
    const result = parseCommand('buy milk');

    expect(result.intent).toBe('CREATE_TASK');
    expect(result.entities.title).toBe('Buy milk');
  });

  it('parses task with English date and time', () => {
    const result = parseCommand('call John tomorrow at 3pm');

    expect(result.intent).toBe('CREATE_TASK');
    expect(result.entities.title).toBe('Call John');
    expect(result.entities.date).toBeDefined();
    expect(result.entities.time).toBe('15:00');
  });

  it('parses explicit create task command', () => {
    const result = parseCommand('create task Buy milk tomorrow');

    expect(result.intent).toBe('CREATE_TASK');
    expect(result.entities.title).toBe('Buy milk');
    expect(result.entities.date).toBeDefined();
  });

  it('parses list tasks', () => {
    const result = parseCommand('show my tasks');

    expect(result.intent).toBe('LIST_TASKS');
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('parses complete task', () => {
    const result = parseCommand('complete task 12');

    expect(result.intent).toBe('COMPLETE_TASK');
    expect(result.entities.taskId).toBe('12');
  });

  it('requires confirmation for delete', () => {
    const result = parseCommand('delete task 12');

    expect(result.intent).toBe('DELETE_TASK');
    expect(result.requiresConfirmation).toBe(true);
  });

  it('parses English expense', () => {
    const result = parseCommand('spent 50k on lunch');

    expect(result.intent).toBe('ADD_EXPENSE');
    expect(result.entities.amount).toBe(50000);
    expect(result.entities.category).toBe('food');
  });

  it('parses habit', () => {
    const result = parseCommand('exercise every day');

    expect(result.intent).toBe('CREATE_HABIT');
    expect(result.entities.frequency).toBe('daily');
  });

  it('parses schedule', () => {
    const result = parseCommand('meeting with John tomorrow at 3pm');

    expect(result.intent).toBe('CREATE_EVENT');
    expect(result.entities.title).toBe('Meeting with John');
    expect(result.entities.time).toBe('15:00');
  });

  it('supports active task context', () => {
    const result = parseCommand(
      'buy groceries tomorrow',
      { activeIntent: 'CREATE_TASK' }
    );

    expect(result.intent).toBe('CREATE_TASK');
    expect(result.entities.title).toBe('Buy groceries');
  });

  it('handles unknown input', () => {
    const result = parseCommand('hello');

    expect(result.intent).toBe('UNKNOWN');
    expect(result.needsClarification).toBe(true);
  });
});
