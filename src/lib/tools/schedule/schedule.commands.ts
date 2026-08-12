import type { CommandDefinition, CommandContext } from '../../commands/types';
import { ScheduleService } from './schedule.service';

export const scheduleCommand: CommandDefinition = {
  name: 'schedule',
  aliases: ['s'],
  description: 'Manage schedule and events',
  usage: 'schedule [add <date> <time> <title> | list <date> | delete <id>]',
  examples: [
    'schedule add 2026-08-11 14:00 "Meeting"',
    'schedule list 2026-08-11'
  ],
  async execute(args: string[], context: CommandContext) {
    const service = new ScheduleService(context.repositories.schedule);

    if (args.length === 0) {
      return { type: 'navigate', path: '/schedule' };
    }

    const subCommand = args[0].toLowerCase();

    switch (subCommand) {
      case 'add': {
        const date = args[1];
        const time = args[2] && args[2].includes(':') ? args[2] : undefined;
        const titleIndex = time ? 3 : 2;
        const title = args.slice(titleIndex).join(' ');
        
        if (!date || !title) return { type: 'error', output: 'Date and Title are required.' };
        
        const item = await service.create(title, date, time);
        return { type: 'success', output: `Event added: ${item.title} on ${item.date}` };
      }

      case 'list': {
        const date = args[1] || new Date().toISOString().split('T')[0];
        const items = await service.listByDate(date);
        
        if (items.length === 0) return { type: 'text', output: `No events for ${date}.` };
        
        const output = items.map(i => `${i.time || 'All Day'} - ${i.title}`).join('\n');
        return { type: 'text', output: `Events for ${date}:\n${output}` };
      }

      case 'delete': {
        const id = args[1];
        if (!id) return { type: 'error', output: 'ID is required.' };
        
        await service.delete(id);
        return { type: 'success', output: 'Event deleted.' };
      }

      default:
        return { type: 'error', output: `Unknown subcommand: ${subCommand}` };
    }
  }
};
