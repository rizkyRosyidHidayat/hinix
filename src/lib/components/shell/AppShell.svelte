<script lang="ts">
  import Sidebar from './Sidebar.svelte';
  import TerminalBar from './TerminalBar.svelte';
  import { shellStore } from '../../stores/shell.svelte';
  import CommandPalette from '../command/CommandPalette.svelte';

  let { children } = $props();

  // Keyboard shortcut listener for Command Palette (Ctrl/Cmd + K)
  function handleKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      shellStore.isCommandPaletteOpen = !shellStore.isCommandPaletteOpen;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex h-screen w-full flex-col bg-[var(--background)] text-[var(--text-primary)] font-mono overflow-hidden">
  <div class="flex flex-1 overflow-hidden">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content Area -->
    <main class="flex flex-1 flex-col overflow-hidden relative border-l border-[var(--border)]">
      <!-- Page Content -->
      <div class="flex-1 overflow-y-auto p-6 scroll-smooth">
        {@render children()}
      </div>

      <!-- Terminal Bar at the bottom -->
      <TerminalBar />
    </main>
  </div>
  
  {#if shellStore.isCommandPaletteOpen}
    <CommandPalette />
  {/if}
</div>
