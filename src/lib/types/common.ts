export interface HiNixTool {
	id: string;
	name: string;
	description: string;
	icon?: string;
	route: string;
	commands: import('../commands/types').CommandDefinition[];
}
