import type { CommandDefinition } from '../../commands/types';

// export const clearCommand: CommandDefinition = {
//   name: 'clear',
//   aliases: ['cls'],
//   category: 'system',
//   description: 'Clear the terminal output',
//   usage: 'clear',
//   async execute() {
//     return { type: 'clear' } as CommandResult;
//   }
// };

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

export const aboutCommand: CommandDefinition = {
  name: 'about',
  aliases: ['info'],
  category: 'system',
  description: 'View information about the system and support options',
  usage: 'about',
  async execute() {
    return { type: 'navigate', path: '/about' };
  }
};
