<script lang="ts">
	import { TodoRepository } from '$lib/repositories/todo.repository';
	import { ScheduleRepository } from '$lib/repositories/schedule.repository';
	import { TodoService } from '$lib/tools/todo/todo.service';
	import type { Todo } from '$lib/types/todo';
	import { CheckCircle, Circle, Trash2, Plus, CalendarClock } from '@lucide/svelte';
	import { dbState } from '$lib/stores/db.svelte';
	import { registry } from '$lib/commands/registry';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';

	let todos = $state<Todo[]>([]);
	let service = new TodoService(new TodoRepository(), new ScheduleRepository());
	let newTaskTitle = $state('');
	let todoCommand = registry.get('todo');

	let updateModalOpen = $state(false);
	let activeTodoId = $state('');
	let deadlineDate = $state('');
	let deadlineTime = $state('');

	function openUpdateModal(todo: Todo) {
		activeTodoId = todo.id;
		if (todo.deadline) {
			const parts = todo.deadline.split(' ');
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
		await service.update(activeTodoId, newDeadline);
		updateModalOpen = false;
		await loadTodos();
	}

	$effect(() => {
		// Re-run whenever dbState.todos changes
		const _ = dbState.todos;
		loadTodos();
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
		if (currentlyCompleted) return; // For now, only one-way complete
		await service.complete(id);
		await loadTodos();
	}

	async function handleDelete(id: string) {
		await service.delete(id);
		await loadTodos();
	}
</script>

<svelte:head>
	<title>Todo | HiNix</title>
</svelte:head>

<div class="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500">
	<div>
		<h1 class="text-3xl font-bold tracking-tight text-[var(--accent)]">Todo</h1>
		<p class="mt-1 font-mono text-sm text-[var(--text-muted)]">
			{todoCommand?.usage}
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

	<!-- Todo List -->
	<div
		class="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-sm"
	>
		{#if todos.length === 0}
			<div class="p-8 text-center text-[var(--text-muted)]">
				No tasks yet. Add one above or type <code
					class="rounded bg-[var(--surface)] px-1.5 py-0.5 font-mono">todo add "My task"</code
				>
			</div>
		{:else}
			<ul class="divide-y divide-[var(--border)]">
				{#each todos as todo (todo.id)}
					<li class="group flex items-center gap-4 p-4 transition-colors hover:bg-[var(--surface)]">
						<button
							onclick={() => handleToggle(todo.id, todo.completed)}
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

						<div class="flex min-w-0 flex-1 flex-col">
							<span
								class="truncate text-[var(--text-primary)] {todo.completed
									? 'line-through opacity-50'
									: ''}"
							>
								{todo.title}
							</span>
							<div class="mt-1 flex items-center gap-3 font-mono text-xs text-[var(--text-muted)]">
								<span>ID: {todo.id.substring(0, 8)}</span>
								{#if todo.deadline}
									<span class="flex items-center gap-1 text-[var(--accent)]">
										<CalendarClock size={12} />
										{todo.deadline}
									</span>
								{/if}
							</div>
						</div>

						<div class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
							<button
								onclick={() => openUpdateModal(todo)}
								class="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)] focus:outline-none"
								aria-label="Update deadline"
							>
								<CalendarClock size={18} />
							</button>
							<button
								onclick={() => handleDelete(todo.id)}
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
</div>

<Dialog.Root bind:open={updateModalOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Update Deadline</Dialog.Title>
			<Dialog.Description>
				Set a new deadline for this task. Format: DD-MM-YYYY and HH:MM.
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
			<Button type="button" onclick={submitUpdateModal}>
				Save changes
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
