import nlp from 'compromise';
import type Three from 'compromise/view/three';

export function analyze(input: string) {
  return nlp(input);
}

export function getVerbs(doc: Three): string[] {
  return doc.verbs().out('array') as string[];
}

export function getNouns(doc: Three): string[] {
  return doc.nouns().out('array') as string[];
}

export function getPeople(doc: Three): string[] {
  return doc.people().out('array') as string[];
}

export function getNumbers(doc: Three): string[] {
  return doc.numbers().out('array') as string[];
}

export function getMoney(doc: Three): string[] {
  return doc.money().out('array') as string[];
}
