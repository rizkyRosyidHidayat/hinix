<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		CheckSquare,
		DollarSign,
		Calendar,
		ArrowRight,
		TrendingUp,
		TrendingDown,
		CheckCircle2
	} from '@lucide/svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { registry } from '$lib/commands/registry';
	import { resolve } from '$app/paths';
	import { dbState } from '$lib/stores/db.svelte';
	import Title from '$lib/components/shell/Title.svelte';
	import { ScheduleRepository } from '$lib/repositories/schedule.repository';
	import { ScheduleService } from '$lib/tools/schedule/schedule.service';
	import { TodoService } from '$lib/tools/todo/todo.service';
	import { TodoRepository } from '$lib/repositories/todo.repository';
	import { HabitRepository } from '$lib/repositories/habit.repository';
	import { HabitService } from '$lib/tools/habits/habit.service';
	import { BudgetRepository } from '$lib/repositories/budget.repository';
	import { BudgetService } from '$lib/tools/budget/budget.service';

	const serviceSchedule = new ScheduleService(new ScheduleRepository());
	const serviceTodo = new TodoService(new TodoRepository());
	const serviceHabit = new HabitService(new HabitRepository());
	const serviceBudget = new BudgetService(new BudgetRepository());
	let ctx = $state({
		todo: 0,
		todoCompleted: 0,
		todoPending: 0,
		habits: 0,
		habitsCompleted: 0,
		habitsPending: 0,
		schedules: 0,
		expenses: 0,
		income: 0,
		net: 0
	});

	const budgetCommand = registry.get('budget');
	const todoCommand = registry.get('todo');
	const scheduleCommand = registry.get('schedule');

	$effect(() => {
		dbState.subscribe('todos');
		dbState.subscribe('budget');
		dbState.subscribe('schedules');
		dbState.subscribe('notes');
		dbState.subscribe('habits');

		const loadAllData = async () => {
			const today = new Date();
			const todayStr = today.toISOString().split('T')[0];
			const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
				.toISOString()
				.split('T')[0];
			const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
				.toISOString()
				.split('T')[0];

			const [todaySchedules, todayTask, habits, budget] = await Promise.all([
				serviceSchedule.listByDate(todayStr),
				serviceTodo.listByDate(todayStr),
				serviceHabit.getTodaySummary(),
				serviceBudget.getSummary(firstDay, lastDay)
			]);

			ctx = {
				todo: todayTask.length,
				todoCompleted: todayTask.filter((task) => task.completed).length,
				todoPending: todayTask.filter((task) => !task.completed).length,
				schedules: todaySchedules.length,
				habits: habits?.total || 0,
				habitsCompleted: habits?.completed || 0,
				habitsPending: habits?.total - habits?.completed || 0,
				expenses: budget.expenses,
				income: budget.income,
				net: budget.income - budget.expenses
			};
		};

		loadAllData();
	});
</script>

<Title title="Statistics" />

<div class="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
	<!-- Greeting -->
	<div>
		<h1 class="text-xl font-bold tracking-tight text-[var(--accent)] md:text-3xl">Statistics</h1>
		<p class="mt-1 text-sm text-[var(--text-muted)]">Your data overview at a glance</p>
	</div>

	<!-- Today Stats -->
	<div class="flex flex-col gap-6 md:flex-row">
		{#if settingsStore.features.todo}
			<button
				onclick={() => goto(resolve('/todo'))}
				class="group flex-1 cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 text-left transition-all hover:border-[var(--accent)]/30 md:p-6"
			>
				<div class="mb-4 flex items-center gap-4 text-[var(--accent)]">
					<CheckSquare size={24} />
					<h2 class="text-lg font-semibold text-[var(--text-primary)]">Tasks</h2>
					<ArrowRight
						size={16}
						class="ml-auto text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
					/>
				</div>
				<div class="text-4xl font-bold">{ctx.todo}</div>
				<p class="mt-2 text-sm text-[var(--text-muted)]">
					{ctx.todoPending} pending · {ctx.todoCompleted} done
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
				class="group flex-1 cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 text-left transition-all hover:border-[var(--error)]/30 md:p-6"
			>
				<div class="mb-4 flex items-center gap-4 text-[var(--error)]">
					<DollarSign size={24} />
					<h2 class="text-lg font-semibold text-[var(--text-primary)]">Today's Expenses</h2>
					<ArrowRight
						size={16}
						class="ml-auto text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
					/>
				</div>
				<div class="font-mono text-4xl font-bold">{ctx.expenses.toLocaleString()}</div>
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
				class="group flex-1 cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 text-left transition-all hover:border-[var(--success)]/30 md:p-6"
			>
				<div class="mb-4 flex items-center gap-4 text-[var(--success)]">
					<Calendar size={24} />
					<h2 class="text-lg font-semibold text-[var(--text-primary)]">Events</h2>
					<ArrowRight
						size={16}
						class="ml-auto text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
					/>
				</div>
				<div class="text-4xl font-bold">{ctx.schedules}</div>
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
			class="group w-full cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 text-left transition-all hover:border-[var(--accent)]/30 md:p-6"
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
					{ctx.habitsCompleted} / {ctx.habits} completed
				</span>
				<span class="text-sm font-bold text-[var(--accent)]">
					{ctx.habits > 0 ? Math.round((ctx.habitsCompleted / ctx.habits) * 100) : 0}%
				</span>
			</div>

			<div class="mb-3 h-2 w-full overflow-hidden rounded-full border border-[var(--border)]">
				<div
					class="h-full bg-[var(--accent)] transition-all duration-500 ease-out"
					style="width: {ctx.habits > 0 ? (ctx.habitsCompleted / ctx.habits) * 100 : 0}%"
				></div>
			</div>
		</button>
	{/if}

	<!-- Finance Summary -->
	{#if settingsStore.features.budget}
		<div class="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 md:p-6">
			<div class="mb-4 flex items-center gap-3">
				<DollarSign size={20} class="text-[var(--accent)]" />
				<h2 class="text-lg font-semibold">Monthly Finance</h2>
			</div>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
				<div>
					<div class="mb-1 flex items-center gap-2 text-sm text-[var(--text-muted)]">
						<TrendingUp size={14} class="text-[var(--success)]" />
						Income
					</div>
					<div class="font-mono text-xl font-bold text-[var(--success)]">
						{ctx.income.toLocaleString()}
					</div>
				</div>
				<div>
					<div class="mb-1 flex items-center gap-2 text-sm text-[var(--text-muted)]">
						<TrendingDown size={14} class="text-[var(--error)]" />
						Expenses
					</div>
					<div class="font-mono text-xl font-bold text-[var(--error)]">
						{ctx.expenses.toLocaleString()}
					</div>
				</div>
				<div>
					<div class="mb-1 text-sm text-[var(--text-muted)]">Remaining</div>
					<div class="font-mono text-xl font-bold">{ctx.net.toLocaleString()}</div>
				</div>
			</div>
		</div>
	{/if}
</div>
