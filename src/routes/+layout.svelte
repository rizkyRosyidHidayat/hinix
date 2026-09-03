<script lang="ts">
	import '../app.css';
	import AppShell from '$lib/components/shell/AppShell.svelte';
	import { registerAllCommands } from '$lib/commands/register';
	import { dev } from '$app/environment';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { syncStore } from '$lib/stores/sync.svelte';
	import { supportStore } from '$lib/stores/support.svelte';
	import SupportModal from '$lib/components/support/SupportModal.svelte';
	import { pinnedNotesStore } from '$lib/stores/pinnedNotes.svelte';
	import PinnedNotesModal from '$lib/components/notes/PinnedNotesModal.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Toaster } from '$lib/components/ui/sonner/index.js';

	injectAnalytics({ mode: dev ? 'development' : 'production' });
	registerAllCommands();

	$effect(() => {
		settingsStore.load();
		syncStore.load();
		supportStore.init();
	});

	$effect(() => {
		if (typeof document === 'undefined') return;
		const isDark =
			settingsStore.theme === 'dark' ||
			(settingsStore.theme === 'system' &&
				window.matchMedia('(prefers-color-scheme: dark)').matches);

		if (isDark) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	});

	// Watch for system theme changes if using 'system'
	$effect(() => {
		if (typeof window === 'undefined' || settingsStore.theme !== 'system') return;

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handler = (e: MediaQueryListEvent) => {
			if (e.matches) {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
		};

		mediaQuery.addEventListener('change', handler);
		return () => mediaQuery.removeEventListener('change', handler);
	});

	let { children } = $props();
</script>

<Tooltip.Provider>
	<AppShell>
		{@render children()}
	</AppShell>
	{#if supportStore.isSupportModalOpen}
		<SupportModal />
	{/if}
	{#if pinnedNotesStore.isPinnedNotesModalOpen}
		<PinnedNotesModal />
	{/if}
</Tooltip.Provider>

<Toaster position="top-center" />
