import type { CommandContext, CommandDefinition } from '../../commands/types';
import { NotesService } from './notes.service';

export const notesCommand: CommandDefinition = {
  name: 'notes',
  aliases: ['n', 'note'],
  namespace: 'notes',
  category: 'productivity',
  keywords: ['note', 'memo', 'write', 'text', 'document'],
  description: 'Manage personal notes',
  usage: 'notes [add <title> | list | search <query> | delete <id>]',
  subcommands: [
    { name: 'add', description: 'Create a new note', usage: 'add <title>', example: 'add "Meeting ideas"' },
    { name: 'list', description: 'List all notes' },
    { name: 'search', description: 'Search notes', usage: 'search <query>', example: 'search meeting' },
    {
      name: 'delete',
      description: 'Delete a note',
      usage: 'delete <id>',
      example: 'delete abc123',
      suggest: async (input: string, context: CommandContext) => {
        const service = new NotesService(context.repositories.notes);
        const notes = await service.list();
        return notes.map(n => ({
          name: n.id.substring(0, 8),
          description: n.title,
          type: 'data' as const
        }));
      }
    },
  ],
  async execute(args: string[]) {
    const service = new NotesService();

    if (args.length === 0) {
      return { type: 'navigate', path: '/notes' };
    }

    const subCommand = args[0].toLowerCase();

    switch (subCommand) {
      case 'list': {
        const notes = await service.list();
        if (notes.length === 0) {
          return { type: 'text', output: 'No notes found.' };
        }
        const output = notes
          .map(n => `${n.id.substring(0, 8)} - ${n.title}`)
          .join('\n');
        return { type: 'text', output };
      }

      case 'add': {
        const title = args.slice(1).join(' ');
        if (!title) {
          return { type: 'error', output: 'Title is required.\nUsage: notes add "My Note Title"' };
        }
        const note = await service.create(title);
        return { type: 'success', output: `Note created: ${note.title}` };
      }

      case 'search': {
        const query = args.slice(1).join(' ');
        if (!query) {
          return { type: 'error', output: 'Search query is required.\nUsage: notes search <query>' };
        }
        const results = await service.search(query);
        if (results.length === 0) {
          return { type: 'text', output: `No notes matching "${query}".` };
        }
        const output = results
          .map(n => `${n.id.substring(0, 8)} - ${n.title}`)
          .join('\n');
        return { type: 'text', output };
      }

      case 'delete': {
        const id = args[1];
        if (!id) {
          return { type: 'error', output: 'ID is required.\nUsage: notes delete <id>' };
        }
        try {
          const notes = await service.list();
          const note = notes.find(n => n.id.startsWith(id));
          if (!note) {
            return { type: 'error', output: `Note with ID starting with "${id}" not found.` };
          }
          await service.delete(note.id);
          return { type: 'success', output: `Note deleted: ${note.title}` };
        } catch (e: any) {
          return { type: 'error', output: e.message };
        }
      }

      default:
        return { type: 'error', output: `Unknown notes command: ${subCommand}` };
    }
  },
};
