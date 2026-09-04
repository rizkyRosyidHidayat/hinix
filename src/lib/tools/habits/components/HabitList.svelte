<script lang="ts">
	import { HabitService } from '$lib/tools/habits/habit.service';
	import { HabitRepository } from '$lib/repositories/habit.repository';
	import type { TodayHabit } from '$lib/types/habit';
	import { CheckCircle2, Circle, Trash2, Target, Pencil, Repeat } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import HabitCreateInline from './HabitCreateInline.svelte';
	import { resolve } from '$app/paths';

	const service = new HabitService(new HabitRepository());
	let habits: TodayHabit[] = $state([]);

	let editingTitleId = $state<string | null>(null);
	let editTitleValue = $state('');

	async function loadHabits() {
		habits = (await service.listTodayHabits()).filter((h) => !h.completed);
	}

	$effect(() => {
		loadHabits();
	});

	async function toggleHabit(habit: TodayHabit) {
		try {
			const wasCompleted = habit.completed;
			habit.completed = !habit.completed;
			if (wasCompleted) {
				await service.undoHabit(habit.habit.name);
				toast.info('Habit marked as incomplete', {
					description: `Habit "${habit.habit.name}" moved back to pending`
				});
			} else {
				await service.completeHabit(habit.habit.name);
				toast.success('Habit marked as completed', {
					description: `Habit "${habit.habit.name}" has been completed`
				});
			}
			setTimeout(() => {
				loadHabits();
			}, 400);
		} catch (e) {
			console.error('Failed to toggle habit:', e);
			toast.error('Failed to toggle habit');
		}
	}

	async function handleDelete(name: string) {
		await service.removeHabit(name);
		toast.success('Habit deleted successfully');
		await loadHabits();
	}

	async function saveTitle(item: TodayHabit) {
		if (editingTitleId !== item.habit.id) return;
		const newTitle = editTitleValue.trim();
		if (newTitle && newTitle !== item.habit.name) {
			try {
				await service.renameHabit(item.habit.id, newTitle);
				toast.success('Habit title updated successfully');
				await loadHabits();
			} catch (e) {
				toast.error(e instanceof Error ? e.message : 'Failed to rename habit');
			}
		}
		editingTitleId = null;
	}

	async function handleAdd(name: string, interval?: 'everyday' | 'weekday' | 'weekend') {
		try {
			await service.createHabit(name, interval);
			toast.success('Habit created successfully');
			await loadHabits();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to create habit');
		}
	}

	function autofocus(node: HTMLElement) {
		node.focus();
	}
</script>

<div
	class="animate-in fade-in slide-in-from-bottom-4 flex min-h-[calc(100vh-200px)] w-full flex-col items-center justify-center duration-500"
>
	<h1 class="mb-2 text-center text-3xl leading-tight font-bold tracking-tight md:text-5xl">
		Pending Habits
	</h1>
	<p class="mb-8 text-center text-lg text-[var(--text-muted)]">
		View all your habits
		<a
			href={resolve('/statistics?tab=habits')}
			class="text-[var(--accent)] transition-colors hover:underline"
		>
			here
		</a>
	</p>
	<div class="mb-4 w-full max-w-xl">
		<HabitCreateInline onSubmit={handleAdd} />
	</div>
	<div class="w-full max-w-xl">
		{#if habits.length === 0}
			<div
				class="flex h-[150px] w-full flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-8 text-center text-[var(--text-muted)]"
			>
				<Target size={32} class="mb-2 opacity-50" />
				<p>No habits pending</p>
			</div>
		{:else}
			<div
				class="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]"
			>
				<ul class="divide-y divide-[var(--border)]">
					{#each habits as item (item.habit.id)}
						<li class="group flex items-center gap-4 p-4">
							<button
								onclick={(e) => {
									e.stopPropagation();
									toggleHabit(item);
								}}
								class="shrink-0 cursor-pointer rounded-full focus:ring-2 focus:ring-[var(--accent)] focus:outline-none"
							>
								{#if item.completed}
									<CheckCircle2 size={24} class="text-[var(--success)]" />
								{:else}
									<Circle
										size={24}
										class="text-[var(--text-muted)] transition-colors group-hover:text-[var(--accent)]"
									/>
								{/if}
							</button>

							<div class="flex min-w-0 flex-1 flex-col items-start text-left">
								{#if editingTitleId === item.habit.id}
									<input
										use:autofocus
										bind:value={editTitleValue}
										onblur={() => saveTitle(item)}
										onkeydown={(e) => {
											if (e.key === 'Enter') {
												saveTitle(item);
											} else if (e.key === 'Escape') {
												editingTitleId = null;
											}
										}}
										type="text"
										class="w-full border-none bg-transparent text-base font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:ring-0"
										placeholder="Habit title"
									/>
								{:else}
									<div class="flex items-center gap-2">
										<span
											class="truncate text-base font-medium text-[var(--text-primary)] {item.completed
												? 'line-through opacity-50'
												: ''}"
										>
											{item.habit.name}
										</span>
										{#if item.habit.interval}
											<span
												class="inline-flex items-center rounded-md border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-[var(--accent)] uppercase {item.completed
													? 'opacity-50'
													: ''}"
											>
												<Repeat size={10} class="mr-1" />
												{item.habit.interval}
											</span>
										{/if}
									</div>
								{/if}
							</div>

							<div class="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
								<button
									onclick={(e) => {
										e.stopPropagation();
										editingTitleId = item.habit.id;
										editTitleValue = item.habit.name;
									}}
									class="cursor-pointer rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:text-[var(--accent)] focus:outline-none"
									aria-label="Edit habit"
								>
									<Pencil size={18} />
								</button>
								<button
									onclick={(e) => {
										e.stopPropagation();
										handleDelete(item.habit.name);
									}}
									class="cursor-pointer rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:text-[var(--error)] focus:outline-none"
									aria-label="Delete habit"
								>
									<Trash2 size={18} />
								</button>
							</div>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</div>
