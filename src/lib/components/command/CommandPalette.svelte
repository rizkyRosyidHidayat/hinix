<script lang="ts">
  import { shellStore } from '../../stores/shell.svelte';
  import { registry } from '../../commands/registry';
  import { Search } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import { fade, slide } from 'svelte/transition';

  let searchQuery = $state('');
  let searchInputRef: HTMLInputElement;

  let filteredCommands = $derived(
    searchQuery ? registry.search(searchQuery) : registry.getAll()
  );

  onMount(() => {
    if (searchInputRef) {
      searchInputRef.focus();
    }
  });

  function close() {
    shellStore.isCommandPaletteOpen = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      close();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div 
  class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh]"
  onclick={close}
  transition:fade={{ duration: 150 }}
>
  <div 
    class="bg-[var(--surface)] w-full max-w-xl rounded-xl shadow-2xl border border-[var(--border)] overflow-hidden"
    onclick={(e) => e.stopPropagation()}
    transition:slide={{ duration: 200, axis: 'y' }}
  >
    <div class="flex items-center px-4 py-3 border-b border-[var(--border)]">
      <Search size={20} class="text-[var(--text-muted)] mr-3" />
      <input
        bind:this={searchInputRef}
        bind:value={searchQuery}
        type="text"
        placeholder="Search commands..."
        class="flex-1 bg-transparent border-none outline-none text-[var(--text-primary)] text-lg placeholder:text-[var(--text-muted)]"
      />
    </div>

    <div class="max-h-[60vh] overflow-y-auto p-2">
      {#if filteredCommands.length === 0}
        <div class="px-4 py-8 text-center text-[var(--text-muted)]">
          No commands found matching "{searchQuery}"
        </div>
      {:else}
        {#each filteredCommands as cmd}
          <button 
            class="w-full text-left px-4 py-3 rounded-lg hover:bg-[var(--surface-elevated)] transition-colors focus:bg-[var(--surface-elevated)] focus:outline-none flex flex-col gap-1"
            onclick={() => {
              shellStore.input = cmd.name;
              close();
            }}
          >
            <div class="flex items-center justify-between">
              <span class="font-bold text-[var(--accent)] font-mono">{cmd.name}</span>
              {#if cmd.aliases && cmd.aliases.length > 0}
                <div class="flex gap-1">
                  {#each cmd.aliases as alias}
                    <span class="text-xs bg-[var(--surface-elevated)] border border-[var(--border)] px-1.5 py-0.5 rounded text-[var(--text-muted)]">{alias}</span>
                  {/each}
                </div>
              {/if}
            </div>
            <div class="text-sm text-[var(--text-secondary)]">{cmd.description}</div>
            <div class="text-xs text-[var(--text-muted)] font-mono mt-1 opacity-70">Usage: {cmd.usage}</div>
          </button>
        {/each}
      {/if}
    </div>
  </div>
</div>
