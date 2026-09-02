export type CommandDomain = 'todo' | 'schedule' | 'habit' | 'budget' | 'note';
export type CommandAction = 'create' | 'list' | 'update' | 'delete';
export type ParseStatus = 'parsed' | 'ambiguous';
export type EvidenceSource =
	| 'default'
	| 'strong-action'
	| 'strong-domain'
	| 'weak-action'
	| 'weak-domain'
	| 'phrase'
	| 'entity'
	| 'date'
	| 'explicit';
export interface Evidence {
	source: EvidenceSource;
	value: string;
	weight: number;
}
export interface CommandEntities {
	title?: string;
	search?: string;
	dateText?: string;
	dateISO?: string;
	amount?: number;
	currency?: string;
	category?: string;
}
export interface ParsedCommand {
	status: ParseStatus;
	input: string;
	domain: CommandDomain;
	action: CommandAction;
	entities: CommandEntities;
	confidence: number;
	alternatives: Array<{ domain: CommandDomain; action: CommandAction; score: number }>;
	evidence: Evidence[];
	needsConfirmation: boolean;
	reason: string;
}
