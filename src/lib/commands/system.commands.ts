import type { CommandDefinition, CommandResult } from './types';
import { settingsStore, type FeatureSettings } from '../stores/settings.svelte';
import { syncStore } from '../stores/sync.svelte';
import { syncService } from '../sync/sync.service';

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

export const statisticsCommand: CommandDefinition = {
  name: 'statistics',
  aliases: ['stats'],
  category: 'system',
  keywords: ['stats', 'overview', 'summary', 'data', 'analytics'],
  description: 'View your statistics and data overview',
  usage: 'statistics',
  async execute() {
    return { type: 'navigate', path: '/statistics' };
  }
};

// export const historyCommand: CommandDefinition = {
//   name: 'history',
//   category: 'system',
//   description: 'Display command history',
//   usage: 'history',
//   async execute() {
//     const history = [...shellStore.history].reverse();
//     if (history.length === 0) {
//       return { type: 'text', output: 'No command history.' };
//     }
//     const output = history.map((cmd, i) => `${(i + 1).toString().padStart(3, ' ')}  ${cmd}`).join('\n');
//     return { type: 'text', output };
//   }
// };
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
  namespace: 'settings',
  category: 'system',
  description: 'Manage settings and feature toggles',
  usage: 'settings <enable|disable|theme> [args]',
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
    },
    {
      name: 'theme',
      description: 'Change the application theme',
      usage: 'theme <system|light|dark>',
      example: 'settings theme dark',
      suggest: async () => {
        return await new Promise((resolve) => {
          resolve([
            { name: 'system', description: 'Follow system preference', type: 'data' as const },
            { name: 'light', description: 'Light theme', type: 'data' as const },
            { name: 'dark', description: 'Dark theme', type: 'data' as const }
          ]);
        });
      },
    },
    {
      name: 'sync',
      description: 'Manage Google Sheets sync',
      usage: 'sync <set|status|push|disable>',
      example: 'settings sync push',
      suggest: async () => [
        { name: 'set', description: 'Set Google Apps Script URL', type: 'data' as const },
        { name: 'status', description: 'Show sync connection status', type: 'data' as const },
        { name: 'push', description: 'Push all local data to Sheet', type: 'data' as const },
        // { name: 'pull', description: 'Pull all data from Sheet to local', type: 'data' as const },
        { name: 'disable', description: 'Disable sync', type: 'data' as const },
      ]
    }
  ],
  async execute(args: string[]) {
    if (args.length === 0) {
      return { type: 'navigate', path: '/settings' };
    }

    const action = args[0].toLowerCase();

    if (action === 'sync') {
      const subAction = args[1]?.toLowerCase();
      if (subAction === 'set') {
        const url = args[2];
        if (!url) return { type: 'error', output: 'Missing URL. Usage: settings sync set <url>' };
        await syncStore.setScriptUrl(url);
        await syncStore.setEnabled(true);
        return { type: 'success', output: 'Sync URL set and sync enabled.' };
      } else if (subAction === 'disable') {
        await syncStore.setScriptUrl('');
        await syncStore.setEnabled(false);
        return { type: 'success', output: 'Sync disabled.' };
      } else if (subAction === 'status') {
        const enabled = syncStore.enabled;
        const last = syncStore.lastSyncAt ? new Date(syncStore.lastSyncAt).toLocaleString() : 'Never';
        return { type: 'text', output: `Sync Enabled: ${enabled}\nStatus: ${syncStore.status}\nLast Sync: ${last}` };
      } else if (subAction === 'push') {
        try {
          let result: CommandResult = { type: 'loading', output: 'Syncing...' };
          result = await syncService.pushAllTables();
          return result;
        } catch (e) {
          return { type: 'error', output: `Push failed: ${e instanceof Error ? e.message : e}` };
        }
      }
      // else if (subAction === 'pull') {
      //   try {
      //     await syncService.pullAllTables();
      //     return { type: 'success', output: 'Pulled all data from Google Sheets.' };
      //   } catch (e) {
      //     return { type: 'error', output: `Pull failed: ${e instanceof Error ? e.message : e}` };
      //   }
      // }
      return { type: 'error', output: 'Invalid sync action. Use set, status, push, pull, or disable.' };
    }

    if (action === 'theme') {
      const themeStr = args[1]?.toLowerCase();
      if (!themeStr || (themeStr !== 'system' && themeStr !== 'light' && themeStr !== 'dark')) {
        return { type: 'error', output: 'Invalid theme. Use system, light, or dark.' };
      }
      await settingsStore.setTheme(themeStr);
      return { type: 'success', output: `Theme set to ${themeStr}.` };
    }

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

    return { type: 'error', output: 'Invalid action. Use enable, disable or theme.' };
  }
};