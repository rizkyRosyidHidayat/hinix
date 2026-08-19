import type { CommandResult } from '../commands/types';

export interface CommandOutputItem {
  id: string;
  command: string;
  context: string | null;
  result: CommandResult;
}

// Global singleton state for the shell using Svelte 5 runes
class ShellState {
  input = $state('');
  output = $state<CommandOutputItem | null>(null);
  history = $state<string[]>([]);
  historyIndex = $state(-1);
  isCommandPaletteOpen = $state(false);

  addOutput(command: string, context: string | null, result: CommandResult) {
    this.output = {
      id: crypto.randomUUID(),
      command,
      context,
      result
    };

    // Add to history (avoid consecutive duplicates)
    if (this.history[0] !== command && command.trim() !== '') {
      this.history.unshift(command);
    }

    // Keep max 100 history items
    if (this.history.length > 100) {
      this.history.pop();
    }

    this.historyIndex = -1;
  }

  // Helper functions for the close button
  closeOutput() {
    this.output = null;
  }
}

export const shellStore = new ShellState();
