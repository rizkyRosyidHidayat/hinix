import type { CommandDefinition, CommandContext } from '../../commands/types';
import { timerStore } from '../../stores/timer.svelte';

export const timerCommand: CommandDefinition = {
  name: 'timer',
  aliases: ['time'],
  namespace: 'timer',
  category: 'productivity',
  keywords: ['countdown', 'alarm', 'clock', 'pomodoro'],
  description: 'Manage timers',
  usage: 'timer [<duration>m | stop | pause | resume]',
  subcommands: [
    { name: 'start', usage: '<duration>m', description: 'Stop the active timer' },
    { name: 'stop', usage: 'stop', description: 'Stop the active timer' },
    { name: 'pause', usage: 'pause', description: 'Pause the active timer' },
    { name: 'resume', usage: 'resume', description: 'Resume a paused timer' },
  ],
  async execute(args: string[], context: CommandContext) {
    if (args.length === 0) {
      return { type: 'navigate', path: '/timer' };
    }

    const command = args[0].toLowerCase();

    if (command === 'stop') {
      timerStore.stop();
      return { type: 'success', output: 'Timer stopped.' };
    }

    if (command === 'pause') {
      timerStore.pause();
      return { type: 'success', output: 'Timer paused.' };
    }

    if (command === 'resume') {
      timerStore.resume();
      return { type: 'success', output: 'Timer resumed.' };
    }

    if (command.endsWith('m')) {
      const minutes = parseInt(command.replace('m', ''), 10);
      if (isNaN(minutes)) return { type: 'error', output: 'Invalid duration.' };

      timerStore.start(minutes * 60 * 1000);
      return { type: 'success', output: `Timer started for ${minutes} minutes.` };
    }

    return { type: 'error', output: `Unknown timer command: ${command}` };
  }
};
