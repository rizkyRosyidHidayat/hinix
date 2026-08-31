<script lang="ts">
	import Header from './Header.svelte';
	import TerminalBar from './TerminalBar.svelte';

	let { children } = $props();
</script>

<div class="bg-[var(--background)] font-mono text-[var(--text-primary)]">
	<!-- Header -->
	<Header />

	<!-- Main Content Area -->
	<main class="relative">
		<!-- Page Content -->
		<div class="container mx-auto min-h-screen px-4 pt-4 pb-24 md:px-6 md:pt-6 md:pb-6">
			{@render children()}
		</div>

		<!-- Terminal Bar at the bottom -->
		<TerminalBar />
	</main>
</div>
