import { FREQUENCIES } from '../rules/habit-rules';

export function extractFrequency(input: string): string | undefined {
  const lower = input.toLowerCase();

  for (const [frequency, phrases] of Object.entries(FREQUENCIES)) {
    if (phrases.some((phrase) => lower.includes(phrase))) {
      return frequency;
    }
  }

  const custom = lower.match(
    /\b(?:every)\s+(\d+)\s+(day|days|week|weeks)\b/i
  );

  if (custom) {
    return `every ${custom[1]} ${custom[2]}`;
  }

  return undefined;
}
