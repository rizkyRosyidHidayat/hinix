<script lang="ts">
	import { NotesService } from '$lib/tools/notes/notes.service';
	import type { Note } from '$lib/types/note';
	import { FileText, Trash2, Pin } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import NoteCreateInline from './NoteCreateInline.svelte';
	import NoteDetailModal from './NoteDetailModal.svelte';
	import { format } from 'date-fns';

	let service = new NotesService();
	let notes = $state<Note[]>([]);
	let viewingNoteId = $state<string | null>(null);

	async function loadNotes() {
		notes = (await service.list()).slice(0, 10);
	}

	$effect(() => {
		loadNotes();
	});

	async function handleDelete(id: string) {
		await service.delete(id);
		toast.success('Note deleted successfully');
		await loadNotes();
	}

	async function handleAdd(title: string) {
		try {
			await service.create(title);
			toast.success('Note created successfully');
			await loadNotes();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to create note');
		}
	}

	async function togglePin(note: Note) {
		try {
			if (note.pinned) {
				await service.unpin(note.id);
				toast.info('Note unpinned');
			} else {
				await service.pin(note.id);
				toast.success('Note pinned');
			}
			await loadNotes();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to pin note');
		}
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
		return format(new Date(dateStr), 'dd MMM yyyy');
	}
</script>

<NoteDetailModal
	isOpen={!!viewingNoteId}
	noteId={viewingNoteId}
	onClose={() => (viewingNoteId = null)}
	onUpdate={loadNotes}
/>

<div
	class="animate-in fade-in slide-in-from-bottom-4 flex min-h-[calc(100vh-200px)] w-full flex-col items-center justify-center duration-500"
>
	<h1 class="mb-2 text-center text-3xl leading-tight font-bold tracking-tight md:text-5xl">
		Recent Notes
	</h1>
	<p class="mb-8 text-center text-lg text-[var(--text-muted)]">
		Jot down your ideas
		<span class="text-[var(--accent)] transition-colors hover:underline"> here </span>
	</p>
	<div class="mb-4 w-full max-w-xl">
		<NoteCreateInline onSubmit={handleAdd} />
	</div>
	<div class="w-full max-w-xl">
		{#if notes.length === 0}
			<div
				class="flex h-[150px] w-full flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-8 text-center text-[var(--text-muted)]"
			>
				<FileText size={32} class="mb-2 opacity-50" />
				<p>No notes found</p>
			</div>
		{:else}
			<div
				class="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]"
			>
				<ul class="divide-y divide-[var(--border)]">
					{#each notes as note (note.id)}
						<li class="group flex items-center gap-4 p-4">
							<button
								onclick={() => (viewingNoteId = note.id)}
								class="flex-1 cursor-pointer text-left focus:outline-none"
							>
								<div class="flex items-center gap-2">
									{#if note.pinned}
										<Pin size={14} class="text-[var(--warning)]" fill="currentColor" />
									{/if}
									<h3 class="truncate text-base font-medium text-[var(--text-primary)]">
										{note.title}
									</h3>
								</div>
								<div class="mt-1 flex w-full items-center gap-2 text-xs text-[var(--text-muted)]">
									<span>{timeAgo(note.updatedAt)}</span>
									{#if note.content?.trim()}
										<span class="mx-1">•</span>
										<span class="max-w-[250px] truncate">{note.content.substring(0, 45)}</span>
									{/if}
								</div>
							</button>

							<div class="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
								<button
									onclick={(e) => {
										e.stopPropagation();
										togglePin(note);
									}}
									class="cursor-pointer rounded-lg p-2 transition-colors {note.pinned
										? 'text-[var(--warning)] hover:bg-[var(--warning)]/10 hover:text-[var(--warning)]'
										: 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'} focus:outline-none"
									aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
								>
									<Pin size={18} />
								</button>
								<button
									onclick={(e) => {
										e.stopPropagation();
										handleDelete(note.id);
									}}
									class="cursor-pointer rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:text-[var(--error)] focus:outline-none"
									aria-label="Delete note"
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
