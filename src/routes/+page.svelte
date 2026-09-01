<script lang="ts">
	import { getRecommendations } from '$lib/tools/recommendation/recommendation.service';
	import type { Recommendation } from '$lib/tools/recommendation/recommendation.types';
	import { ArrowLeft } from '@lucide/svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
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
	import ScheduleList from '$lib/tools/schedule/components/ScheduleList.svelte';
	import HabitList from '$lib/tools/habits/components/HabitList.svelte';
	import BudgetList from '$lib/tools/budget/components/BudgetList.svelte';
	import NoteList from '$lib/tools/notes/components/NoteList.svelte';
	import RecomendationList from '$lib/tools/recommendation/components/RecomendationList.svelte';
	import { browser } from '$app/env';
	import { resolve } from '$app/paths';
	import { fly } from 'svelte/transition';

	const serviceSchedule = new ScheduleService(new ScheduleRepository());
	const serviceTodo = new TodoService(new TodoRepository());
	const serviceHabit = new HabitService(new HabitRepository());
	let recommendations = $state<Recommendation[]>([]);
	let isLoading = $state<boolean>(true);
	let parsedCommand = $derived(shellStore.parsedCommand);

	const animatedWords = ['tasks', 'schedule', 'habits', 'budget'];
	let animatedWordIndex = $state(0);

	$effect(() => {
		const interval = setInterval(() => {
			animatedWordIndex = (animatedWordIndex + 1) % animatedWords.length;
		}, 3000);
		return () => clearInterval(interval);
	});

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

	$effect(() => {
		// reset when parsedCommand change to null
		if (parsedCommand && browser) {
			window.scrollTo({ top: 0, behavior: 'instant' });
		}
	});

	function handleBack() {
		shellStore.clearParsedCommand();
		window.scrollTo({ top: 0, behavior: 'instant' });
	}

	const domainMap = {
		todo: TodoList,
		schedule: ScheduleList,
		habit: HabitList,
		budget: BudgetList,
		note: NoteList
	};

	let domainDisplay = $derived<
		() =>
			| {
					title: string;
					description: string;
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					path: any;
					component: keyof typeof domainMap;
			  }
			| undefined
	>(() => {
		if (parsedCommand?.status !== 'success') return;
		switch (parsedCommand?.domain) {
			case 'todo':
				return {
					title: 'Pending Tasks',
					description: 'View all your tasks',
					path: '/todo',
					component: 'todo'
				};
			case 'schedule':
				return {
					title: 'Upcoming Events',
					description: 'View all your schedules',
					path: '/schedule',
					component: 'schedule'
				};
			case 'habit':
				return {
					title: 'Incomplete Habits',
					description: 'View all your habits',
					path: '/habits',
					component: 'habit'
				};
			case 'budget':
				return {
					title: 'Today Transactions',
					description: 'View all your transactions',
					path: '/budget',
					component: 'budget'
				};
			case 'note':
				return {
					title: 'Notes',
					description: 'View all your notes',
					path: '/note',
					component: 'note'
				};
			default:
				return undefined;
		}
	});
</script>

<Title title="Dashboard" />

{#if isLoading}
	<div
		class="animate-in fade-in slide-in-from-bottom-4 flex min-h-[calc(100vh-200px)] w-full items-center justify-center duration-500"
	>
		<p class="text-center text-lg text-[var(--text-muted)]">Loading dashboard...</p>
	</div>
{:else if domainDisplay()}
	{@const ListComponent = domainMap[domainDisplay()?.component ?? 'todo']}
	<div
		class="animate-in fade-in slide-in-from-bottom-4 flex min-h-[calc(100vh-200px)] w-full flex-col items-center justify-center duration-500"
	>
		<h1 class="mb-2 text-center text-3xl leading-tight font-bold tracking-tight md:text-5xl">
			{domainDisplay()?.title}
		</h1>
		<p class="text-center text-lg text-[var(--text-muted)]">
			{domainDisplay()?.description}
			<a
				class="text-[var(--accent)] transition-colors hover:underline"
				href={resolve(domainDisplay()?.path)}
			>
				here
			</a>
		</p>
		<div class="my-8 w-full max-w-xl">
			{#if ListComponent}
				<ListComponent />
			{/if}
		</div>
		<button
			onclick={handleBack}
			class="flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--text-muted)]"
		>
			<ArrowLeft size={16} />
			Back
		</button>
	</div>
{:else}
	<div
		class="animate-in fade-in slide-in-from-bottom-4 flex min-h-[calc(100vh-200px)] w-full flex-col items-center justify-center duration-500"
	>
		<h1 class="mb-2 text-center text-3xl leading-tight font-bold tracking-tight md:text-5xl">
			Welcome to HiNix
		</h1>
		<div class="mb-8 flex items-center justify-center text-lg text-[var(--text-muted)]">
			<span>Track and manage your daily</span>
			<span
				class="relative ml-2 inline-flex h-7 w-[80px] overflow-hidden text-left text-[var(--accent)]"
			>
				{#key animatedWordIndex}
					<span
						class="absolute top-0 left-0"
						in:fly={{ y: 25, duration: 400, delay: 100 }}
						out:fly={{ y: -25, duration: 400 }}
					>
						{animatedWords[animatedWordIndex]}
					</span>
				{/key}
			</span>
		</div>
		<!-- Recommendations -->
		<RecomendationList {recommendations} />
	</div>
{/if}
