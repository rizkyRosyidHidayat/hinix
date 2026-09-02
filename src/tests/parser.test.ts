import { describe, expect, it } from 'vitest';
import { classifyAction, classifyDomain, parseCommand } from '../lib/command';

const NOW = new Date('2026-08-28T12:00:00');

function parse(input: string) {
	return parseCommand(input, { now: NOW });
}

describe('HiNix hybrid classifier', () => {
	it('classifies action and domain independently', () => {
		expect(classifyAction('change my dentist appointment')).toBeTruthy();
		expect(classifyDomain('change my dentist appointment')).toBeTruthy();
	});

	it('parses implicit todo creation', () => {
		const result = parse('buy milk');
		expect(result.domain).toBe('todo');
		expect(result.action).toBe('create');
		expect(result.entities.title).toBe('buy milk');
	});

	it('parses a schedule with a relative date and time', () => {
		const result = parse('set meeting tomorrow at 10am');
		expect(result.domain).toBe('schedule');
		expect(result.action).toBe('create');
		expect(result.entities.date).toBe('2026-08-29');
		expect(result.entities.time).toBe('10:00');
		expect(result.entities.title).toBe('meeting');
	});

	it('parses list intent', () => {
		const result = parse('show my todos today');
		expect(result.action).toBe('list');
		expect(result.domain).toBe('todo');
		expect(result.entities.date).toBe('2026-08-28');
	});

	it('parses update intent and extracts target/new title', () => {
		const result = parse('change buy milk to buy almond milk');
		expect(result.action).toBe('update');
		expect(result.domain).toBe('todo');
		expect(result.entities.search).toBe('buy milk');
		expect(result.entities.title).toBe('buy almond milk');
	});

	it('parses delete intent', () => {
		const result = parse('delete buy milk');
		expect(result.action).toBe('delete');
		expect(result.domain).toBe('todo');
		expect(result.entities.search).toBe('buy milk');
	});

	it('parses habits', () => {
		const result = parse('run every morning');
		expect(result.domain).toBe('habit');
		expect(result.action).toBe('create');
		expect(result.entities.frequency).toBe('daily');
	});

	it('parses budget amount and category', () => {
		const result = parse('spent $20 on lunch');
		expect(result.domain).toBe('budget');
		expect(result.action).toBe('create');
		expect(result.entities.amount).toBe(20);
		expect(result.entities.currency).toBe('USD');
		expect(result.entities.category).toBe('lunch');
	});

	it('parses notes', () => {
		const result = parse('remember to call John');
		expect(result.domain).toBe('note');
		expect(result.action).toBe('create');
	});

	it('supports explicit command syntax', () => {
		const result = parse('todo add buy milk');
		expect(result.source).toBe('explicit-command');
		expect(result.domain).toBe('todo');
		expect(result.action).toBe('create');
	});

	it('returns invalid for empty input', () => {
		expect(parse('  ').status).toBe('invalid');
	});

	it('handles ambiguous commands', () => {
		const result = parse('add note budget');
		expect(result.status).toBe('ambiguous');
		if (result.status === 'ambiguous') {
			expect(result.clarification?.options.length).toBeGreaterThan(1);
		}
	});
});
