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
  usage: 'todo [add <title> | list | view <id> | update <id> | done <id> | undo <id> | delete <id>]',
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
          usage: '--deadline <HH:MM> [DD-MM-YYYY]',
          example: '--deadline 14:30',
        },
        {
          name: 'description',
          description: 'Description for the task',
          usage: '--description <value>',
          example: '--description "Buy milk and eggs"',
        }
      ]
    },
    { name: 'list', description: 'List all tasks', usage: 'list', example: 'list' },
    {
      name: 'view',
      description: 'View task details',
      usage: 'view <id>',
      example: 'view 1234',
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
      name: 'undo',
      description: 'Mark a task as incomplete',
      usage: 'undo <id>',
      example: 'undo 1234',
      suggest: async (input: string, context: CommandContext) => {
        const service = new TodoService(context.repositories.todo);
        const todos = await service.list();
        // Only suggest complete tasks for 'undo'
        return todos
          .filter(t => t.completed)
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
          usage: '--deadline <HH:MM> [DD-MM-YYYY]',
          example: '--deadline 14:30',
        },
        {
          name: 'description',
          description: 'Description for the task',
          usage: '--description <value>',
          example: '--description "Buy milk and eggs"',
        },
        {
          name: 'title',
          description: 'Title for the task',
          usage: '--title <value>',
          example: '--title "New Task Title"',
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
            const [t, d] = part1.split(' ');
            if (timeRegex.test(t) && dateRegex.test(d)) {
              parsedDeadline = `${parseDateInput(d)} ${t}`;
            } else {
              return { type: 'error', output: 'Invalid --deadline format. Format: <HH:MM> [DD-MM-YYYY]' };
            }
          } else if (timeRegex.test(part1)) {
            if (part2 && dateRegex.test(part2)) {
              parsedDeadline = `${parseDateInput(part2)} ${part1}`;
              spliceCount = 3;
            } else {
              const today = new Date();
              const yyyy = today.getFullYear();
              const mm = String(today.getMonth() + 1).padStart(2, '0');
              const dd = String(today.getDate()).padStart(2, '0');
              parsedDeadline = `${yyyy}-${mm}-${dd} ${part1}`;
            }
          } else {
            return { type: 'error', output: 'Invalid --deadline format. Format: <HH:MM> [DD-MM-YYYY]' };
          }

          deadline = parsedDeadline;
          args.splice(deadlineIndex, spliceCount);
        }

        let description: string | undefined;
        const descIndex = args.indexOf('--description');
        if (descIndex !== -1 && descIndex + 1 < args.length) {
          description = args[descIndex + 1];
          args.splice(descIndex, 2);
        }

        const title = args.slice(1).join(' ');

        if (!title) return { type: 'error', output: 'Title is required. Usage: todo add "Task Title" [--deadline <HH:MM> [DD-MM-YYYY]]' };

        const todo = await service.create(title, deadline, description);
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

      case 'undo': {
        const id = args[1];
        if (!id) return { type: 'error', output: 'ID is required. Usage: todo undo <id>' };
        try {
          const todos = await service.list();
          const todo = todos.find(t => t.id.startsWith(id));
          if (!todo) return { type: 'error', output: `Task with ID starting with ${id} not found.` };

          await service.uncomplete(todo.id);
          return { type: 'success', output: `Task marked as incomplete: ${todo.title}` };
        } catch (e) {
          return { type: 'error', output: e instanceof Error ? e.message : 'Unknown error' };
        }
      }

      case 'view': {
        const id = args[1];
        if (!id) return { type: 'error', output: 'ID is required. Usage: todo view <id>' };
        try {
          const todos = await service.list();
          const todo = todos.find(t => t.id.startsWith(id));
          if (!todo) return { type: 'error', output: `Task with ID starting with ${id} not found.` };
          return { type: 'navigate', path: `/todo?id=${todo.id}` };
        } catch (e) {
          return { type: 'error', output: e instanceof Error ? e.message : 'Unknown error' };
        }
      }

      case 'update': {
        const id = args[1];
        if (!id) return { type: 'error', output: 'ID is required. Usage: todo update <id> [--deadline <HH:MM> [DD-MM-YYYY]] [--description <value>] [--title <value>]' };

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
            const [t, d] = part1.split(' ');
            if (timeRegex.test(t) && dateRegex.test(d)) {
              parsedDeadline = `${parseDateInput(d)} ${t}`;
            } else {
              return { type: 'error', output: 'Invalid --deadline format. Format: <HH:MM> [DD-MM-YYYY]' };
            }
          } else if (timeRegex.test(part1)) {
            if (part2 && dateRegex.test(part2)) {
              parsedDeadline = `${parseDateInput(part2)} ${part1}`;
              spliceCount = 3;
            } else {
              const today = new Date();
              const yyyy = today.getFullYear();
              const mm = String(today.getMonth() + 1).padStart(2, '0');
              const dd = String(today.getDate()).padStart(2, '0');
              parsedDeadline = `${yyyy}-${mm}-${dd} ${part1}`;
            }
          } else {
            return { type: 'error', output: 'Invalid --deadline format. Format: <HH:MM> [DD-MM-YYYY]' };
          }

          deadline = parsedDeadline;
          args.splice(deadlineIndex, spliceCount);
        }

        let description: string | undefined;
        const descIndex = args.indexOf('--description');
        if (descIndex !== -1 && descIndex + 1 < args.length) {
          description = args[descIndex + 1];
          args.splice(descIndex, 2);
        }

        let title: string | undefined;
        const titleIndex = args.indexOf('--title');
        if (titleIndex !== -1 && titleIndex + 1 < args.length) {
          title = args[titleIndex + 1];
          args.splice(titleIndex, 2);
        }

        try {
          const todos = await service.list();
          const todo = todos.find(t => t.id.startsWith(id));
          if (!todo) return { type: 'error', output: `Task with ID starting with ${id} not found.` };

          await service.update(todo.id, deadline, description, title);
          return { type: 'success', output: `Task updated: ${title || todo.title}${deadline !== undefined ? ` (Deadline: ${deadline || 'cleared'})` : ''}` };
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
