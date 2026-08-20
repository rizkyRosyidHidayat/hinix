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
  usage: 'schedule [add <title> <time> --date [DD-MM-YYYY] | list <date> | update <id> [--time HH:MM] [--date DD-MM-YYYY] | delete <id>]',
  subcommands: [
    {
      name: 'add',
      description: 'Add an event',
      usage: 'add <title> <time>',
      example: 'add "Meeting" 14:00',
      flags: [
        {
          name: 'date',
          description: 'Date of the event',
          usage: '--date [DD-MM-YYYY]',
          example: '--date ' + format(new Date(), 'dd-MM-yyyy')
        }
      ]
    },
    { name: 'list', description: 'List events for a date', usage: 'list <date>', example: 'list ' + format(new Date(), 'dd-MM-yyyy') },
    {
      name: 'delete',
      description: 'Delete an event',
      usage: 'delete <id>',
      example: 'delete 1234',
      suggest: async (input: string, context: CommandContext) => {
        const service = new ScheduleService(context.repositories.schedule, context.repositories.habits);
        const todos = await service.list();
        return todos.map(t => ({
          name: t.id.substring(0, 8),
          description: t.title,
          type: 'data' as const
        }));
      }
    },
    {
      name: 'update',
      description: 'Update an event',
      usage: 'update <id>',
      example: 'update 1234',
      flags: [
        { name: 'time', description: 'New time', usage: '--time HH:MM', example: '--time 14:00' },
        { name: 'date', description: 'New date', usage: '--date DD-MM-YYYY', example: '--date ' + format(new Date(), 'dd-MM-yyyy') }
      ],
      suggest: async (input: string, context: CommandContext) => {
        const service = new ScheduleService(context.repositories.schedule, context.repositories.habits);
        const items = await service.list();
        return items.map(t => ({
          name: t.id.substring(0, 8),
          description: t.title,
          type: 'data' as const
        }));
      }
    },
  ],
  async execute(args: string[], context: CommandContext) {
    const service = new ScheduleService(context.repositories.schedule, context.repositories.habits);

    if (args.length === 0 || args[0].toLowerCase() === 'list') {
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
        let date: string | undefined;
        let time: string | undefined;

        // Parse flags
        const dateIndex = args.indexOf('--date');
        if (dateIndex !== -1 && dateIndex + 1 < args.length) {
          const rawDate = args[dateIndex + 1];
          const parsed = parseDateInput(rawDate);

          if (!parsed) {
            return { type: 'error', output: 'Invalid --date format. Format: [DD-MM-YYYY] or [YYYY-MM-DD]' };
          }
          date = parsed;
          args.splice(dateIndex, 2);
        } else {
          // Default to today if no date is provided
          const today = new Date();
          const yyyy = today.getFullYear();
          const mm = String(today.getMonth() + 1).padStart(2, '0');
          const dd = String(today.getDate()).padStart(2, '0');
          date = `${yyyy}-${mm}-${dd}`;
        }

        const timeRegex = /^([01]?\d|2[0-3]):[0-5]\d$/;
        if (args.length > 1) {
          const lastArg = args[args.length - 1];
          if (timeRegex.test(lastArg)) {
            time = lastArg;
            args.pop(); // Remove time from args
          }
        }

        const title = args.slice(1).join(' ');

        if (!title) return { type: 'error', output: 'Title is required. Usage: schedule add "Event Title" [HH:MM] [--date [DD-MM-YYYY]]' };

        if (!date) return { type: 'error', output: 'Invalid date format.' };

        const item = await service.create(title, date, time);
        return { type: 'success', output: `Event added: ${item.title} on ${format(new Date(date), 'dd MM yyyy')}${time ? ` at ${time}` : ''}` };
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
        } catch (e) {
          return { type: 'error', output: e instanceof Error ? e.message : 'Unknown error' };
        }
      }

      case 'update': {
        const id = args[1];
        if (!id) return { type: 'error', output: 'ID is required.\nUsage: schedule update <id> [--time HH:MM] [--date DD-MM-YYYY]' };

        try {
          const schedules = await service.list();
          const item = schedules.find(s => s.id.startsWith(id));
          if (!item) return { type: 'error', output: `Event with ID starting with "${id}" not found.` };

          const changes: { date?: string; time?: string } = {};

          const dateIndex = args.indexOf('--date');
          if (dateIndex !== -1 && dateIndex + 1 < args.length) {
            const parsed = parseDateInput(args[dateIndex + 1]);
            if (!parsed) return { type: 'error', output: 'Invalid --date format. Format: [DD-MM-YYYY] or [YYYY-MM-DD]' };
            changes.date = parsed;
          }

          const timeIndex = args.indexOf('--time');
          if (timeIndex !== -1 && timeIndex + 1 < args.length) {
            const timeRegex = /^([01]?\d|2[0-3]):[0-5]\d$/;
            const rawTime = args[timeIndex + 1];
            if (!timeRegex.test(rawTime)) return { type: 'error', output: 'Invalid --time format. Format: HH:MM (e.g. 14:00)' };
            changes.time = rawTime;
          }

          if (Object.keys(changes).length === 0) {
            return { type: 'error', output: 'Nothing to update. Provide --time and/or --date.' };
          }

          await context.repositories.schedule.update(item.id, changes);
          const parts = [];
          if (changes.date) parts.push(`date → ${format(new Date(changes.date), 'dd MM yyyy')}`);
          if (changes.time) parts.push(`time → ${changes.time}`);
          return { type: 'success', output: `Event updated: ${item.title} (${parts.join(', ')})` };
        } catch (e) {
          return { type: 'error', output: e instanceof Error ? e.message : 'Unknown error' };
        }
      }

      default:
        return { type: 'error', output: `Unknown subcommand: ${subCommand}` };
    }
  }
};
