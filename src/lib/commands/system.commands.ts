import type { CommandDefinition } from './types';
import { shellStore } from '../stores/shell.svelte';

export const clearCommand: CommandDefinition = {
  name: 'clear',
  aliases: ['cls'],
  category: 'system',
  description: 'Clear the terminal output',
  usage: 'clear',
  async execute() {
    return { type: 'clear' } as any;
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

