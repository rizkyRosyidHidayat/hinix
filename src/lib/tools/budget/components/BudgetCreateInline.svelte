<script lang="ts">
	import { Plus } from '@lucide/svelte';
	import Kbd from '$lib/components/ui/kbd/kbd.svelte';
	import { Switch } from '$lib/components/ui/switch';

	let { onSubmit } = $props<{
		onSubmit: (type: 'income' | 'expense', amount: number, description: string) => void;
	}>();

	let isIncome = $state(false);
	let type = $derived(isIncome ? 'income' : 'expense');
	let amount = $state('');
	let description = $state('');

	function handleSubmit() {
		const parsedAmount = parseFloat(amount.replace(/,/g, ''));
		if (!isNaN(parsedAmount) && parsedAmount > 0) {
			onSubmit(type, parsedAmount, description.trim());
			amount = '';
			description = '';
		}
	}
</script>

<div
	class="flex items-center gap-2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-2 transition-colors focus-within:border-[var(--accent)]/50"
>
	<Switch bind:checked={isIncome} title={isIncome ? 'Income' : 'Expense'} />
	<input
		bind:value={amount}
		onkeydown={(e) => !!amount && e.key === 'Enter' && handleSubmit()}
		oninput={() => {
			amount = amount.replace(/[^\d.]/g, '');
		}}
		type="text"
		inputmode="decimal"
		class="w-24 bg-transparent px-2 py-2 font-mono text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
		placeholder={type === 'income' ? 'Received' : 'Spent'}
	/>
	<div class="h-4 w-px bg-[var(--border)]"></div>
	<input
		bind:value={description}
		onkeydown={(e) => !!amount && e.key === 'Enter' && handleSubmit()}
		type="text"
		class="flex-1 bg-transparent px-2 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
		placeholder={type === 'income' ? 'Where did the money come from?' : 'What was it for?'}
	/>
	<div class="hidden text-[var(--text-muted)] md:block">
		<Kbd>Enter</Kbd>
	</div>
	<button
		onclick={handleSubmit}
		disabled={!amount}
		class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--background)] transition-opacity hover:opacity-90 disabled:opacity-50"
		aria-label="Add transaction"
	>
		<Plus size={20} />
	</button>
</div>
