<script lang="ts">
	import CommandInput from '../command/CommandInput.svelte';
	import CommandOutput from '../command/CommandOutput.svelte';
	import { shellStore } from '../../stores/shell.svelte';
	import { XIcon } from '@lucide/svelte';
	import { Kbd } from '../ui/kbd';
</script>

<svelte:window onkeydown={(e) => (e.metaKey || e.key === 'Escape') && shellStore.closeOutput()} />
<div
	class="sticky bottom-0 z-10 flex flex-col divide-y divide-[var(--border)] border-t border-[var(--border)] bg-[var(--background)] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
>
	{#if shellStore.output}
		<div class="relative">
			<div class="container mx-auto flex-1 space-y-2 overflow-y-auto p-4 px-6">
				<div class="text-sm">
					<div class="mb-1 font-mono text-[var(--text-secondary)]">
						$nix{shellStore.output.context ? ` ${shellStore.output.context}` : ''}: {shellStore
							.output.command}
					</div>
					<CommandOutput result={shellStore.output.result} />
				</div>
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

	<CommandInput />
</div>
