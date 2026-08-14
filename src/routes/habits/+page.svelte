<script lang="ts">
	import { registry } from '$lib/commands/registry';
	import { HabitService } from '$lib/services/habit.service';
	import { HabitRepository } from '$lib/repositories/habit.repository';
	import { ScheduleRepository } from '$lib/repositories/schedule.repository';
	import { dbState } from '$lib/stores/db.svelte';
	import type { TodaySummary, Habit } from '$lib/types/habit';
	import { CheckCircle2, Circle, CalendarClock, Trash2 } from '@lucide/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';

	const service = new HabitService(new HabitRepository(), new ScheduleRepository());
	let summary: TodaySummary | null = $state(null);
	const habitsCommand = registry.get('habits');

	let updateModalOpen = $state(false);
	let activeHabitName = $state('');
	let deadlineDate = $state('');
	let deadlineTime = $state('');

	function openUpdateModal(habit: Habit) {
		activeHabitName = habit.name;
		if (habit.deadlineTime) {
			const parts = habit.deadlineTime.split(' ');
			deadlineDate = parts[0] || '';
			deadlineTime = parts[1] || '';
		} else {
			deadlineDate = '';
			deadlineTime = '';
		}
		updateModalOpen = true;
	}

	async function submitUpdateModal() {
		let newDeadline = undefined;
		if (deadlineDate || deadlineTime) {
			newDeadline = `${deadlineDate} ${deadlineTime}`.trim();
		}
		await service.updateHabit(activeHabitName, newDeadline);
		updateModalOpen = false;
		await loadHabits();
	}

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

	async function handleDelete(id: string) {
		await service.removeHabit(id);
		await loadHabits();
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
									{#if item.habit.deadlineTime}
										<span
											class="mt-1 flex items-center gap-1 font-mono text-xs text-[var(--accent)]"
										>
											<CalendarClock size={12} />
											{item.habit.deadlineTime}
										</span>
									{/if}
								</div>
							</div>

							<div
								class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
							>
								<button
									onclick={() => openUpdateModal(item.habit)}
									class="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)] focus:outline-none"
									aria-label="Update deadline"
								>
									<CalendarClock size={18} />
								</button>
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

<Dialog.Root bind:open={updateModalOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Update Deadline</Dialog.Title>
			<Dialog.Description>
				Set a new deadline for this habit. Format: DD-MM-YYYY and HH:MM.
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="date" class="text-right">Date</Label>
				<Input id="date" placeholder="DD-MM-YYYY" bind:value={deadlineDate} class="col-span-3" />
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="time" class="text-right">Time</Label>
				<Input id="time" placeholder="HH:MM" bind:value={deadlineTime} class="col-span-3" />
			</div>
		</div>
		<Dialog.Footer>
			<Button type="button" variant="outline" onclick={() => (updateModalOpen = false)}>
				Cancel
			</Button>
			<Button type="button" onclick={submitUpdateModal}>Save changes</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
