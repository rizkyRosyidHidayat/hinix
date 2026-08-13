import type { TodoRepository } from '../repositories/todo.repository';
import type { BudgetRepository } from '../repositories/budget.repository';
import type { ScheduleRepository } from '../repositories/schedule.repository';
import type { NoteRepository } from '$lib/repositories/note.repository';

export interface CommandContext {
  navigate: (path: string) => void;
  repositories: {
    todo: TodoRepository;
    budget: BudgetRepository;
    schedule: ScheduleRepository;
    notes: NoteRepository
  };
}

export type CommandResult =
  | { type: 'text'; output: string }
  | { type: 'success'; output: string }
  | { type: 'error'; output: string }
  | { type: 'navigate'; path: string }
  | { type: 'clear' }
  | { type: 'view'; view: string; data?: unknown }
  | { type: 'context_entered'; namespace: string }
  | { type: 'context_exited' };

export type ToolCategory = 'productivity' | 'finance' | 'utility' | 'system';

export interface AutocompleteItem {
  name: string;
  description: string;
  usage?: string;
  type: 'command' | 'subcommand' | 'data';
}

export interface SubcommandDefinition {
  name: string;
  description: string;
  usage?: string;
  example?: string;
  /** Async function to provide dynamic suggestions (e.g. from DB) when this subcommand is active */
  suggest?: (input: string, context: CommandContext) => Promise<AutocompleteItem[]>;
}

export interface CommandDefinition {
  name: string;
  aliases?: string[];
  description: string;
  usage: string;
  /** Optional category for command palette grouping */
  category?: ToolCategory;
  /** Optional keywords to improve search discoverability */
  keywords?: string[];
  /** If set, typing this command with no args enters the namespace context */
  namespace?: string;
  /** Subcommands for autocomplete discovery when inside this command's context */
  subcommands?: SubcommandDefinition[];
  execute(args: string[], context: CommandContext): Promise<CommandResult>;
}

