export function normalizeInput(input: string): string {
  return input
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^[,;]+|[,;]+$/g, '');
}

export function stripPunctuation(value: string): string {
  return value
    .replace(/[“”"]/g, '')
    .replace(/[!?]+$/g, '')
    .trim();
}
