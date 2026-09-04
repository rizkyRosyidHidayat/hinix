<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { X, Pencil } from '@lucide/svelte';
	import Kbd from '$lib/components/ui/kbd/kbd.svelte';
	import { NotesService } from '$lib/tools/notes/notes.service';
	import type { Note } from '$lib/types/note';

	let { isOpen, noteId, onClose, onUpdate } = $props<{
		isOpen: boolean;
		noteId: string | null;
		onClose: () => void;
		onUpdate?: () => void;
	}>();

	let service = new NotesService();
	let note = $state<Note | null>(null);

	let editTitle = $state('');
	let editContent = $state('');
	let isEditingTitle = $state(false);

	$effect(() => {
		if (isOpen && noteId) {
			service.getById(noteId).then((n) => {
				if (n) {
					note = n;
					editTitle = n.title;
					editContent = n.content;
					isEditingTitle = false;
				}
			});
		} else {
			note = null;
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isOpen && !isEditingTitle) {
			onClose();
		}
	}

	async function saveNote() {
		if (!note) return;
		const updated = await service.update(note.id, {
			title: editTitle,
			content: editContent
		});
		note = updated;
		if (onUpdate) onUpdate();
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

<svelte:window onkeydown={handleKeydown} />

{#if isOpen && note}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[10vh] backdrop-blur-sm"
		onclick={onClose}
		transition:fade={{ duration: 150 }}
	>
		<div
			class="w-full max-w-2xl overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
			onclick={(e) => e.stopPropagation()}
			transition:slide={{ duration: 200, axis: 'y' }}
		>
			<div class="flex items-center gap-1 border-b border-[var(--border)] px-6 py-4">
				<div class="group flex flex-1 items-center gap-2">
					{#if isEditingTitle}
						<!-- svelte-ignore a11y_autofocus -->
						<input
							bind:value={editTitle}
							onblur={() => {
								saveNote();
								isEditingTitle = false;
							}}
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									saveNote();
									isEditingTitle = false;
								}
							}}
							type="text"
							class="w-full border-none bg-transparent text-lg font-bold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:ring-0"
							placeholder="Note title"
							autofocus
						/>
					{:else}
						<h2 class="text-lg font-bold text-[var(--text-primary)]">{note.title}</h2>
						<button
							onclick={() => (isEditingTitle = true)}
							class="cursor-pointer text-[var(--text-muted)] opacity-0 transition-all group-hover:opacity-100 hover:text-[var(--accent)]"
							title="Edit title"
						>
							<Pencil size={16} />
						</button>
					{/if}
				</div>
				<Kbd>Esc</Kbd>
				<button
					class="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
					onclick={onClose}
					aria-label="Close"
				>
					<X size={18} />
				</button>
			</div>

			<div class="px-6 py-6">
				<textarea
					bind:value={editContent}
					onblur={saveNote}
					class="min-h-[40vh] w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-4 font-mono text-sm text-[var(--text-primary)] transition-colors outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]/40"
					placeholder="Start writing..."></textarea>
			</div>

			<div
				class="flex items-center justify-between border-t border-[var(--border)] bg-[var(--surface)] px-6 py-3 text-xs text-[var(--text-muted)]"
			>
				<span>Last updated {timeAgo(note.updatedAt)}</span>
				<div class="flex items-center gap-2">
					<span>Saved automatically</span>
				</div>
			</div>
		</div>
	</div>
{/if}
