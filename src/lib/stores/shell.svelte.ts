import type { ParsedCommand, CommandResult, CommandDomain } from '$lib/command-v2';

export interface CommandOutputItem {
	id: string;
	result: CommandResult;
}

// Global singleton state for the shell using Svelte 5 runes
class ShellState {
	input = $state('');
	output = $state<CommandOutputItem | null>(null);
	history = $state<string[]>([]);
	historyIndex = $state(-1);
	parsedCommand = $state<ParsedCommand | null>(null);
	activatedDomain = $state<CommandDomain | null>(null);
	controlState = $state<'pointer' | 'terminal'>('pointer');

	setControlState(controlState: 'pointer' | 'terminal') {
		this.controlState = controlState;
	}

	setActiveDomain(domain: CommandDomain) {
		this.activatedDomain = domain;
	}

	clearActiveDomain() {
		this.activatedDomain = null;
	}

	setParsedCommand(parsedCommand: ParsedCommand) {
		this.parsedCommand = parsedCommand;
	}

	clearParsedCommand() {
		this.parsedCommand = null;
	}

	addOutput(result: CommandResult, parsedCommand: ParsedCommand) {
		this.setParsedCommand(parsedCommand);

		this.output = {
			id: crypto.randomUUID(),
			result
		};

		// Add to history (avoid consecutive duplicates)
		if (this.history[0] !== parsedCommand?.input && parsedCommand?.input.trim() !== '') {
			this.history.unshift(parsedCommand?.input ?? '');
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
