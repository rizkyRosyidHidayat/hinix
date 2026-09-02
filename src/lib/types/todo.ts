export interface Todo {
	id: string;
	title: string;
	completed: boolean;
	createdAt: string;
	date: string;
	completedAt?: string;
	deadline?: string;
	description?: string;
}
