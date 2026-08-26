<script lang="ts">
	import { timerStore } from '$lib/stores/timer.svelte';
	import type { Recommendation } from '$lib/tools/recommendation/recommendation.types';
	import { getRecommendations } from '$lib/tools/recommendation/recommendation.service';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { dbState } from '$lib/stores/db.svelte';
	import type { ScheduleItem } from '$lib/types/schedule';
	import { ScheduleService } from '$lib/tools/schedule/schedule.service';
	import { ScheduleRepository } from '$lib/repositories/schedule.repository';

	let {
		title = ''
	}: {
		title?: string;
	} = $props();

	let recommendations = $state<Recommendation[]>([]);
	let upcomingEvent = $state<ScheduleItem | null>(null);
	let serviceSchedule = new ScheduleService(new ScheduleRepository());

	let pageTitle = $derived(
		timerStore.state.status !== 'idle' && upcomingEvent
			? `${timerStore.state.label} - ${upcomingEvent.title}`
			: timerStore.state.status !== 'idle'
				? `${timerStore.state.label} - Active Timer`
				: recommendations.length > 0
					? `${recommendations[0].title}`
					: `${title} | HiNix`
	);

	async function loadSchedule() {
		const nextEvent = await serviceSchedule.findNextEvent();
		upcomingEvent = nextEvent;
	}

	async function loadRecommendation() {
		recommendations = (await getRecommendations(settingsStore.features)).filter(
			(r) => r.action && r.action?.command === undefined
		);
	}

	$effect(() => {
		dbState.subscribe('todos');
		dbState.subscribe('budget');
		dbState.subscribe('schedules');
		dbState.subscribe('notes');
		dbState.subscribe('habits');
		dbState.subscribe('settings');

		loadSchedule();
		loadRecommendation();
	});
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>
