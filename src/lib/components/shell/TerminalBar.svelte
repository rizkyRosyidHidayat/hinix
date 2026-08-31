<script lang="ts">
	import CommandInput from '../command/CommandInput.svelte';
	import CommandOutput from '../command/CommandOutput.svelte';
	import { shellStore } from '../../stores/shell.svelte';
	import { XIcon } from '@lucide/svelte';
	import { Kbd } from '../ui/kbd';

	$effect(() => {
		let timer: NodeJS.Timeout;

		if (['success', 'navigate'].includes(shellStore.output?.result.type ?? '')) {
			timer = setTimeout(() => {
				shellStore.closeOutput();
			}, 3000);
		}

		return () => clearTimeout(timer);
	});
</script>

<svelte:window onkeydown={(e) => (e.metaKey || e.key === 'Escape') && shellStore.closeOutput()} />
<div class="sticky bottom-0 z-10 w-full px-4 pb-4 md:pb-8">
	<div class="relative mx-auto w-full max-w-xl">
		<!-- Neon glow effect -->
		<div
			class="pointer-events-none absolute -inset-0.5 -z-10 rounded-2xl bg-[var(--accent)]/70 opacity-20 blur-md transition-opacity duration-500"
		></div>

		<div
			class="flex flex-col divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)]/95 backdrop-blur-xl"
		>
			{#if shellStore.output}
				<div class="animate-in fade-in slide-in-from-bottom-4 relative duration-500">
					<div class="flex-1 space-y-2 overflow-y-auto p-4 md:px-6">
						<div class="text-sm">
							<CommandOutput result={shellStore.output.result} />
						</div>
					</div>
					<!-- close button -->
					<button
						onclick={() => shellStore.closeOutput()}
						class="absolute top-4 right-3 flex cursor-pointer items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
					>
						<Kbd class="hidden md:inline-flex">esc</Kbd>
						<XIcon size={16} />
					</button>
				</div>
			{/if}

			<CommandInput />
		</div>
	</div>
</div>
