<script lang="ts">
  import { onMount } from 'svelte';
  import { TodoRepository } from '$lib/repositories/todo.repository';
  import { BudgetRepository } from '$lib/repositories/budget.repository';
  import { ScheduleRepository } from '$lib/repositories/schedule.repository';
  import { timerStore } from '$lib/stores/timer.svelte';
  import { CheckSquare, DollarSign, Calendar } from 'lucide-svelte';
  
  let pendingTasksCount = $state(0);
  let todayExpenses = $state(0);
  let todayEventsCount = $state(0);

  onMount(async () => {
    const todoRepo = new TodoRepository();
    const budgetRepo = new BudgetRepository();
    const scheduleRepo = new ScheduleRepository();
    const today = new Date().toISOString().split('T')[0];

    // Load data concurrently
    const [todos, budgets, schedules] = await Promise.all([
      todoRepo.list(),
      budgetRepo.listByDateRange(today, today),
      scheduleRepo.listByDate(today)
    ]);

    pendingTasksCount = todos.filter(t => !t.completed).length;
    todayExpenses = budgets.filter(b => b.type === 'expense').reduce((sum, b) => sum + b.amount, 0);
    todayEventsCount = schedules.length;
  });
</script>

<svelte:head>
  <title>Dashboard | HiNix</title>
</svelte:head>

<div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
  <header>
    <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
    <p class="text-[var(--text-muted)] mt-2">Welcome to HiNix. Type a command to get started.</p>
  </header>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div class="flex items-center gap-4 mb-4 text-[var(--accent)]">
        <CheckSquare size={24} />
        <h2 class="text-lg font-semibold text-[var(--text-primary)]">Pending Tasks</h2>
      </div>
      <div class="text-4xl font-bold">{pendingTasksCount}</div>
      <p class="text-sm text-[var(--text-muted)] mt-2">Tasks left to complete</p>
    </div>

    <div class="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div class="flex items-center gap-4 mb-4 text-[var(--error)]">
        <DollarSign size={24} />
        <h2 class="text-lg font-semibold text-[var(--text-primary)]">Today's Expenses</h2>
      </div>
      <div class="text-4xl font-bold font-mono">{todayExpenses.toLocaleString()}</div>
      <p class="text-sm text-[var(--text-muted)] mt-2">Total spent today</p>
    </div>

    <div class="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div class="flex items-center gap-4 mb-4 text-[var(--success)]">
        <Calendar size={24} />
        <h2 class="text-lg font-semibold text-[var(--text-primary)]">Today's Events</h2>
      </div>
      <div class="text-4xl font-bold">{todayEventsCount}</div>
      <p class="text-sm text-[var(--text-muted)] mt-2">Scheduled for today</p>
    </div>
  </div>

  {#if timerStore.state.status === 'running' || timerStore.state.status === 'paused'}
    <div class="bg-[var(--surface-elevated)] border border-[var(--border)] border-l-4 border-l-[var(--accent)] rounded-xl p-6 shadow-sm">
      <h2 class="text-lg font-semibold mb-2">Active Timer</h2>
      <div class="text-4xl font-mono font-bold tracking-wider">
        {Math.floor(timerStore.state.remainingMs / 60000).toString().padStart(2, '0')}:{(Math.floor(timerStore.state.remainingMs / 1000) % 60).toString().padStart(2, '0')}
      </div>
      <div class="mt-4 flex gap-4 text-sm text-[var(--text-muted)] font-mono">
        Status: <span class="text-[var(--text-primary)]">{timerStore.state.status.toUpperCase()}</span>
      </div>
    </div>
  {/if}

  <div class="pt-8 mt-8 border-t border-[var(--border)] text-sm text-[var(--text-muted)] font-mono">
    <p>Try running: <code class="text-[var(--accent)]">todo add "Finish the project"</code></p>
    <p class="mt-2">Press <code class="bg-[var(--surface-elevated)] px-1.5 py-0.5 rounded text-[var(--text-primary)]">Ctrl+K</code> or <code class="bg-[var(--surface-elevated)] px-1.5 py-0.5 rounded text-[var(--text-primary)]">Cmd+K</code> to open the command palette.</p>
  </div>
</div>
