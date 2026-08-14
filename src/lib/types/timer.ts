export interface TimerState {
  status: 'idle' | 'running' | 'paused' | 'completed';
  durationMs: number;
  remainingMs: number;
  startedAt?: number;
  label: string;
}
