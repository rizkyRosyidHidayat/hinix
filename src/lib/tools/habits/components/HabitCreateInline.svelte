<script lang="ts">
	import { Plus, Repeat } from '@lucide/svelte';
	import Kbd from '$lib/components/ui/kbd/kbd.svelte';
	import * as Select from '$lib/components/ui/select/index.js';

	let { onSubmit } = $props<{
		onSubmit: (name: string, interval?: 'everyday' | 'weekday' | 'weekend') => void;
	}>();

	let newName = $state('');
	let interval = $state('');

	function handleSubmit() {
		if (newName.trim()) {
			const parsedInterval = interval as 'everyday' | 'weekday' | 'weekend' | '';
			onSubmit(newName, parsedInterval || undefined);
			newName = '';
			interval = '';
		}
	}
</script>

<div
	class="flex items-center gap-3 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-2 transition-colors focus-within:border-[var(--accent)]/50"
>
	<input
		bind:value={newName}
		onkeydown={(e) => !!newName.trim() && e.key === 'Enter' && handleSubmit()}
		type="text"
		class="flex-1 bg-transparent px-2 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
		placeholder="What habit want to build?"
	/>
	
	<div class="h-4 w-px bg-[var(--border)]"></div>
	
	<div class="flex items-center gap-1">
		<Repeat size={16} class="text-[var(--text-muted)]" />
		<Select.Root type="single" bind:value={interval}>
			<Select.Trigger class="h-8 w-[100px] border-none bg-transparent px-2 py-0 text-sm shadow-none focus-visible:ring-0">
				{interval ? interval.charAt(0).toUpperCase() + interval.slice(1) : 'Everyday'}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="">Everyday</Select.Item>
				<Select.Item value="weekday">Weekday</Select.Item>
				<Select.Item value="weekend">Weekend</Select.Item>
			</Select.Content>
		</Select.Root>
	</div>
	
	<div class="h-4 w-px bg-[var(--border)]"></div>
	
	<div class="hidden text-[var(--text-muted)] md:block">
		<Kbd>Enter</Kbd>
	</div>
	<button
		onclick={handleSubmit}
		disabled={!newName.trim()}
		class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--background)] transition-opacity hover:opacity-90 disabled:opacity-50"
		aria-label="Add habit"
	>
		<Plus size={20} />
	</button>
</div>
