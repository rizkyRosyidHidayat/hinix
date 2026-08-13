<script lang="ts">
	import { goto } from '$app/navigation';
	import { ContextService } from '$lib/context/context.service';
	import { getFormattedDate } from '$lib/context/context.selectors';
	import type { HiNixContext } from '$lib/context/context.types';
	import { timerStore } from '$lib/stores/timer.svelte';
	import {
		CheckSquare,
		DollarSign,
		Calendar,
		Timer,
		Clock,
		ArrowRight,
		TrendingUp,
		TrendingDown,
		Pause,
		Play,
		Square,
		FileText,
		Pin
	} from '@lucide/svelte';
	import { dbState } from '$lib/stores/db.svelte';
	import { registry } from '$lib/commands/registry';

	let ctx = $state<HiNixContext | null>(null);
	let formattedDate = $state(getFormattedDate());
	let service = new ContextService();

	$effect(() => {
		// Re-run whenever any of these dbState properties change
		const _t = dbState.todos;
		const _b = dbState.budget;
		const _s = dbState.schedules;
		const _n = dbState.notes;

		service.getDashboardContext().then((res) => {
			ctx = res;
		});
	});

	const budgetCommand = registry.get('budget');
	const todoCommand = registry.get('todo');
	const scheduleCommand = registry.get('schedule');
	const notesCommand = registry.get('notes');
</script>

<svelte:head>
	<title>Dashboard | HiNix</title>
</svelte:head>

{#if ctx}
	<div class="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
		<!-- Greeting -->
		<div class="flex items-center gap-4">
			<div class="flex-1">
				<p class="text-sm font-medium tracking-wider text-[var(--text-muted)] uppercase">
					{formattedDate}
				</p>
				<h1 class="mt-1 text-3xl font-bold tracking-tight">{ctx.today.greeting}</h1>
			</div>

			<button
				onclick={() => goto('/notes')}
				class="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--surface)]"
			>
				<FileText size={16} class="text-[var(--accent)]" />
				Notes
			</button>
			<button
				onclick={() => goto('/timer')}
				class="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--surface)]"
			>
				<Timer size={16} class="text-[var(--accent)]" />
				Timer
			</button>
		</div>

		<!-- Active Timer -->
		{#if timerStore.state.status === 'running' || timerStore.state.status === 'paused'}
			<div
				class="flex items-center gap-4 rounded-xl border border-l-4 border-[var(--border)] border-l-[var(--accent)] bg-[var(--surface-elevated)] p-6 shadow-sm"
			>
				<div class="flex-1">
					<h2 class="mb-2 text-lg font-semibold">Active Timer</h2>
					<div class="font-mono text-4xl font-bold tracking-wider">
						{Math.floor(timerStore.state.remainingMs / 60000)
							.toString()
							.padStart(2, '0')}:{(Math.floor(timerStore.state.remainingMs / 1000) % 60)
							.toString()
							.padStart(2, '0')}
					</div>
					<div class="mt-4 flex gap-4 font-mono text-sm text-[var(--text-muted)]">
						Status: <span class="text-[var(--text-primary)]"
							>{timerStore.state.status.toUpperCase()}</span
						>
					</div>
				</div>
				<button
					onclick={() =>
						timerStore.state.status === 'running' ? timerStore.pause() : timerStore.resume()}
					class="rounded-full border border-[var(--border)] bg-[var(--surface)] p-4 text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-elevated)] focus:ring-4 focus:ring-[var(--border)] focus:outline-none"
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
					class="rounded-full bg-[var(--error)] p-4 text-white transition-opacity hover:opacity-90 focus:ring-4 focus:ring-[var(--error)]/50 focus:outline-none"
					aria-label="Stop Timer"
				>
					<Square size={24} fill="currentColor" />
				</button>
			</div>
		{/if}

		<!-- Upcoming Events -->
		{#if ctx.upcoming.schedules.length > 0}
			<div
				class="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-sm"
			>
				<div class="mb-4 flex items-center gap-3">
					<Clock size={20} class="text-[var(--accent)]" />
					<h2 class="text-lg font-semibold">Up Next</h2>
				</div>
				<div class="space-y-3">
					{#each ctx.upcoming.schedules as event (event.id)}
						<div
							class="flex items-center gap-4 border-b border-[var(--border)]/50 py-2 last:border-0"
						>
							<span class="w-14 shrink-0 font-mono text-sm font-semibold text-[var(--accent)]">
								{event.time || 'All Day'}
							</span>
							<span class="text-sm text-[var(--text-primary)]">{event.title}</span>
							{#if event.date !== ctx.today.date}
								<span
									class="ml-auto rounded bg-[var(--surface)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]"
								>
									{event.date}
								</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Pinned Notes -->
		{#if ctx.recent.pinnedNotes && ctx.recent.pinnedNotes.length > 0}
			<div
				class="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-sm"
			>
				<div class="mb-4 flex items-center gap-3">
					<Pin size={20} class="text-[var(--warning)]" />
					<h2 class="text-lg font-semibold">Pinned Notes</h2>
				</div>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each ctx.recent.pinnedNotes as note (note.id)}
						<button
							onclick={() => goto('/notes')}
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
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<button
				onclick={() => goto('/todo')}
				class="group cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 text-left shadow-sm transition-all hover:border-[var(--accent)]/30 hover:shadow-md"
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

			<button
				onclick={() => goto('/budget')}
				class="group cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 text-left shadow-sm transition-all hover:border-[var(--error)]/30 hover:shadow-md"
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

			<button
				onclick={() => goto('/schedule')}
				class="group cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 text-left shadow-sm transition-all hover:border-[var(--success)]/30 hover:shadow-md"
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
		</div>

		<!-- Finance Summary -->
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
	</div>
{:else}
	<div class="flex min-h-[50vh] items-center justify-center">
		<div class="animate-pulse text-[var(--text-muted)]">Loading...</div>
	</div>
{/if}
