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
		BarChart3
	} from '@lucide/svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { resolve } from '$app/paths';
	import { dbState } from '$lib/stores/db.svelte';

	let service = new ContextService();
	let ctx = $state<HiNixContext>(service.initContext);
	let formattedDate = $state(getFormattedDate());
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

	// Check if all data is empty
	const isAllEmpty = $derived(
		ctx.today.tasks === 0 &&
			ctx.today.completedTasks === 0 &&
			ctx.today.events === 0 &&
			ctx.today.expenses === 0 &&
			ctx.finance.income === 0 &&
			ctx.finance.expenses === 0 &&
			(!ctx.habits || ctx.habits.total === 0) &&
			ctx.recent.pinnedNotes.length === 0 &&
			ctx.upcoming.schedules.length === 0 &&
			ctx.upcoming.todos.length === 0
	);

	$effect(() => {
		dbState.subscribe('todos');
		dbState.subscribe('budget');
		dbState.subscribe('schedules');
		dbState.subscribe('notes');
		dbState.subscribe('habits');

		service.getDashboardContext().then((res) => {
			ctx = res;
			recommendations = getRecommendations(res, settingsStore.features);
		});
	});

	const priorityColors: Record<string, string> = {
		high: 'border-l-[var(--error)]',
		medium: 'border-l-[var(--warning)]',
		low: 'border-l-[var(--accent)]'
	};

	const priorityIconColors: Record<string, string> = {
		high: 'text-[var(--error)]',
		medium: 'text-[var(--warning)]',
		low: 'text-[var(--accent)]'
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
			<h1 class="mt-1 text-3xl font-bold tracking-tight">
				{#if isAllEmpty}
					Let's Get Started
				{:else}
					What's Next
				{/if}
			</h1>
		</div>

		{#if !isAllEmpty}
			<button
				onclick={() => goto(resolve('/statistics'))}
				class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--surface)]"
			>
				<BarChart3 size={16} class="text-[var(--accent)]" />
				Statistics
			</button>
		{/if}
	</div>

	<!-- Recommendations -->
	{#if recommendations.length > 0}
		<div class="space-y-4">
			{#each recommendations as rec, i (rec.id)}
				{@const IconComponent = iconMap[rec.icon]}
				{@const isFirst = i === 0 && rec.priority === 'high'}
				{#if rec.action?.command}
					<button
						onclick={() =>
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							goto(resolve(rec.action?.path ?? ('/' as any)))}
						class="group flex w-full cursor-pointer items-start gap-5 rounded-2xl border border-l-4 border-[var(--border)] {priorityColors[
							rec.priority
						]} bg-[var(--surface-elevated)] p-6 text-left shadow-sm transition-all hover:shadow-md"
					>
						<div
							class="{isFirst
								? 'size-14'
								: 'size-12'} flex shrink-0 items-center justify-center rounded-xl bg-[var(--surface)]"
						>
							{#if IconComponent}
								<IconComponent size={isFirst ? 28 : 24} class={priorityIconColors[rec.priority]} />
							{/if}
						</div>
						<div class="flex-1">
							<h3 class="{isFirst ? 'text-xl' : 'text-lg'} font-bold text-[var(--text-primary)]">
								{rec.description}
							</h3>
							{#if rec.action?.command}
								<p class="mt-2 text-sm text-[var(--text-muted)]">
									<span class="opacity-50">$nix</span>
									<span>{rec.action.command}</span>
								</p>
							{/if}
						</div>
						<ArrowRight
							size={20}
							class="mt-2 shrink-0 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
						/>
					</button>
				{:else if rec.action}
					<button
						onclick={() =>
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							goto(resolve(rec.action?.path ?? ('/' as any)))}
						class="group flex w-full cursor-pointer items-start gap-5 rounded-2xl border border-l-4 border-[var(--border)] {priorityColors[
							rec.priority
						]} bg-[var(--surface-elevated)] p-6 text-left shadow-sm transition-all hover:shadow-md"
					>
						<div
							class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)]"
						>
							{#if IconComponent}
								<IconComponent size={24} class={priorityIconColors[rec.priority]} />
							{/if}
						</div>
						<div class="flex-1">
							<h3 class="text-lg font-bold text-[var(--text-primary)]">{rec.title}</h3>
							<p class="mt-1 text-sm text-[var(--text-muted)]">{rec.description}</p>
						</div>
						<ArrowRight
							size={20}
							class="mt-2 shrink-0 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
						/>
					</button>
				{:else}
					<div
						class="flex w-full items-start gap-5 rounded-2xl border border-l-4 border-[var(--border)] border-l-[var(--success)] bg-[var(--surface-elevated)] p-6 shadow-sm"
					>
						<div
							class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)]"
						>
							{#if IconComponent}
								<IconComponent size={24} class="text-[var(--success)]" />
							{/if}
						</div>
						<div class="flex-1">
							<h3 class="text-lg font-bold text-[var(--text-primary)]">{rec.title}</h3>
							<p class="mt-1 text-sm text-[var(--text-muted)]">{rec.description}</p>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{/if}

	<!-- Pinned Notes -->
	{#if settingsStore.features.notes && ctx.recent.pinnedNotes && ctx.recent.pinnedNotes.length > 0}
		<div
			class="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-sm"
		>
			<div class="mb-4 flex items-center gap-3">
				<Pin size={20} class="text-[var(--primary)]" />
				<h2 class="text-lg font-semibold">Pinned Notes</h2>
			</div>
			<div class="-my-4 divide-y divide-[var(--border)]">
				{#each ctx.recent.pinnedNotes as note (note.id)}
					<button
						onclick={() => goto(resolve('/notes'))}
						class="group flex w-full cursor-pointer items-center gap-5 bg-[var(--surface)] py-4 text-left"
					>
						<div class="flex-1">
							<h3
								class="font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[var(--primary)]"
							>
								{note.title}
							</h3>
							<p class="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">
								{note.content || 'No content'}
							</p>
						</div>
						<ArrowRight
							size={20}
							class="shrink-0 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
						/>
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>
