import type { TimerState } from '../types/timer';

class TimerStore {
	state = $state<TimerState>({
		status: 'idle',
		durationMs: 0,
		remainingMs: 0,
		label: ''
	});

	private interval: ReturnType<typeof setInterval> | null = null;
	private targetEndTimestamp: number = 0;

	formatTime(ms: number) {
		const totalSeconds = Math.max(0, Math.floor(ms / 1000));
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;

		if (hours > 0) {
			return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
		} else if (minutes > 0) {
			return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
		}
		return '';
	}

	start(durationMs: number, isAutoTimer: boolean = false, linkedEventId?: string) {
		this.stop();
		this.state.status = 'running';
		this.state.durationMs = durationMs;
		this.state.startedAt = Date.now();
		this.targetEndTimestamp = Date.now() + durationMs;
		this.state.remainingMs = durationMs;
		this.state.label = this.formatTime(durationMs);
		this.state.isAutoTimer = isAutoTimer;
		this.state.linkedEventId = linkedEventId;

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
		this.state.label = '';
		this.targetEndTimestamp = 0;
		this.state.isAutoTimer = false;
		this.state.linkedEventId = undefined;
	}

	private tick() {
		if (this.state.status !== 'running') return;

		const now = Date.now();
		const remaining = Math.max(0, this.targetEndTimestamp - now);

		this.state.remainingMs = remaining;
		this.state.label = this.formatTime(remaining);

		if (remaining === 0) {
			this.state.status = 'completed';
			this.stopInterval();

			// Trigger notification if supported and granted
			if (typeof window !== 'undefined' && 'Notification' in window) {
				if (Notification.permission === 'granted') {
					new Notification('HiNix Timer', {
						body: 'Your timer has finished!',
						icon: '/favicon.png'
					});
				} else if (Notification.permission !== 'denied') {
					Notification.requestPermission().then((permission) => {
						if (permission === 'granted') {
							new Notification('HiNix Timer', {
								body: 'Your timer has finished!',
								icon: '/favicon.png'
							});
						}
					});
				}
			}
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
