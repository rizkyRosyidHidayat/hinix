<script lang="ts">
	import { ScheduleRepository } from '$lib/repositories/schedule.repository';
	import { ScheduleService } from '$lib/tools/schedule/schedule.service';
	import type { ScheduleItem } from '$lib/types/schedule';
	import { Trash2, Calendar, FileText, Unlink, Plus, Pencil } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { NotesService } from '$lib/tools/notes/notes.service';
	import type { Note } from '$lib/types/note';
	import { toast } from 'svelte-sonner';
	import TodoAddNoteModal from '$lib/tools/todo/components/TodoAddNoteModal.svelte';
	import ScheduleCreateInline from './ScheduleCreateInline.svelte';

	let service = new ScheduleService(new ScheduleRepository());
	let schedules = $state<ScheduleItem[]>([]);
	let notesService = new NotesService();
	let linkedNotes = $state<Record<string, Note>>({});

	let activeNoteScheduleId = $state<string | null>(null);
	let editingTitleId = $state<string | null>(null);
	let editTitleValue = $state('');

	let sortedSchedules = $derived(
		[...schedules].sort((a, b) => (a.time || '24:00').localeCompare(b.time || '24:00'))
	);

	let selectedDate = $derived(() => {
		const today = new Date();
		const dateDay = today.getDate().toString().padStart(2, '0');
		const dateMonth = (today.getMonth() + 1).toString().padStart(2, '0');
		const dateYear = today.getFullYear().toString();
		return `${dateYear}-${dateMonth}-${dateDay}`;
	});

	async function loadData() {
		const date = selectedDate();
		schedules = (await service.listByDate(date)).filter((s) => {
			// filter by time more than now
			if (!s.time) return true;
			const now = new Date();
			const [hours, minutes] = s.time.split(':').map(Number);
			const scheduleTime = new Date(
				now.getFullYear(),
				now.getMonth(),
				now.getDate(),
				hours,
				minutes
			);
			return scheduleTime > now;
		});

		const noteMap: Record<string, Note> = {};
		for (const item of schedules) {
			if (item.linkedNoteId) {
				const note = await notesService.getById(item.linkedNoteId);
				if (note) noteMap[item.id] = note;
			}
		}
		linkedNotes = noteMap;
	}

	$effect(() => {
		loadData();
	});

	async function handleDelete(id: string) {
		await service.delete(id);
		toast.success('Event deleted successfully');
		await loadData();
	}

	async function handleUnlinkNote(id: string) {
		await service.unlinkNote(id);
		toast.success('Note unlinked successfully');
		await loadData();
	}

	async function handleAddNote(content: string) {
		if (!activeNoteScheduleId || !content.trim()) return;
		const item = schedules.find((s) => s.id === activeNoteScheduleId);
		if (item) {
			const note = await notesService.create(`Note for: ${item.title}`, content);
			await service.linkNote(item.id, note.id);
			toast.success('Note linked to event successfully');
		}
		activeNoteScheduleId = null;
		await loadData();
	}

	async function saveTitle(item: ScheduleItem) {
		if (editingTitleId !== item.id) return;
		const newTitle = editTitleValue.trim();
		if (newTitle && newTitle !== item.title) {
			await service.update(item.id, newTitle);
			toast.success('Event title updated successfully');
			await loadData();
		}
		editingTitleId = null;
	}

	async function handleAdd(title: string, time?: string) {
		if (!title.trim()) {
			toast.error('Event title cannot be empty');
			return;
		}
		const date = selectedDate();
		await service.create(title.trim(), date, time);
		toast.success('Event created successfully');
		await loadData();
	}

	function autofocus(node: HTMLElement) {
		node.focus();
	}
</script>

<TodoAddNoteModal
	isOpen={!!activeNoteScheduleId}
	onClose={() => (activeNoteScheduleId = null)}
	onSubmit={handleAddNote}
/>

<div
	class="animate-in fade-in slide-in-from-bottom-4 flex min-h-[calc(100vh-200px)] w-full flex-col items-center justify-center duration-500"
>
	<h1 class="mb-2 text-center text-3xl leading-tight font-bold tracking-tight md:text-5xl">
		Upcoming Events
	</h1>
	<p class="mb-8 text-center text-lg text-[var(--text-muted)]">
		Manage your schedule
		<span class="text-[var(--accent)] transition-colors hover:underline"> here </span>
	</p>
	<div class="mb-4 w-full max-w-xl">
		<ScheduleCreateInline onSubmit={handleAdd} />
	</div>
	<div class="w-full max-w-xl">
		{#if sortedSchedules.length === 0}
			<div
				class="flex h-[150px] flex-col items-center justify-center rounded-xl border border-[var(--border)] p-8 text-center text-[var(--text-muted)]"
			>
				<Calendar size={32} class="mb-2 opacity-50" />
				<p>No events scheduled</p>
			</div>
		{:else}
			<ul
				class="divide-y divide-[var(--border)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]"
			>
				{#each sortedSchedules as item (item.id)}
					<li class="group flex items-center gap-4 p-4 transition-colors hover:bg-[var(--surface)]">
						<div class="w-16 shrink-0 text-center">
							{#if item.time}
								<div class="font-mono text-lg font-bold text-[var(--text-primary)]">
									{item.time}
								</div>
							{:else}
								<div
									class="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase"
								>
									All Day
								</div>
							{/if}
						</div>

						<div
							class="h-12 w-1 rounded-full {item.time
								? 'bg-[var(--accent)]'
								: 'bg-[var(--border)]'}"
						></div>

						<div class="min-w-0 flex-1">
							{#if editingTitleId === item.id}
								<input
									use:autofocus
									bind:value={editTitleValue}
									onblur={() => saveTitle(item)}
									onkeydown={(e) => {
										if (e.key === 'Enter') {
											saveTitle(item);
										} else if (e.key === 'Escape') {
											editingTitleId = null;
										}
									}}
									type="text"
									class="w-full border-none bg-transparent text-lg font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:ring-0"
									placeholder="Event title"
								/>
							{:else}
								<h3 class="truncate text-lg font-medium text-[var(--text-primary)]">
									{item.title}
								</h3>
							{/if}
							<div class="mt-1 flex w-full flex-wrap items-center gap-2">
								{#if linkedNotes[item.id]}
									<button
										onclick={(e) => {
											e.stopPropagation();
											goto(resolve(`/notes?id=${linkedNotes[item.id].id}`));
										}}
										class="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-[var(--accent)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/20"
									>
										<FileText size={12} />
										View Notes
									</button>
									<button
										onclick={(e) => {
											e.stopPropagation();
											handleUnlinkNote(item.id);
										}}
										class="cursor-pointer rounded-lg text-[var(--text-muted)] transition-all hover:bg-[var(--warning)]/10 hover:text-[var(--warning)] focus:outline-none"
										aria-label="Unlink note"
										title="Unlink note"
									>
										<Unlink size={12} />
									</button>
								{:else}
									<button
										onclick={(e) => {
											e.stopPropagation();
											activeNoteScheduleId = item.id;
										}}
										class="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] px-2 py-0.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
									>
										<Plus size={12} />
										Add Note
									</button>
								{/if}
							</div>
						</div>

						<div class="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
							<button
								onclick={(e) => {
									e.stopPropagation();
									editingTitleId = item.id;
									editTitleValue = item.title;
								}}
								class="cursor-pointer rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:text-[var(--accent)] focus:outline-none"
								aria-label="Edit event"
							>
								<Pencil size={18} />
							</button>
							<button
								onclick={(e) => {
									e.stopPropagation();
									handleDelete(item.id);
								}}
								class="cursor-pointer rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:text-[var(--error)] focus:outline-none"
								aria-label="Delete event"
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
