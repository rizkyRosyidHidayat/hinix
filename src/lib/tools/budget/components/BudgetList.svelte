<script lang="ts">
	import { BudgetRepository } from '$lib/repositories/budget.repository';
	import { BudgetService } from '$lib/tools/budget/budget.service';
	import type { BudgetTransaction } from '$lib/types/budget';
	import { TrendingUp, TrendingDown, Receipt, Trash2, Pencil } from '@lucide/svelte';
	import { format } from 'date-fns';
	import { toast } from 'svelte-sonner';
	import BudgetCreateInline from './BudgetCreateInline.svelte';

	let transactions = $state<BudgetTransaction[]>([]);
	let service = new BudgetService(new BudgetRepository());

	let editingTitleId = $state<string | null>(null);
	let editTitleValue = $state('');

	async function loadData() {
		transactions = await service.listToday();
	}

	$effect(() => {
		loadData();
	});

	async function handleDelete(id: string) {
		await service.delete(id);
		toast.success('Transaction deleted successfully');
		await loadData();
	}

	async function handleAdd(type: 'income' | 'expense', amount: number, description: string) {
		try {
			if (type === 'income') {
				await service.addIncome(amount, description);
			} else {
				await service.addExpense(amount, undefined, description);
			}
			toast.success('Transaction added successfully');
			await loadData();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to add transaction');
		}
	}

	async function saveDescription(t: BudgetTransaction) {
		if (editingTitleId !== t.id) return;
		const newDesc = editTitleValue.trim();
		if (newDesc !== (t.description || '')) {
			await service.update(t.id, { description: newDesc });
			toast.success('Transaction updated successfully');
			await loadData();
		}
		editingTitleId = null;
	}

	function autofocus(node: HTMLElement) {
		node.focus();
	}
</script>

<div
	class="animate-in fade-in slide-in-from-bottom-4 flex min-h-[calc(100vh-200px)] w-full flex-col items-center justify-center duration-500"
>
	<h1 class="mb-2 text-center text-3xl leading-tight font-bold tracking-tight md:text-5xl">
		Today's Budget
	</h1>
	<p class="mb-8 text-center text-lg text-[var(--text-muted)]">
		Track your expenses
		<span class="text-[var(--accent)] transition-colors hover:underline"> here </span>
	</p>
	<div class="mb-4 w-full max-w-xl">
		<BudgetCreateInline onSubmit={handleAdd} />
	</div>
	<div class="w-full max-w-xl">
		{#if transactions.length === 0}
			<div
				class="flex h-[150px] w-full flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-8 text-center text-[var(--text-muted)]"
			>
				<Receipt size={32} class="mb-2 opacity-50" />
				<p>No transactions yet</p>
			</div>
		{:else}
			<div
				class="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]"
			>
				<ul class="divide-y divide-[var(--border)]">
					{#each transactions as t (t.id)}
						<li
							class="group relative flex items-center gap-4 p-4 transition-colors hover:bg-[var(--surface)]"
						>
							<div class="shrink-0">
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
							</div>
							<div class="flex min-w-0 flex-1 flex-col items-start text-left">
								{#if editingTitleId === t.id}
									<input
										use:autofocus
										bind:value={editTitleValue}
										onblur={() => saveDescription(t)}
										onkeydown={(e) => {
											if (e.key === 'Enter') {
												saveDescription(t);
											} else if (e.key === 'Escape') {
												editingTitleId = null;
											}
										}}
										type="text"
										class="w-full border-none bg-transparent text-base font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:ring-0"
										placeholder="Description"
									/>
								{:else}
									<div class="truncate text-base font-medium text-[var(--text-primary)]">
										{t.description || t.category || 'Uncategorized'}
									</div>
								{/if}
								<div class="text-xs text-[var(--text-muted)]">
									{format(new Date(t.date), 'dd MMM yyyy')}
									{#if t.description && t.category}
										<span class="mx-1">•</span>{t.category}
									{/if}
								</div>
							</div>
							<div class="absolute right-4 text-right transition-all group-hover:right-[100px]">
								<div
									class="font-mono font-bold {t.type === 'income'
										? 'text-[var(--success)]'
										: 'text-[var(--text-primary)]'}"
								>
									{t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
								</div>
							</div>
							<div class="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
								<button
									onclick={(e) => {
										e.stopPropagation();
										editingTitleId = t.id;
										editTitleValue = t.description || t.category || '';
									}}
									class="cursor-pointer rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:text-[var(--accent)] focus:outline-none"
									aria-label="Edit transaction"
								>
									<Pencil size={18} />
								</button>
								<button
									onclick={(e) => {
										e.stopPropagation();
										handleDelete(t.id);
									}}
									class="cursor-pointer rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:text-[var(--error)] focus:outline-none"
									aria-label="Delete transaction"
								>
									<Trash2 size={18} />
								</button>
							</div>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</div>
