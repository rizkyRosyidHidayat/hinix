<script lang="ts">
	import { NotesService } from '$lib/tools/notes/notes.service';
	import type { Note } from '$lib/types/note';
	import { Plus, Trash2, Search, ArrowLeft, FileText, Pin } from '@lucide/svelte';
	import { dbState } from '$lib/stores/db.svelte';
	import { registry } from '$lib/commands/registry';
	import { resolve } from '$app/paths';

	const service = new NotesService();
	let noteCommand = registry.get('notes');
	let notes = $state<Note[]>([]);
	let searchQuery = $state('');
	let activeNote = $state<Note | null>(null);
	let editTitle = $state('');
	let editContent = $state('');
	let isCreating = $state(false);
	let newTitle = $state('');

	let filteredNotes = $derived(
		(searchQuery
			? notes.filter(
					(n) =>
						n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
						n.content.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: [...notes]
		).sort((a, b) => {
			if (a.pinned && !b.pinned) return -1;
			if (!a.pinned && b.pinned) return 1;
			return 0;
		})
	);

	$effect(() => {
		dbState.subscribe('notes');
		service.list().then((res) => {
			notes = res;
		});
	});

	async function createNote() {
		if (!newTitle.trim()) return;
		const note = await service.create(newTitle.trim());
		notes = [note, ...notes];
		newTitle = '';
		isCreating = false;
		openNote(note);
	}

	function openNote(note: Note) {
		activeNote = note;
		editTitle = note.title;
		editContent = note.content;
	}

	function closeNote() {
		activeNote = null;
	}

	async function saveNote() {
		if (!activeNote) return;
		const updated = await service.update(activeNote.id, {
			title: editTitle,
			content: editContent
		});
		notes = notes.map((n) => (n.id === updated.id ? updated : n));
		activeNote = updated;
	}

	async function deleteNote(id: string) {
		await service.delete(id);
		notes = notes.filter((n) => n.id !== id);
		if (activeNote?.id === id) {
			activeNote = null;
		}
	}

	async function togglePin(note: Note) {
		if (note.pinned) {
			await service.unpin(note.id);
		} else {
			await service.pin(note.id);
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
		return new Date(dateStr).toLocaleDateString();
	}
</script>

<svelte:head>
	<title>Notes | HiNix</title>
</svelte:head>

<div class="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500">
	{#if activeNote}
		<!-- Note Editor -->
		<div class="space-y-4">
			<button
				onclick={closeNote}
				class="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
			>
				<ArrowLeft size={16} />
				Back to notes
			</button>

			<input
				bind:value={editTitle}
				onblur={saveNote}
				type="text"
				class="w-full border-none bg-transparent text-2xl font-bold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
				placeholder="Note title"
			/>

			<textarea
				bind:value={editContent}
				onblur={saveNote}
				class="min-h-[50vh] w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 font-mono text-sm text-[var(--text-primary)] transition-colors outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]/40"
				placeholder="Start writing..."></textarea>

			<div class="text-xs text-[var(--text-muted)]">
				Last updated {timeAgo(activeNote.updatedAt)}
			</div>
		</div>
	{:else}
		<!-- Notes List -->
		<header class="flex items-center justify-between">
			<div>
				<h1 class="text-xl font-bold tracking-tight md:text-3xl">Notes</h1>
				<p class="mt-2 text-sm text-[var(--text-muted)]">
					<span class="font-mono">See full the commands usage in help menu</span>
					<a
						href={resolve(`/help#${noteCommand?.name}`)}
						class="text-[var(--accent)] hover:underline">View full commands</a
					>
				</p>
			</div>
			<button
				onclick={() => (isCreating = !isCreating)}
				class="flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--accent)] px-2.5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 md:px-4"
			>
				<Plus size={20} />
				<span class="hidden md:inline-block">New Note</span>
			</button>
		</header>

		<!-- Create Note Form -->
		{#if isCreating}
			<div class="flex gap-3">
				<input
					bind:value={newTitle}
					onkeydown={(e) => e.key === 'Enter' && createNote()}
					type="text"
					class="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2.5 text-sm text-[var(--text-primary)] transition-colors outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]/40"
					placeholder="Note title..."
				/>
				<button
					onclick={createNote}
					class="cursor-pointer rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
				>
					Create
				</button>
			</div>
		{/if}

		<!-- Search -->
		<div class="relative">
			<Search size={16} class="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--text-muted)]" />
			<input
				bind:value={searchQuery}
				type="text"
				class="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] py-2.5 pr-4 pl-10 text-sm text-[var(--text-primary)] transition-colors outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]/40"
				placeholder="Search notes..."
			/>
		</div>

		<!-- Note Cards -->
		{#if filteredNotes.length === 0}
			<div class="flex flex-col items-center justify-center py-16 text-[var(--text-muted)]">
				<FileText size={48} class="mb-4 opacity-30" />
				<p>
					{searchQuery
						? `No notes matching "${searchQuery}"`
						: 'No notes yet. Create your first one!'}
				</p>
			</div>
		{:else}
			<div class="space-y-3">
				{#each filteredNotes as note (note.id)}
					<div
						class="group flex items-start gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 transition-all hover:border-[var(--accent)]/30"
					>
						<button onclick={() => openNote(note)} class="flex-1 cursor-pointer text-left">
							<div class="flex items-center gap-2">
								{#if note.pinned}
									<Pin size={14} class="text-[var(--warning)]" fill="currentColor" />
								{/if}
								<h3 class="font-semibold text-[var(--text-primary)]">{note.title}</h3>
							</div>
							<p class="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">
								{note.content || 'Content still empty. Click to update content'}
							</p>
							<p class="mt-2 text-xs text-[var(--text-muted)]">Updated {timeAgo(note.updatedAt)}</p>
						</button>
						<div class="flex items-center gap-1">
							<button
								onclick={() => togglePin(note)}
								class="shrink-0 cursor-pointer rounded-lg p-2 transition-all {note.pinned
									? 'text-[var(--warning)] opacity-100 hover:bg-[var(--warning)]/10'
									: 'text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:bg-[var(--surface)] hover:text-[var(--text-primary)]'}"
								title={note.pinned ? 'Unpin note' : 'Pin note'}
							>
								<Pin size={16} />
							</button>
							<button
								onclick={() => deleteNote(note.id)}
								class="shrink-0 cursor-pointer rounded-lg p-2 text-[var(--text-muted)] opacity-0 transition-all group-hover:opacity-100 hover:bg-[var(--error)]/10 hover:text-[var(--error)]"
								title="Delete note"
							>
								<Trash2 size={16} />
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>
