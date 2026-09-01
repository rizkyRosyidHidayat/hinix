<script lang="ts">
	import { BudgetRepository } from '$lib/repositories/budget.repository';
	import { BudgetService } from '$lib/tools/budget/budget.service';
	import type { BudgetTransaction } from '$lib/types/budget';
	import { TrendingUp, TrendingDown, Receipt } from '@lucide/svelte';
	import { dbState } from '$lib/stores/db.svelte';
	import { format } from 'date-fns';
	import { shellStore } from '$lib/stores/shell.svelte';

	let transactions = $state<BudgetTransaction[]>([]);
	let service = new BudgetService(new BudgetRepository());
	const limit = 5;

	let parsedCommand = $derived(shellStore.parsedCommand);

	async function loadData() {
		transactions = (await service.listToday()).slice(0, limit);
	}

	$effect(() => {
		dbState.subscribe('budget');
		if (parsedCommand && parsedCommand.status === 'success' && parsedCommand.domain === 'budget') {
			loadData();
		}
	});
</script>

<div class="flex flex-col gap-6">
	<!-- Transactions List -->
	{#if transactions.length === 0}
		<div
			class="flex h-[150px] flex-col items-center justify-center p-8 text-center text-[var(--text-muted)]"
		>
			<Receipt size={48} class="mb-4 opacity-20" />
			<p>No transactions yet. <br /> Try "Spent $15 for lunch"</p>
		</div>
	{:else}
		<ul class="space-y-4">
			{#each transactions as t (t.id)}
				<li
					class="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 transition-colors hover:bg-[var(--surface)]"
				>
					<div class="flex items-center gap-4">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface)] {t.type ===
							'income'
								? 'text-[var(--success)]'
								: 'text-[var(--error)]'}"
						>
							{#if t.type === 'income'}
								<TrendingUp size={20} />
							{:else}
								<TrendingDown size={20} />
							{/if}
						</div>
						<div>
							<div class="font-medium text-[var(--text-primary)]">
								{t.category || t.description || 'Uncategorized'}
							</div>
							<div class="text-xs text-[var(--text-muted)]">
								{format(t.date, 'dd MMM yyyy')}
								{t.description && t.category ? `- ${t.description}` : ''}
							</div>
						</div>
					</div>
					<div class="text-right">
						<div
							class="font-mono font-bold {t.type === 'income'
								? 'text-[var(--success)]'
								: 'text-[var(--text-primary)]'}"
						>
							{t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
