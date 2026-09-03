<script lang="ts">
	import type { Recommendation } from '$lib/tools/recommendation/recommendation.types';
	import {
		ArrowRight,
		Pin,
		Clock,
		Calendar,
		CalendarPlus,
		CheckSquare,
		ListPlus,
		Target,
		Trophy,
		AlertTriangle,
		DollarSign,
		Receipt,
		PartyPopper,
		List
	} from '@lucide/svelte';
	import { shellStore } from '$lib/stores/shell.svelte';

	let { recommendations } = $props<{ recommendations: Recommendation[] }>();

	const iconMap: Record<string, typeof Clock> = {
		Clock,
		Calendar,
		CalendarPlus,
		CheckSquare,
		ListPlus,
		Target,
		Trophy,
		AlertTriangle,
		DollarSign,
		Receipt,
		Pin,
		PartyPopper,
		List
	};

	const priorityColors: Record<string, string> = {
		high: 'border-l-[var(--error)]',
		medium: 'border-l-[var(--warning)]',
		low: 'border-l-[var(--accent)]'
	};

	const priorityIconColors: Record<string, string> = {
		high: 'text-[var(--error)]',
		medium: 'text-[var(--warning)]',
		low: 'text-[var(--accent)]'
	};

	function handleAccept(rec: Recommendation) {
		shellStore.setActiveDomain(rec.domain);
	}
</script>

<div class="w-full max-w-xl space-y-4">
	{#each recommendations as rec, i (rec.id)}
		{@const IconComponent = iconMap[rec.icon]}
		{@const isFirst = i === 0 && rec.priority === 'high'}
		<button
			onclick={() => handleAccept(rec)}
			class="group flex w-full flex-col items-start gap-4 rounded-2xl border border-l-4 border-[var(--border)] md:flex-row {priorityColors[
				rec.priority
			]} cursor-pointer bg-[var(--surface-elevated)] p-4 text-left transition-all md:gap-5 md:p-6"
		>
			<div
				class="{isFirst
					? 'size-12 md:size-14'
					: 'size-10 md:size-12'} flex shrink-0 items-center justify-center rounded-xl bg-[var(--surface)]"
			>
				{#if IconComponent}
					<IconComponent
						size={isFirst ? 28 : 24}
						class="{priorityIconColors[rec.priority]} {isFirst
							? 'scale-75 md:scale-100'
							: 'scale-75 md:scale-100'}"
					/>
				{/if}
			</div>
			<div class="flex-1">
				<h3 class="text-base font-bold text-[var(--text-primary)] md:text-lg">
					{rec.title}
				</h3>
				<p class="mt-1 text-xs text-[var(--text-muted)] md:text-sm">{rec.description}</p>
			</div>
			<ArrowRight
				size={20}
				class="mt-2 hidden shrink-0 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100 md:inline-block"
			/>
		</button>
	{/each}
</div>
