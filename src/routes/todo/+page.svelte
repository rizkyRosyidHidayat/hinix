<script lang="ts">
	import { TodoRepository } from '$lib/repositories/todo.repository';
	import { ScheduleRepository } from '$lib/repositories/schedule.repository';
	import { TodoService } from '$lib/tools/todo/todo.service';
	import type { Todo } from '$lib/types/todo';
	import {
		CheckCircle,
		Circle,
		Trash2,
		Plus,
		CheckSquare,
		ArrowLeft,
		Pencil,
		InfoIcon,
		Search
	} from '@lucide/svelte';
	import { dbState } from '$lib/stores/db.svelte';
	import { registry } from '$lib/commands/registry';
	import { format } from 'date-fns';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Title from '$lib/components/shell/Title.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Pagination from '$lib/components/ui/pagination/index.js';
	import TodoCreateModal from '$lib/tools/todo/components/TodoCreateModal.svelte';

	let todos = $state<Todo[]>([]);
	let service = new TodoService(new TodoRepository(), new ScheduleRepository());
	let todoCommand = registry.get('todo');

	let activeTodo = $state<Todo | null>(null);
	let editDescription = $state('');
	let editTitle = $state('');
	let isEditingTitle = $state(false);

	let searchQuery = $state('');
	let currentTab = $state('all');
	let currentPage = $state(1);
	let isCreating = $state(false);
	const itemsPerPage = 10;

	let filteredTodos = $derived(
		searchQuery || currentTab !== 'all'
			? todos.filter(
					(t) =>
						(currentTab === 'all' ||
							(currentTab === 'completed' && t.completed) ||
							(currentTab === 'pending' && !t.completed)) &&
						(!searchQuery ||
							t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
							(t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())))
				)
			: [...todos]
	);

	let paginatedTodos = $derived(
		filteredTodos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);

	$effect(() => {
		// Reset page when filter changes
		if (searchQuery !== undefined && currentTab !== undefined) {
			currentPage = 1;
		}
	});

	$effect(() => {
		// Re-run whenever dbState.todos changes
		dbState.subscribe('todos');
		const todoId = page.url.searchParams.get('id');
		const filterParam = page.url.searchParams.get('filter');

		if (filterParam && ['pending', 'completed'].includes(filterParam)) {
			currentTab = filterParam;
		} else {
			currentTab = 'all';
		}

		loadTodos().then(() => {
			if (todoId) {
				const todo = todos.find((t) => t.id === todoId || t.id.startsWith(todoId));
				if (todo) {
					activeTodo = todo;
					editDescription = todo.description || '';
					editTitle = todo.title;
					isEditingTitle = false;
				}
			} else {
				activeTodo = null;
			}
		});
	});

	async function loadTodos() {
		todos = await service.list();
	}

	async function handleAdd(title: string) {
		if (!title.trim()) return;
		await service.create(title.trim());
		isCreating = false;
		await loadTodos();
	}

	async function handleToggle(id: string, currentlyCompleted: boolean) {
		if (currentlyCompleted) {
			await service.uncomplete(id);
		} else {
			await service.complete(id);
		}
		await loadTodos();
	}

	async function handleDelete(id: string) {
		await service.delete(id);
		await loadTodos();
		if (activeTodo?.id === id) {
			activeTodo = null;
		}
	}

	function openTodo(todo: Todo) {
		activeTodo = todo;
		editDescription = todo.description || '';
		editTitle = todo.title;
		isEditingTitle = false;
		goto(resolve(`/todo?id=${todo.id}`), { replaceState: true });
	}

	function closeTodo() {
		activeTodo = null;
		goto(resolve('/todo'), { replaceState: true });
	}

	async function saveTodoDesc() {
		if (!activeTodo) return;
		const updated = await service.update(activeTodo.id, undefined, editDescription);
		const index = todos.findIndex((t) => t.id === updated.id);
		if (index !== -1) {
			todos[index] = updated;
		}
	}

	async function saveTodoTitle() {
		if (!activeTodo) return;
		if (!editTitle.trim()) {
			editTitle = activeTodo.title;
			return;
		}
		const updated = await service.update(activeTodo.id, undefined, undefined, editTitle.trim());
		const index = todos.findIndex((t) => t.id === updated.id);
		if (index !== -1) {
			todos[index] = updated;
		}
		activeTodo = updated;
	}

	const updateDeadlineUsage = $derived(() => {
		const subcommand = todoCommand?.subcommands?.find((c) => c.name === 'update');
		const flag = subcommand?.flags?.find((f) => f.name === 'deadline');
		return `${todoCommand?.name} ${subcommand?.usage} ${flag?.usage}`;
	});
</script>

<Title title="Todo" />

<TodoCreateModal isOpen={isCreating} onClose={() => (isCreating = false)} onSubmit={handleAdd} />

<div class="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500">
	{#if !activeTodo}
		<header class="flex items-center justify-between">
			<div>
				<h1 class="text-xl font-bold tracking-tight md:text-3xl">Todo</h1>
				<p class="mt-2 text-sm text-[var(--text-muted)]">
					<span class="font-mono">See full the commands</span>
					<a
						href={resolve(`/help#${todoCommand?.name}`)}
						class="text-[var(--accent)] hover:underline">View full commands</a
					>
				</p>
			</div>
			<button
				onclick={() => (isCreating = true)}
				class="flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--accent)] px-2.5 py-2.5 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-90 md:px-4"
			>
				<Plus size={20} />
				<span class="hidden md:inline-block">New Task</span>
			</button>
		</header>

		<!-- Search and Filter -->
		<div class="flex flex-col gap-4 md:flex-row">
			<Tabs.Root bind:value={currentTab}>
				<Tabs.List
					class="h-10! w-full border border-[var(--border)] bg-[var(--surface-elevated)] md:w-auto"
				>
					<Tabs.Trigger value="all">All</Tabs.Trigger>
					<Tabs.Trigger value="pending">Pending</Tabs.Trigger>
					<Tabs.Trigger value="completed">Completed</Tabs.Trigger>
				</Tabs.List>
			</Tabs.Root>

			<div class="relative flex-1">
				<Search
					size={16}
					class="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--text-muted)]"
				/>
				<input
					bind:value={searchQuery}
					type="text"
					class="h-10! w-full rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] py-2.5 pr-4 pl-10 text-sm text-[var(--text-primary)] transition-colors outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]/40"
					placeholder="Search tasks..."
				/>
			</div>
		</div>
	{/if}

	{#if activeTodo}
		<!-- Editor View -->
		<div class="space-y-4">
			<button
				onclick={closeTodo}
				class="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
			>
				<ArrowLeft size={16} />
				Back to todos
			</button>

			<div class="flex items-center gap-4 pt-2">
				<button
					onclick={() => {
						if (activeTodo) {
							handleToggle(activeTodo.id, activeTodo.completed);
							activeTodo.completed = !activeTodo.completed;
						}
					}}
					class="shrink-0 rounded-full focus:ring-2 focus:ring-[var(--accent)] focus:outline-none"
				>
					{#if activeTodo.completed}
						<CheckCircle size={32} class="text-[var(--success)]" />
					{:else}
						<Circle
							size={32}
							class="text-[var(--text-muted)] transition-colors hover:text-[var(--accent)]"
						/>
					{/if}
				</button>
				<div class="group flex flex-1 items-center gap-2">
					{#if isEditingTitle}
						<input
							bind:value={editTitle}
							onblur={() => {
								saveTodoTitle();
								isEditingTitle = false;
							}}
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									saveTodoTitle();
									isEditingTitle = false;
								}
							}}
							type="text"
							class="w-full border-none bg-transparent text-2xl font-bold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:ring-0"
							placeholder="Task title"
						/>
					{:else}
						<h1
							class="text-2xl font-bold text-[var(--text-primary)] {activeTodo.completed
								? 'line-through opacity-50'
								: ''}"
						>
							{activeTodo.title}
						</h1>
						<button
							onclick={() => (isEditingTitle = true)}
							class="cursor-pointer text-[var(--text-muted)] opacity-0 transition-all group-hover:opacity-100 hover:text-[var(--accent)]"
							title="Edit title"
						>
							<Pencil size={18} />
						</button>
					{/if}
				</div>
			</div>
			{#if activeTodo.deadline}
				<div class="flex items-center gap-3">
					<p class="font-mono text-xs text-[var(--error)]">
						Deadline: {format(new Date(activeTodo.deadline), 'dd MMM yyyy, HH:mm')}
					</p>
					<Tooltip.Root>
						<Tooltip.Trigger
							><InfoIcon size={14} class="text-[var(--text-muted)]" /></Tooltip.Trigger
						>
						<Tooltip.Content>
							<p>Update deadline using <br /> $nix {updateDeadlineUsage()}</p>
						</Tooltip.Content>
					</Tooltip.Root>
				</div>
			{/if}

			<textarea
				bind:value={editDescription}
				onblur={saveTodoDesc}
				class="min-h-[50vh] w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 font-mono text-sm text-[var(--text-primary)] transition-colors outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]/40"
				placeholder="Add a description..."></textarea>

			<p class="font-mono text-xs text-[var(--text-muted)]">
				Created {format(new Date(activeTodo.createdAt), 'dd MMM yyyy, HH:mm')}
			</p>
		</div>
	{:else}
		<!-- Todo List -->
		{#if filteredTodos.length === 0}
			<div
				class="flex h-[300px] flex-col items-center justify-center p-8 text-center text-[var(--text-muted)]"
			>
				<CheckSquare size={48} class="mb-4 opacity-30" />
				<p>
					{searchQuery ? `No tasks matching "${searchQuery}"` : 'No tasks found.'}
				</p>
			</div>
		{:else}
			<div
				class="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]"
			>
				<ul class="divide-y divide-[var(--border)]">
					{#each paginatedTodos as todo (todo.id)}
						<li
							class="group flex items-start gap-4 p-4 transition-colors hover:bg-[var(--surface)]"
						>
							<button
								onclick={(e) => {
									e.stopPropagation();
									handleToggle(todo.id, todo.completed);
								}}
								class="mt-0.5 shrink-0 rounded-full focus:ring-2 focus:ring-[var(--accent)] focus:outline-none"
							>
								{#if todo.completed}
									<CheckCircle size={24} class="text-[var(--success)]" />
								{:else}
									<Circle
										size={24}
										class="text-[var(--text-muted)] transition-colors group-hover:text-[var(--accent)]"
									/>
								{/if}
							</button>

							<button
								class="flex min-w-0 flex-1 cursor-pointer flex-col text-left"
								onclick={() => openTodo(todo)}
							>
								<span
									class="truncate text-base font-medium text-[var(--text-primary)] {todo.completed
										? 'line-through opacity-50'
										: ''}"
								>
									{todo.title}
								</span>
								{#if todo.description && todo.description.length > 40}
									<p class="mt-1 text-sm text-[var(--text-muted)]">
										{todo.description.substring(0, 40)}...
										<span class="text-[var(--accent)]">View detail</span>
									</p>
								{:else if todo.description}
									<p class="mt-1 text-sm text-[var(--text-muted)]">{todo.description}</p>
								{/if}
								<div class="mt-2 font-mono text-xs text-[var(--text-muted)]">
									<span>ID: {todo.id.substring(0, 8)}</span>
									{#if todo.deadline}
										<span>|</span>
										<span class="text-[var(--error)]">
											{format(new Date(todo.deadline), 'dd MMM yyyy, HH:mm')}
										</span>
									{/if}
								</div>
							</button>

							<div
								class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
							>
								<button
									onclick={(e) => {
										e.stopPropagation();
										handleDelete(todo.id);
									}}
									class="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:text-[var(--error)] focus:ring-2 focus:ring-[var(--error)] focus:outline-none"
									aria-label="Delete task"
								>
									<Trash2 size={18} />
								</button>
							</div>
						</li>
					{/each}
				</ul>
			</div>

			{#if filteredTodos.length > itemsPerPage}
				<div class="mt-6 pt-2">
					<Pagination.Root
						count={filteredTodos.length}
						perPage={itemsPerPage}
						bind:page={currentPage}
					>
						{#snippet children({ pages, currentPage })}
							<Pagination.Content>
								<Pagination.Item>
									<Pagination.Previous />
								</Pagination.Item>
								{#each pages as page (page.key)}
									{#if page.type === 'ellipsis'}
										<Pagination.Item>
											<Pagination.Ellipsis />
										</Pagination.Item>
									{:else}
										<Pagination.Item>
											<Pagination.Link {page} isActive={currentPage === page.value}>
												{page.value}
											</Pagination.Link>
										</Pagination.Item>
									{/if}
								{/each}
								<Pagination.Item>
									<Pagination.Next />
								</Pagination.Item>
							</Pagination.Content>
						{/snippet}
					</Pagination.Root>
				</div>
			{/if}
		{/if}
	{/if}
</div>
