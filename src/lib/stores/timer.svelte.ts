import type { TimerState } from '../types/timer';

class TimerStore {
  state = $state<TimerState>({
    status: 'idle',
    durationMs: 0,
    remainingMs: 0,
  });

  private interval: ReturnType<typeof setInterval> | null = null;
  private targetEndTimestamp: number = 0;

  start(durationMs: number) {
    this.stop();
    this.state.status = 'running';
    this.state.durationMs = durationMs;
    this.state.startedAt = Date.now();
    this.targetEndTimestamp = Date.now() + durationMs;
    this.state.remainingMs = durationMs;

    this.interval = setInterval(() => {
      this.tick();
    }, 100); // 100ms tick for smooth UI updates
  }

  pause() {
    if (this.state.status === 'running') {
      this.stopInterval();
      this.state.status = 'paused';
    }
  }

  resume() {
    if (this.state.status === 'paused') {
      this.state.status = 'running';
      this.targetEndTimestamp = Date.now() + this.state.remainingMs;
      this.interval = setInterval(() => {
        this.tick();
      }, 100);
    }
  }

  stop() {
    this.stopInterval();
    this.state.status = 'idle';
    this.state.durationMs = 0;
    this.state.remainingMs = 0;
    this.state.startedAt = undefined;
    this.targetEndTimestamp = 0;
  }

  private tick() {
    if (this.state.status !== 'running') return;
    
    const now = Date.now();
    const remaining = Math.max(0, this.targetEndTimestamp - now);
    
    this.state.remainingMs = remaining;

    if (remaining === 0) {
      this.state.status = 'completed';
      this.stopInterval();
    }
  }

  private stopInterval() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

export const timerStore = new TimerStore();
