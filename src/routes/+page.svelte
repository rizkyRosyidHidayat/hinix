<script lang="ts">
	import { goto } from '$app/navigation';
	import { getRecommendations } from '$lib/tools/recommendation/recommendation.service';
	import type { Recommendation } from '$lib/tools/recommendation/recommendation.types';
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
		PartyPopper
	} from '@lucide/svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { resolve } from '$app/paths';
	import { dbState } from '$lib/stores/db.svelte';
	import Title from '$lib/components/shell/Title.svelte';
	import { ScheduleRepository } from '$lib/repositories/schedule.repository';
	import { ScheduleService } from '$lib/tools/schedule/schedule.service';
	import { TodoService } from '$lib/tools/todo/todo.service';
	import { TodoRepository } from '$lib/repositories/todo.repository';
	import { HabitRepository } from '$lib/repositories/habit.repository';
	import { HabitService } from '$lib/tools/habits/habit.service';
	import { shellStore } from '$lib/stores/shell.svelte';
	import TodoList from '$lib/tools/todo/components/TodoList.svelte';

	const serviceSchedule = new ScheduleService(new ScheduleRepository());
	const serviceTodo = new TodoService(new TodoRepository());
	const serviceHabit = new HabitService(new HabitRepository());
	let recommendations = $state<Recommendation[]>([]);
	let isLoading = $state<boolean>(true);
	let parsedCommand = $derived(shellStore.parsedCommand);

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
	async function loadAllData() {
		const today = new Date();
		const todayStr = today.toISOString().split('T')[0];

		const [todaySchedules, todayTask, habits] = await Promise.all([
			serviceSchedule.listByDate(todayStr),
			serviceTodo.listByDate(todayStr),
			serviceHabit.getTodaySummary()
		]);

		return todayTask.length === 0 && todaySchedules.length === 0 && (!habits || habits.total === 0);
	}

	async function loadRecommendation() {
		recommendations = await getRecommendations(settingsStore.features);
	}

	$effect(() => {
		dbState.subscribe('todos');
		dbState.subscribe('budget');
		dbState.subscribe('schedules');
		dbState.subscribe('notes');
		dbState.subscribe('habits');
		dbState.subscribe('settings');

		const fetchData = async () => {
			try {
				await loadRecommendation();
				await loadAllData();
			} catch (error) {
				console.error(error);
			} finally {
				isLoading = false;
			}
		};

		fetchData();
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

<Title title="Dashboard" />

{#if isLoading}
	<div
		class="animate-in fade-in slide-in-from-bottom-4 flex min-h-[calc(100vh-200px)] w-full items-center justify-center duration-500"
	>
		<p class="text-center text-lg text-[var(--text-muted)]">Loading dashboard...</p>
	</div>
{:else if parsedCommand}
	{#if parsedCommand.domain === 'todo'}
		<div
			class="animate-in fade-in slide-in-from-bottom-4 flex min-h-[calc(100vh-200px)] w-full flex-col items-center justify-center duration-500"
		>
			<h1 class="mb-2 text-center text-3xl leading-tight font-bold tracking-tight md:text-5xl">
				Todo List
			</h1>
			<p class="mb-8 text-center text-lg text-[var(--text-muted)]">Track and manage your tasks</p>
			<div class="w-full max-w-xl">
				<TodoList />
			</div>
		</div>
	{/if}
{:else}
	<div
		class="animate-in fade-in slide-in-from-bottom-4 flex min-h-[calc(100vh-200px)] w-full flex-col items-center justify-center duration-500"
	>
		<h1 class="mb-2 text-center text-3xl leading-tight font-bold tracking-tight md:text-5xl">
			Welcome to HiNix
		</h1>
		<p class="mb-8 text-center text-lg text-[var(--text-muted)]">Let's make your day productive</p>
		<!-- Recommendations -->
		{#if recommendations.length > 0}
			<div class="w-full max-w-xl space-y-4">
				{#each recommendations as rec, i (rec.id)}
					{@const IconComponent = iconMap[rec.icon]}
					{@const isFirst = i === 0 && rec.priority === 'high'}
					{#if rec.action?.command}
						<button
							onclick={() =>
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								goto(resolve(rec.action?.path ?? ('/' as any)))}
							class="group flex w-full cursor-pointer flex-col items-start gap-4 rounded-2xl border border-l-4 border-[var(--border)] md:flex-row {priorityColors[
								rec.priority
							]} bg-[var(--surface-elevated)] p-4 text-left transition-all md:gap-5 md:p-6"
						>
							<div
								class="{isFirst
									? 'size-12 md:size-14'
									: 'size-10 md:size-12'} flex shrink-0 items-center justify-center rounded-xl bg-[var(--surface)]"
							>
								{#if IconComponent}
									<IconComponent
										size={isFirst ? 28 : 24}
										class="{priorityIconColors[rec.priority]} {isFirst
											? 'scale-75 md:scale-100'
											: 'scale-75 md:scale-100'}"
									/>
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
								class="mt-2 hidden shrink-0 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100 md:inline-block"
							/>
						</button>
					{:else if rec.action}
						<button
							onclick={() =>
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								goto(resolve(rec.action?.path ?? ('/' as any)))}
							class="group flex w-full cursor-pointer flex-col items-start gap-4 rounded-2xl border border-l-4 border-[var(--border)] md:flex-row {priorityColors[
								rec.priority
							]} bg-[var(--surface-elevated)] p-4 text-left transition-all md:gap-5 md:p-6"
						>
							<div
								class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)] md:size-12"
							>
								{#if IconComponent}
									<IconComponent
										size={24}
										class="{priorityIconColors[rec.priority]} scale-75 md:scale-100"
									/>
								{/if}
							</div>
							<div class="flex-1">
								<h3 class="text-base font-bold text-[var(--text-primary)] md:text-lg">
									{rec.title}
								</h3>
								<p class="mt-1 text-xs text-[var(--text-muted)] md:text-sm">{rec.description}</p>
							</div>
							<ArrowRight
								size={20}
								class="mt-2 hidden shrink-0 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100 md:inline-block"
							/>
						</button>
					{:else}
						<div
							class="flex w-full flex-col items-start gap-4 rounded-2xl border border-l-4 border-[var(--border)] border-l-[var(--success)] bg-[var(--surface-elevated)] p-4 md:flex-row md:gap-5 md:p-6"
						>
							<div
								class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)] md:size-12"
							>
								{#if IconComponent}
									<IconComponent size={24} class="scale-75 text-[var(--success)] md:scale-100" />
								{/if}
							</div>
							<div class="flex-1">
								<h3 class="text-base font-bold text-[var(--text-primary)] md:text-lg">
									{rec.title}
								</h3>
								<p class="mt-1 text-xs text-[var(--text-muted)] md:text-sm">{rec.description}</p>
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{/if}
	</div>
{/if}
