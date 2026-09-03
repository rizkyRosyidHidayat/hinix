<script lang="ts">
	import { Clock, Plus } from '@lucide/svelte';
	import Kbd from '$lib/components/ui/kbd/kbd.svelte';

	let { onSubmit } = $props<{
		onSubmit: (title: string, time?: string) => void;
	}>();

	let newTitle = $state('');
	let hh = $state('');
	let mm = $state('');

	function handleSubmit() {
		if (newTitle.trim()) {
			let timeStr = '';
			if (hh && mm) {
				timeStr = `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`;
			}
			onSubmit(newTitle, timeStr || undefined);
			newTitle = '';
			hh = '';
			mm = '';
		}
	}
</script>

<div
	class="flex items-center gap-3 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-2 transition-colors focus-within:border-[var(--accent)]/50"
>
	<div class="flex items-center gap-1 pl-2">
		<Clock size={16} class="mr-1 text-[var(--text-muted)]" />
		<input
			bind:value={hh}
			onkeydown={(e) => !!newTitle.trim() && e.key === 'Enter' && handleSubmit()}
			oninput={() => {
				hh = hh.replace(/\D/g, '');
				if (parseInt(hh) > 23) hh = '23';
			}}
			type="text"
			inputmode="numeric"
			placeholder="HH"
			maxlength="2"
			class="w-7 bg-transparent text-center text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
		/>
		<span class="text-[var(--text-muted)]">:</span>
		<input
			bind:value={mm}
			onkeydown={(e) => !!newTitle.trim() && e.key === 'Enter' && handleSubmit()}
			oninput={() => {
				mm = mm.replace(/\D/g, '');
				if (parseInt(mm) > 59) mm = '59';
			}}
			type="text"
			inputmode="numeric"
			placeholder="MM"
			maxlength="2"
			class="w-7 bg-transparent text-center text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
		/>
	</div>
	<div class="h-4 w-px bg-[var(--border)]"></div>
	<input
		bind:value={newTitle}
		onkeydown={(e) => !!newTitle.trim() && e.key === 'Enter' && handleSubmit()}
		type="text"
		class="flex-1 bg-transparent px-2 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
		placeholder="What's happening?"
	/>
	<div class="hidden text-[var(--text-muted)] md:block">
		<Kbd>Enter</Kbd>
	</div>
	<button
		onclick={handleSubmit}
		disabled={!newTitle.trim()}
		class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--background)] transition-opacity hover:opacity-90 disabled:opacity-50"
		aria-label="Add event"
	>
		<Plus size={20} />
	</button>
</div>
