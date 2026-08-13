import { format, parse, isValid } from 'date-fns';
import type { CommandDefinition, CommandContext } from '../../commands/types';
import { ScheduleService } from './schedule.service';

export const scheduleCommand: CommandDefinition = {
  name: 'schedule',
  aliases: ['s'],
  namespace: 'schedule',
  category: 'productivity',
  keywords: ['event', 'events', 'calendar', 'meeting', 'appointment'],
  description: 'Manage schedule and events',
  usage: 'schedule [add <date> <time> <title> | list <date> | delete <id>]',
  subcommands: [
    { name: 'add', description: 'Add an event', usage: 'add <date> <time> <title>', example: 'add 11-08-2026 14:00 "Meeting"' },
    { name: 'list', description: 'List events for a date', usage: 'list <date>', example: 'list 11-08-2026' },
    {
      name: 'delete',
      description: 'Delete an event',
      usage: 'delete <id>',
      example: 'delete 1234',
      suggest: async (input: string, context: CommandContext) => {
        const service = new ScheduleService(context.repositories.schedule);
        const todos = await service.list();
        return todos.map(t => ({
          name: t.id.substring(0, 8),
          description: t.title,
          type: 'data' as const
        }));
      }
    },
  ],
  async execute(args: string[], context: CommandContext) {
    const service = new ScheduleService(context.repositories.schedule);

    if (args.length === 0) {
      return { type: 'navigate', path: '/schedule' };
    }

    const subCommand = args[0].toLowerCase();

    // Helper to parse dates
    const parseDateInput = (input: string) => {
      let d = parse(input, 'dd-MM-yyyy', new Date());
      if (!isValid(d)) d = parse(input, 'yyyy-MM-dd', new Date());
      if (!isValid(d)) d = new Date(input);
      return isValid(d) ? format(d, 'yyyy-MM-dd') : null;
    };

    switch (subCommand) {
      case 'add': {
        const rawDate = args[1];
        if (!rawDate) return { type: 'error', output: 'Date and Title are required.' };

        const date = parseDateInput(rawDate);
        if (!date) return { type: 'error', output: 'Invalid date format. Use dd-MM-yyyy or yyyy-MM-dd.' };

        const time = args[2] && args[2].includes(':') ? args[2] : undefined;
        const titleIndex = time ? 3 : 2;
        const title = args.slice(titleIndex).join(' ');

        if (!title) return { type: 'error', output: 'Date and Title are required.' };

        const item = await service.create(title, date, time);
        return { type: 'success', output: `Event added: ${item.title} on ${rawDate}` };
      }

      case 'list': {
        const rawDate = args[1];
        let date = new Date().toISOString().split('T')[0];

        if (rawDate) {
          const parsed = parseDateInput(rawDate);
          if (!parsed) return { type: 'error', output: 'Invalid date format.' };
          date = parsed;
        }

        const items = await service.listByDate(date);

        if (items.length === 0) return { type: 'text', output: `No events for ${date}.` };

        const output = items.map(i => `${i.time || 'All Day'} - ${i.title}`).join('\n');
        return { type: 'text', output: `Events for ${format(date, 'dd MMM yyyy')}:\n${output}` };
      }

      case 'delete': {
        const id = args[1];
        if (!id) return { type: 'error', output: 'ID is required.' };

        try {
          const schedules = await service.list();
          const item = schedules.find(s => s.id.startsWith(id));
          if (!item) return { type: 'error', output: `Event with ID starting with ${id} not found.` };

          await service.delete(item.id);
          return { type: 'success', output: `Event deleted: ${item.title}` };
        } catch (e: any) {
          return { type: 'error', output: e.message };
        }
      }

      default:
        return { type: 'error', output: `Unknown subcommand: ${subCommand}` };
    }
  }
};
