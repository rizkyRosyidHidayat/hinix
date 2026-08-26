<script lang="ts">
	import { BudgetRepository } from '$lib/repositories/budget.repository';
	import { BudgetService } from '$lib/tools/budget/budget.service';
	import type { BudgetTransaction, BudgetSummary } from '$lib/types/budget';
	import { TrendingUp, TrendingDown, Receipt } from '@lucide/svelte';
	import { dbState } from '$lib/stores/db.svelte';
	import { format } from 'date-fns';
	import { registry } from '$lib/commands/registry';
	import { resolve } from '$app/paths';
	import Title from '$lib/components/shell/Title.svelte';

	let transactions = $state<BudgetTransaction[]>([]);
	let summary = $state<BudgetSummary>({ income: 0, expenses: 0, remaining: 0, byCategory: {} });
	let service = new BudgetService(new BudgetRepository());
	let budgetCommand = registry.get('budget');

	$effect(() => {
		// Re-run whenever dbState.budget changes
		dbState.subscribe('budget');
		loadData();
	});

	async function loadData() {
		transactions = await service.list();
		// Assuming summary for current month for simplicity, or all time here
		const today = new Date();
		const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
		const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
			.toISOString()
			.split('T')[0];
		summary = await service.getSummary(firstDay, lastDay);
	}
</script>

<Title title="Budget" />

<div class="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500">
	<div>
		<h1 class="text-xl font-bold tracking-tight md:text-3xl">Budget</h1>
		<p class="mt-2 text-sm text-[var(--text-muted)]">
			<span class="font-mono">See full the commands usage in help menu</span>
			<a href={resolve(`/help#${budgetCommand?.name}`)} class="text-[var(--accent)] hover:underline"
				>View full commands</a
			>
		</p>
	</div>

	<!-- Summary Cards -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
		<div class="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5">
			<div class="mb-1 text-sm text-[var(--text-muted)]">Monthly Income</div>
			<div class="font-mono text-2xl font-bold text-[var(--success)]">
				+{summary.income.toLocaleString()}
			</div>
		</div>
		<div class="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5">
			<div class="mb-1 text-sm text-[var(--text-muted)]">Monthly Expenses</div>
			<div class="font-mono text-2xl font-bold text-[var(--error)]">
				-{summary.expenses.toLocaleString()}
			</div>
		</div>
		<div class="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5">
			<div class="mb-1 text-sm text-[var(--text-muted)]">Remaining</div>
			<div
				class="font-mono text-2xl font-bold {summary.remaining >= 0
					? 'text-[var(--text-primary)]'
					: 'text-[var(--error)]'}"
			>
				{summary.remaining.toLocaleString()}
			</div>
		</div>
	</div>

	<!-- Transactions List -->
	<div
		class="mt-8 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]"
	>
		<div class="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
			<h2 class="font-semibold">Recent Transactions</h2>
		</div>
		{#if transactions.length === 0}
			<div
				class="flex h-[200px] flex-col items-center justify-center p-8 text-center text-[var(--text-muted)]"
			>
				<Receipt size={48} class="mb-4 opacity-20" />
				<p>No transactions yet. Create your first transaction!</p>
			</div>
		{:else}
			<ul class="divide-y divide-[var(--border)]">
				{#each transactions as t (t.id)}
					<li
						class="flex items-center justify-between p-4 transition-colors hover:bg-[var(--surface)]"
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
</div>
