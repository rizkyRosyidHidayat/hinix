<script lang="ts">
  import CommandInput from '../command/CommandInput.svelte';
  import CommandOutput from '../command/CommandOutput.svelte';
  import { shellStore } from '../../stores/shell.svelte';

  let terminalOutputRef: HTMLDivElement | undefined = $state();

  // Auto-scroll to bottom when output changes
  $effect(() => {
    // Read the output length to trigger reactivity
    const length = shellStore.output.length;
    if (terminalOutputRef && length > 0) {
      setTimeout(() => {
        if (terminalOutputRef) {
          terminalOutputRef.scrollTop = terminalOutputRef.scrollHeight;
        }
      }, 0);
    }
  });
</script>

<div class="bg-[var(--surface-elevated)] border-t border-[var(--border)] flex flex-col max-h-64 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
  {#if shellStore.output.length > 0}
    <div bind:this={terminalOutputRef} class="flex-1 overflow-y-auto p-4 space-y-2 border-b border-[var(--border)]">
      {#each shellStore.output as item (item.id)}
        <div class="text-sm">
          <div class="text-[var(--text-secondary)] mb-1 font-mono">$ {item.command}</div>
          <CommandOutput result={item.result} />
        </div>
      {/each}
    </div>
  {/if}
  
  <div class="p-4 flex items-center bg-[var(--surface-elevated)]">
    <span class="text-[var(--accent)] font-bold mr-3 font-mono">$</span>
    <CommandInput />
  </div>
</div>
