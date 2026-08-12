import type { CommandDefinition, CommandContext } from '../../commands/types';
import { TodoService } from './todo.service';

export const todoCommand: CommandDefinition = {
  name: 'todo',
  aliases: ['t'],
  namespace: 'todo',
  description: 'Manage tasks',
  usage: 'todo [add <title> | list | done <id> | delete <id>]',
  subcommands: [
    { name: 'add', description: 'Add a new task', usage: 'add <title>', example: 'todo add "Buy groceries"' },
    { name: 'list', description: 'List all tasks' },
    { name: 'done', description: 'Mark a task as completed', usage: 'done <id>', example: 'done 1234' },
    { name: 'delete', description: 'Delete a task', usage: 'delete <id>', example: 'delete 1234' },
  ],
  async execute(args: string[], context: CommandContext) {
    const service = new TodoService(context.repositories.todo);

    if (args.length === 0) {
      return { type: 'navigate', path: '/todo' };
    }

    const subCommand = args[0].toLowerCase();

    switch (subCommand) {
      case 'list': {
        const todos = await service.list();
        if (todos.length === 0) {
          return { type: 'text', output: 'No tasks found.' };
        }
        const output = todos.map(t => `[${t.completed ? 'x' : ' '}] ${t.id.substring(0, 8)} - ${t.title}`).join('\n');
        return { type: 'text', output };
      }

      case 'add': {
        const title = args.slice(1).join(' ');
        if (!title) return { type: 'error', output: 'Title is required. Usage: todo add "Task Title"' };
        const todo = await service.create(title);
        return { type: 'success', output: `Task added: ${todo.title}` };
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
        } catch (e: any) {
          return { type: 'error', output: e.message };
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
        } catch (e: any) {
          return { type: 'error', output: e.message };
        }
      }

      default:
        return { type: 'error', output: `Unknown subcommand: ${subCommand}. See help.` };
    }
  }
};
