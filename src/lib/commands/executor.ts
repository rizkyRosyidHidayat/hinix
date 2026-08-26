import { parseCommand } from './parser';
import { registry } from './registry';
import { contextManager } from '../stores/contextManager.svelte';
import type { CommandContext, CommandResult } from './types';
import { HiNixError } from '../errors';
import { goto } from '$app/navigation';
import { settingsStore, type FeatureSettings } from '../stores/settings.svelte';
import { resolve } from '$app/paths';

export async function executeCommand(
  input: string,
  context: CommandContext
): Promise<CommandResult> {
  const { command, args } = parseCommand(input);

  if (!command) {
    return { type: 'text', output: '' };
  }

  // Handle "exit" to leave active context
  if (command === 'exit') {
    if (contextManager.isActive()) {
      contextManager.exit();
      goto(resolve('/'));
      return { type: 'context_exited' };
    }
    return { type: 'text', output: 'No active context to exit.' };
  }

  let cmdDef = registry.get(command);
  let finalArgs = args;

  if (!cmdDef && contextManager.isActive()) {
    // If not found globally, assume it's a subcommand of the active context
    const ns = contextManager.namespace!;
    cmdDef = registry.get(ns);
    finalArgs = [command, ...args];
  }

  if (!cmdDef) {
    const ns = contextManager.isActive() ? contextManager.namespace : null;
    const errorMsg = ns
      ? `Unknown ${ns} command: ${command}`
      : `Command not found: ${command}. Type "help" for a list of commands.`;

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
  if (cmdDef.namespace && args.length === 0) {
    contextManager.enter(cmdDef.namespace);
  }

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

