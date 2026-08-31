import { classifyAction, classifyDomain } from '../classifier';
import type { CommandAction, CommandDomain, ParsedCommand, ParseOptions } from '../types';
import { extractEntities } from './entities';
import { parseExplicitCommand } from './explicit';
import { cleanText, looksLikeQuestion } from '../utils/text';

const MIN_EXECUTE_CONFIDENCE = 0.55;
const MIN_GAP = 0.12;

function inferImplicitAction(input: string, domain: CommandDomain): CommandAction | undefined {
  const lower = input.toLowerCase();
  if (/\b(delete|remove|cancel|forget|clear)\b/.test(lower)) return 'delete';
  if (/\b(change|update|modify|edit|move|rename|reschedule)\b/.test(lower)) return 'update';
  if (looksLikeQuestion(input) || /\b(show|list|find)\b/.test(lower)) return 'list';
  if (domain === 'budget' && /\b(spent|spend|expense|income)\b/.test(lower)) return 'create';
  return 'create';
}

function buildClarification(
  input: string,
  action: CommandAction,
  domainResult: ReturnType<typeof classifyDomain>
): ParsedCommand['clarification'] {
  const alternatives = domainResult.alternatives.slice(0, 2);
  return {
    question: `I am not fully sure how to interpret “${input}”.`,
    options: [
      { label: `${action} ${domainResult.label}`, domain: domainResult.label, action },
      ...alternatives.map((item) => ({ label: `${action} ${item.label}`, domain: item.label, action }))
    ]
  };
}

export function parseCommand(input: string, options: ParseOptions = {}): ParsedCommand {
  const originalInput = input;
  const normalized = cleanText(input);

  if (!normalized) {
    return {
      status: 'invalid',
      entities: {},
      confidence: 0,
      source: 'natural-language',
      originalInput
    };
  }

  const explicit = parseExplicitCommand(normalized, options);
  if (explicit) return explicit;

  const intent = classifyAction(normalized);
  const domainClassification = classifyDomain(normalized);
  const action = inferImplicitAction(normalized, domainClassification.label);

  if (!action || domainClassification.confidence < 0.3) {
    return {
      status: 'invalid',
      entities: {},
      confidence: Math.max(intent.confidence, domainClassification.confidence),
      source: 'natural-language',
      originalInput,
      intent,
      domainClassification
    };
  }

  const alternatives = domainClassification.alternatives;
  const ambiguous =
    domainClassification.confidence < MIN_EXECUTE_CONFIDENCE ||
    (alternatives[0] && domainClassification.confidence - alternatives[0].confidence < MIN_GAP);

  const domain = domainClassification.label;
  const entities = extractEntities(normalized, domain, action, options);
  const confidence = Number(
    ((intent.confidence * 0.35 + domainClassification.confidence * 0.65) * (action ? 1 : 0)).toFixed(3)
  );

  if (ambiguous) {
    return {
      status: 'ambiguous',
      domain,
      action,
      entities,
      confidence,
      source: 'natural-language',
      originalInput,
      intent,
      domainClassification,
      clarification: buildClarification(normalized, action, domainClassification)
    };
  }

  let missingField: string | undefined;
  if (action === 'create') {
    if (domain === 'budget' && !entities.amount) {
      missingField = 'amount';
    } else if (domain === 'schedule' && !entities.time) {
      missingField = 'time';
    } else if (domain !== 'budget' && !entities.title) {
      missingField = 'title';
    }
  } else if ((action === 'update' || action === 'delete') && !entities.search) {
    missingField = 'target item';
  }

  if (missingField) {
    return {
      status: 'incomplete',
      domain,
      action,
      entities,
      confidence,
      source: 'natural-language',
      originalInput,
      intent,
      domainClassification,
      clarification: {
        question: `Please provide a ${missingField} for your complete request`,
        options: []
      }
    };
  }

  return {
    status: 'success',
    domain,
    action,
    entities,
    confidence,
    source: 'natural-language',
    originalInput,
    intent,
    domainClassification
  };
}

export * from './dates';
export * from './entities';
export * from './explicit';
