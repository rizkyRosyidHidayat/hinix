<script lang="ts">
	import '../app.css';
	import AppShell from '$lib/components/shell/AppShell.svelte';
	import { page } from '$app/state';
	import { contextManager } from '$lib/commands/contextManager.svelte';
	import { registry } from '$lib/commands/registry';
	import { registerAllCommands } from '$lib/commands/register';
	import { dev } from '$app/environment';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { settingsStore } from '$lib/stores/settings.svelte';

	injectAnalytics({ mode: dev ? 'development' : 'production' });
	registerAllCommands();

	$effect(() => {
		settingsStore.load();
	});

	let { children } = $props();

	$effect(() => {
		// Sync context with the current page path on refresh / navigation
		const segment = page.url.pathname.split('/')[1];

		if (segment) {
			const cmdDef = registry.get(segment);
			if (cmdDef && cmdDef.namespace) {
				contextManager.enter(cmdDef.namespace);
			} else {
				contextManager.exit();
			}
		} else {
			contextManager.exit();
		}
	});
</script>

<AppShell>
	{@render children()}
</AppShell>
