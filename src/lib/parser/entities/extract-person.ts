import nlp from 'compromise';

export function extractPerson(input: string): string | undefined {
  const doc = nlp(input);
  const people = doc.people().out('array') as string[];

  if (people.length > 0) return people[0];

  const match = input.match(
    /\b(?:with|for|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/
  );

  return match?.[1];
}
