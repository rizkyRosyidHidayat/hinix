import type { CommandDomain } from "$lib/command-v2";

export interface Recommendation {
	id: string;
	type: 'action' | 'insight' | 'reminder';
	priority: 'high' | 'medium' | 'low';
	icon: string;
	title: string;
	description: string;
	domain: CommandDomain;
	path: string;
	action?: {
		label: string;
		command?: string;
	};
}
