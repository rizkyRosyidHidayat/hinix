import type { CommandDefinition, ToolCategory } from './types';

class CommandRegistry {
	private commands = new Map<string, CommandDefinition>();
	private aliases = new Map<string, string>();

	register(command: CommandDefinition): void {
		this.commands.set(command.name.toLowerCase(), command);
		if (command.aliases) {
			for (const alias of command.aliases) {
				this.aliases.set(alias.toLowerCase(), command.name.toLowerCase());
			}
		}
	}

	get(name: string): CommandDefinition | undefined {
		const lowerName = name.toLowerCase();
		const resolvedName = this.aliases.get(lowerName) || lowerName;
		return this.commands.get(resolvedName);
	}

	/**
	 * Search commands by query, matching across name, aliases,
	 * description, keywords, and subcommand names.
	 * Results are de-duplicated and ordered by relevance.
	 */
	search(query: string): CommandDefinition[] {
		const q = query.toLowerCase();
		const all = Array.from(this.commands.values());

		// Score each command for relevance
		const scored: { cmd: CommandDefinition; score: number }[] = [];

		for (const cmd of all) {
			let score = 0;

			// Exact name match
			if (cmd.name === q) score += 100;
			// Name starts with query
			else if (cmd.name.startsWith(q)) score += 80;
			// Name contains query
			else if (cmd.name.includes(q)) score += 60;

			// Alias match
			if (cmd.aliases?.some((a) => a === q)) score += 90;
			else if (cmd.aliases?.some((a) => a.startsWith(q))) score += 70;
			else if (cmd.aliases?.some((a) => a.includes(q))) score += 50;

			// Description match
			if (cmd.description.toLowerCase().includes(q)) score += 30;

			// Keyword match
			if (cmd.keywords?.some((k) => k.includes(q))) score += 40;

			// Subcommand name match
			if (
				cmd.subcommands?.some((s) => s.name.includes(q) || s.description.toLowerCase().includes(q))
			) {
				score += 25;
			}

			if (score > 0) {
				scored.push({ cmd, score });
			}
		}

		return scored.sort((a, b) => b.score - a.score).map((s) => s.cmd);
	}

	getAll(): CommandDefinition[] {
		return Array.from(this.commands.values());
	}

	getByCategory(category: ToolCategory): CommandDefinition[] {
		return Array.from(this.commands.values()).filter((cmd) => cmd.category === category);
	}
}

export const registry = new CommandRegistry();
