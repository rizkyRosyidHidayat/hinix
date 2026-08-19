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
	import { settingsStore, type FeatureSettings } from '$lib/stores/settings.svelte';
	import { resolve } from '$app/paths';
	import { dbState } from '$lib/stores/db.svelte';
	import { registry } from '$lib/commands/registry';

	// Map feature keys to their icon name, route path, label, and command name
	const featureConfig: {
		key: keyof FeatureSettings;
		icon: string;
		iconColor: string;
		path: string;
		label: string;
		description: string;
		commandName: string;
	}[] = [
		{
			key: 'todo',
			icon: 'CheckSquare',
			iconColor: 'text-[var(--primary)]',
			path: '/todo',
			label: 'Add a task',
			description: 'Add a task to your to-do list',
			commandName: 'todo'
		},
		{
			key: 'schedule',
			icon: 'Calendar',
			iconColor: 'text-[var(--success)]',
			path: '/schedule',
			label: 'Add an event',
			description: 'Add an event to your schedule',
			commandName: 'schedule'
		},
		{
			key: 'habits',
			icon: 'Target',
			iconColor: 'text-[var(--warning)]',
			path: '/habits',
			label: 'Track a habit',
			description: 'Track your daily habit',
			commandName: 'habits'
		},
		{
			key: 'notes',
			icon: 'Pin',
			iconColor: 'text-[var(--error)]',
			path: '/notes',
			label: 'Create a note',
			description: 'Create a note for later use',
			commandName: 'notes'
		}
	];

	// Dynamically compute quick actions based on enabled features and registry data
	const featureQuickActions = $derived(
		featureConfig
			.filter((f) => settingsStore.features[f.key])
			.map((f) => {
				const cmd = registry.get(f.commandName);
				const addSub = cmd?.subcommands?.find((s) => s.name === 'add');
				const usage = `${f.commandName} ${addSub?.example}`;
				return { ...f, usage };
			})
	);

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
	<!-- Empty State -->
	{#if isAllEmpty}
		<div>
			<h2 class="mb-2 text-3xl font-bold tracking-tight text-[var(--text-primary)]">
				Welcome to HiNix
			</h2>
			<p class="text-xl text-[var(--text-muted)]">Here are some commands to get started:</p>
		</div>

		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			{#each featureQuickActions as action (action.key)}
				{@const IconComponent = iconMap[action.icon]}
				<button
					onclick={() =>
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						goto(resolve(action.path as any))}
					class="group flex-1 cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 text-left shadow-sm transition-all hover:border-[var(--accent)]/30 hover:shadow-md"
				>
					<div class="mb-4 flex items-center gap-4">
						{#if IconComponent}
							<IconComponent size={24} class={action.iconColor} />
						{/if}
						<h2 class="text-lg font-semibold text-[var(--text-primary)]">{action.label}</h2>
						<ArrowRight
							size={16}
							class="ml-auto text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
						/>
					</div>
					<p class="mt-2 text-sm text-[var(--text-muted)]">
						{action.description}
					</p>
					<hr class="my-4" />
					<p class="font-mono text-xs text-[var(--text-muted)]">
						{action.usage}
					</p>
				</button>
			{/each}
		</div>
	{:else}
		<!-- Greeting -->
		<div class="flex flex-col gap-4 md:flex-row md:items-center">
			<div class="flex-1">
				<p class="text-sm font-medium tracking-wider text-[var(--text-muted)] uppercase">
					{formattedDate}
				</p>
				<h1 class="mt-1 text-3xl font-bold tracking-tight">What's Next</h1>
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

		<!-- Recommendations -->
		{#if recommendations.length > 0}
			<div class="space-y-4">
				{#each recommendations as rec, i (rec.id)}
					{@const IconComponent = iconMap[rec.icon]}
					{@const isFirst = i === 0 && rec.priority === 'high'}
					{#if rec.action}
						<button
							onclick={() =>
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								goto(resolve(rec.action?.path ?? ('/' as any)))}
							class="group flex w-full cursor-pointer items-start gap-5 rounded-2xl border border-l-4 border-[var(--border)] {priorityColors[
								rec.priority
							]} bg-[var(--surface-elevated)] {isFirst
								? 'p-8'
								: 'p-6'} text-left shadow-sm transition-all hover:shadow-md"
						>
							<div
								class="{isFirst
									? 'size-14'
									: 'size-12'} flex shrink-0 items-center justify-center rounded-xl bg-[var(--surface)]"
							>
								{#if IconComponent}
									<IconComponent
										size={isFirst ? 28 : 24}
										class={priorityIconColors[rec.priority]}
									/>
								{/if}
							</div>
							<div class="flex-1">
								<h3 class="{isFirst ? 'text-xl' : 'text-lg'} font-bold text-[var(--text-primary)]">
									{rec.title}
								</h3>
								<p class="{isFirst ? 'mt-2 text-base' : 'mt-1 text-sm'} text-[var(--text-muted)]">
									{rec.description}
								</p>
							</div>
							<ArrowRight
								size={20}
								class="mt-1 shrink-0 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
							/>
						</button>
					{:else}
						<div
							class="flex items-start gap-5 rounded-2xl border border-l-4 border-[var(--border)] {priorityColors[
								rec.priority
							]} bg-[var(--surface-elevated)] p-6 shadow-sm"
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
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					{#each ctx.recent.pinnedNotes as note (note.id)}
						<button
							onclick={() => goto(resolve('/notes'))}
							class="group cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition-all hover:border-[var(--primary)]/40 hover:shadow-sm"
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
	{/if}
</div>
