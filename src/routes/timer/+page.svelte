<script lang="ts">
  import { timerStore } from '$lib/stores/timer.svelte';
  import { Play, Pause, Square } from 'lucide-svelte';

  let customMinutes = $state(25);

  function startTimer(minutes: number) {
    timerStore.start(minutes * 60 * 1000);
  }

  function formatTime(ms: number) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
</script>

<svelte:head>
  <title>Timer | HiNix</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
  <header>
    <h1 class="text-3xl font-bold tracking-tight text-[var(--accent)]">Timer</h1>
    <p class="text-[var(--text-muted)] mt-1 font-mono text-sm">timer [&lt;duration&gt;m | stop | pause | resume]</p>
  </header>

  <div class="flex flex-col items-center justify-center p-12 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl shadow-sm min-h-[400px]">
    
    <!-- Timer Display -->
    <div class="text-8xl font-black font-mono tracking-widest text-[var(--text-primary)] tabular-nums mb-8">
      {formatTime(timerStore.state.remainingMs)}
    </div>

    <!-- Status indicator -->
    <div class="mb-10 text-sm tracking-widest uppercase font-semibold {timerStore.state.status === 'running' ? 'text-[var(--success)] animate-pulse' : timerStore.state.status === 'paused' ? 'text-[var(--warning)]' : 'text-[var(--text-muted)]'}">
      {timerStore.state.status}
    </div>

    <!-- Controls -->
    <div class="flex gap-4">
      {#if timerStore.state.status === 'idle' || timerStore.state.status === 'completed'}
        <div class="flex items-center gap-2">
          <input 
            type="number" 
            bind:value={customMinutes} 
            min="1" 
            class="w-20 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-3 text-center text-lg font-mono outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <span class="text-[var(--text-muted)] mr-2">min</span>
          
          <button 
            onclick={() => startTimer(customMinutes)}
            class="bg-[var(--accent)] text-[var(--background)] p-4 rounded-full hover:opacity-90 transition-opacity focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/50"
            aria-label="Start Timer"
          >
            <Play size={24} fill="currentColor" />
          </button>
        </div>
      {:else}
        <button 
          onclick={() => timerStore.state.status === 'running' ? timerStore.pause() : timerStore.resume()}
          class="bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] p-4 rounded-full hover:bg-[var(--surface-elevated)] transition-colors focus:outline-none focus:ring-4 focus:ring-[var(--border)]"
          aria-label={timerStore.state.status === 'running' ? "Pause Timer" : "Resume Timer"}
        >
          {#if timerStore.state.status === 'running'}
            <Pause size={24} fill="currentColor" />
          {:else}
            <Play size={24} fill="currentColor" />
          {/if}
        </button>

        <button 
          onclick={() => timerStore.stop()}
          class="bg-[var(--error)] text-white p-4 rounded-full hover:opacity-90 transition-opacity focus:outline-none focus:ring-4 focus:ring-[var(--error)]/50"
          aria-label="Stop Timer"
        >
          <Square size={24} fill="currentColor" />
        </button>
      {/if}
    </div>

    <!-- Quick Presets -->
    {#if timerStore.state.status === 'idle' || timerStore.state.status === 'completed'}
      <div class="flex gap-3 mt-10">
        {#each [5, 10, 25, 50] as preset}
          <button
            onclick={() => startTimer(preset)}
            class="px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm font-medium hover:bg-[var(--surface-elevated)] transition-colors"
          >
            {preset}m
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>
