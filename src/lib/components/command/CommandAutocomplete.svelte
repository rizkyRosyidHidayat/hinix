<script lang="ts">
	import Kbd from '../ui/kbd/kbd.svelte';
	import type { AutocompleteItem } from '../../commands/types';

	let {
		items,
		selectedIndex,
		onselect
	}: {
		items: AutocompleteItem[];
		selectedIndex: number;
		onselect: (item: AutocompleteItem) => void;
	} = $props();

	let listRef: HTMLUListElement | undefined = $state();

	// Keep selected item visible
	$effect(() => {
		if (listRef && selectedIndex >= 0) {
			const el = listRef.children[selectedIndex] as HTMLElement | undefined;
			el?.scrollIntoView({ block: 'nearest' });
		}
	});
</script>

{#if items.length > 0}
	<div class="bg-[var(--surface-elevated)]">
		<ul bind:this={listRef} class="container mx-auto max-h-48 overflow-y-auto px-3" role="listbox">
			{#each items as item, i (item.name)}
				<li
					role="option"
					aria-selected={i === selectedIndex}
					class="flex cursor-pointer items-center gap-3 px-3 py-2 font-mono text-sm transition-colors
            {i === selectedIndex
						? 'bg-[var(--accent)]/10 text-[var(--accent)]'
						: 'text-[var(--text-primary)] hover:bg-[var(--surface)]'}"
					onmousedown={(e: MouseEvent) => {
						e.preventDefault();
						onselect(item);
					}}
				>
					<span class="shrink-0 font-semibold">{item.name}</span>
					<span class="truncate text-xs text-[var(--text-muted)]">{item.description}</span>
					{#if item.usage}
						<span
							class="ml-auto shrink-0 rounded bg-[var(--surface)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)]"
							>{item.usage}</span
						>
					{/if}
				</li>
			{/each}
		</ul>
		<div
			class="container mx-auto flex items-center gap-3 border-t border-[var(--border)] px-6 py-1.5 text-[10px] text-[var(--text-muted)]"
		>
			<span><Kbd>Tab</Kbd> complete</span>
			<span><Kbd>↑↓</Kbd> navigate</span>
			<span><Kbd>Enter</Kbd> select</span>
			<span><Kbd>Esc</Kbd> dismiss</span>
		</div>
	</div>
{/if}
