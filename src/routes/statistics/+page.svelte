<script lang="ts">
	import { goto } from '$app/navigation';
	import { ContextService } from '$lib/context/context.service';
	import { getFormattedDate } from '$lib/context/context.selectors';
	import type { HiNixContext } from '$lib/context/context.types';
	import {
		CheckSquare,
		DollarSign,
		Calendar,
		ArrowRight,
		TrendingUp,
		TrendingDown,
		Pin,
		CheckCircle2
	} from '@lucide/svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { registry } from '$lib/commands/registry';
	import { resolve } from '$app/paths';
	import { dbState } from '$lib/stores/db.svelte';

	let service = new ContextService();
	let ctx = $state<HiNixContext>(service.initContext);
	let formattedDate = $state(getFormattedDate());

	const budgetCommand = registry.get('budget');
	const todoCommand = registry.get('todo');
	const scheduleCommand = registry.get('schedule');

	$effect(() => {
		dbState.subscribe('todos');
		dbState.subscribe('budget');
		dbState.subscribe('schedules');
		dbState.subscribe('notes');
		dbState.subscribe('habits');

		service.getDashboardContext().then((res) => {
			ctx = res;
		});
	});
</script>

<svelte:head>
	<title>Statistics | HiNix</title>
</svelte:head>

<div class="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
	<!-- Greeting -->
	<div>
		<h1 class="text-3xl font-bold tracking-tight text-[var(--accent)]">Statistics</h1>
		<p class="mt-1 text-sm text-[var(--text-muted)]">
			{formattedDate} — Your data overview at a glance
		</p>
	</div>

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

	<!-- Today Stats -->
	<div class="flex flex-wrap gap-6">
		{#if settingsStore.features.todo}
			<button
				onclick={() => goto(resolve('/todo'))}
				class="group flex-1 cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 text-left shadow-sm transition-all hover:border-[var(--accent)]/30 hover:shadow-md"
			>
				<div class="mb-4 flex items-center gap-4 text-[var(--accent)]">
					<CheckSquare size={24} />
					<h2 class="text-lg font-semibold text-[var(--text-primary)]">Tasks</h2>
					<ArrowRight
						size={16}
						class="ml-auto text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
					/>
				</div>
				<div class="text-4xl font-bold">{ctx.today.tasks}</div>
				<p class="mt-2 text-sm text-[var(--text-muted)]">
					{ctx.today.tasks} pending · {ctx.today.completedTasks} done
				</p>
				<hr class="my-4" />
				<p class="text-xs text-[var(--text-muted)]">
					{todoCommand?.name}
					{todoCommand?.subcommands?.[0].usage}
				</p>
			</button>
		{/if}

		{#if settingsStore.features.budget}
			<button
				onclick={() => goto(resolve('/budget'))}
				class="group flex-1 cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 text-left shadow-sm transition-all hover:border-[var(--error)]/30 hover:shadow-md"
			>
				<div class="mb-4 flex items-center gap-4 text-[var(--error)]">
					<DollarSign size={24} />
					<h2 class="text-lg font-semibold text-[var(--text-primary)]">Today's Expenses</h2>
					<ArrowRight
						size={16}
						class="ml-auto text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
					/>
				</div>
				<div class="font-mono text-4xl font-bold">{ctx.today.expenses.toLocaleString()}</div>
				<p class="mt-2 text-sm text-[var(--text-muted)]">Total spent today</p>
				<hr class="my-4" />
				<p class="text-xs text-[var(--text-muted)]">
					{budgetCommand?.name}
					{budgetCommand?.subcommands?.[0].usage}
				</p>
			</button>
		{/if}

		{#if settingsStore.features.schedule}
			<button
				onclick={() => goto(resolve('/schedule'))}
				class="group flex-1 cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 text-left shadow-sm transition-all hover:border-[var(--success)]/30 hover:shadow-md"
			>
				<div class="mb-4 flex items-center gap-4 text-[var(--success)]">
					<Calendar size={24} />
					<h2 class="text-lg font-semibold text-[var(--text-primary)]">Events</h2>
					<ArrowRight
						size={16}
						class="ml-auto text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
					/>
				</div>
				<div class="text-4xl font-bold">{ctx.today.events}</div>
				<p class="mt-2 text-sm text-[var(--text-muted)]">Scheduled for today</p>
				<hr class="my-4" />
				<p class="text-xs text-[var(--text-muted)]">
					{scheduleCommand?.name}
					{scheduleCommand?.subcommands?.[0].usage}
				</p>
			</button>
		{/if}
	</div>

	<!-- Habits Summary -->
	{#if settingsStore.features.habits && ctx.habits}
		<button
			onclick={() => goto(resolve('/habits'))}
			class="group w-full cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 text-left shadow-sm transition-all hover:border-[var(--accent)]/30 hover:shadow-md"
		>
			<div class="mb-4 flex items-center justify-between gap-3">
				<div class="flex items-center gap-3">
					<CheckCircle2 size={24} class="text-[var(--accent)]" />
					<h2 class="text-lg font-semibold">Today's Habits</h2>
				</div>
				<ArrowRight
					size={16}
					class="ml-auto text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
				/>
			</div>

			<div class="mb-3 flex items-center justify-between">
				<span class="text-sm font-medium text-[var(--text-muted)]">
					{ctx.habits.completed} / {ctx.habits.total} completed
				</span>
				<span class="text-sm font-bold text-[var(--accent)]">
					{ctx.habits.total > 0 ? Math.round((ctx.habits.completed / ctx.habits.total) * 100) : 0}%
				</span>
			</div>

			<div class="mb-3 h-2 w-full overflow-hidden rounded-full border border-[var(--border)]">
				<div
					class="h-full bg-[var(--accent)] transition-all duration-500 ease-out"
					style="width: {ctx.habits.total > 0
						? (ctx.habits.completed / ctx.habits.total) * 100
						: 0}%"
				></div>
			</div>
		</button>
	{/if}

	<!-- Finance Summary -->
	{#if settingsStore.features.budget}
		<div
			class="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-sm"
		>
			<div class="mb-4 flex items-center gap-3">
				<DollarSign size={20} class="text-[var(--accent)]" />
				<h2 class="text-lg font-semibold">Monthly Finance</h2>
			</div>
			<div class="grid grid-cols-3 gap-6">
				<div>
					<div class="mb-1 flex items-center gap-2 text-sm text-[var(--text-muted)]">
						<TrendingUp size={14} class="text-[var(--success)]" />
						Income
					</div>
					<div class="font-mono text-xl font-bold text-[var(--success)]">
						{ctx.finance.income.toLocaleString()}
					</div>
				</div>
				<div>
					<div class="mb-1 flex items-center gap-2 text-sm text-[var(--text-muted)]">
						<TrendingDown size={14} class="text-[var(--error)]" />
						Expenses
					</div>
					<div class="font-mono text-xl font-bold text-[var(--error)]">
						{ctx.finance.expenses.toLocaleString()}
					</div>
				</div>
				<div>
					<div class="mb-1 text-sm text-[var(--text-muted)]">Remaining</div>
					<div class="font-mono text-xl font-bold">{ctx.finance.remaining.toLocaleString()}</div>
				</div>
			</div>
		</div>
	{/if}
</div>
