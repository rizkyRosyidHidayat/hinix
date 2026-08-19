<script lang="ts">
	import { registry } from '$lib/commands/registry';
	import { HabitService } from '$lib/services/habit.service';
	import { HabitRepository } from '$lib/repositories/habit.repository';
	import { dbState } from '$lib/stores/db.svelte';
	import type { TodaySummary } from '$lib/types/habit';
	import { CheckCircle2, Circle, Trash2 } from '@lucide/svelte';
	import { resolve } from '$app/paths';

	const service = new HabitService(new HabitRepository());
	let summary: TodaySummary | null = $state(null);
	const habitsCommand = registry.get('habits');

	async function loadHabits() {
		// Just to trigger reactivity when dbState.habits changes
		dbState.subscribe('habits');
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
		} catch (e) {
			console.error('Failed to toggle habit:', e);
		}
	}

	async function handleDelete(id: string) {
		await service.removeHabit(id);
		await loadHabits();
	}
</script>

<div class="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
	<div>
		<h1 class="text-3xl font-bold tracking-tight text-[var(--accent)]">Habits</h1>
		<p class="mt-2 text-sm text-[var(--text-muted)]">
			<span class="font-mono">See full the commands usage in help menu</span>
			<a href={resolve(`/help#${habitsCommand?.name}`)} class="text-[var(--accent)] hover:underline"
				>View full commands</a
			>
		</p>
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

			<div class="mb-6 h-2 w-full overflow-hidden rounded-full border border-[var(--border)]">
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
					{#each summary.habits as item (item.habit.id)}
						<div
							class="group flex w-full items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 transition-all hover:border-[var(--accent)]/50 focus:outline-none"
						>
							<div class="flex items-center gap-3">
								<button
									onclick={() => toggleHabit(item.habit.name, item.completed)}
									class="focus:outline-none"
								>
									{#if item.completed}
										<CheckCircle2 class="text-[var(--accent)]" size={24} />
									{:else}
										<Circle
											class="text-[var(--text-muted)] transition-colors group-hover:text-[var(--accent)]/50"
											size={24}
										/>
									{/if}
								</button>
								<div class="flex flex-col">
									<span
										class="font-medium {item.completed
											? 'text-[var(--text-muted)] line-through'
											: 'text-[var(--text-primary)]'}"
									>
										{item.habit.name}
									</span>
								</div>
							</div>

							<div
								class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
							>
								<button
									onclick={() => handleDelete(item.habit.name)}
									class="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:text-[var(--error)] focus:ring-2 focus:ring-[var(--error)] focus:outline-none"
									aria-label="Delete task"
								>
									<Trash2 size={18} />
								</button>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
