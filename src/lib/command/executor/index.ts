import type { CommandExecutor, ParsedCommand } from '../types';

/**
 * Demo executor. In the real HiNix application, replace these callbacks with
 * the existing Todo/Schedule/Habit/Budget/Note domain services.
 */
export class DemoCommandExecutor implements CommandExecutor {
  async execute(command: ParsedCommand): Promise<unknown> {
    if (command.status !== 'success' || !command.domain || !command.action) {
      throw new Error('Command cannot be executed until it is successfully parsed.');
    }

    return {
      ok: true,
      operation: `${command.domain}.${command.action}`,
      entities: command.entities
    };
  }
}
