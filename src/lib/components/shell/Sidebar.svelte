<script lang="ts">
  import { page } from '$app/stores';
  import { Home, Calculator, CheckSquare, Clock, DollarSign, Calendar } from 'lucide-svelte';
  import { timerStore } from '../../stores/timer.svelte';

  const navItems = [
    { label: 'Dashboard', path: '/', icon: Home },
    { label: 'Calculator', path: '/calculator', icon: Calculator },
    { label: 'Todo', path: '/todo', icon: CheckSquare },
    { label: 'Timer', path: '/timer', icon: Clock },
    { label: 'Budget', path: '/budget', icon: DollarSign },
    { label: 'Schedule', path: '/schedule', icon: Calendar },
  ];
</script>

<aside class="w-64 bg-[var(--surface-elevated)] flex-col justify-between hidden md:flex">
  <div>
    <div class="p-6">
      <h1 class="text-2xl font-bold text-[var(--accent)] tracking-tight">HiNix</h1>
      <p class="text-xs text-[var(--text-muted)] mt-1">v0.1</p>
    </div>
    <nav class="px-4 py-2 flex flex-col gap-1">
      {#each navItems as item}
        <a 
          href={item.path}
          class="flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-200 ease-in-out text-sm {$page.url.pathname === item.path ? 'bg-[var(--surface)] text-[var(--text-primary)] font-medium shadow-sm' : 'text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]'}"
        >
          <item.icon size={18} />
          {item.label}
        </a>
      {/each}
    </nav>
  </div>
  
  {#if timerStore.state.status === 'running' || timerStore.state.status === 'paused'}
    <div class="p-4 m-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
      <div class="flex items-center gap-2 mb-1">
        <Clock size={16} class="text-[var(--accent)]" />
        <span class="text-sm font-medium">Timer {timerStore.state.status}</span>
      </div>
      <div class="text-xl font-bold font-mono">
        {Math.floor(timerStore.state.remainingMs / 60000).toString().padStart(2, '0')}:{(Math.floor(timerStore.state.remainingMs / 1000) % 60).toString().padStart(2, '0')}
      </div>
    </div>
  {/if}
</aside>
