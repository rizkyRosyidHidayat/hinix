<script lang="ts">
	import { Plus } from '@lucide/svelte';
	import Kbd from '$lib/components/ui/kbd/kbd.svelte';

	let { onSubmit } = $props<{
		onSubmit: (name: string) => void;
	}>();

	let newName = $state('');

	function handleSubmit() {
		if (newName.trim()) {
			onSubmit(newName);
			newName = '';
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
