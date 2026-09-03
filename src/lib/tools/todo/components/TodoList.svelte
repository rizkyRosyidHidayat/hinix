<script lang="ts">
	import { TodoRepository } from '$lib/repositories/todo.repository';
	import { ScheduleRepository } from '$lib/repositories/schedule.repository';
	import { TodoService } from '$lib/tools/todo/todo.service';
	import type { Todo } from '$lib/types/todo';
	import {
		CheckCircle,
		Circle,
		Trash2,
		CheckSquare,
		FileText,
		Unlink,
		Plus,
		Pencil
	} from '@lucide/svelte';
	import { format } from 'date-fns';
	import TodoCreateInline from './TodoCreateInline.svelte';
	import TodoAddNoteModal from './TodoAddNoteModal.svelte';
	import { NotesService } from '$lib/tools/notes/notes.service';
	import type { Note } from '$lib/types/note';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let todos = $state<Todo[]>([]);
	let linkedNotes = $state<Record<string, Note>>({});
	let activeNoteTodoId = $state<string | null>(null);
	let editingTitleId = $state<string | null>(null);
	let editTitleValue = $state('');

	let service = new TodoService(new TodoRepository(), new ScheduleRepository());
	let notesService = new NotesService();

	$effect(() => {
		loadTodos();
	});

	async function loadTodos() {
		todos = (await service.list()).filter((t) => !t.completed);

		const noteMap: Record<string, Note> = {};
		for (const todo of todos) {
			if (todo.linkedNoteId) {
				const note = await notesService.getById(todo.linkedNoteId);
				if (note) noteMap[todo.id] = note;
			}
		}
		linkedNotes = noteMap;
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

	async function handleUnlinkNote(id: string) {
		await service.unlinkNote(id);
		await loadTodos();
	}

	async function handleAddNote(content: string) {
		if (!activeNoteTodoId || !content.trim()) return;
		const todo = todos.find((t) => t.id === activeNoteTodoId);
		if (todo) {
			const note = await notesService.create(`Note for: ${todo.title}`, content);
			await service.linkNote(todo.id, note.id);
		}
		activeNoteTodoId = null;
		await loadTodos();
	}

	async function saveTitle(todo: Todo) {
		if (editingTitleId !== todo.id) return;
		const newTitle = editTitleValue.trim();
		if (newTitle && newTitle !== todo.title) {
			await service.update(todo.id, undefined, undefined, newTitle);
			await loadTodos();
		}
		editingTitleId = null;
	}

	function autofocus(node: HTMLElement) {
		node.focus();
	}

	async function handleAdd(title: string) {
		if (!title.trim()) return;
		await service.create(title.trim());
		await loadTodos();
	}
</script>

<TodoAddNoteModal
	isOpen={!!activeNoteTodoId}
	onClose={() => (activeNoteTodoId = null)}
	onSubmit={handleAddNote}
/>

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
	<div class="mt-4 w-full max-w-xl">
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
								class="shrink-0 cursor-pointer rounded-full focus:ring-2 focus:ring-[var(--accent)] focus:outline-none"
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

							<div class="group/title flex min-w-0 flex-1 flex-col items-start text-left">
								{#if editingTitleId === todo.id}
									<input
										use:autofocus
										bind:value={editTitleValue}
										onblur={() => saveTitle(todo)}
										onkeydown={(e) => {
											if (e.key === 'Enter') {
												saveTitle(todo);
											} else if (e.key === 'Escape') {
												editingTitleId = null;
											}
										}}
										type="text"
										class="w-full border-none bg-transparent text-base font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:ring-0"
										placeholder="Task title"
									/>
								{:else}
									<span
										class="truncate text-base font-medium text-[var(--text-primary)] {todo.completed
											? 'line-through opacity-50'
											: ''}"
									>
										{todo.title}
									</span>
								{/if}
								{#if linkedNotes[todo.id]}
									<div class="flex w-full items-center gap-2">
										<button
											onclick={(e) => {
												e.stopPropagation();
												goto(resolve(`/notes?id=${linkedNotes[todo.id].id}`));
											}}
											class="mt-1 inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-[var(--accent)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/20"
										>
											<FileText size={12} />
											View Notes
										</button>
										<button
											onclick={(e) => {
												e.stopPropagation();
												handleUnlinkNote(todo.id);
											}}
											class="mt-1.5 cursor-pointer rounded-lg text-[var(--text-muted)] transition-all hover:bg-[var(--warning)]/10 hover:text-[var(--warning)] focus:outline-none"
											aria-label="Unlink note"
											title="Unlink note"
										>
											<Unlink size={12} />
										</button>
									</div>
								{:else}
									<button
										onclick={(e) => {
											e.stopPropagation();
											activeNoteTodoId = todo.id;
										}}
										class="mt-1 inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] px-2 py-0.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
									>
										<Plus size={12} />
										Add Note
									</button>
								{/if}
								{#if todo.deadline}
									<span class="mt-2 font-mono text-sm text-[var(--error)]">
										{format(new Date(todo.deadline), 'dd MMM yyyy, HH:mm')}
									</span>
								{/if}
							</div>

							<div class="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
								<button
									onclick={(e) => {
										e.stopPropagation();
										editingTitleId = todo.id;
										editTitleValue = todo.title;
									}}
									class="cursor-pointer rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:text-[var(--accent)] focus:outline-none"
									aria-label="Edit task"
								>
									<Pencil size={18} />
								</button>
								<button
									onclick={(e) => {
										e.stopPropagation();
										handleDelete(todo.id);
									}}
									class="cursor-pointer rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:text-[var(--error)] focus:outline-none"
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
