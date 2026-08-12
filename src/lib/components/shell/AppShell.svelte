<script lang="ts">
	import Header from './Header.svelte';
	import TerminalBar from './TerminalBar.svelte';
	import { shellStore } from '../../stores/shell.svelte';
	import CommandPalette from '../command/CommandPalette.svelte';

	let { children } = $props();

	// Keyboard shortcut listener for Command Palette (Ctrl/Cmd + K)
	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			shellStore.isCommandPaletteOpen = !shellStore.isCommandPaletteOpen;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="bg-[var(--background)] font-mono text-[var(--text-primary)]">
	<!-- Header -->
	<Header />

	<!-- Main Content Area -->
	<main class="relative">
		<!-- Page Content -->
		<div class="container mx-auto min-h-screen px-6 pt-2 pb-6">
			{@render children()}
		</div>

		<!-- Terminal Bar at the bottom -->
		<TerminalBar />
	</main>

	{#if shellStore.isCommandPaletteOpen}
		<CommandPalette />
	{/if}
</div>
