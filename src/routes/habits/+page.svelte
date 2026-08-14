<script lang="ts">
	import { registry } from '$lib/commands/registry';
	import { HabitService } from '$lib/services/habit.service';
	import { dbState } from '$lib/stores/db.svelte';
	import type { TodaySummary } from '$lib/types/habit';
	import { CheckCircle2, Circle } from '@lucide/svelte';

	const service = new HabitService();
	let summary: TodaySummary | null = $state(null);
	const habitsCommand = registry.get('habits');

	async function loadHabits() {
		// Just to trigger reactivity when dbState.habits changes
		const _ = dbState.habits;
		summary = await service.getTodaySummary();
	}

	$effect(() => {
		loadHabits();
	});

	async function toggleHabit(habitName: string, isCompleted: boolean) {
		try {
			if (isCompleted) {
				await service.undoHabit(habitName);
			} else {
				await service.completeHabit(habitName);
			}
		} catch (e: any) {
			console.error('Failed to toggle habit:', e);
		}
	}
</script>

<div class="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
	<div>
		<h1 class="text-3xl font-bold tracking-tight text-[var(--accent)]">Habits</h1>
		<p class="mt-2 text-[var(--text-muted)]">{habitsCommand?.usage}</p>
	</div>

	{#if summary}
		<div class="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
			<h2 class="mb-4 text-xl font-semibold text-[var(--text-primary)]">
				Today — {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
			</h2>

			<div class="mb-4 flex items-center justify-between">
				<span class="text-sm font-medium text-[var(--text-secondary)]">
					{summary.completed} / {summary.total} completed
				</span>
				<span class="text-sm font-bold text-[var(--accent)]">
					{summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0}%
				</span>
			</div>

			<div class="mb-6 h-2 w-full overflow-hidden rounded-full bg-[var(--surface)]">
				<div
					class="h-full bg-[var(--accent)] transition-all duration-500 ease-out"
					style="width: {summary.total > 0 ? (summary.completed / summary.total) * 100 : 0}%"
				></div>
			</div>

			<div class="flex flex-col gap-3">
				{#if summary.habits.length === 0}
					<div class="py-8 text-center text-[var(--text-muted)]">
						<p>No habits active.</p>
						<p class="mt-1 text-sm">
							Use <code class="rounded bg-[var(--surface)] px-1 py-0.5 text-[var(--accent)]"
								>habits add &lt;name&gt;</code
							> in the terminal to get started.
						</p>
					</div>
				{:else}
					{#each summary.habits as item}
						<button
							class="group flex w-full items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 transition-all hover:border-[var(--accent)]/50 focus:outline-none"
							onclick={() => toggleHabit(item.habit.name, item.completed)}
						>
							<span
								class="font-medium {item.completed
									? 'text-[var(--text-muted)] line-through'
									: 'text-[var(--text-primary)]'}"
							>
								{item.habit.name}
							</span>
							{#if item.completed}
								<CheckCircle2 class="text-[var(--accent)]" size={24} />
							{:else}
								<Circle
									class="text-[var(--text-muted)] transition-colors group-hover:text-[var(--accent)]/50"
									size={24}
								/>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
