export type CommandDomain = 'todo' | 'schedule' | 'habit' | 'budget' | 'note';
export type CommandAction = 'create' | 'list' | 'update' | 'delete';
export type ParseStatus = 'parsed' | 'ambiguous' | 'invalid';
export type EvidenceSource =
	| 'default'
	| 'strong-action'
	| 'strong-domain'
	| 'weak-action'
	| 'weak-domain'
	| 'phrase'
	| 'nlp-verb'
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
	description?: string;
	search?: string;
	date?: string;
	time?: string;
	datetime?: string;
	dateText?: string;
	amount?: number;
	currency?: string;
	category?: string;
	frequency?: string;
	days?: string[];
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
