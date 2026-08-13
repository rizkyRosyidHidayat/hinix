<script lang="ts">
	import '../app.css';
	import AppShell from '$lib/components/shell/AppShell.svelte';
	import { page } from '$app/state';
	import { contextManager } from '$lib/commands/contextManager.svelte';
	import { registry } from '$lib/commands/registry';
	import { registerAllCommands } from '$lib/commands/register';
	import { dev } from '$app/environment';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';

	injectAnalytics({ mode: dev ? 'development' : 'production' });
	registerAllCommands();

	let { children } = $props();

	$effect(() => {
		// Sync context with the current page path on refresh / navigation
		const path = page.url.pathname;
		const segment = path.split('/')[1]; // e.g. "todo" from "/todo"

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
