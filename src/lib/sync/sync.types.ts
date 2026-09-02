export type SyncableTable = 'todos' | 'habits' | 'schedules' | 'notes' | 'budgetTransactions';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

export interface SyncConfig {
	scriptUrl: string;
	enabled: boolean;
}
