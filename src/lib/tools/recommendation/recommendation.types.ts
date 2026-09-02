export interface Recommendation {
	id: string;
	type: 'action' | 'insight' | 'reminder';
	priority: 'high' | 'medium' | 'low';
	icon: string;
	title: string;
	description: string;
	action?: {
		label: string;
		command?: string;
	};
}
