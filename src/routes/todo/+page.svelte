<script lang="ts">
	import { TodoRepository } from '$lib/repositories/todo.repository';
	import { ScheduleRepository } from '$lib/repositories/schedule.repository';
	import { TodoService } from '$lib/tools/todo/todo.service';
	import type { Todo } from '$lib/types/todo';
	import { CheckCircle, Circle, Trash2, Plus, CheckSquare, ArrowLeft } from '@lucide/svelte';
	import { dbState } from '$lib/stores/db.svelte';
	import { registry } from '$lib/commands/registry';
	import { format } from 'date-fns';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Title from '$lib/components/shell/Title.svelte';

	let todos = $state<Todo[]>([]);
	let service = new TodoService(new TodoRepository(), new ScheduleRepository());
	let newTaskTitle = $state('');
	let todoCommand = registry.get('todo');

	let activeTodo = $state<Todo | null>(null);
	let editDescription = $state('');

	$effect(() => {
		// Re-run whenever dbState.todos changes
		dbState.subscribe('todos');
		const todoId = page.url.searchParams.get('id');

		loadTodos().then(() => {
			if (todoId) {
				const todo = todos.find((t) => t.id === todoId || t.id.startsWith(todoId));
				if (todo) {
					activeTodo = todo;
					editDescription = todo.description || '';
				}
			} else {
				activeTodo = null;
			}
		});
	});

	async function loadTodos() {
		todos = await service.list();
	}

	async function handleAdd() {
		if (!newTaskTitle.trim()) return;
		await service.create(newTaskTitle.trim());
		newTaskTitle = '';
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
</script>

<Title title="Todo" />

<div class="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500">
	{#if !activeTodo}
		<div>
			<h1 class="text-xl font-bold tracking-tight text-[var(--accent)] md:text-3xl">Todo</h1>
			<p class="mt-2 text-sm text-[var(--text-muted)]">
				<span class="font-mono">See full the commands usage in help menu</span>
				<a href={resolve(`/help#${todoCommand?.name}`)} class="text-[var(--accent)] hover:underline"
					>View full commands</a
				>
			</p>
		</div>
		<!-- Add Task Form -->
		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleAdd();
			}}
			class="flex gap-2"
		>
			<input
				type="text"
				bind:value={newTaskTitle}
				placeholder="What needs to be done?"
				class="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-[var(--text-primary)] transition-all outline-none focus:ring-2 focus:ring-[var(--accent)]"
			/>
			<button
				type="submit"
				disabled={!newTaskTitle.trim()}
				class="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-[var(--background)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
			>
				<Plus size={20} />
				Add
			</button>
		</form>
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

			<div class="flex items-center gap-4 py-2">
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
				<h1
					class="text-2xl font-bold text-[var(--text-primary)] {activeTodo.completed
						? 'line-through opacity-50'
						: ''}"
				>
					{activeTodo.title}
				</h1>
			</div>

			<textarea
				bind:value={editDescription}
				onblur={saveTodoDesc}
				class="min-h-[50vh] w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 font-mono text-sm text-[var(--text-primary)] transition-colors outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]/40"
				placeholder="Add a description..."></textarea>

			<div class="text-xs text-[var(--text-muted)]">
				Created {format(new Date(activeTodo.createdAt), 'dd MMM yyyy, HH:mm')}
			</div>
		</div>
	{:else}
		<!-- Todo List -->
		<div
			class="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]"
		>
			{#if todos.length === 0}
				<div
					class="flex h-[300px] flex-col items-center justify-center p-8 text-center text-[var(--text-muted)]"
				>
					<CheckSquare size={48} class="mb-4 opacity-20" />
					<p>No tasks yet. Create your first task!</p>
				</div>
			{:else}
				<ul class="divide-y divide-[var(--border)]">
					{#each todos as todo (todo.id)}
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
			{/if}
		</div>
	{/if}
</div>
