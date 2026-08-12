<script lang="ts">
	import { shellStore } from '../../stores/shell.svelte';
	import { registry } from '../../commands/registry';
	import { Search } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import Kbd from '../ui/kbd/kbd.svelte';

	let searchQuery = $state('');
	let searchInputRef: HTMLInputElement;

	let filteredCommands = $derived(searchQuery ? registry.search(searchQuery) : registry.getAll());

	onMount(() => {
		if (searchInputRef) {
			searchInputRef.focus();
		}
	});

	function close() {
		shellStore.isCommandPaletteOpen = false;
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
		class="w-full max-w-xl overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
		onclick={(e) => e.stopPropagation()}
		transition:slide={{ duration: 200, axis: 'y' }}
	>
		<div class="flex items-center border-b border-[var(--border)] px-4 py-3">
			<Search size={20} class="mr-3 text-[var(--text-muted)]" />
			<input
				bind:this={searchInputRef}
				bind:value={searchQuery}
				type="text"
				placeholder="Search commands..."
				class="flex-1 border-none bg-transparent text-lg text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
			/>
		</div>

		<div class="max-h-[60vh] overflow-y-auto p-2">
			{#if filteredCommands.length === 0}
				<div class="px-4 py-8 text-center text-[var(--text-muted)]">
					No commands found matching "{searchQuery}"
				</div>
			{:else}
				{#each filteredCommands as cmd}
					<button
						class="flex w-full flex-col gap-1 rounded-lg px-4 py-3 text-left transition-colors hover:bg-[var(--surface-elevated)] focus:bg-[var(--surface-elevated)] focus:outline-none"
						onclick={() => {
							shellStore.input = cmd.name;
							close();
						}}
					>
						<div class="flex items-center justify-between">
							<span class="font-mono font-bold text-[var(--accent)]">{cmd.name}</span>
							{#if cmd.aliases && cmd.aliases.length > 0}
								<div class="flex gap-1">
									{#each cmd.aliases as alias}
										<Kbd>{alias}</Kbd>
									{/each}
								</div>
							{/if}
						</div>
						<div class="text-sm text-[var(--text-secondary)]">{cmd.description}</div>
						<div class="mt-1 font-mono text-xs text-[var(--text-muted)] opacity-70">
							Usage: {cmd.usage}
						</div>
					</button>
				{/each}
			{/if}
		</div>
	</div>
</div>
