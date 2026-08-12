import type { CommandDefinition } from './types';

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

  search(query: string): CommandDefinition[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.commands.values()).filter((cmd) => 
      cmd.name.includes(lowerQuery) || 
      (cmd.aliases && cmd.aliases.some(alias => alias.includes(lowerQuery)))
    );
  }

  getAll(): CommandDefinition[] {
    return Array.from(this.commands.values());
  }
}

export const registry = new CommandRegistry();
