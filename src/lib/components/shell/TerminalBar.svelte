<script lang="ts">
	import CommandInput from '../command/CommandInput.svelte';
	import CommandOutput from '../command/CommandOutput.svelte';
	import { shellStore } from '../../stores/shell.svelte';
	import { XIcon } from 'lucide-svelte';
	import { Kbd } from '../ui/kbd';

	let terminalOutputRef: HTMLDivElement | undefined = $state();

	// Auto-scroll to bottom when output changes
	$effect(() => {
		// Read the output length to trigger reactivity
		const length = shellStore.output.length;
		if (terminalOutputRef && length > 0) {
			setTimeout(() => {
				if (terminalOutputRef) {
					terminalOutputRef.scrollTop = terminalOutputRef.scrollHeight;
				}
			}, 0);
		}
	});
</script>

<svelte:window onkeydown={(e) => (e.metaKey || e.key === 'Escape') && shellStore.closeOutput()} />
<div
	class="sticky bottom-0 z-10 flex flex-col divide-y divide-[var(--border)] border-t border-[var(--border)] bg-[var(--background)] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
>
	{#if shellStore.output.length > 0}
		<div class="relative">
			<div
				bind:this={terminalOutputRef}
				class="container mx-auto flex-1 space-y-2 overflow-y-auto p-4 px-6"
			>
				{#each shellStore.output as item (item.id)}
					<div class="text-sm">
						<div class="mb-1 font-mono text-[var(--text-secondary)]">$nix: {item.command}</div>
						<CommandOutput result={item.result} />
					</div>
				{/each}
			</div>
			<!-- close button -->
			<button
				onclick={() => shellStore.closeOutput()}
				class="absolute top-4 right-3 flex cursor-pointer items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
			>
				<Kbd>esc</Kbd>
				<XIcon size={16} />
			</button>
		</div>
	{/if}
	<div class="container mx-auto px-6 py-4">
		<div class="flex items-center bg-[var(--surface-elevated)]">
			<span class="mr-3 font-mono font-bold text-[var(--accent)]">$nix</span>
			<CommandInput />
		</div>
	</div>
</div>
