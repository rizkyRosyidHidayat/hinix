import type { CommandDefinition, CommandContext } from '../../commands/types';
import { TodoService } from './todo.service';
import { format, parse, isValid } from 'date-fns';

export const todoCommand: CommandDefinition = {
  name: 'todo',
  aliases: ['t'],
  namespace: 'todo',
  category: 'productivity',
  keywords: ['task', 'tasks', 'checklist', 'to-do'],
  description: 'Manage tasks',
  usage: 'todo [add <title> | list | update <id> | done <id> | delete <id>]',
  subcommands: [
    {
      name: 'add',
      description: 'Add a new task',
      usage: 'add <title>',
      example: 'add "Buy groceries"',
      flags: [
        {
          name: 'deadline',
          description: 'Deadline for the task',
          usage: '--deadline [DD-MM-YYYY] <HH:MM>',
          example: '--deadline 14:30',
        }
      ]
    },
    { name: 'list', description: 'List all tasks', usage: 'list', example: 'todo list' },
    {
      name: 'done',
      description: 'Mark a task as completed',
      usage: 'done <id>',
      example: 'done 1234',
      suggest: async (input: string, context: CommandContext) => {
        const service = new TodoService(context.repositories.todo);
        const todos = await service.list();
        // Only suggest incomplete tasks for 'done'
        return todos
          .filter(t => !t.completed)
          .map(t => ({
            name: t.id.substring(0, 8),
            description: t.title,
            type: 'data' as const
          }));
      }
    },
    {
      name: 'update',
      description: 'Update a task deadline',
      usage: 'update <id>',
      example: 'update 1234',
      suggest: async (input: string, context: CommandContext) => {
        const service = new TodoService(context.repositories.todo);
        const todos = await service.list();
        return todos.map(t => ({
          name: t.id.substring(0, 8),
          description: t.title,
          type: 'data' as const
        }));
      },
      flags: [
        {
          name: 'deadline',
          description: 'Deadline for the task',
          usage: '--deadline [DD-MM-YYYY] <HH:MM>',
          example: '--deadline 14:30',
        }
      ]
    },
    {
      name: 'delete',
      description: 'Delete a task',
      usage: 'delete <id>',
      example: 'delete 1234',
      suggest: async (input: string, context: CommandContext) => {
        const service = new TodoService(context.repositories.todo);
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
    const service = new TodoService(context.repositories.todo, context.repositories.schedule);

    if (args.length === 0 || args[0].toLowerCase() === 'list') {
      return { type: 'navigate', path: '/todo' };
    }

    const subCommand = args[0].toLowerCase();
    // Helper to parse dates
    const parseDateInput = (input: string) => {
      let d = parse(input, 'dd-MM-yyyy', new Date());
      if (!isValid(d)) d = parse(input, 'yyyy-MM-dd', new Date());
      if (!isValid(d)) d = new Date(input);
      return isValid(d) ? format(d, 'yyyy-MM-dd') : '';
    };

    switch (subCommand) {
      case 'add': {
        let deadline: string | undefined;

        // Parse flags
        const deadlineIndex = args.indexOf('--deadline');
        if (deadlineIndex !== -1 && deadlineIndex + 1 < args.length) {
          const part1 = args[deadlineIndex + 1];
          const part2 = deadlineIndex + 2 < args.length ? args[deadlineIndex + 2] : undefined;

          const timeRegex = /^([01]?\d|2[0-3]):[0-5]\d$/;
          const dateRegex = /^\d{2}-\d{2}-\d{4}$/;

          let parsedDeadline;
          let spliceCount = 2;

          if (part1.includes(' ')) {
            const [d, t] = part1.split(' ');
            if (dateRegex.test(d) && timeRegex.test(t)) {
              parsedDeadline = parseDateInput(part1);
            } else {
              return { type: 'error', output: 'Invalid --deadline format. Format: [DD-MM-YYYY] HH:MM' };
            }
          } else if (dateRegex.test(part1)) {
            if (part2 && timeRegex.test(part2)) {
              parsedDeadline = `${parseDateInput(part1)} ${part2}`;
              spliceCount = 3;
            } else {
              return { type: 'error', output: 'Time is required when specifying a date for --deadline. Format: [DD-MM-YYYY] HH:MM' };
            }
          } else if (timeRegex.test(part1)) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            parsedDeadline = `${yyyy}-${mm}-${dd} ${part1}`;
          } else {
            return { type: 'error', output: 'Invalid --deadline format. Format: [DD-MM-YYYY] HH:MM' };
          }

          deadline = parsedDeadline;
          args.splice(deadlineIndex, spliceCount);
        }

        const title = args.slice(1).join(' ');

        if (!title) return { type: 'error', output: 'Title is required. Usage: todo add "Task Title" [--deadline [DD-MM-YYYY] HH:MM]' };

        const todo = await service.create(title, deadline);
        return { type: 'success', output: `Task added: ${todo.title}${deadline ? ` (Deadline: ${deadline})` : ''}` };
      }

      case 'done': {
        const id = args[1];
        if (!id) return { type: 'error', output: 'ID is required. Usage: todo done <id>' };
        try {
          // In a real app we'd resolve short ID to full ID
          const todos = await service.list();
          const todo = todos.find(t => t.id.startsWith(id));
          if (!todo) return { type: 'error', output: `Task with ID starting with ${id} not found.` };

          await service.complete(todo.id);
          return { type: 'success', output: `Task marked as done: ${todo.title}` };
        } catch (e) {
          return { type: 'error', output: e instanceof Error ? e.message : 'Unknown error' };
        }
      }

      case 'update': {
        const id = args[1];
        if (!id) return { type: 'error', output: 'ID is required. Usage: todo update <id> [--deadline [DD-MM-YYYY] HH:MM]' };

        let deadline: string | undefined;

        // Parse flags
        const deadlineIndex = args.indexOf('--deadline');
        if (deadlineIndex !== -1 && deadlineIndex + 1 < args.length) {
          const part1 = args[deadlineIndex + 1];
          const part2 = deadlineIndex + 2 < args.length ? args[deadlineIndex + 2] : undefined;
          const timeRegex = /^([01]?\d|2[0-3]):[0-5]\d$/;
          const dateRegex = /^\d{2}-\d{2}-\d{4}$/;

          let parsedDeadline;
          let spliceCount = 2;

          if (part1 === '0') {
            parsedDeadline = undefined;
          } else if (part1.includes(' ')) {
            const [d, t] = part1.split(' ');
            if (dateRegex.test(d) && timeRegex.test(t)) {
              parsedDeadline = parseDateInput(part1);
            } else {
              return { type: 'error', output: 'Invalid --deadline format. Format: [DD-MM-YYYY] HH:MM' };
            }
          } else if (dateRegex.test(part1)) {
            if (part2 && timeRegex.test(part2)) {
              parsedDeadline = `${parseDateInput(part1)} ${part2}`;
              spliceCount = 3;
            } else {
              return { type: 'error', output: 'Time is required when specifying a date for --deadline. Format: [DD-MM-YYYY] HH:MM' };
            }
          } else if (timeRegex.test(part1)) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            parsedDeadline = `${yyyy}-${mm}-${dd} ${part1}`;
          } else {
            return { type: 'error', output: 'Invalid --deadline format. Format: [DD-MM-YYYY] HH:MM' };
          }

          deadline = parsedDeadline;
          args.splice(deadlineIndex, spliceCount);
        }

        try {
          const todos = await service.list();
          const todo = todos.find(t => t.id.startsWith(id));
          if (!todo) return { type: 'error', output: `Task with ID starting with ${id} not found.` };

          await service.update(todo.id, deadline);
          return { type: 'success', output: `Task updated: ${todo.title}${deadline ? ` (Deadline: ${deadline})` : ' (Deadline cleared)'}` };
        } catch (e) {
          return { type: 'error', output: e instanceof Error ? e.message : 'Unknown error' };
        }
      }

      case 'delete': {
        const id = args[1];
        if (!id) return { type: 'error', output: 'ID is required. Usage: todo delete <id>' };
        try {
          const todos = await service.list();
          const todo = todos.find(t => t.id.startsWith(id));
          if (!todo) return { type: 'error', output: `Task with ID starting with ${id} not found.` };

          await service.delete(todo.id);
          return { type: 'success', output: `Task deleted: ${todo.title}` };
        } catch (e) {
          return { type: 'error', output: e instanceof Error ? e.message : 'Unknown error' };
        }
      }

      default:
        return { type: 'error', output: `Unknown subcommand: ${subCommand}. See help.` };
    }
  }
};
