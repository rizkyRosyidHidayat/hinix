<script lang="ts">
	import { goto } from '$app/navigation';
	import { ContextService } from '$lib/context/context.service';
	import { getFormattedDate } from '$lib/context/context.selectors';
	import type { HiNixContext } from '$lib/context/context.types';
	import { getRecommendations } from '$lib/context/recommendation.service';
	import type { Recommendation } from '$lib/context/recommendation.types';
	import { timerStore } from '$lib/stores/timer.svelte';
	import {
		ArrowRight,
		Pause,
		Play,
		Square,
		Pin,
		Clock,
		Calendar,
		CalendarPlus,
		CheckSquare,
		ListPlus,
		Target,
		Trophy,
		AlertTriangle,
		DollarSign,
		Receipt,
		PartyPopper,
		Sparkles,
		BarChart3
	} from '@lucide/svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { SvelteDate } from 'svelte/reactivity';
	import type { ScheduleItem } from '$lib/types/schedule';
	import { resolve } from '$app/paths';
	import { dbState } from '$lib/stores/db.svelte';

	let service = new ContextService();
	let ctx = $state<HiNixContext>(service.initContext);
	let formattedDate = $state(getFormattedDate());
	let lastTimerEventId = $state<string | null>(null);
	let upcomingEvent = $state<ScheduleItem | undefined>();
	let recommendations = $state<Recommendation[]>([]);

	const iconMap: Record<string, typeof Clock> = {
		Clock,
		Calendar,
		CalendarPlus,
		CheckSquare,
		ListPlus,
		Target,
		Trophy,
		AlertTriangle,
		DollarSign,
		Receipt,
		Pin,
		PartyPopper
	};

	$effect(() => {
		dbState.subscribe('todos');
		dbState.subscribe('budget');
		dbState.subscribe('schedules');
		dbState.subscribe('notes');
		dbState.subscribe('habits');

		service.getDashboardContext().then((res) => {
			ctx = res;
			recommendations = getRecommendations(ctx, settingsStore.features);

			// Auto timer for upcoming schedule within 30 minutes
			if (settingsStore.features.timer) {
				if (timerStore.state.status === 'idle') {
					upcomingEvent = undefined;
					lastTimerEventId = null;

					if (ctx.upcoming.schedules.length > 0) {
						const now = new Date();
						const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

						const todaySchedules = ctx.upcoming.schedules
							.filter((e) => e.date === ctx.today.date && e.time && e.time > currentTimeStr)
							.sort((a, b) => a.time!.localeCompare(b.time!));

						const nextEvent = todaySchedules[0];

						if (nextEvent && nextEvent.time && nextEvent.id !== lastTimerEventId) {
							const [hours, minutes] = nextEvent.time.split(':').map(Number);
							const eventTime = new SvelteDate(now);
							eventTime.setHours(hours, minutes, 0, 0);

							const diffMs = eventTime.getTime() - now.getTime();
							const diffMinutes = diffMs / (1000 * 60);

							if (diffMinutes > 0 && diffMinutes <= 30) {
								// Request notification permission if needed
								if (
									typeof window !== 'undefined' &&
									'Notification' in window &&
									Notification.permission === 'default'
								) {
									Notification.requestPermission();
								}
								// Start a countdown to the event
								timerStore.start(diffMs, true, nextEvent.id);
								lastTimerEventId = nextEvent.id;
								upcomingEvent = nextEvent;
							}
						}
					}
				} else if (timerStore.state.isAutoTimer && timerStore.state.linkedEventId) {
					// Restore upcomingEvent if we navigated back to the dashboard while the timer is running
					const linkedEvent = ctx.upcoming.schedules.find(
						(e) => e.id === timerStore.state.linkedEventId
					);
					if (linkedEvent) {
						upcomingEvent = linkedEvent;
						lastTimerEventId = linkedEvent.id;
					}
				}
			}
		});
	});

	const priorityColors: Record<string, string> = {
		high: 'border-l-[var(--error)]',
		medium: 'border-l-[var(--warning)]',
		low: 'border-l-[var(--accent)]'
	};

	const priorityBadgeColors: Record<string, string> = {
		high: 'bg-[var(--error)]/10 text-[var(--error)]',
		medium: 'bg-[var(--warning)]/10 text-[var(--warning)]',
		low: 'bg-[var(--accent)]/10 text-[var(--accent)]'
	};
</script>

<svelte:head>
	<title>{timerStore.state.label || 'Dashboard | HiNix'}</title>
</svelte:head>

<div class="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
	<!-- Greeting -->
	<div class="flex flex-col gap-4 md:flex-row md:items-center">
		<div class="flex-1">
			<p class="text-sm font-medium tracking-wider text-[var(--text-muted)] uppercase">
				{formattedDate}
			</p>
			<h1 class="mt-1 text-3xl font-bold tracking-tight">{ctx.today.greeting}</h1>
		</div>

		<div class="flex items-center gap-2">
			<button
				onclick={() => goto(resolve('/statistics'))}
				class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--surface)]"
			>
				<BarChart3 size={16} class="text-[var(--accent)]" />
				Statistics
			</button>
		</div>
	</div>

	<!-- Active Timer -->
	{#if settingsStore.features.timer && (timerStore.state.status === 'running' || timerStore.state.status === 'paused')}
		<div
			class="flex items-center gap-4 rounded-xl border border-l-4 border-[var(--border)] border-l-[var(--accent)] bg-[var(--surface-elevated)] p-6 shadow-sm"
		>
			<div class="flex-1">
				<h2 class="mb-2 text-lg font-semibold">
					{#if upcomingEvent}
						Event:
						<span class="text-[var(--accent)]">{upcomingEvent.title}</span>
					{:else}
						Active Timer
					{/if}
				</h2>
				<div class="font-mono text-4xl font-bold tracking-wider">
					{timerStore.state.label}
				</div>
				<div class="mt-4 flex gap-4 font-mono text-sm text-[var(--text-muted)]">
					{#if upcomingEvent}
						<span class="text-[var(--text-primary)]">Remaining time</span>
					{:else}
						Status: <span class="text-[var(--text-primary)]"
							>{timerStore.state.status.toUpperCase()}</span
						>
					{/if}
				</div>
			</div>

			<button
				onclick={() =>
					timerStore.state.status === 'running' ? timerStore.pause() : timerStore.resume()}
				disabled={timerStore.state.isAutoTimer}
				class="rounded-full border border-[var(--border)] bg-[var(--surface)] p-4 text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-elevated)] focus:ring-4 focus:ring-[var(--border)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				aria-label={timerStore.state.status === 'running' ? 'Pause Timer' : 'Resume Timer'}
			>
				{#if timerStore.state.status === 'running'}
					<Pause size={24} fill="currentColor" />
				{:else}
					<Play size={24} fill="currentColor" />
				{/if}
			</button>

			<button
				onclick={() => timerStore.stop()}
				disabled={timerStore.state.isAutoTimer}
				class="rounded-full bg-[var(--error)] p-4 text-white transition-opacity hover:opacity-90 focus:ring-4 focus:ring-[var(--error)]/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				aria-label="Stop Timer"
			>
				<Square size={24} fill="currentColor" />
			</button>
		</div>
	{/if}

	<!-- Pinned Notes -->
	{#if settingsStore.features.notes && ctx.recent.pinnedNotes && ctx.recent.pinnedNotes.length > 0}
		<div
			class="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-sm"
		>
			<div class="mb-4 flex items-center gap-3">
				<Pin size={20} class="text-[var(--warning)]" />
				<h2 class="text-lg font-semibold">Pinned Notes</h2>
			</div>
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				{#each ctx.recent.pinnedNotes as note (note.id)}
					<button
						onclick={() => goto(resolve('/notes'))}
						class="group cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition-all hover:border-[var(--warning)]/40 hover:shadow-sm"
					>
						<h3 class="font-semibold text-[var(--text-primary)]">{note.title}</h3>
						<p class="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">
							{note.content || 'No content'}
						</p>
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Recommendations -->
	{#if recommendations.length > 0}
		<div>
			<div class="mb-4 flex items-center gap-3">
				<Sparkles size={20} class="text-[var(--accent)]" />
				<h2 class="text-lg font-semibold">What's Next</h2>
			</div>
			<div class="space-y-3">
				{#each recommendations as rec (rec.id)}
					{@const IconComponent = iconMap[rec.icon]}
					{#if rec.action}
						<button
							onclick={() =>
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								goto(resolve(rec.action?.path ?? ('/' as any)))}
							class="group flex w-full cursor-pointer items-center gap-4 rounded-xl border border-l-4 border-[var(--border)] {priorityColors[
								rec.priority
							]} bg-[var(--surface-elevated)] p-5 text-left shadow-sm transition-all hover:shadow-md"
						>
							<div
								class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface)]"
							>
								{#if IconComponent}
									<IconComponent size={20} class="text-[var(--text-primary)]" />
								{/if}
							</div>
							<div class="flex-1">
								<div class="flex items-center gap-2">
									<h3 class="font-semibold text-[var(--text-primary)]">{rec.title}</h3>
									<span
										class="rounded-full px-2 py-0.5 text-xs font-medium {priorityBadgeColors[
											rec.priority
										]}"
									>
										{rec.priority}
									</span>
								</div>
								<p class="mt-1 text-sm text-[var(--text-muted)]">{rec.description}</p>
							</div>
							<ArrowRight
								size={16}
								class="shrink-0 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
							/>
						</button>
					{:else}
						<div
							class="flex items-center gap-4 rounded-xl border border-l-4 border-[var(--border)] {priorityColors[
								rec.priority
							]} bg-[var(--surface-elevated)] p-5 shadow-sm"
						>
							<div
								class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface)]"
							>
								{#if IconComponent}
									<IconComponent size={20} class="text-[var(--text-primary)]" />
								{/if}
							</div>
							<div class="flex-1">
								<div class="flex items-center gap-2">
									<h3 class="font-semibold text-[var(--text-primary)]">{rec.title}</h3>
									<span
										class="rounded-full px-2 py-0.5 text-xs font-medium {priorityBadgeColors[
											rec.priority
										]}"
									>
										{rec.priority}
									</span>
								</div>
								<p class="mt-1 text-sm text-[var(--text-muted)]">{rec.description}</p>
							</div>
						</div>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</div>
