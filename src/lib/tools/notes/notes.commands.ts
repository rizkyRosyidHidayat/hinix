import type { CommandContext, CommandDefinition } from '../../commands/types';
import { NotesService } from './notes.service';

export const notesCommand: CommandDefinition = {
	name: 'notes',
	aliases: ['n', 'note'],
	namespace: 'notes',
	category: 'productivity',
	keywords: ['note', 'memo', 'write', 'text', 'document'],
	description: 'Manage personal notes',
	usage:
		'notes [add <title> | list | view <id> | update <id> | pin <id> | unpin <id> | delete <id>]',
	subcommands: [
		{
			name: 'add',
			description: 'Create a new note',
			usage: 'add <title> [--content <value>]',
			example: 'add "Meeting ideas"',
			flags: [
				{
					name: 'content',
					usage: '--content <value>',
					description: 'Content of the note',
					example: '--content "Meeting ideas"'
				}
			]
		},
		{
			name: 'update',
			description: 'Update a note',
			usage: 'update <id> [--title <value>] [--content <value>]',
			example: 'update abc123',
			flags: [
				{
					name: 'title',
					usage: '--title <value>',
					description: 'New title for the note',
					example: '--title "New title"'
				},
				{
					name: 'content',
					usage: '--content <value>',
					description: 'New content for the note',
					example: '--content "New content"'
				}
			],
			suggest: async (input: string, context: CommandContext) => {
				const service = new NotesService(context.repositories.notes);
				const notes = await service.list();
				return notes.map((n) => ({
					name: n.id.substring(0, 8),
					description: n.title,
					type: 'data' as const
				}));
			}
		},
		{
			name: 'list',
			description: 'List all notes',
			usage: 'list [--filter <all|pinned|unpinned>]',
			example: 'list --filter pinned',
			flags: [
				{
					name: 'filter',
					usage: '--filter <value>',
					description: 'Filter list by status',
					example: '--filter pinned',
					suggest: async () => [
						{ name: 'all', description: 'Show all notes', type: 'data' },
						{ name: 'pinned', description: 'Show pinned notes only', type: 'data' },
						{ name: 'unpinned', description: 'Show unpinned notes only', type: 'data' }
					]
				}
			]
		},
		{
			name: 'view',
			description: 'View a note in the editor',
			usage: 'view <id>',
			example: 'view abc123',
			suggest: async (input: string, context: CommandContext) => {
				const service = new NotesService(context.repositories.notes);
				const notes = await service.list();
				return notes.map((n) => ({
					name: n.id.substring(0, 8),
					description: n.title,
					type: 'data' as const
				}));
			}
		},
		{
			name: 'delete',
			description: 'Delete a note',
			usage: 'delete <id>',
			example: 'delete abc123',
			suggest: async (input: string, context: CommandContext) => {
				const service = new NotesService(context.repositories.notes);
				const notes = await service.list();
				return notes.map((n) => ({
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
				return notes
					.filter((n) => !n.pinned)
					.map((n) => ({
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
				return notes.map((n) => ({
					name: n.id.substring(0, 8),
					description: n.title,
					type: 'data' as const
				}));
			}
		}
	],
	async execute(args: string[]) {
		const service = new NotesService();

		if (args.length === 0 || args[0].toLowerCase() === 'list') {
			let filter = 'all';
			const filterIndex = args.indexOf('--filter');
			if (filterIndex !== -1 && filterIndex + 1 < args.length) {
				filter = args[filterIndex + 1];
			}
			return { type: 'navigate', path: `/notes${filter !== 'all' ? `?filter=${filter}` : ''}` };
		}

		const subCommand = args[0].toLowerCase();

		switch (subCommand) {
			case 'view': {
				const id = args[1];
				if (!id) {
					return { type: 'error', output: 'ID is required.\nUsage: notes view <id>' };
				}
				const notes = await service.list();
				const note = notes.find((n) => n.id.startsWith(id));
				if (!note) {
					return { type: 'error', output: `Note with ID starting with "${id}" not found.` };
				}
				return { type: 'navigate', path: `/notes?id=${note.id}` };
			}

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
					return {
						type: 'error',
						output: 'Title is required.\nUsage: notes add "My Note Title" [--content "content"]'
					};
				}
				const note = await service.create(title, content);
				return { type: 'success', output: `Note created: ${note.title}` };
			}

			case 'update': {
				const id = args[1];
				if (!id) {
					return {
						type: 'error',
						output:
							'ID is required.\nUsage: notes update <id> [--title "new title"] [--content "new content"]'
					};
				}

				let content: string | undefined;
				const contentFlagIndex = args.indexOf('--content');
				if (contentFlagIndex !== -1 && contentFlagIndex + 1 < args.length) {
					content = args[contentFlagIndex + 1];
					args.splice(contentFlagIndex, 2);
				}

				let title: string | undefined;
				const titleFlagIndex = args.indexOf('--title');
				if (titleFlagIndex !== -1 && titleFlagIndex + 1 < args.length) {
					title = args[titleFlagIndex + 1];
					args.splice(titleFlagIndex, 2);
				}

				if (content === undefined && title === undefined) {
					return {
						type: 'error',
						output: 'Nothing to update. Provide --title <value> or --content <value>'
					};
				}

				try {
					const notes = await service.list();
					const note = notes.find((n) => n.id.startsWith(id));
					if (!note) {
						return { type: 'error', output: `Note with ID starting with "${id}" not found.` };
					}
					await service.update(note.id, { title, content });
					return { type: 'success', output: `Note updated: ${title || note.title}` };
				} catch (e) {
					return { type: 'error', output: e instanceof Error ? e.message : 'Unknown error' };
				}
			}

			case 'delete': {
				const id = args[1];
				if (!id) {
					return { type: 'error', output: 'ID is required.\nUsage: notes delete <id>' };
				}
				try {
					const notes = await service.list();
					const note = notes.find((n) => n.id.startsWith(id));
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
					const note = notes.find((n) => n.id.startsWith(id));
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
	}
};
