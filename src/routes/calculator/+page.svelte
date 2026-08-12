<script lang="ts">
  import { CalculatorService } from '$lib/tools/calculator/calculator.service';
  import { executeCommand } from '$lib/commands/executor';
  import { shellStore } from '$lib/stores/shell.svelte';

  let expression = $state('');
  let result = $state<string | null>(null);
  let error = $state<string | null>(null);

  const service = new CalculatorService();

  function handleCalculate() {
    if (!expression.trim()) return;
    
    try {
      const res = service.calculate(expression);
      result = res.toString();
      error = null;
      
      // Optionally sync to shell output
      shellStore.addOutput(`calc ${expression}`, null, { type: 'success', output: result });
    } catch (e: any) {
      error = e.message;
      result = null;
    }
  }
</script>

<svelte:head>
  <title>Calculator | HiNix</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
  <header>
    <h1 class="text-3xl font-bold tracking-tight text-[var(--accent)]">Calculator</h1>
    <p class="text-[var(--text-muted)] mt-1 font-mono text-sm">calc &lt;expression&gt;</p>
  </header>

  <div class="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
    <form onsubmit={(e) => { e.preventDefault(); handleCalculate(); }} class="space-y-6">
      <div>
        <label for="expression" class="block text-sm font-medium text-[var(--text-secondary)] mb-2">Expression</label>
        <input
          id="expression"
          type="text"
          bind:value={expression}
          placeholder="e.g. 50 * 20 + (100 / 3)"
          class="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-4 text-xl font-mono text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
          autofocus
        />
      </div>
      
      <button
        type="submit"
        disabled={!expression.trim()}
        class="w-full bg-[var(--accent)] text-[var(--background)] px-4 py-3 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        Calculate
      </button>
    </form>

    {#if result !== null}
      <div class="mt-8 p-6 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
        <div class="text-[var(--text-muted)] text-sm mb-2">Result:</div>
        <div class="text-4xl font-bold font-mono text-[var(--text-primary)] break-all">{result}</div>
      </div>
    {:else if error !== null}
      <div class="mt-8 p-6 bg-red-950/30 rounded-lg border border-red-900/50">
        <div class="text-red-400 font-medium">Error:</div>
        <div class="text-red-300 mt-1">{error}</div>
      </div>
    {/if}
  </div>
</div>
