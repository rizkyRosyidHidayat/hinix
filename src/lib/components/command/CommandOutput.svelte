<script lang="ts">
  import type { CommandResult } from '../../commands/types';
  import { CheckCircle, XCircle, ChevronRight } from 'lucide-svelte';

  let { result } = $props<{ result: CommandResult }>();
</script>

<div class="mt-1 font-mono break-words whitespace-pre-wrap">
  {#if result.type === 'text'}
    <div class="text-[var(--text-primary)] pl-2">{result.output}</div>
  {:else if result.type === 'success'}
    <div class="flex items-start text-[var(--success)] gap-2">
      <CheckCircle size={16} class="mt-0.5 shrink-0" />
      <span>{result.output}</span>
    </div>
  {:else if result.type === 'error'}
    <div class="flex items-start text-[var(--error)] gap-2">
      <XCircle size={16} class="mt-0.5 shrink-0" />
      <span>{result.output}</span>
    </div>
  {:else if result.type === 'navigate'}
    <div class="flex items-start text-[var(--accent)] gap-2 italic">
      <ChevronRight size={16} class="mt-0.5 shrink-0" />
      <span>Navigated to {result.path}</span>
    </div>
  {:else if result.type === 'view'}
    <div class="text-[var(--text-primary)] italic">View: {result.view}</div>
  {/if}
</div>
