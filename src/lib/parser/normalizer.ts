export function normalize(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // replace multiple spaces with single space
}
