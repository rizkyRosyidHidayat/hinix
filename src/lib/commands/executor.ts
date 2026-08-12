import { parseCommand } from './parser';
import { registry } from './registry';
import type { CommandContext, CommandResult } from './types';

export async function executeCommand(
  input: string,
  context: CommandContext
): Promise<CommandResult> {
  const { command, args } = parseCommand(input);

  if (!command) {
    return { type: 'text', output: '' };
  }

  const cmdDef = registry.get(command);

  if (!cmdDef) {
    return {
      type: 'error',
      output: `Command not found: ${command}. Type "help" for a list of commands.`,
    };
  }

  try {
    return await cmdDef.execute(args, context);
  } catch (error) {
    return {
      type: 'error',
      output: error instanceof Error ? error.message : String(error),
    };
  }
}
