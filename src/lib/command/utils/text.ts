import nlp from 'compromise';

export function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function stripLeadingCommandPrefix(input: string): string {
  return cleanText(input.replace(/^(todo|schedule|habit|budget|note)s?\s+(add|create|list|show|update|delete|remove)\s+/i, ''));
}

export function removePhrases(input: string, phrases: string[]): string {
  let output = input;
  for (const phrase of phrases) {
    output = output.replace(new RegExp(`\\b${escapeRegex(phrase)}\\b`, 'gi'), ' ');
  }
  return cleanText(output);
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function titleCase(value: string): string {
  return value.replace(/\b\w/g, (character) => character.toUpperCase());
}

export function looksLikeQuestion(input: string): boolean {
  const doc = nlp(input);
  return /^(what|which|show|list|how|where|when|do|did|can|could|give)/i.test(doc.text());
}
