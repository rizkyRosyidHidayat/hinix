<script lang="ts">
	import { timerStore } from '$lib/stores/timer.svelte';
	import { Play, Pause, Square } from '@lucide/svelte';
	import { registry } from '$lib/commands/registry';
	import { ContextService } from '$lib/context/context.service';
	import type { HiNixContext } from '$lib/context/context.types';
	import type { ScheduleItem } from '$lib/types/schedule';
	import { dbState } from '$lib/stores/db.svelte';
	import { resolve } from '$app/paths';

	let customMinutes = $state(25);
	let timerCommand = registry.get('timer');

	let service = new ContextService();
	let ctx = $state<HiNixContext | null>(null);
	let upcomingEvent = $state<ScheduleItem | undefined>();

	$effect(() => {
		dbState.subscribe('schedules');
		const isAutoTimer = timerStore.state.isAutoTimer;
		const linkedEventId = timerStore.state.linkedEventId;

		service.getDashboardContext().then((res) => {
			ctx = res;
			if (isAutoTimer && linkedEventId) {
				const linkedEvent = ctx.upcoming.schedules.find((e) => e.id === linkedEventId);
				if (linkedEvent) {
					upcomingEvent = linkedEvent;
				}
			} else {
				upcomingEvent = undefined;
			}
		});
	});

	function startTimer(minutes: number) {
		timerStore.start(minutes * 60 * 1000);
	}

	const formatTime = $derived(timerStore.state.label || `00:00`);
</script>

<svelte:head>
	<title>{timerStore.state.label || 'Timer | HiNix'}</title>
</svelte:head>

<div class="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
	<div>
		<h1 class="text-xl font-bold tracking-tight text-[var(--accent)] md:text-3xl">Timer</h1>
		<p class="mt-2 text-sm text-[var(--text-muted)]">
			<span class="font-mono">See full the commands usage in help menu</span>
			<a href={resolve(`/help#${timerCommand?.name}`)} class="text-[var(--accent)] hover:underline"
				>View full commands</a
			>
		</p>
	</div>

	<div
		class="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-12"
	>
		{#if upcomingEvent}
			<h2 class="mb-6 text-2xl font-semibold text-[var(--text-primary)]">
				Event: <span class="text-[var(--accent)]">{upcomingEvent.title}</span>
			</h2>
		{/if}

		<!-- Timer Display -->
		<div
			class="mb-8 font-mono text-8xl font-black tracking-widest text-[var(--text-primary)] tabular-nums"
		>
			{formatTime}
		</div>

		<!-- Controls -->
		<div class="flex gap-4">
			{#if timerStore.state.status === 'idle' || timerStore.state.status === 'completed'}
				<div class="flex items-center gap-2">
					<input
						type="text"
						bind:value={customMinutes}
						inputmode="numeric"
						class="w-20 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-center font-mono text-lg outline-none focus:ring-2 focus:ring-[var(--accent)]"
					/>
					<span class="mr-2 text-[var(--text-muted)]">min</span>

					<button
						onclick={() => startTimer(customMinutes)}
						class="rounded-full bg-[var(--accent)] p-4 text-[var(--background)] transition-opacity hover:opacity-90 focus:ring-4 focus:ring-[var(--accent)]/50 focus:outline-none"
						aria-label="Start Timer"
					>
						<Play size={24} fill="currentColor" />
					</button>
				</div>
			{:else}
				<button
					onclick={() =>
						timerStore.state.status === 'running' ? timerStore.pause() : timerStore.resume()}
					class="rounded-full border border-[var(--border)] bg-[var(--surface)] p-4 text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-elevated)] focus:ring-4 focus:ring-[var(--border)] focus:outline-none"
					aria-label={timerStore.state.status === 'running' ? 'Pause Timer' : 'Resume Timer'}
					disabled={timerStore.state.isAutoTimer}
				>
					{#if timerStore.state.status === 'running'}
						<Pause size={24} fill="currentColor" />
					{:else}
						<Play size={24} fill="currentColor" />
					{/if}
				</button>

				<button
					onclick={() => timerStore.stop()}
					class="rounded-full bg-[var(--error)] p-4 text-white transition-opacity hover:opacity-90 focus:ring-4 focus:ring-[var(--error)]/50 focus:outline-none"
					aria-label="Stop Timer"
					disabled={timerStore.state.isAutoTimer}
				>
					<Square size={24} fill="currentColor" />
				</button>
			{/if}
		</div>

		<!-- Quick Presets -->
		{#if timerStore.state.status === 'idle' || timerStore.state.status === 'completed'}
			<div class="mt-10 flex gap-3">
				{#each [5, 10, 25, 50] as preset (preset)}
					<button
						onclick={() => startTimer(preset)}
						class="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--surface-elevated)]"
					>
						{preset}m
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>
