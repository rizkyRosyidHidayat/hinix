<script lang="ts">
	import { ScheduleRepository } from '$lib/repositories/schedule.repository';
	import { ScheduleService } from '$lib/tools/schedule/schedule.service';
	import type { ScheduleItem } from '$lib/types/schedule';
	import { Plus, Trash2, Calendar } from '@lucide/svelte';
	import { dbState } from '$lib/stores/db.svelte';

	let items = $state<ScheduleItem[]>([]);
	let service = new ScheduleService(new ScheduleRepository());

	let selectedDate = $state(new Date().toISOString().split('T')[0]);
	let newTitle = $state('');
	let newTime = $state('');

	let sortedItems = $derived(
		[...items].sort((a, b) => (a.time || '24:00').localeCompare(b.time || '24:00'))
	);

	async function loadData() {
		items = await service.listByDate(selectedDate);
	}

	// Reactive statement to reload data when selectedDate or dbState changes
	$effect(() => {
		const _ = dbState.schedules;
		if (selectedDate && service) {
			loadData();
		}
	});

	async function handleAdd() {
		if (!newTitle.trim() || !selectedDate) return;
		await service.create(newTitle.trim(), selectedDate, newTime || undefined);
		newTitle = '';
		newTime = '';
		await loadData();
	}

	async function handleDelete(id: string) {
		await service.delete(id);
		await loadData();
	}
</script>

<svelte:head>
	<title>Schedule | HiNix</title>
</svelte:head>

<div class="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
	<div>
		<h1 class="text-3xl font-bold tracking-tight text-[var(--accent)]">Schedule</h1>
		<p class="mt-1 font-mono text-sm text-[var(--text-muted)]">
			schedule [add &lt;date&gt; &lt;time&gt; &lt;title&gt; | list &lt;date&gt; | delete &lt;id&gt;]
		</p>
	</div>

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
		<!-- Left Column: Calendar/Date Picker -->
		<div class="space-y-6 lg:col-span-1">
			<div
				class="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-sm"
			>
				<label for="date-picker" class="mb-2 block text-sm font-medium text-[var(--text-secondary)]"
					>Select Date</label
				>
				<input
					id="date-picker"
					type="date"
					bind:value={selectedDate}
					class="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
				/>
			</div>

			<div
				class="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-sm"
			>
				<h3 class="border-b border-[var(--border)] pb-2 font-semibold">Add Event</h3>
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleAdd();
					}}
					class="space-y-4"
				>
					<div>
						<label for="time" class="mb-1 block text-xs text-[var(--text-muted)]"
							>Time (Optional)</label
						>
						<input
							id="time"
							type="time"
							bind:value={newTime}
							class="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
						/>
					</div>
					<div>
						<label for="title" class="mb-1 block text-xs text-[var(--text-muted)]"
							>Event Title</label
						>
						<input
							id="title"
							type="text"
							bind:value={newTitle}
							placeholder="e.g. Project Meeting"
							class="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
							required
						/>
					</div>
					<button
						type="submit"
						disabled={!newTitle.trim()}
						class="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-[var(--background)] transition-opacity hover:opacity-90 disabled:opacity-50"
					>
						<Plus size={18} />
						Add Event
					</button>
				</form>
			</div>
		</div>

		<!-- Right Column: Events List -->
		<div class="lg:col-span-2">
			<div
				class="flex h-full min-h-[400px] flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-sm"
			>
				<div
					class="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4"
				>
					<h2 class="flex items-center gap-2 font-semibold">
						<Calendar size={18} class="text-[var(--accent)]" />
						Events for {new Date(selectedDate).toLocaleDateString(undefined, {
							weekday: 'long',
							month: 'long',
							day: 'numeric'
						})}
					</h2>
					<div
						class="rounded-full bg-[var(--accent)]/10 px-2 py-1 text-xs font-medium text-[var(--accent)]"
					>
						{items.length}
						{items.length === 1 ? 'event' : 'events'}
					</div>
				</div>

				<div class="flex-1 overflow-y-auto">
					{#if items.length === 0}
						<div
							class="flex h-full flex-col items-center justify-center p-8 text-center text-[var(--text-muted)]"
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
	</div>
</div>
