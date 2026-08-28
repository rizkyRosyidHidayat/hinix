import { parseCommand } from './parser';
import { parseSmartCommand } from '../parser/parser';
import { adaptIntentToCommand } from '../parser/adapter';
import { registry } from './registry';
// import { contextManager } from '../stores/contextManager.svelte';
import type { CommandContext, CommandResult } from './types';
import { HiNixError } from '../errors';
import { settingsStore, type FeatureSettings } from '../stores/settings.svelte';

export async function executeCommand(
  input: string,
  context: CommandContext
): Promise<CommandResult> {
  if (!input.trim()) {
    return { type: 'text', output: '' };
  }

  let command: string | undefined;
  let args: string[] = [];

  // 1. Try Smart Parser First
  const smartIntent = parseSmartCommand(input);

  if (smartIntent.confidence >= 0.8) {
    const adapted = adaptIntentToCommand(smartIntent);
    if (adapted) {
      command = adapted.command;
      args = adapted.args;
    }
  } else if (smartIntent.confidence > 0 && smartIntent.confidence < 0.8) {
    // Ambiguous — show what the parser thinks the user meant
    return {
      type: 'error',
      output: `Command not identified. Please be more specific.\nDid you mean to ${smartIntent.intent.replace(/_/g, ' ').toLowerCase()}?`,
    };
  }

  // 2. Fallback to Legacy Parser
  if (!command) {
    const parsedLegacy = parseCommand(input);
    command = parsedLegacy.command;
    args = parsedLegacy.args;
  }

  if (!command) {
    return { type: 'text', output: '' };
  }

  // Handle "exit" to leave active context
  // if (command === 'exit') {
  //   if (contextManager.isActive()) {
  //     contextManager.exit();
  //     goto(resolve('/'));
  //     return { type: 'context_exited' };
  //   }
  //   return { type: 'text', output: 'No active context to exit.' };
  // }

  const cmdDef = registry.get(command);
  const finalArgs = args;

  // if (!cmdDef && contextManager.isActive()) {
  //   // If not found globally, assume it's a subcommand of the active context
  //   const ns = contextManager.namespace!;
  //   cmdDef = registry.get(ns);
  //   finalArgs = [command, ...args];
  // }

  if (!cmdDef) {
    // Show recommendations from the smart parser if available
    let errorMsg = `Command not found: ${command}. Type "help" for a list of commands.`;
    if (smartIntent.recommendations && smartIntent.recommendations.length > 0) {
      errorMsg = `Command not identified. Try:\n${smartIntent.recommendations.map((r) => `  • ${r}`).join('\n')}`;
    }

    return {
      type: 'error',
      output: errorMsg,
    };
  }

  // Check if command is disabled
  const featureKey = (cmdDef.namespace || cmdDef.name) as keyof FeatureSettings;
  if (featureKey in settingsStore.features && !settingsStore.features[featureKey]) {
    return {
      type: 'error',
      output: `Feature '${featureKey}' is currently disabled. Enable it in settings.`,
    };
  }

  // If a command declares a namespace and is called with no args → enter context
  // if (cmdDef.namespace && args.length === 0) {
  //   contextManager.enter(cmdDef.namespace);
  // }

  try {
    return await cmdDef.execute(finalArgs, context);
  } catch (error) {
    if (error instanceof HiNixError) {
      const parts = [error.message];
      if (error.hint) {
        parts.push(`\n${error.hint}`);
      }
      return { type: 'error', output: parts.join('') };
    }
    return {
      type: 'error',
      output: error instanceof Error ? error.message : String(error),
    };
  }
}

