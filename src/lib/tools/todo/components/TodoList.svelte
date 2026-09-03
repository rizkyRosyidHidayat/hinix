<script lang="ts">
	import { TodoRepository } from '$lib/repositories/todo.repository';
	import { ScheduleRepository } from '$lib/repositories/schedule.repository';
	import { TodoService } from '$lib/tools/todo/todo.service';
	import type { Todo } from '$lib/types/todo';
	import { CheckCircle, Circle, Trash2, CheckSquare } from '@lucide/svelte';
	import { format } from 'date-fns';
	import TodoCreateInline from './TodoCreateInline.svelte';

	let todos = $state<Todo[]>([]);
	let service = new TodoService(new TodoRepository(), new ScheduleRepository());

	$effect(() => {
		loadTodos();
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

	async function handleAdd(title: string) {
		if (!title.trim()) return;
		await service.create(title.trim());
		await loadTodos();
	}
</script>

<!-- Todo List -->
<div
	class="animate-in fade-in slide-in-from-bottom-4 flex min-h-[calc(100vh-200px)] w-full flex-col items-center justify-center duration-500"
>
	<h1 class="mb-2 text-center text-3xl leading-tight font-bold tracking-tight md:text-5xl">
		Pending Task
	</h1>
	<p class="mb-8 text-center text-lg text-[var(--text-muted)]">
		View all your task
		<span class="text-[var(--accent)] transition-colors hover:underline"> here </span>
	</p>
	<div class="w-full max-w-xl">
		<TodoCreateInline onSubmit={handleAdd} />
	</div>
	<div class="my-8 w-full max-w-xl">
		{#if todos.length === 0}
			<div
				class="flex h-[150px] w-full flex-col items-center justify-center rounded-xl border border-[var(--border)] p-8 text-center text-[var(--text-muted)]"
			>
				<CheckSquare size={32} class="mb-2 opacity-50" />
				<p>No pending tasks found</p>
			</div>
		{:else}
			<div
				class="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]"
			>
				<ul class="divide-y divide-[var(--border)]">
					{#each todos as todo (todo.id)}
						<li
							class="group flex items-center gap-4 p-4 transition-colors hover:bg-[var(--surface)]"
						>
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
		{/if}
	</div>
</div>
