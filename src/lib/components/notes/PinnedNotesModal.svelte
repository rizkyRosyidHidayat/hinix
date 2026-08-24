<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { X, Pin, ArrowRight } from '@lucide/svelte';
	import { pinnedNotesStore } from '$lib/stores/pinnedNotes.svelte';
	import Kbd from '../ui/kbd/kbd.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { NoteRepository } from '$lib/repositories/note.repository';
	import type { Note } from '$lib/types/note';

	let notes = $state<Note[]>([]);
	const repo = new NoteRepository();

	onMount(async () => {
		const allNotes = await repo.list();
		notes = allNotes.filter((n) => n.pinned);
	});

	function close() {
		pinnedNotesStore.closeModal();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			close();
		}
	}

	function navigateToNote(noteId: string) {
		close();
		goto(resolve(`/notes?id=${noteId}`));
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[15vh] backdrop-blur-sm"
	onclick={close}
	transition:fade={{ duration: 150 }}
>
	<div
		class="w-full max-w-md overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
		onclick={(e) => e.stopPropagation()}
		transition:slide={{ duration: 200, axis: 'y' }}
	>
		<div class="flex items-center gap-1 border-b border-[var(--border)] px-4 py-3">
			<h2 class="flex-1 items-center gap-2 font-bold text-[var(--text-primary)]">Pinned Notes</h2>
			<Kbd>Esc</Kbd>
			<button
				class="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
				onclick={close}
				aria-label="Close"
			>
				<X size={18} />
			</button>
		</div>

		<div class="max-h-[60vh] overflow-y-auto p-4">
			{#if notes.length === 0}
				<div class="py-8 text-center text-[var(--text-muted)]">No pinned notes found.</div>
			{:else}
				<div class="flex flex-col gap-3">
					{#each notes as note (note.id)}
						<button
							onclick={() => navigateToNote(note.id)}
							class="group flex w-full cursor-pointer items-start gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-4 text-left transition-colors hover:border-[var(--accent)]/50"
						>
							<Pin size={18} class="mt-0.5 shrink-0 text-[var(--accent)]" />
							<div class="flex-1 overflow-hidden">
								<h3 class="truncate font-medium text-[var(--text-primary)]">
									{note.title}
								</h3>
								{#if note.content?.length > 45}
									<p class="mt-1 text-sm text-[var(--text-muted)]">
										{note.content?.substring(0, 45) + '...'}
										<span class="text-[var(--accent)]">View detail</span>
									</p>
								{:else if note.content?.length > 0}
									<p class="mt-1 text-sm text-[var(--text-muted)]">{note.content}</p>
								{:else}
									<p class="mt-1 text-sm text-[var(--text-muted)]">No content</p>
								{/if}
							</div>
							<ArrowRight
								size={18}
								class="mt-0.5 shrink-0 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
							/>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
