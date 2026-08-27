<script lang="ts">
	import { registry } from '$lib/commands/registry';
	import { HabitService } from '$lib/tools/habits/habit.service';
	import { HabitRepository } from '$lib/repositories/habit.repository';
	import { dbState } from '$lib/stores/db.svelte';
	import type { TodaySummary } from '$lib/types/habit';
	import { CheckCircle2, Circle, Trash2, Target, Plus } from '@lucide/svelte';
	import HabitCreateModal from '$lib/tools/habits/components/HabitCreateModal.svelte';
	import { resolve } from '$app/paths';

	const service = new HabitService(new HabitRepository());
	let summary: TodaySummary | null = $state(null);
	let isCreating = $state(false);
	const habitsCommand = registry.get('habits');

	async function handleAddHabit(title: string) {
		if (!title.trim()) return;
		try {
			await service.createHabit(title.trim());
			isCreating = false;
			await loadHabits();
		} catch (e) {
			console.error('Failed to create habit:', e);
		}
	}

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

<HabitCreateModal
	isOpen={isCreating}
	onClose={() => (isCreating = false)}
	onSubmit={handleAddHabit}
/>

<div class="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
	<header class="flex items-center justify-between">
		<div>
			<h1 class="text-xl font-bold tracking-tight md:text-3xl">Habits</h1>
			<p class="mt-2 text-sm text-[var(--text-muted)]">
				<span class="font-mono">See full the commands</span>
				<a
					href={resolve(`/help#${habitsCommand?.name}`)}
					class="text-[var(--accent)] hover:underline">View full commands</a
				>
			</p>
		</div>
		<button
			onclick={() => (isCreating = true)}
			class="flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--accent)] px-2.5 py-2.5 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-90 md:px-4"
		>
			<Plus size={20} />
			<span class="hidden md:inline-block">New Habit</span>
		</button>
	</header>

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
					<div
						class="flex h-[200px] flex-col items-center justify-center p-8 text-center text-[var(--text-muted)]"
					>
						<Target size={48} class="mb-4 opacity-20" />
						<p>No habits active.</p>
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
