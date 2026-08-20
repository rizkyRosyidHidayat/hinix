<script lang="ts">
	import { ScheduleRepository } from '$lib/repositories/schedule.repository';
	import { ScheduleService } from '$lib/tools/schedule/schedule.service';
	import type { ScheduleItem } from '$lib/types/schedule';
	import { Trash2, Calendar } from '@lucide/svelte';
	import { dbState } from '$lib/stores/db.svelte';
	import { registry } from '$lib/commands/registry';
	import { format } from 'date-fns';
	import { resolve } from '$app/paths';
	import Title from '$lib/components/shell/Title.svelte';

	let items = $state<ScheduleItem[]>([]);
	let service = new ScheduleService(new ScheduleRepository());
	let scheduleCommand = registry.get('schedule');

	let today = $state(new Date());
	let filterDate = $state(today.getDate().toString().padStart(2, '0'));

	let dateDay = $state(today.getDate().toString().padStart(2, '0'));
	let dateMonth = $state((today.getMonth() + 1).toString().padStart(2, '0'));
	let dateYear = $state(today.getFullYear().toString());

	let selectedDate = $derived(
		`${dateYear.padStart(4, '2024')}-${dateMonth.padStart(2, '0')}-${dateDay.padStart(2, '0')}`
	);

	let sortedItems = $derived(
		[...items].sort((a, b) => (a.time || '24:00').localeCompare(b.time || '24:00'))
	);

	async function loadData(date: string) {
		items = await service.listByDate(date);
	}

	// Reactive statement to reload data when filterDate or dbState changes
	$effect(() => {
		dbState.subscribe('schedules');
		if (filterDate && service) {
			loadData(`${format(today, 'yyyy-MM')}-${filterDate}`);
		}
	});

	async function handleDelete(id: string) {
		await service.delete(id);
		await loadData(`${format(today, 'yyyy-MM')}-${filterDate}`);
	}
</script>

<Title title="Schedule" />

<div class="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
	<div>
		<h1 class="text-xl font-bold tracking-tight text-[var(--accent)] md:text-3xl">Schedule</h1>
		<p class="mt-2 text-sm text-[var(--text-muted)]">
			<span class="font-mono">See full the commands usage in help menu</span>
			<a
				href={resolve(`/help#${scheduleCommand?.name}`)}
				class="text-[var(--accent)] hover:underline">View full commands</a
			>
		</p>
	</div>

	<div
		class="flex h-full min-h-[400px] flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]"
	>
		<div
			class="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6 py-2"
		>
			<h2 class="flex items-center gap-2 font-semibold">
				<Calendar size={18} class="text-[var(--accent)]" />
				Events for
				<input
					type="text"
					inputmode="numeric"
					pattern="[0-9]*"
					maxlength="2"
					bind:value={filterDate}
					class="w-12 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-center text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
					placeholder="DD"
				/>
				{format(new Date(selectedDate), 'MMM yyyy')}
			</h2>
			<div
				class="rounded-full bg-[var(--accent)]/10 px-2 py-1 text-xs font-medium text-[var(--accent)]"
			>
				{items.length}
				{items.length === 1 ? 'event' : 'events'}
			</div>
		</div>

		<div class="flex-1">
			{#if items.length === 0}
				<div
					class="flex h-[300px] flex-col items-center justify-center p-8 text-center text-[var(--text-muted)]"
				>
					<Calendar size={48} class="mb-4 opacity-20" />
					<p>No events scheduled for this day.</p>
				</div>
			{:else}
				<ul class="divide-y divide-[var(--border)]">
					{#each sortedItems as item (item.id)}
						<li
							class="group flex items-center gap-4 p-5 transition-colors hover:bg-[var(--surface)]"
						>
							<div class="w-16 shrink-0 text-center">
								{#if item.time}
									<div class="font-mono text-lg font-bold text-[var(--text-primary)]">
										{item.time}
									</div>
								{:else}
									<div
										class="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase"
									>
										All Day
									</div>
								{/if}
							</div>

							<div
								class="h-12 w-1 rounded-full {item.time
									? 'bg-[var(--accent)]'
									: 'bg-[var(--border)]'}"
							></div>

							<div class="min-w-0 flex-1">
								<h3 class="truncate text-lg font-medium text-[var(--text-primary)]">
									{item.title}
								</h3>
							</div>

							<button
								onclick={() => handleDelete(item.id)}
								class="rounded-lg p-2 text-[var(--text-muted)] opacity-0 transition-colors group-hover:opacity-100 hover:text-[var(--error)] focus:ring-2 focus:ring-[var(--error)] focus:outline-none"
								aria-label="Delete event"
							>
								<Trash2 size={20} />
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
</div>
