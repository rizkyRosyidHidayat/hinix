import type { CommandAction, CommandDomain, ParsedCommand, ParseOptions } from '../types';
import { COMMAND_ACTIONS, COMMAND_DOMAINS } from '../types';
import { extractEntities } from './entities';

export function parseExplicitCommand(input: string, options: ParseOptions = {}): ParsedCommand | undefined {
  const match = input.trim().match(/^(todo|schedule|habit|budget|note)s?\s+(add|create|list|show|update|delete|remove)\s*(.*)$/i);
  if (!match) return undefined;

  const domain = match[1].toLowerCase() as CommandDomain;
  const rawAction = match[2].toLowerCase();
  const action: CommandAction = rawAction === 'add' || rawAction === 'create' ? 'create' :
    rawAction === 'show' || rawAction === 'list' ? 'list' :
      rawAction === 'remove' ? 'delete' : rawAction as CommandAction;

  if (!COMMAND_DOMAINS.includes(domain) || !COMMAND_ACTIONS.includes(action)) return undefined;

  return {
    status: 'success',
    domain,
    action,
    entities: extractEntities(match[3], domain, action, options),
    confidence: 1,
    source: 'explicit-command',
    originalInput: input
  };
}
