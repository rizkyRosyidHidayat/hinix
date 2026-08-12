import type { TodoRepository } from '../repositories/todo.repository';
import type { BudgetRepository } from '../repositories/budget.repository';
import type { ScheduleRepository } from '../repositories/schedule.repository';

export interface CommandContext {
  navigate: (path: string) => void;
  repositories: {
    todo: TodoRepository;
    budget: BudgetRepository;
    schedule: ScheduleRepository;
  };
}

export type CommandResult =
  | { type: 'text'; output: string }
  | { type: 'success'; output: string }
  | { type: 'error'; output: string }
  | { type: 'navigate'; path: string }
  | { type: 'clear' }
  | { type: 'view'; view: string; data?: unknown };

export interface CommandDefinition {
  name: string;
  aliases?: string[];
  description: string;
  usage: string;
  examples?: string[];
  execute(args: string[], context: CommandContext): Promise<CommandResult>;
}
