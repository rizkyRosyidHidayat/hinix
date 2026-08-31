import nlp from 'compromise';
import {
  ACTION_EXAMPLES,
  ACTION_HINTS,
  DOMAIN_EXAMPLES,
  DOMAIN_HINTS
} from './registry';
import type {
  ClassificationResult,
  CommandAction,
  CommandDomain
} from '../types';

interface ScoredLabel<T extends string> {
  label: T;
  score: number;
}

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9$ ]/g, ' ').replace(/\s+/g, ' ').trim();

const tokenSet = (value: string) => new Set(normalize(value).split(' ').filter(Boolean));

function similarity(input: string, phrase: string): number {
  const inputText = normalize(input);
  const phraseText = normalize(phrase);

  if (!inputText || !phraseText) return 0;
  if (inputText.includes(phraseText)) return 1;

  const inputTokens = tokenSet(inputText);
  const phraseTokens = tokenSet(phraseText);
  const overlap = [...phraseTokens].filter((token) => inputTokens.has(token)).length;

  return overlap / Math.max(phraseTokens.size, 1);
}

function rank<T extends string>(
  input: string,
  examples: Record<T, { phrase: string; weight?: number }[]>,
  hints: Record<T, string[]>
): ClassificationResult<T> {
  const scores: ScoredLabel<T>[] = Object.entries(examples).map(([label, items]) => {
    const exampleScore = Math.max(
      ...(items as { phrase: string; weight?: number }[]).map(
        (item) => similarity(input, item.phrase) * (item.weight ?? 1)
      ),
      0
    );

    const lower = normalize(input);
    const hintScore = Math.max(
      ...(hints[label as T] ?? []).map((hint) => (lower.includes(normalize(hint)) ? 0.65 : 0)),
      0
    );

    return {
      label: label as T,
      score: Math.min(1, Math.max(exampleScore, hintScore))
    };
  });

  // Explicitly detected verbs are stronger than generic semantic similarity.
  const doc = nlp(input);
  const verbs = doc.verbs().toInfinitive().out('array') as string[];
  const verbText = verbs.join(' ');

  const verbBoosts = {
    add: 0.45,
    create: 0.45,
    make: 0.35,
    show: 0.45,
    list: 0.45,
    find: 0.35,
    change: 0.5,
    update: 0.5,
    modify: 0.45,
    edit: 0.45,
    move: 0.45,
    rename: 0.45,
    reschedule: 0.5,
    delete: 0.55,
    remove: 0.55,
    cancel: 0.55,
    forget: 0.45
  };

  for (const scored of scores) {
    const boost = verbBoosts[verbText as CommandAction];
    if (boost && scored.label in ACTION_EXAMPLES) {
      scored.score = Math.min(1, scored.score + boost);
    }
  }

  const sorted = scores.sort((a, b) => b.score - a.score);
  const max = sorted[0]?.score ?? 0;

  const normalized = sorted.map((item) => ({
    label: item.label,
    confidence: max > 0 ? Number((item.score / max).toFixed(3)) : 0
  }));

  return {
    label: normalized[0].label,
    confidence: normalized[0].confidence,
    alternatives: normalized.slice(1, 4)
  };
}

export function classifyAction(input: string): ClassificationResult<CommandAction> {
  return rank(input, ACTION_EXAMPLES, ACTION_HINTS);
}

export function classifyDomain(input: string): ClassificationResult<CommandDomain> {
  return rank(input, DOMAIN_EXAMPLES, DOMAIN_HINTS);
}
