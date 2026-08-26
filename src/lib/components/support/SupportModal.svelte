<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { Coffee, X, HeartHandshake } from '@lucide/svelte';
	import { supportStore } from '../../stores/support.svelte';
	import Kbd from '../ui/kbd/kbd.svelte';

	function close() {
		supportStore.closeModal();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			close();
		}
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
			<h2 class="flex-1 items-center gap-2 font-bold text-[var(--text-primary)]">Support Us</h2>
			<Kbd>Esc</Kbd>
			<button
				class="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
				onclick={close}
				aria-label="Close"
			>
				<X size={18} />
			</button>
		</div>

		<div class="p-6 text-center">
			<p class="mb-6 text-[var(--text-secondary)]">
				You've been using Hinix for a few days! If you find it helpful and want to support the
				project's. Please consider giving a star or a tip.
			</p>

			<div class="flex flex-col gap-3">
				<a
					href="https://github.com/rizkyRosyidHidayat/hinix"
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-[var(--text-primary)] transition-colors hover:border hover:border-[var(--accent)]"
					onclick={close}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="currentColor"
					>
						<path
							d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
						/>
					</svg>
					<span>Star on GitHub</span>
				</a>
				<a
					href="https://x.com"
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-[var(--text-primary)] transition-colors hover:border hover:border-[var(--accent)]"
					onclick={close}
				>
					<svg xmlns="http://w3.org" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
						/>
					</svg>
					<span>Share on X</span>
				</a>
				<a
					href="https://ko-fi.com/M2Y525H15R"
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-[var(--text-primary)] transition-colors hover:border hover:border-[var(--error)]"
					onclick={close}
				>
					<Coffee size={18} class="text-[var(--error)]" />
					<span>Support Us</span>
				</a>
			</div>
		</div>

		<div
			class="flex items-center justify-center gap-2 border-t border-[var(--border)] px-4 py-3 text-xs text-[var(--text-muted)]"
		>
			<span>Made with</span>
			<HeartHandshake size={14} class="text-[var(--error)]" />
			<span>for the community.</span>
		</div>
	</div>
</div>
