<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { X } from '@lucide/svelte';
	import Kbd from '$lib/components/ui/kbd/kbd.svelte';

	let { isOpen, onClose, onSubmit } = $props<{
		isOpen: boolean;
		onClose: () => void;
		onSubmit: (content: string) => void;
	}>();

	let content = $state('');
	let inputElement = $state<HTMLTextAreaElement>();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isOpen) {
			onClose();
		}
	}

	function handleSubmit() {
		if (content.trim()) {
			onSubmit(content);
			content = '';
		}
	}

	$effect(() => {
		if (isOpen && inputElement) {
			inputElement.focus();
			content = '';
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[15vh] backdrop-blur-sm"
		onclick={onClose}
		transition:fade={{ duration: 150 }}
	>
		<div
			class="w-full max-w-md overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
			onclick={(e) => e.stopPropagation()}
			transition:slide={{ duration: 200, axis: 'y' }}
		>
			<div class="flex items-center gap-1 border-b border-[var(--border)] px-4 py-3">
				<h2 class="flex-1 items-center gap-2 font-bold text-[var(--text-primary)]">Add Note</h2>
				<Kbd>Esc</Kbd>
				<button
					class="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
					onclick={onClose}
					aria-label="Close"
				>
					<X size={18} />
				</button>
			</div>

			<div class="px-4 py-6">
				<div class="flex gap-3">
					<!-- svelte-ignore a11y_autofocus -->
					<textarea
						bind:this={inputElement}
						bind:value={content}
						onkeydown={(e) =>
							content.trim() &&
							e.key === 'Enter' &&
							!e.shiftKey &&
							(e.preventDefault(), handleSubmit())}
						class="min-h-[100px] flex-1 resize-none rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2.5 text-sm text-[var(--text-primary)] transition-colors outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]/40"
						placeholder="Write a note..."
						autofocus></textarea>
				</div>
			</div>

			<div
				class="flex items-center justify-end gap-3 border-t border-[var(--border)] px-4 py-3 text-xs text-[var(--text-muted)]"
			>
				<Kbd>Enter</Kbd>
				<button
					onclick={handleSubmit}
					disabled={!content.trim()}
					class="cursor-pointer rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-90"
				>
					Add Note
				</button>
			</div>
		</div>
	</div>
{/if}
