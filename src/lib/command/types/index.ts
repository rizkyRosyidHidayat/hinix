export const COMMAND_DOMAINS = ['todo', 'schedule', 'habit', 'budget', 'note'] as const;
export type CommandDomain = (typeof COMMAND_DOMAINS)[number];

export const COMMAND_ACTIONS = ['create', 'list', 'update', 'delete'] as const;
export type CommandAction = (typeof COMMAND_ACTIONS)[number];

export type ParseStatus = 'success' | 'ambiguous' | 'invalid' | 'incomplete';
export type CommandSource = 'natural-language' | 'explicit-command';

export interface CommandEntities {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  datetime?: string;
  amount?: number;
  currency?: string;
  category?: string;
  frequency?: string;
  days?: string[];
  targetId?: string;
  search?: string;
  status?: string;
  tags?: string[];
}

export interface ClassificationAlternative<T extends string> {
  label: T;
  confidence: number;
}

export interface ClassificationResult<T extends string> {
  label: T;
  confidence: number;
  alternatives: ClassificationAlternative<T>[];
}

export interface ParsedCommand {
  status: ParseStatus;
  domain?: CommandDomain;
  action?: CommandAction;
  entities: CommandEntities;
  confidence: number;
  source: CommandSource;
  originalInput: string;
  intent?: ClassificationResult<CommandAction>;
  domainClassification?: ClassificationResult<CommandDomain>;
  clarification?: Clarification;
}

export interface Clarification {
  question: string;
  options: Array<{
    label: string;
    domain?: CommandDomain;
    action?: CommandAction;
  }>;
}

export interface ParseOptions {
  now?: Date;
}

export interface CommandExecutionContext {
  find?: (domain: CommandDomain, query: string) => Promise<Array<{ id: string; title?: string }>>;
}

export type CommandResult =
  | { type: 'text'; output: string }
  | { type: 'success'; output: string }
  | { type: 'error'; output: string }
  | { type: 'loading'; output: string };

export interface CommandExecutor {
  execute(command: ParsedCommand, context?: CommandExecutionContext): Promise<CommandResult>;
}
