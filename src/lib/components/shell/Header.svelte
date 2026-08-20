<script lang="ts">
	import { Pause, Play, Square } from '@lucide/svelte';
	import { timerStore } from '../../stores/timer.svelte';
	import * as NavigationMenu from '$lib/components/ui/navigation-menu';
	import Kbd from '../ui/kbd/kbd.svelte';
	import { shellStore } from '$lib/stores/shell.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { page } from '$app/state';
	import { ContextService } from '$lib/context/context.service';
	import type { ScheduleItem } from '$lib/types/schedule';
	import { dbState } from '$lib/stores/db.svelte';
	import { resolve } from '$app/paths';
	import { SvelteDate } from 'svelte/reactivity';

	function handleOpenCommandPallete() {
		shellStore.isCommandPaletteOpen = !shellStore.isCommandPaletteOpen;
	}

	let service = new ContextService();
	let upcomingEvent = $state<ScheduleItem | undefined>();
	let lastTimerEventId = $state<string | null>(null);

	const isTimerPage = $derived(page.url.pathname === '/timer');
	const showTimer = $derived(
		settingsStore.features.timer &&
			!isTimerPage &&
			timerStore.state.isAutoTimer &&
			(timerStore.state.status === 'running' || timerStore.state.status === 'paused')
	);

	$effect(() => {
		dbState.subscribe('schedules');
		dbState.subscribe('settings');

		service.getDashboardContext().then((res) => {
			// Auto timer for upcoming schedule within 30 minutes
			if (settingsStore.features.timer) {
				if (timerStore.state.status === 'idle') {
					upcomingEvent = undefined;
					lastTimerEventId = null;

					if (res.upcoming.nextEvent) {
						const now = new Date();
						const nextEvent = res.upcoming.nextEvent;

						if (nextEvent && nextEvent.time && nextEvent.id !== lastTimerEventId) {
							const [hours, minutes] = nextEvent.time.split(':').map(Number);
							const eventTime = new SvelteDate(now);
							eventTime.setHours(hours, minutes, 0, 0);

							const diffMs = eventTime.getTime() - now.getTime();
							const diffMinutes = diffMs / (1000 * 60);

							if (diffMinutes > 0 && diffMinutes <= 30) {
								if (
									typeof window !== 'undefined' &&
									'Notification' in window &&
									Notification.permission === 'default'
								) {
									Notification.requestPermission();
								}
								timerStore.start(diffMs, true, nextEvent.id);
								lastTimerEventId = nextEvent.id;
								upcomingEvent = nextEvent;
							}
						}
					}
				} else if (timerStore.state.isAutoTimer && timerStore.state.linkedEventId) {
					const linkedEvent = res.upcoming.schedules.find(
						(s) => s.id === timerStore.state.linkedEventId
					);
					if (linkedEvent) {
						upcomingEvent = linkedEvent;
						lastTimerEventId = linkedEvent.id;
					} else {
						// Event was deleted — stop auto-timer
						timerStore.stop();
						upcomingEvent = undefined;
						lastTimerEventId = null;
					}
				}
			} else {
				// Timer feature disabled — stop any active auto-timer
				if (timerStore.state.isAutoTimer && timerStore.state.status !== 'idle') {
					timerStore.stop();
					upcomingEvent = undefined;
					lastTimerEventId = null;
				}
			}
		});
	});
</script>

<div class="sticky top-0 z-10">
	<header
		class="flex w-full items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-4 py-3 md:px-6"
	>
		<NavigationMenu.Root>
			<NavigationMenu.List class="gap-6">
				<NavigationMenu.Item>
					<NavigationMenu.Link>
						{#snippet child()}
							<a href={resolve('/')} class="flex items-center transition-opacity hover:opacity-80">
								<h1 class="text-xl font-bold tracking-tight text-[var(--accent)] sm:text-2xl">
									HiNix
								</h1>
							</a>
						{/snippet}
					</NavigationMenu.Link>
				</NavigationMenu.Item>
				<NavigationMenu.Item onclick={handleOpenCommandPallete}>
					<span class="cursor-pointer text-xs font-medium sm:text-sm">Commands</span>
					<Kbd class="hidden sm:inline-flex">Ctrl + K</Kbd>
				</NavigationMenu.Item>
				<NavigationMenu.Item>
					<NavigationMenu.Link>
						{#snippet child()}
							<a href={resolve('/settings')} class="text-xs font-medium sm:text-sm"> Settings </a>
						{/snippet}
					</NavigationMenu.Link>
				</NavigationMenu.Item>
				<NavigationMenu.Item>
					<NavigationMenu.Link>
						{#snippet child()}
							<a href={resolve('/help')} class="text-xs font-medium sm:text-sm"> Help </a>
						{/snippet}
					</NavigationMenu.Link>
				</NavigationMenu.Item>
			</NavigationMenu.List>
		</NavigationMenu.Root>
	</header>

	<!-- Active Timer Bar (below header, still sticky) -->
	{#if showTimer}
		<div
			class="flex items-center gap-4 border-b border-[var(--border)] bg-[var(--surface-elevated)] px-6 py-3"
		>
			<div class="flex-1">
				<div class="flex items-center gap-3">
					<span class="font-mono text-lg font-bold tracking-wider">
						{timerStore.state.label}
					</span>
					{#if upcomingEvent}
						<span class="text-sm font-semibold">
							Event: <span class="text-[var(--accent)]">{upcomingEvent.title}</span>
						</span>
					{:else}
						<span class="text-sm font-semibold">Active Timer</span>
					{/if}
				</div>
			</div>

			<div class="flex items-center gap-2">
				<button
					onclick={() =>
						timerStore.state.status === 'running' ? timerStore.pause() : timerStore.resume()}
					disabled={timerStore.state.isAutoTimer}
					class="rounded-full border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--text-primary)] transition-colors hover:bg-[var(--background)] focus:ring-2 focus:ring-[var(--border)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					aria-label={timerStore.state.status === 'running' ? 'Pause Timer' : 'Resume Timer'}
				>
					{#if timerStore.state.status === 'running'}
						<Pause size={16} fill="currentColor" />
					{:else}
						<Play size={16} fill="currentColor" />
					{/if}
				</button>

				<button
					onclick={() => timerStore.stop()}
					disabled={timerStore.state.isAutoTimer}
					class="rounded-full bg-[var(--error)] p-2 text-white transition-opacity hover:opacity-90 focus:ring-2 focus:ring-[var(--error)]/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					aria-label="Stop Timer"
				>
					<Square size={16} fill="currentColor" />
				</button>
			</div>
		</div>
	{/if}
</div>
