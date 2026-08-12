<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { ContextService } from '$lib/context/context.service';
  import { getFormattedDate } from '$lib/context/context.selectors';
  import type { HiNixContext } from '$lib/context/context.types';
  import { timerStore } from '$lib/stores/timer.svelte';
  import {
    CheckSquare,
    DollarSign,
    Calendar,
    Plus,
    Timer,
    Clock,
    ArrowRight,
    TrendingUp,
    TrendingDown,
  } from 'lucide-svelte';

  let ctx = $state<HiNixContext | null>(null);
  let formattedDate = $state(getFormattedDate());

  onMount(async () => {
    const service = new ContextService();
    ctx = await service.getDashboardContext();
  });
</script>

<svelte:head>
  <title>Dashboard | HiNix</title>
</svelte:head>

{#if ctx}
  <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <!-- Greeting -->
    <header>
      <p class="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">{formattedDate}</p>
      <h1 class="text-3xl font-bold tracking-tight mt-1">{ctx.today.greeting}</h1>
    </header>

    <!-- Today Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <button
        onclick={() => goto('/todo')}
        class="group bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-6 shadow-sm hover:shadow-md hover:border-[var(--accent)]/30 transition-all text-left cursor-pointer"
      >
        <div class="flex items-center gap-4 mb-4 text-[var(--accent)]">
          <CheckSquare size={24} />
          <h2 class="text-lg font-semibold text-[var(--text-primary)]">Tasks</h2>
          <ArrowRight size={16} class="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-muted)]" />
        </div>
        <div class="text-4xl font-bold">{ctx.today.tasks}</div>
        <p class="text-sm text-[var(--text-muted)] mt-2">
          {ctx.today.tasks} pending · {ctx.today.completedTasks} done
        </p>
      </button>

      <button
        onclick={() => goto('/budget')}
        class="group bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-6 shadow-sm hover:shadow-md hover:border-[var(--error)]/30 transition-all text-left cursor-pointer"
      >
        <div class="flex items-center gap-4 mb-4 text-[var(--error)]">
          <DollarSign size={24} />
          <h2 class="text-lg font-semibold text-[var(--text-primary)]">Today's Expenses</h2>
          <ArrowRight size={16} class="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-muted)]" />
        </div>
        <div class="text-4xl font-bold font-mono">{ctx.today.expenses.toLocaleString()}</div>
        <p class="text-sm text-[var(--text-muted)] mt-2">Total spent today</p>
      </button>

      <button
        onclick={() => goto('/schedule')}
        class="group bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-6 shadow-sm hover:shadow-md hover:border-[var(--success)]/30 transition-all text-left cursor-pointer"
      >
        <div class="flex items-center gap-4 mb-4 text-[var(--success)]">
          <Calendar size={24} />
          <h2 class="text-lg font-semibold text-[var(--text-primary)]">Events</h2>
          <ArrowRight size={16} class="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-muted)]" />
        </div>
        <div class="text-4xl font-bold">{ctx.today.events}</div>
        <p class="text-sm text-[var(--text-muted)] mt-2">Scheduled for today</p>
      </button>
    </div>

    <!-- Active Timer -->
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

    <!-- Upcoming Events -->
    {#if ctx.upcoming.schedules.length > 0}
      <div class="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
        <div class="flex items-center gap-3 mb-4">
          <Clock size={20} class="text-[var(--accent)]" />
          <h2 class="text-lg font-semibold">Up Next</h2>
        </div>
        <div class="space-y-3">
          {#each ctx.upcoming.schedules as event (event.id)}
            <div class="flex items-center gap-4 py-2 border-b border-[var(--border)]/50 last:border-0">
              <span class="shrink-0 w-14 text-sm font-mono font-semibold text-[var(--accent)]">
                {event.time || 'All Day'}
              </span>
              <span class="text-sm text-[var(--text-primary)]">{event.title}</span>
              {#if event.date !== ctx.today.date}
                <span class="ml-auto text-[10px] rounded bg-[var(--surface)] px-1.5 py-0.5 text-[var(--text-muted)]">
                  {event.date}
                </span>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Finance Summary -->
    <div class="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
      <div class="flex items-center gap-3 mb-4">
        <DollarSign size={20} class="text-[var(--accent)]" />
        <h2 class="text-lg font-semibold">Monthly Finance</h2>
      </div>
      <div class="grid grid-cols-3 gap-6">
        <div>
          <div class="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-1">
            <TrendingUp size={14} class="text-[var(--success)]" />
            Income
          </div>
          <div class="text-xl font-bold font-mono text-[var(--success)]">{ctx.finance.income.toLocaleString()}</div>
        </div>
        <div>
          <div class="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-1">
            <TrendingDown size={14} class="text-[var(--error)]" />
            Expenses
          </div>
          <div class="text-xl font-bold font-mono text-[var(--error)]">{ctx.finance.expenses.toLocaleString()}</div>
        </div>
        <div>
          <div class="text-sm text-[var(--text-muted)] mb-1">Remaining</div>
          <div class="text-xl font-bold font-mono">{ctx.finance.remaining.toLocaleString()}</div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="flex flex-wrap gap-3">
      <button
        onclick={() => goto('/todo')}
        class="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface)] hover:border-[var(--accent)]/40 cursor-pointer"
      >
        <Plus size={16} class="text-[var(--accent)]" />
        Task
      </button>
      <button
        onclick={() => goto('/budget')}
        class="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface)] hover:border-[var(--accent)]/40 cursor-pointer"
      >
        <Plus size={16} class="text-[var(--accent)]" />
        Expense
      </button>
      <button
        onclick={() => goto('/schedule')}
        class="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface)] hover:border-[var(--accent)]/40 cursor-pointer"
      >
        <Plus size={16} class="text-[var(--accent)]" />
        Event
      </button>
      <button
        onclick={() => goto('/timer')}
        class="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface)] hover:border-[var(--accent)]/40 cursor-pointer"
      >
        <Timer size={16} class="text-[var(--accent)]" />
        Timer
      </button>
    </div>
  </div>
{:else}
  <div class="flex items-center justify-center min-h-[50vh]">
    <div class="text-[var(--text-muted)] animate-pulse">Loading...</div>
  </div>
{/if}
