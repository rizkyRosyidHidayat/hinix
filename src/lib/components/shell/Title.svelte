<script lang="ts">
	import { timerStore } from '$lib/stores/timer.svelte';
	import type { HiNixContext } from '$lib/context/context.types';
	import { ContextService } from '$lib/context/context.service';
	import type { Recommendation } from '$lib/context/recommendation.types';
	import { getRecommendations } from '$lib/context/recommendation.service';
	import { settingsStore } from '$lib/stores/settings.svelte';

	let {
		title = ''
	}: {
		title?: string;
	} = $props();

	let service = new ContextService();
	let ctx = $state<HiNixContext>(service.initContext);
	let recommendations = $state<Recommendation[]>([]);

	let pageTitle = $derived(
		timerStore.state.status !== 'idle' && ctx.upcoming.nextEvent
			? `${timerStore.state.label} - ${ctx.upcoming.nextEvent.title}`
			: timerStore.state.status !== 'idle'
				? `${timerStore.state.label} - Active Timer`
				: recommendations.length > 0
					? `${recommendations[0].title}`
					: `${title} | HiNix`
	);

	$effect(() => {
		service.getDashboardContext().then((res) => {
			ctx = res;
			recommendations = getRecommendations(res, settingsStore.features).filter(
				(r) => r.action && r.action?.command === undefined
			);
		});
	});
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>
