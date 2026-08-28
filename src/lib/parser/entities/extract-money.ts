import type { ParsedEntities } from '../types';

export function extractMoney(input: string): Pick<ParsedEntities, 'amount' | 'currency'> {
  const normalized = input.toLowerCase();

  const money = normalized.match(
    /(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(k|m|million|thousand)?\b/
  );

  if (!money) return {};

  let amount = Number(money[1].replace(',', '.'));
  const unit = money[2];

  if (unit === 'k' || unit === 'thousand') {
    amount *= 1_000;
  }

  if (unit === 'm' || unit === 'million') {
    amount *= 1_000_000;
  }

  const currency = /\b(?:$|€|£)\b/i.test(normalized) ? '$' : undefined;

  return { amount, currency };
}
