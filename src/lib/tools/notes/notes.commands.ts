import type { CommandContext, CommandDefinition } from '../../commands/types';
import { NotesService } from './notes.service';

export const notesCommand: CommandDefinition = {
  name: 'notes',
  aliases: ['n', 'note'],
  namespace: 'notes',
  category: 'productivity',
  keywords: ['note', 'memo', 'write', 'text', 'document'],
  description: 'Manage personal notes',
  usage: 'notes [add <title> [--content <value>] | list | search <query> | update <id> [--content <value>] | pin <id> | unpin <id> | delete <id>]',
  subcommands: [
    {
      name: 'add',
      description: 'Create a new note',
      usage: 'add <title> [--content <value>]',
      example: 'add "Meeting ideas"',
      flags: [
        { name: 'content', usage: '--content <value>', description: 'Content of the note' }
      ]
    },
    {
      name: 'update',
      description: 'Update a note',
      usage: 'update <id> [--content <value>]',
      example: 'update abc123 --content "New text"',
      flags: [
        { name: 'content', usage: '--content <value>', description: 'New content for the note' }
      ],
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
    { name: 'list', description: 'List all notes', usage: 'list', example: 'list' },
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
    {
      name: 'pin',
      description: 'Pin a note to the top',
      usage: 'pin <id>',
      example: 'pin abc123',
      suggest: async (input: string, context: CommandContext) => {
        const service = new NotesService(context.repositories.notes);
        const notes = await service.list();
        return notes.filter(n => !n.pinned).map(n => ({
          name: n.id.substring(0, 8),
          description: n.title,
          type: 'data' as const
        }));
      }
    },
    {
      name: 'unpin',
      description: 'Unpin a note',
      usage: 'unpin <id>',
      example: 'unpin abc123',
      suggest: async (input: string, context: CommandContext) => {
        const service = new NotesService(context.repositories.notes);
        const notes = await service.listPinned();
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

    if (args.length === 0 || args[0].toLowerCase() === 'list') {
      return { type: 'navigate', path: '/notes' };
    }

    const subCommand = args[0].toLowerCase();

    switch (subCommand) {
      case 'add': {
        const contentFlagIndex = args.indexOf('--content');
        let titleArgs = args.slice(1);
        let content = '';

        if (contentFlagIndex !== -1) {
          titleArgs = args.slice(1, contentFlagIndex);
          content = args.slice(contentFlagIndex + 1).join(' ');
        }

        const title = titleArgs.join(' ');
        if (!title) {
          return { type: 'error', output: 'Title is required.\nUsage: notes add "My Note Title" [--content "content"]' };
        }
        const note = await service.create(title, content);
        return { type: 'success', output: `Note created: ${note.title}` };
      }

      case 'update': {
        const id = args[1];
        if (!id) {
          return { type: 'error', output: 'ID is required.\nUsage: notes update <id> --content "new content"' };
        }

        const contentFlagIndex = args.indexOf('--content');
        if (contentFlagIndex === -1) {
          return { type: 'error', output: 'Nothing to update. Provide --content <value>' };
        }

        const content = args.slice(contentFlagIndex + 1).join(' ');

        try {
          const notes = await service.list();
          const note = notes.find(n => n.id.startsWith(id));
          if (!note) {
            return { type: 'error', output: `Note with ID starting with "${id}" not found.` };
          }
          await service.update(note.id, { content });
          return { type: 'success', output: `Note updated: ${note.title}` };
        } catch (e) {
          return { type: 'error', output: e instanceof Error ? e.message : 'Unknown error' };
        }
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
        } catch (e) {
          return { type: 'error', output: e instanceof Error ? e.message : 'Unknown error' };
        }
      }

      case 'pin':
      case 'unpin': {
        const id = args[1];
        if (!id) {
          return { type: 'error', output: `ID is required.\nUsage: notes ${subCommand} <id>` };
        }
        try {
          const notes = await service.list();
          const note = notes.find(n => n.id.startsWith(id));
          if (!note) {
            return { type: 'error', output: `Note with ID starting with "${id}" not found.` };
          }
          if (subCommand === 'pin') {
            await service.pin(note.id);
            return { type: 'success', output: `Note pinned: ${note.title}` };
          } else {
            await service.unpin(note.id);
            return { type: 'success', output: `Note unpinned: ${note.title}` };
          }
        } catch (e) {
          return { type: 'error', output: e instanceof Error ? e.message : 'Unknown error' };
        }
      }

      default:
        return { type: 'error', output: `Unknown notes command: ${subCommand}` };
    }
  },
};
