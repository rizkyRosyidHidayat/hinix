<script lang="ts">
	import { TodoRepository } from '$lib/repositories/todo.repository';
	import { ScheduleRepository } from '$lib/repositories/schedule.repository';
	import { TodoService } from '$lib/tools/todo/todo.service';
	import type { Todo } from '$lib/types/todo';
	import { CheckCircle, Circle, Trash2, CheckSquare } from '@lucide/svelte';
	import { dbState } from '$lib/stores/db.svelte';
	import { format } from 'date-fns';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import * as Pagination from '$lib/components/ui/pagination/index.js';

	let todos = $state<Todo[]>([]);
	let service = new TodoService(new TodoRepository(), new ScheduleRepository());
	let searchQuery = $state('');
	let currentTab = $state('all');
	let currentPage = $state(1);
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

		loadTodos();
	});

	async function loadTodos() {
		todos = await service.list();
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
	}

	function openTodo(todo: Todo) {
		goto(resolve(`/todo?id=${todo.id}`), { replaceState: true });
	}
</script>

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
				<li class="group flex items-start gap-4 p-4 transition-colors hover:bg-[var(--surface)]">
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

					<div class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
			<Pagination.Root count={filteredTodos.length} perPage={itemsPerPage} bind:page={currentPage}>
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
