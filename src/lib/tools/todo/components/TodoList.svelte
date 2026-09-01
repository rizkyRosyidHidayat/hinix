<script lang="ts">
	import { TodoRepository } from '$lib/repositories/todo.repository';
	import { ScheduleRepository } from '$lib/repositories/schedule.repository';
	import { TodoService } from '$lib/tools/todo/todo.service';
	import type { Todo } from '$lib/types/todo';
	import { CheckCircle, Circle, Trash2, CheckSquare } from '@lucide/svelte';
	import { format } from 'date-fns';
	import * as Pagination from '$lib/components/ui/pagination/index.js';
	import { shellStore } from '$lib/stores/shell.svelte';

	let todos = $state<Todo[]>([]);
	let service = new TodoService(new TodoRepository(), new ScheduleRepository());
	let currentPage = $state(1);
	const itemsPerPage = 10;

	let paginatedTodos = $derived(
		todos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);

	let parsedCommand = $derived(shellStore.parsedCommand);

	$effect(() => {
		if (parsedCommand && parsedCommand.status === 'success' && parsedCommand.domain === 'todo') {
			loadTodos();
		}
	});

	async function loadTodos() {
		todos = (await service.list()).filter((t) => !t.completed);
	}

	async function handleToggle(todo: Todo) {
		const wasCompleted = todo.completed;
		todo.completed = !todo.completed; // Optimistic update

		if (wasCompleted) {
			await service.uncomplete(todo.id);
		} else {
			await service.complete(todo.id);
		}

		setTimeout(() => {
			loadTodos();
		}, 400);
	}

	async function handleDelete(id: string) {
		await service.delete(id);
		await loadTodos();
	}
</script>

<!-- Todo List -->
{#if todos.length === 0}
	<div
		class="flex h-[150px] w-full flex-col items-center justify-center rounded-xl border border-[var(--border)] p-8 text-center text-[var(--text-muted)]"
	>
		<CheckSquare size={32} class="mb-2 opacity-30" />
		<p>No pending tasks found. <br /> Try "Create report" to create one.</p>
	</div>
{:else}
	<div
		class="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]"
	>
		<ul class="divide-y divide-[var(--border)]">
			{#each paginatedTodos as todo (todo.id)}
				<li class="group flex items-center gap-4 p-4 transition-colors hover:bg-[var(--surface)]">
					<button
						onclick={(e) => {
							e.stopPropagation();
							handleToggle(todo);
						}}
						class="shrink-0 rounded-full focus:ring-2 focus:ring-[var(--accent)] focus:outline-none"
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
						onclick={(e) => {
							e.stopPropagation();
							handleToggle(todo);
						}}
					>
						<span
							class="truncate text-base font-medium text-[var(--text-primary)] {todo.completed
								? 'line-through opacity-50'
								: ''}"
						>
							{todo.title}
						</span>
						{#if todo.deadline}
							<span class="mt-2 font-mono text-sm text-[var(--error)]">
								{format(new Date(todo.deadline), 'dd MMM yyyy, HH:mm')}
							</span>
						{/if}
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

	{#if todos.length > itemsPerPage}
		<div class="mt-6 pt-2">
			<Pagination.Root count={todos.length} perPage={itemsPerPage} bind:page={currentPage}>
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
