<script lang="ts">
  import { onMount } from 'svelte';
  import { BudgetRepository } from '$lib/repositories/budget.repository';
  import { BudgetService } from '$lib/tools/budget/budget.service';
  import type { BudgetTransaction, BudgetSummary } from '$lib/types/budget';
  import { TrendingUp, TrendingDown, Trash2 } from 'lucide-svelte';
  
  let transactions = $state<BudgetTransaction[]>([]);
  let summary = $state<BudgetSummary>({ income: 0, expenses: 0, remaining: 0, byCategory: {} });
  let service: BudgetService;

  onMount(async () => {
    service = new BudgetService(new BudgetRepository());
    await loadData();
  });

  async function loadData() {
    transactions = await service.list();
    // Assuming summary for current month for simplicity, or all time here
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    summary = await service.getSummary(firstDay, lastDay);
  }
</script>

<svelte:head>
  <title>Budget | HiNix</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
  <header>
    <h1 class="text-3xl font-bold tracking-tight text-[var(--accent)]">Budget</h1>
    <p class="text-[var(--text-muted)] mt-1 font-mono text-sm">budget [add &lt;amount&gt; &lt;category&gt; | income &lt;amount&gt; | list]</p>
  </header>

  <!-- Summary Cards -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-5 shadow-sm">
      <div class="text-[var(--text-muted)] text-sm mb-1">Monthly Income</div>
      <div class="text-2xl font-bold font-mono text-[var(--success)]">+{summary.income.toLocaleString()}</div>
    </div>
    <div class="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-5 shadow-sm">
      <div class="text-[var(--text-muted)] text-sm mb-1">Monthly Expenses</div>
      <div class="text-2xl font-bold font-mono text-[var(--error)]">-{summary.expenses.toLocaleString()}</div>
    </div>
    <div class="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-5 shadow-sm">
      <div class="text-[var(--text-muted)] text-sm mb-1">Remaining</div>
      <div class="text-2xl font-bold font-mono {summary.remaining >= 0 ? 'text-[var(--text-primary)]' : 'text-[var(--error)]'}">
        {summary.remaining.toLocaleString()}
      </div>
    </div>
  </div>

  <!-- Transactions List -->
  <div class="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm mt-8">
    <div class="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)]">
      <h2 class="font-semibold">Recent Transactions</h2>
    </div>
    {#if transactions.length === 0}
      <div class="p-8 text-center text-[var(--text-muted)]">
        No transactions yet. Type <code class="font-mono bg-[var(--surface)] px-1.5 py-0.5 rounded">budget add 50000 food "Lunch"</code>
      </div>
    {:else}
      <ul class="divide-y divide-[var(--border)]">
        {#each transactions as t (t.id)}
          <li class="flex items-center justify-between p-4 hover:bg-[var(--surface)] transition-colors">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-[var(--surface)] flex items-center justify-center {t.type === 'income' ? 'text-[var(--success)]' : 'text-[var(--error)]'}">
                {#if t.type === 'income'}
                  <TrendingUp size={20} />
                {:else}
                  <TrendingDown size={20} />
                {/if}
              </div>
              <div>
                <div class="font-medium text-[var(--text-primary)]">{t.category || t.description || 'Uncategorized'}</div>
                <div class="text-xs text-[var(--text-muted)]">{t.date} {t.description && t.category ? `- ${t.description}` : ''}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="font-mono font-bold {t.type === 'income' ? 'text-[var(--success)]' : 'text-[var(--text-primary)]'}">
                {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
              </div>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
