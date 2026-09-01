<script lang="ts">
	import { ScheduleRepository } from '$lib/repositories/schedule.repository';
	import { ScheduleService } from '$lib/tools/schedule/schedule.service';
	import type { ScheduleItem } from '$lib/types/schedule';
	import { Trash2, Calendar, FileText, Unlink } from '@lucide/svelte';
	import { dbState } from '$lib/stores/db.svelte';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { NotesService } from '$lib/tools/notes/notes.service';
	import type { Note } from '$lib/types/note';
	import { shellStore } from '$lib/stores/shell.svelte';

	let service = new ScheduleService(new ScheduleRepository());
	let schedules = $state<ScheduleItem[]>([]);
	let notesService = new NotesService();
	let linkedNotes = $state<Record<string, Note>>({});

	let parsedCommand = $derived(shellStore.parsedCommand);

	let sortedSchedules = $derived(
		[...schedules].sort((a, b) => (a.time || '24:00').localeCompare(b.time || '24:00'))
	);

	let selectedDate = $derived(() => {
		const today = new Date();
		const dateDay = today.getDate().toString().padStart(2, '0');
		const dateMonth = (today.getMonth() + 1).toString().padStart(2, '0');
		const dateYear = today.getFullYear().toString();
		return `${dateYear}-${dateMonth}-${dateDay}`;
	});

	async function loadData() {
		const date = selectedDate();
		schedules = (await service.listByDate(date)).filter((s) => {
			// filter by time more than now
			if (!s.time) return true;
			const now = new Date();
			const [hours, minutes] = s.time.split(':').map(Number);
			const scheduleTime = new Date(
				now.getFullYear(),
				now.getMonth(),
				now.getDate(),
				hours,
				minutes
			);
			return scheduleTime > now;
		});

		const noteMap: Record<string, Note> = {};
		for (const item of schedules) {
			if (item.linkedNoteId) {
				const note = await notesService.getById(item.linkedNoteId);
				if (note) noteMap[item.id] = note;
			}
		}
		linkedNotes = noteMap;
	}

	$effect(() => {
		dbState.subscribe('schedules');
		if (
			parsedCommand &&
			parsedCommand.status === 'success' &&
			parsedCommand.domain === 'schedule'
		) {
			loadData();
		}
	});

	async function handleDelete(id: string) {
		await service.delete(id);
		await loadData();
	}

	async function handleUnlinkNote(id: string) {
		await service.unlinkNote(id);
		await loadData();
	}
</script>

<div class="flex flex-col gap-3">
	{#if sortedSchedules.length === 0}
		<div
			class="flex h-[150px] flex-col items-center justify-center rounded-xl border border-[var(--border)] p-8 text-center text-[var(--text-muted)]"
		>
			<Calendar size={32} class="mb-2 opacity-30" />
			<p>No events scheduled. <br /> Try "Set meeting at 10am"</p>
		</div>
	{:else}
		<ul class="space-y-4">
			{#each sortedSchedules as item (item.id)}
				<li
					class="group mb-4 flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 transition-colors hover:bg-[var(--surface)]"
				>
					<div class="w-16 shrink-0 text-center">
						{#if item.time}
							<div class="font-mono text-lg font-bold text-[var(--text-primary)]">
								{item.time}
							</div>
						{:else}
							<div class="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
								All Day
							</div>
						{/if}
					</div>

					<div
						class="h-12 w-1 rounded-full {item.time ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}"
					></div>

					<div class="min-w-0 flex-1">
						<h3 class="truncate text-lg font-medium text-[var(--text-primary)]">
							{item.title}
						</h3>
						{#if linkedNotes[item.id]}
							<button
								onclick={() => goto(resolve(`/notes?id=${linkedNotes[item.id].id}`))}
								class="mt-1 inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-[var(--accent)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/20"
							>
								<FileText size={12} />
								{linkedNotes[item.id].title}
							</button>
						{/if}
					</div>

					<div class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
						{#if linkedNotes[item.id]}
							<button
								onclick={() => handleUnlinkNote(item.id)}
								class="cursort-pointer rounded-lg p-2 text-[var(--text-muted)] transition-all hover:bg-[var(--warning)]/10 hover:text-[var(--warning)] focus:ring-2 focus:ring-[var(--warning)] focus:outline-none"
								aria-label="Unlink note"
								title="Unlink note"
							>
								<Unlink size={18} />
							</button>
						{/if}
						<button
							onclick={() => handleDelete(item.id)}
							class="cursort-pointer rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:text-[var(--error)] focus:ring-2 focus:ring-[var(--error)] focus:outline-none"
							aria-label="Delete event"
						>
							<Trash2 size={20} />
						</button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
