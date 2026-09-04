<script lang="ts">
	import Title from '$lib/components/shell/Title.svelte';
	import { TodoRepository } from '$lib/repositories/todo.repository';
	import { TodoService } from '$lib/tools/todo/todo.service';
	import { ScheduleRepository } from '$lib/repositories/schedule.repository';
	import { ScheduleService } from '$lib/tools/schedule/schedule.service';
	import { HabitRepository } from '$lib/repositories/habit.repository';
	import { HabitService } from '$lib/tools/habits/habit.service';
	import { BudgetRepository } from '$lib/repositories/budget.repository';
	import { BudgetService } from '$lib/tools/budget/budget.service';
	import { NotesService } from '$lib/tools/notes/notes.service';
	import type { Todo } from '$lib/types/todo';
	import type { ScheduleItem } from '$lib/types/schedule';
	import type { Habit, HabitCompletion } from '$lib/types/habit';
	import type { BudgetTransaction, BudgetSummary } from '$lib/types/budget';
	import type { Note } from '$lib/types/note';
	import { toast } from 'svelte-sonner';
	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import type { CarouselAPI } from '$lib/components/ui/carousel/context.js';
	import {
		CheckCircle2,
		Circle,
		Trash2,
		CheckSquare,
		Calendar,
		Target,
		Receipt,
		FileText,
		Repeat,
		Pin,
		TrendingUp,
		TrendingDown,
		Clock
	} from '@lucide/svelte';

	// Services
	const todoService = new TodoService(new TodoRepository(), new ScheduleRepository());
	const scheduleService = new ScheduleService(new ScheduleRepository());
	const habitService = new HabitService(new HabitRepository());
	const budgetService = new BudgetService(new BudgetRepository());
	const notesService = new NotesService();

	// State
	let isLoading = $state(true);
	let todos = $state<Todo[]>([]);
	let schedules = $state<ScheduleItem[]>([]);
	let habits = $state<Habit[]>([]);
	let habitCompletions = $state<HabitCompletion[]>([]);
	let transactions = $state<BudgetTransaction[]>([]);
	let monthlySummary = $state<BudgetSummary>({
		income: 0,
		expenses: 0,
		remaining: 0,
		byCategory: {}
	});
	let notes = $state<Note[]>([]);

	// Selected tab
	type DomainTab = 'todo' | 'schedule' | 'habits' | 'budget' | 'notes';
	let selectedTab = $state<DomainTab>('todo');

	const summaryCards: { key: DomainTab; icon: typeof CheckSquare; label: string }[] = [
		{ key: 'todo', icon: CheckSquare, label: 'Tasks' },
		{ key: 'schedule', icon: Calendar, label: 'Events' },
		{ key: 'habits', icon: Target, label: 'Habits' },
		{ key: 'budget', icon: Receipt, label: 'Budget' },
		{ key: 'notes', icon: FileText, label: 'Notes' }
	];

	// Derived stats
	let todoStats = $derived({
		total: todos.length,
		completed: todos.filter((t) => t.completed).length,
		pending: todos.filter((t) => !t.completed).length,
		overdue: todos.filter((t) => !t.completed && t.deadline && new Date(t.deadline) < new Date())
			.length
	});

	let scheduleStats = $derived({
		total: schedules.length,
		upcoming: schedules.filter((s) => {
			const now = new Date();
			const eventDate = new Date(s.date);
			return eventDate >= new Date(now.toISOString().split('T')[0]);
		}).length,
		recurring: schedules.length
	});

	let habitStats = $derived({
		total: habits.length,
		active: habits.filter((h) => !h.archived).length
	});

	let noteStats = $derived({
		total: notes.length,
		pinned: notes.filter((n) => n.pinned).length
	});

	// Carousel state
	let carouselApi = $state<CarouselAPI>();
	let currentSlide = $state(0);
	let slideCount = $state(0);

	$effect(() => {
		if (!carouselApi) return;

		slideCount = carouselApi.scrollSnapList().length;
		currentSlide = carouselApi.selectedScrollSnap() + 1;

		carouselApi.on('select', () => {
			if (!carouselApi) return;
			currentSlide = carouselApi.selectedScrollSnap() + 1;
		});
	});

	// Per-card subtitle
	function getSubtitle(key: DomainTab): string {
		switch (key) {
			case 'todo':
				return `${todoStats.completed} done · ${todoStats.pending} pending`;
			case 'schedule':
				return `${scheduleStats.upcoming} upcoming`;
			case 'habits':
				return `${habitStats.active} active · ${habitCompletions.length} done`;
			case 'budget':
				return `${formatAmount(monthlySummary.expenses)} spent`;
			case 'notes':
				return `${noteStats.pinned} pinned`;
		}
	}

	function getCount(key: DomainTab): string {
		switch (key) {
			case 'todo':
				return todoStats.total.toString();
			case 'schedule':
				return scheduleStats.total.toString();
			case 'habits':
				return habitStats.active.toString();
			case 'budget':
				return formatAmount(monthlySummary.income);
			case 'notes':
				return noteStats.total.toString();
		}
	}

	async function loadAll() {
		try {
			const now = new Date();
			const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
			const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
				.toISOString()
				.split('T')[0];

			const [todosRes, schedulesRes, habitsRes, txRes, summaryRes, notesRes] = await Promise.all([
				todoService.list(),
				scheduleService.list(),
				habitService.listHabits(),
				budgetService.list(),
				budgetService.getSummary(firstDay, lastDay),
				notesService.list()
			]);

			todos = todosRes;
			schedules = schedulesRes;
			habits = habitsRes;
			transactions = txRes;
			monthlySummary = summaryRes;
			notes = notesRes;

			// Load habit completions
			const habitRepo = new HabitRepository();
			const allCompletions: HabitCompletion[] = [];
			for (const h of habitsRes) {
				const comps = await habitRepo.findCompletionsByHabit(h.id);
				allCompletions.push(...comps);
			}
			habitCompletions = allCompletions;
		} catch (e) {
			console.error('Failed to load statistics:', e);
		} finally {
			isLoading = false;
		}
	}

	$effect(() => {
		loadAll();
	});

	// Actions
	async function toggleTodo(todo: Todo) {
		try {
			if (todo.completed) {
				await todoService.uncomplete(todo.id);
				toast.info(`"${todo.title}" marked as pending`);
			} else {
				await todoService.complete(todo.id);
				toast.success(`"${todo.title}" completed`);
			}
			await loadAll();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to toggle todo');
		}
	}

	async function deleteTodo(id: string) {
		try {
			await todoService.delete(id);
			toast.success('Task deleted');
			await loadAll();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to delete');
		}
	}

	async function deleteSchedule(id: string) {
		try {
			await scheduleService.delete(id);
			toast.success('Event deleted');
			await loadAll();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to delete');
		}
	}

	async function deleteNote(id: string) {
		try {
			await notesService.delete(id);
			toast.success('Note deleted');
			await loadAll();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to delete');
		}
	}

	async function deleteTransaction(id: string) {
		try {
			await budgetService.delete(id);
			toast.success('Transaction deleted');
			await loadAll();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to delete');
		}
	}

	async function removeHabit(name: string) {
		try {
			await habitService.removeHabit(name);
			toast.success('Habit removed');
			await loadAll();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to remove');
		}
	}

	function getHabitCompletionCount(habitId: string): number {
		return habitCompletions.filter((c) => c.habitId === habitId).length;
	}

	function timeAgo(dateStr: string): string {
		const diff = Date.now() - new Date(dateStr).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return 'Just now';
		if (mins < 60) return `${mins}m ago`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		if (days < 7) return `${days}d ago`;
		return new Date(dateStr).toLocaleDateString();
	}

	function formatAmount(amount: number): string {
		return amount.toLocaleString();
	}
</script>

<Title title="Statistics" />

{#if isLoading}
	<div
		class="animate-in fade-in slide-in-from-bottom-4 flex min-h-[calc(100vh-200px)] w-full items-center justify-center duration-500"
	>
		<p class="text-center text-lg text-[var(--text-muted)]">Loading statistics...</p>
	</div>
{:else}
	<div
		class="animate-in fade-in slide-in-from-bottom-4 mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-8 duration-500"
	>
		<!-- Header -->
		<div class="text-center">
			<h1 class="mb-2 text-center text-3xl leading-tight font-bold tracking-tight md:text-5xl">
				Statistics
			</h1>
			<p class="mb-8 text-center text-lg text-[var(--text-muted)]">
				Discover all your data across modules
			</p>
		</div>

		<!-- Summary Carousel -->
		<!-- We pass onkeydown to override keyboard arrows as requested -->
		<Carousel.Root
			setApi={(api) => (carouselApi = api)}
			opts={{ align: 'start', loop: true }}
			onkeydown={(e: KeyboardEvent) => {
				if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
					e.preventDefault();
				}
			}}
		>
			<Carousel.Content class="-ml-3">
				{#each summaryCards as card (card.key)}
					{@const Icon = card.icon}
					<Carousel.Item class="basis-1/2 pl-3">
						<button
							onclick={() => (selectedTab = card.key)}
							class="w-full cursor-pointer rounded-xl border p-4 text-left transition-all duration-200 {selectedTab ===
							card.key
								? 'border-[var(--accent)] bg-[var(--accent)]/5 ring-1 ring-[var(--accent)]/20'
								: 'border-[var(--border)] bg-[var(--surface-elevated)] hover:border-[var(--accent)]/30'}"
						>
							<div class="flex items-center gap-2">
								<div
									class="flex size-7 items-center justify-center rounded-lg transition-colors duration-200 {selectedTab ===
									card.key
										? 'bg-[var(--accent)]/15'
										: 'bg-[var(--surface)]'}"
								>
									<Icon
										size={14}
										class="transition-colors duration-200 {selectedTab === card.key
											? 'text-[var(--accent)]'
											: 'text-[var(--text-muted)]'}"
									/>
								</div>
								<span
									class="text-xs font-medium tracking-wider uppercase transition-colors duration-200 {selectedTab ===
									card.key
										? 'text-[var(--accent)]'
										: 'text-[var(--text-muted)]'}"
								>
									{card.label}
								</span>
							</div>
							<p
								class="mt-2 text-2xl font-bold transition-colors duration-200 {selectedTab ===
								card.key
									? 'text-[var(--accent)]'
									: 'text-[var(--text-primary)]'}"
							>
								{getCount(card.key)}
							</p>
							<p class="text-xs text-[var(--text-muted)]">
								{getSubtitle(card.key)}
							</p>
						</button>
					</Carousel.Item>
				{/each}
			</Carousel.Content>
		</Carousel.Root>

		<!-- Carousel Indicators -->
		{#if slideCount > 0}
			<div class="-mt-4 flex justify-center gap-2">
				<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
				{#each Array(slideCount) as _, i (i)}
					<button
						class="h-2 cursor-pointer rounded-full transition-all duration-200 {currentSlide ===
						i + 1
							? 'w-6 bg-[var(--accent)]'
							: 'w-2 bg-[var(--border)] hover:bg-[var(--text-muted)]'}"
						onclick={() => carouselApi?.scrollTo(i)}
						aria-label="Go to slide {i + 1}"
					></button>
				{/each}
			</div>
		{/if}

		<!-- Detail Content (Tab-based) -->
		<div class="w-full">
			{#if selectedTab === 'todo'}
				<!-- ═══ TASKS ═══ -->
				<div
					class="animate-in fade-in slide-in-from-bottom-2 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] duration-200"
				>
					<div class="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
						<div class="flex items-center gap-3">
							<div class="flex size-9 items-center justify-center rounded-lg bg-[var(--accent)]/10">
								<CheckSquare size={18} class="text-[var(--accent)]" />
							</div>
							<div>
								<h2 class="font-semibold text-[var(--text-primary)]">All Tasks</h2>
								<p class="text-xs text-[var(--text-muted)]">
									{todoStats.pending} pending · {todoStats.completed} completed
									{#if todoStats.overdue > 0}
										· <span class="text-[var(--error)]">{todoStats.overdue} overdue</span>
									{/if}
								</p>
							</div>
						</div>
					</div>
					<div class="max-h-[400px] overflow-y-auto">
						{#if todos.length === 0}
							<div
								class="flex h-[120px] items-center justify-center text-sm text-[var(--text-muted)]"
							>
								No tasks created yet
							</div>
						{:else}
							<ul class="divide-y divide-[var(--border)]">
								{#each todos as todo (todo.id)}
									<li class="group flex items-center gap-3 px-5 py-3">
										<button
											onclick={() => toggleTodo(todo)}
											class="shrink-0 cursor-pointer rounded-full focus:outline-none"
										>
											{#if todo.completed}
												<CheckCircle2 size={20} class="text-[var(--success)]" />
											{:else}
												<Circle
													size={20}
													class="text-[var(--text-muted)] transition-colors group-hover:text-[var(--accent)]"
												/>
											{/if}
										</button>
										<div class="min-w-0 flex-1">
											<p
												class="truncate text-sm font-medium text-[var(--text-primary)] {todo.completed
													? 'line-through opacity-50'
													: ''}"
											>
												{todo.title}
											</p>
											{#if todo.deadline}
												<p
													class="text-[10px] {new Date(todo.deadline) < new Date() &&
													!todo.completed
														? 'text-[var(--error)]'
														: 'text-[var(--text-muted)]'}"
												>
													<Clock size={10} class="mr-0.5 inline-block" />
													{new Date(todo.deadline).toLocaleDateString()}
												</p>
											{/if}
										</div>
										<button
											onclick={() => deleteTodo(todo.id)}
											class="shrink-0 cursor-pointer rounded-lg p-1.5 text-[var(--text-muted)] opacity-0 transition-all group-hover:opacity-100 hover:text-[var(--error)] focus:outline-none"
										>
											<Trash2 size={14} />
										</button>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</div>
			{:else if selectedTab === 'schedule'}
				<!-- ═══ SCHEDULE ═══ -->
				<div
					class="animate-in fade-in slide-in-from-bottom-2 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] duration-200"
				>
					<div class="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
						<div class="flex items-center gap-3">
							<div class="flex size-9 items-center justify-center rounded-lg bg-[var(--accent)]/10">
								<Calendar size={18} class="text-[var(--accent)]" />
							</div>
							<div>
								<h2 class="font-semibold text-[var(--text-primary)]">All Events</h2>
								<p class="text-xs text-[var(--text-muted)]">
									{scheduleStats.upcoming} upcoming · {scheduleStats.recurring} total
								</p>
							</div>
						</div>
					</div>
					<div class="max-h-[400px] overflow-y-auto">
						{#if schedules.length === 0}
							<div
								class="flex h-[120px] items-center justify-center text-sm text-[var(--text-muted)]"
							>
								No events created yet
							</div>
						{:else}
							<ul class="divide-y divide-[var(--border)]">
								{#each schedules as item (item.id)}
									<li class="group flex items-center gap-3 px-5 py-3">
										<div
											class="flex h-10 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-[var(--surface)]"
										>
											{#if item.time}
												<span class="text-xs font-bold text-[var(--text-primary)]">{item.time}</span
												>
											{:else}
												<span
													class="text-[9px] font-semibold tracking-wider text-[var(--text-muted)] uppercase"
													>All Day</span
												>
											{/if}
										</div>
										<div class="min-w-0 flex-1">
											<div class="flex items-center gap-2">
												<p class="truncate text-sm font-medium text-[var(--text-primary)]">
													{item.title}
												</p>
											</div>
											<p class="text-[10px] text-[var(--text-muted)]">{item.date}</p>
										</div>
										<button
											onclick={() => deleteSchedule(item.id)}
											class="shrink-0 cursor-pointer rounded-lg p-1.5 text-[var(--text-muted)] opacity-0 transition-all group-hover:opacity-100 hover:text-[var(--error)] focus:outline-none"
										>
											<Trash2 size={14} />
										</button>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</div>
			{:else if selectedTab === 'habits'}
				<!-- ═══ HABITS ═══ -->
				<div
					class="animate-in fade-in slide-in-from-bottom-2 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] duration-200"
				>
					<div class="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
						<div class="flex items-center gap-3">
							<div class="flex size-9 items-center justify-center rounded-lg bg-[var(--accent)]/10">
								<Target size={18} class="text-[var(--accent)]" />
							</div>
							<div>
								<h2 class="font-semibold text-[var(--text-primary)]">All Habits</h2>
								<p class="text-xs text-[var(--text-muted)]">
									{habitStats.active} active · {habitCompletions.length} total completions
								</p>
							</div>
						</div>
					</div>
					<div class="max-h-[400px] overflow-y-auto">
						{#if habits.length === 0}
							<div
								class="flex h-[120px] items-center justify-center text-sm text-[var(--text-muted)]"
							>
								No habits created yet
							</div>
						{:else}
							<ul class="divide-y divide-[var(--border)]">
								{#each habits as habit (habit.id)}
									<li class="group flex items-center gap-3 px-5 py-3">
										<div
											class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface)]"
										>
											<Target
												size={16}
												class={habit.archived ? 'text-[var(--text-muted)]' : 'text-[var(--accent)]'}
											/>
										</div>
										<div class="min-w-0 flex-1">
											<div class="flex items-center gap-2">
												<p
													class="truncate text-sm font-medium text-[var(--text-primary)] {habit.archived
														? 'line-through opacity-50'
														: ''}"
												>
													{habit.name}
												</p>
												{#if habit.interval}
													<span
														class="inline-flex items-center rounded-md border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-1 py-0.5 text-[9px] font-medium tracking-wider text-[var(--accent)] uppercase"
													>
														<Repeat size={8} class="mr-0.5" />
														{habit.interval}
													</span>
												{/if}
											</div>
											<p class="text-[10px] text-[var(--text-muted)]">
												{getHabitCompletionCount(habit.id)} completions
											</p>
										</div>
										{#if !habit.archived}
											<button
												onclick={() => removeHabit(habit.name)}
												class="shrink-0 cursor-pointer rounded-lg p-1.5 text-[var(--text-muted)] opacity-0 transition-all group-hover:opacity-100 hover:text-[var(--error)] focus:outline-none"
											>
												<Trash2 size={14} />
											</button>
										{/if}
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</div>
			{:else if selectedTab === 'budget'}
				<!-- ═══ BUDGET ═══ -->
				<div
					class="animate-in fade-in slide-in-from-bottom-2 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] duration-200"
				>
					<div class="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
						<div class="flex items-center gap-3">
							<div class="flex size-9 items-center justify-center rounded-lg bg-[var(--accent)]/10">
								<Receipt size={18} class="text-[var(--accent)]" />
							</div>
							<div>
								<h2 class="font-semibold text-[var(--text-primary)]">Budget — This Month</h2>
								<p class="text-xs text-[var(--text-muted)]">
									{transactions.length} transactions total
								</p>
							</div>
						</div>
					</div>

					<!-- Summary + Category -->
					<div class="p-5">
						<div class="space-y-4">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<TrendingUp size={16} class="text-[var(--success)]" />
									<span class="text-sm text-[var(--text-muted)]">Income</span>
								</div>
								<span class="text-lg font-bold text-[var(--success)]">
									{formatAmount(monthlySummary.income)}
								</span>
							</div>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<TrendingDown size={16} class="text-[var(--error)]" />
									<span class="text-sm text-[var(--text-muted)]">Expenses</span>
								</div>
								<span class="text-lg font-bold text-[var(--error)]">
									{formatAmount(monthlySummary.expenses)}
								</span>
							</div>
							<div class="border-t border-[var(--border)] pt-4">
								<div class="flex items-center justify-between">
									<span class="text-sm font-medium text-[var(--text-muted)]">Remaining</span>
									<span
										class="text-xl font-bold {monthlySummary.remaining >= 0
											? 'text-[var(--success)]'
											: 'text-[var(--error)]'}"
									>
										{monthlySummary.remaining >= 0 ? '+' : ''}{formatAmount(
											monthlySummary.remaining
										)}
									</span>
								</div>
							</div>
						</div>
					</div>

					<!-- Recent Transactions -->
					<div class="border-t border-[var(--border)]">
						<div class="px-5 py-3">
							<h3 class="text-xs font-medium tracking-wider text-[var(--text-muted)] uppercase">
								Recent Transactions
							</h3>
						</div>
						<div class="max-h-[240px] overflow-y-auto">
							{#if transactions.length === 0}
								<div
									class="flex h-[80px] items-center justify-center text-sm text-[var(--text-muted)]"
								>
									No transactions yet
								</div>
							{:else}
								<ul class="divide-y divide-[var(--border)]">
									{#each transactions.slice(0, 10) as tx (tx.id)}
										<li class="group relative flex items-center gap-3 px-5 py-2.5">
											<div
												class="flex size-8 shrink-0 items-center justify-center rounded-lg {tx.type ===
												'income'
													? 'bg-[var(--success)]/10'
													: 'bg-[var(--error)]/10'}"
											>
												{#if tx.type === 'income'}
													<TrendingUp size={14} class="text-[var(--success)]" />
												{:else}
													<TrendingDown size={14} class="text-[var(--error)]" />
												{/if}
											</div>
											<div class="min-w-0 flex-1">
												<p class="truncate text-sm text-[var(--text-primary)]">
													{tx.description || tx.category || 'Uncategorized'}
												</p>
												<p class="text-[10px] text-[var(--text-muted)]">
													{tx.date} · {tx.category || 'No category'}
												</p>
											</div>
											<span
												class="absolute right-5 shrink-0 text-sm font-semibold transition-all group-hover:right-[60px] {tx.type ===
												'income'
													? 'text-[var(--success)]'
													: 'text-[var(--error)]'}"
											>
												{tx.type === 'income' ? '+' : '-'}{formatAmount(tx.amount)}
											</span>
											<button
												onclick={() => deleteTransaction(tx.id)}
												class="shrink-0 cursor-pointer rounded-lg p-1.5 text-[var(--text-muted)] opacity-0 transition-all group-hover:opacity-100 hover:text-[var(--error)] focus:outline-none"
											>
												<Trash2 size={14} />
											</button>
										</li>
									{/each}
								</ul>
							{/if}
						</div>
					</div>
				</div>
			{:else if selectedTab === 'notes'}
				<!-- ═══ NOTES ═══ -->
				<div
					class="animate-in fade-in slide-in-from-bottom-2 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] duration-200"
				>
					<div class="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
						<div class="flex items-center gap-3">
							<div class="flex size-9 items-center justify-center rounded-lg bg-[var(--accent)]/10">
								<FileText size={18} class="text-[var(--accent)]" />
							</div>
							<div>
								<h2 class="font-semibold text-[var(--text-primary)]">All Notes</h2>
								<p class="text-xs text-[var(--text-muted)]">
									{noteStats.total} total · {noteStats.pinned} pinned
								</p>
							</div>
						</div>
					</div>
					<div class="max-h-[400px] overflow-y-auto">
						{#if notes.length === 0}
							<div
								class="flex h-[120px] items-center justify-center text-sm text-[var(--text-muted)]"
							>
								No notes created yet
							</div>
						{:else}
							<ul class="divide-y divide-[var(--border)]">
								{#each notes as note (note.id)}
									<li class="group flex items-center gap-3 px-5 py-3">
										<div
											class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface)]"
										>
											{#if note.pinned}
												<Pin size={16} class="text-[var(--warning)]" fill="currentColor" />
											{:else}
												<FileText size={16} class="text-[var(--text-muted)]" />
											{/if}
										</div>
										<div class="min-w-0 flex-1">
											<p class="truncate text-sm font-medium text-[var(--text-primary)]">
												{note.title}
											</p>
											<p class="truncate text-[10px] text-[var(--text-muted)]">
												{note.content
													? note.content.substring(0, 50) + (note.content.length > 50 ? '...' : '')
													: 'No content'}
												· {timeAgo(note.updatedAt)}
											</p>
										</div>
										<button
											onclick={() => deleteNote(note.id)}
											class="shrink-0 cursor-pointer rounded-lg p-1.5 text-[var(--text-muted)] opacity-0 transition-all group-hover:opacity-100 hover:text-[var(--error)] focus:outline-none"
										>
											<Trash2 size={14} />
										</button>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
