<script lang="ts">
	import { HabitService } from '$lib/tools/habits/habit.service';
	import { HabitRepository } from '$lib/repositories/habit.repository';
	import type { TodayHabit } from '$lib/types/habit';
	import { CheckCircle2, Circle, Trash2, Target } from '@lucide/svelte';
	import { shellStore } from '$lib/stores/shell.svelte';

	const service = new HabitService(new HabitRepository());
	let habits: TodayHabit[] = $state([]);
	const limit = 5;
	let parsedCommand = $derived(shellStore.parsedCommand);

	async function loadHabits() {
		habits = (await service.listTodayHabits()).filter((h) => !h.completed).slice(0, limit);
	}

	$effect(() => {
		if (parsedCommand && parsedCommand.status === 'success' && parsedCommand.domain === 'habit') {
			loadHabits();
		}
	});

	async function toggleHabit(habit: TodayHabit) {
		try {
			habit.completed = !habit.completed;
			if (habit.completed) {
				await service.undoHabit(habit.habit.name);
			} else {
				await service.completeHabit(habit.habit.name);
			}
			setTimeout(() => {
				loadHabits();
			}, 400);
		} catch (e) {
			console.error('Failed to toggle habit:', e);
		}
	}

	async function handleDelete(id: string) {
		await service.removeHabit(id);
		await loadHabits();
	}
</script>

<div class="flex flex-col gap-3">
	{#if habits.length === 0}
		<div
			class="flex h-[150px] flex-col items-center justify-center rounded-xl border border-[var(--border)] p-8 text-center text-[var(--text-muted)]"
		>
			<Target size={32} class="mb-2 opacity-30" />
			<p>No habits incomplete. <br /> Try "run everyday" to create one</p>
		</div>
	{:else}
		{#each habits as item (item.habit.id)}
			<div
				class="group flex w-full items-center justify-between gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 transition-all hover:border-[var(--accent)]/50 focus:outline-none"
			>
				<button onclick={() => toggleHabit(item)} class="cursor-pointer focus:outline-none">
					{#if item.completed}
						<CheckCircle2 class="text-[var(--accent)]" size={24} />
					{:else}
						<Circle
							class="text-[var(--text-muted)] transition-colors group-hover:text-[var(--accent)]/50"
							size={24}
						/>
					{/if}
				</button>
				<button onclick={() => toggleHabit(item)} class="flex-1 cursor-pointer text-left">
					<span
						class="font-medium {item.completed
							? 'text-[var(--text-muted)] line-through'
							: 'text-[var(--text-primary)]'}"
					>
						{item.habit.name}
					</span>
				</button>

				<div class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
