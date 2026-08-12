<script lang="ts">
	import { shellStore } from '../../stores/shell.svelte';
	import { registry } from '../../commands/registry';
	import type { CommandDefinition, ToolCategory } from '../../commands/types';
	import { Search } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import Kbd from '../ui/kbd/kbd.svelte';

	let searchQuery = $state('');
	let searchInputRef: HTMLInputElement;
	let selectedIndex = $state(-1);

	// Recent commands (from shell history, deduplicated, limited to 5)
	let recentCommands = $derived.by((): string[] => {
		const seen = new Set<string>();
		const recents: string[] = [];
		for (const cmd of shellStore.history) {
			const base = cmd.split(' ')[0].toLowerCase();
			if (!seen.has(base) && registry.get(base)) {
				seen.add(base);
				recents.push(cmd);
				if (recents.length >= 5) break;
			}
		}
		return recents;
	});

	let filteredCommands = $derived(
		searchQuery ? registry.search(searchQuery) : registry.getAll()
	);

	// Group commands by category
	let groupedCommands = $derived.by((): { label: string; items: CommandDefinition[] }[] => {
		const groups = new Map<string, CommandDefinition[]>();
		const categoryLabels: Record<string, string> = {
			productivity: 'Productivity',
			finance: 'Finance',
			utility: 'Utility',
			system: 'System',
		};

		for (const cmd of filteredCommands) {
			const cat = cmd.category || 'system';
			if (!groups.has(cat)) groups.set(cat, []);
			groups.get(cat)!.push(cmd);
		}

		// Order: productivity → finance → utility → system
		const order: ToolCategory[] = ['productivity', 'finance', 'utility', 'system'];
		const result: { label: string; items: CommandDefinition[] }[] = [];

		for (const cat of order) {
			const items = groups.get(cat);
			if (items && items.length > 0) {
				result.push({ label: categoryLabels[cat] || cat, items });
			}
		}

		return result;
	});

	// Flat list for keyboard navigation
	let flatItems = $derived(groupedCommands.flatMap(g => g.items));

	// Reset index when results change
	$effect(() => {
		const _ = flatItems.length;
		selectedIndex = -1;
	});

	onMount(() => {
		if (searchInputRef) {
			searchInputRef.focus();
		}
	});

	function close() {
		shellStore.isCommandPaletteOpen = false;
	}

	function selectCommand(cmd: CommandDefinition) {
		shellStore.input = cmd.name + ' ';
		close();
	}

	function selectRecent(cmd: string) {
		shellStore.input = cmd;
		close();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			close();
			return;
		}

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = selectedIndex >= flatItems.length - 1 ? 0 : selectedIndex + 1;
			return;
		}

		if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = selectedIndex <= 0 ? flatItems.length - 1 : selectedIndex - 1;
			return;
		}

		if (e.key === 'Enter' && selectedIndex >= 0) {
			e.preventDefault();
			selectCommand(flatItems[selectedIndex]);
			return;
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
		<!-- Search Input -->
		<div class="flex items-center border-b border-[var(--border)] px-4 py-3">
			<Search size={20} class="mr-3 text-[var(--text-muted)]" />
			<input
				bind:this={searchInputRef}
				bind:value={searchQuery}
				type="text"
				placeholder="Search tools, commands, or actions..."
				class="flex-1 border-none bg-transparent text-lg text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
			/>
			<Kbd>esc</Kbd>
		</div>

		<div class="max-h-[60vh] overflow-y-auto p-2">
			<!-- Recent Commands -->
			{#if !searchQuery && recentCommands.length > 0}
				<div class="mb-2">
					<div class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
						Recent
					</div>
					{#each recentCommands as cmd}
						<button
							class="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-left text-sm font-mono transition-colors hover:bg-[var(--surface-elevated)] focus:bg-[var(--surface-elevated)] focus:outline-none"
							onclick={() => selectRecent(cmd)}
						>
							<span class="text-[var(--text-secondary)]">{cmd}</span>
						</button>
					{/each}
				</div>
			{/if}

			<!-- Grouped Commands -->
			{#if filteredCommands.length === 0}
				<div class="px-4 py-8 text-center text-[var(--text-muted)]">
					No commands found matching "{searchQuery}"
				</div>
			{:else}
				{#each groupedCommands as group}
					<div class="mb-2">
						<div class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
							{group.label}
						</div>
						{#each group.items as cmd}
							{@const idx = flatItems.indexOf(cmd)}
							<button
								class="flex w-full flex-col gap-1 rounded-lg px-4 py-3 text-left transition-colors focus:outline-none
								{idx === selectedIndex
									? 'bg-[var(--accent)]/10 text-[var(--accent)]'
									: 'hover:bg-[var(--surface-elevated)]'}"
								onclick={() => selectCommand(cmd)}
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
					</div>
				{/each}
			{/if}
		</div>

		<!-- Footer -->
		<div class="flex items-center gap-4 border-t border-[var(--border)] px-4 py-2 text-[10px] text-[var(--text-muted)]">
			<span><Kbd>↑↓</Kbd> navigate</span>
			<span><Kbd>Enter</Kbd> select</span>
			<span><Kbd>Esc</Kbd> close</span>
		</div>
	</div>
</div>
