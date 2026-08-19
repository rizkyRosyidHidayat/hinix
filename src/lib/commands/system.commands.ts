import type { CommandDefinition, CommandResult } from './types';
import { shellStore } from '../stores/shell.svelte';
import { settingsStore, type FeatureSettings } from '../stores/settings.svelte';

export const clearCommand: CommandDefinition = {
  name: 'clear',
  aliases: ['cls'],
  category: 'system',
  description: 'Clear the terminal output',
  usage: 'clear',
  async execute() {
    return { type: 'clear' } as CommandResult;
  }
};

export const dashboardCommand: CommandDefinition = {
  name: 'dashboard',
  aliases: ['home'],
  category: 'system',
  keywords: ['main', 'home', 'overview'],
  description: 'Go to the dashboard page',
  usage: 'dashboard',
  async execute() {
    return { type: 'navigate', path: '/' };
  }
};

export const historyCommand: CommandDefinition = {
  name: 'history',
  category: 'system',
  description: 'Display command history',
  usage: 'history',
  async execute() {
    const history = [...shellStore.history].reverse();
    if (history.length === 0) {
      return { type: 'text', output: 'No command history.' };
    }
    const output = history.map((cmd, i) => `${(i + 1).toString().padStart(3, ' ')}  ${cmd}`).join('\n');
    return { type: 'text', output };
  }
};
export const helpCommand: CommandDefinition = {
  name: 'help',
  aliases: ['?'],
  category: 'system',
  description: 'Show guidance on how to use HiNix',
  usage: 'help',
  async execute() {
    return { type: 'navigate', path: '/help' };
  }
};

export const settingsCommand: CommandDefinition = {
  name: 'settings',
  aliases: ['config'],
  category: 'system',
  description: 'Manage settings and feature toggles',
  usage: 'settings [enable|disable] <feature>',
  subcommands: [
    {
      name: 'enable',
      usage: 'enable <feature>',
      description: 'Enable a specific feature',
      example: 'settings enable todo',
      suggest: async () => {
        const features = settingsStore.features;
        return await new Promise((resolve) => {
          setTimeout(() => {
            resolve(Object.keys(features).filter(f => !features[f as keyof FeatureSettings]).map(f => {
              return {
                name: f,
                description: `Enable ${f}`,
                type: 'data' as const
              };
            }));
          }, 100);
        });
      }
    },
    {
      name: 'disable',
      usage: 'disable <feature>',
      description: 'Disable a specific feature',
      example: 'settings disable todo',
      suggest: async () => {
        const features = settingsStore.features;
        return await new Promise((resolve) => {
          setTimeout(() => {
            resolve(Object.keys(features).filter(f => features[f as keyof FeatureSettings]).map(f => {
              return {
                name: f,
                description: `Disable ${f}`,
                type: 'data' as const
              };
            }));
          }, 100);
        });
      }
    }
  ],
  async execute(args: string[]) {
    if (args.length === 0) {
      return { type: 'navigate', path: '/settings' };
    }

    const action = args[0].toLowerCase();
    const feature = args[1]?.toLowerCase();

    if (!feature || !(feature in settingsStore.features)) {
      return { type: 'error', output: `Invalid feature: ${feature}. Available features: ${Object.keys(settingsStore.features).join(', ')}` };
    }

    const validFeature = feature as keyof FeatureSettings;

    if (action === 'enable') {
      await settingsStore.toggleFeature(validFeature, true);
      return { type: 'success', output: `Feature '${validFeature}' enabled.` };
    } else if (action === 'disable') {
      await settingsStore.toggleFeature(validFeature, false);
      return { type: 'success', output: `Feature '${validFeature}' disabled.` };
    }

    return { type: 'error', output: 'Invalid action. Use enable or disable.' };
  }
};
