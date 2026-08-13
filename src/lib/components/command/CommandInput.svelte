<script lang="ts">
	import { shellStore } from '../../stores/shell.svelte';
	import { executeCommand } from '../../commands/executor';
	import { goto } from '$app/navigation';
	import { TodoRepository } from '../../repositories/todo.repository';
	import { BudgetRepository } from '../../repositories/budget.repository';
	import { ScheduleRepository } from '../../repositories/schedule.repository';
	import { registry } from '../../commands/registry';
	import type { CommandContext } from '../../commands/types';
	import { contextManager } from '../../commands/contextManager.svelte';
	import CommandAutocomplete from './CommandAutocomplete.svelte';
	import { onMount } from 'svelte';

	let inputElement: HTMLInputElement;

	onMount(() => {
		inputElement.focus();
	});

	// ── Autocomplete state ──
	let showAutocomplete = $state(false);
	let selectedIndex = $state(-1);

	interface AutocompleteItem {
		name: string;
		description: string;
		usage?: string;
		type: 'command' | 'subcommand';
	}

	// Derive the active subcommand usage hint when the user has typed/selected a full subcommand
	let activeUsageHint = $derived.by(
		(): { name: string; usage: string; example: string; description: string } | undefined => {
			const rawInput = shellStore.input;
			if (!rawInput || !rawInput.includes(' ')) return undefined;

			const ns = contextManager.namespace;
			const parts = rawInput.trim().split(/\s+/);

			if (ns) {
				// In context mode: input is "subcommand [args...]"
				const nsCommand = registry.get(ns);
				if (!nsCommand?.subcommands) return undefined;
				const sub = nsCommand.subcommands.find((s) => s.name === parts[0]);
				if (sub?.usage)
					return {
						name: sub.name,
						usage: sub.usage,
						example: sub.example || '',
						description: sub.description
					};
			} else {
				// No context: input is "command subcommand [args...]"
				if (parts.length < 2) return undefined;
				const parentCmd = registry.get(parts[0]);
				if (!parentCmd?.subcommands) return undefined;
				const sub = parentCmd.subcommands.find((s) => s.name === parts[1]);
				if (sub?.usage)
					return {
						name: sub.name,
						usage: sub.usage,
						example: sub.example || '',
						description: sub.description
					};
			}

			return undefined;
		}
	);

	// Compute suggestions based on input and active context
	let suggestions = $derived.by((): AutocompleteItem[] => {
		const rawInput = shellStore.input;
		const input = rawInput.trim().toLowerCase();

		if (!rawInput) return [];

		const ns = contextManager.namespace;
		const parts = input.split(/\s+/);
		const fullInput = ns ? `${ns} ${rawInput}` : rawInput;
		const fullInputLower = fullInput.toLowerCase();

		const items: AutocompleteItem[] = [];

		if (ns) {
			const nsCommand = registry.get(ns);
			if (!nsCommand) return [];

			// Show subcommands: all when input is empty, filter by partial match otherwise
			if (nsCommand.subcommands) {
				const hasSpace = rawInput.includes(' ');
				const filtered = hasSpace
					? [] // Once a subcommand is fully typed, stop showing the list
					: input === ''
						? nsCommand.subcommands // Show all subcommands
						: nsCommand.subcommands.filter(
								(sub) => sub.name.startsWith(input) && sub.name !== input
							);
				items.push(
					...filtered.map((sub) => ({
						name: sub.name,
						description: sub.description,
						usage: sub.usage,
						type: 'subcommand' as const
					}))
				);
			}

			return items;
		} else {
			// No context
			const firstWord = parts[0];

			// 1. Top-level commands
			if (!rawInput.includes(' ')) {
				const allCmds = registry.getAll();
				const filtered = allCmds.filter(
					(cmd) =>
						(cmd.name.startsWith(firstWord) || cmd.aliases?.some((a) => a.startsWith(firstWord))) &&
						cmd.name !== firstWord
				);

				items.push(
					...filtered.map((cmd) => ({
						name: cmd.name,
						description: cmd.description,
						usage: cmd.aliases?.length ? `alias: ${cmd.aliases.join(', ')}` : undefined,
						type: 'command' as const
					}))
				);

				if ('exit'.startsWith(firstWord) && 'exit' !== firstWord) {
					items.push({
						name: 'exit',
						description: 'Exit the current command context',
						type: 'command'
					});
				}

				return items;
			}

			// 2. Subcommands
			const parentCmd = registry.get(firstWord);
			if (!parentCmd) return items;

			const spaces = (rawInput.match(/ /g) || []).length;
			if (parentCmd.subcommands) {
				const subInput = parts[1] || '';
				// Show all subcommands when user just typed "command " (subInput is empty)
				// Filter by partial match when typing, hide once fully typed (has 2+ spaces)
				const filtered =
					subInput === ''
						? parentCmd.subcommands // Show all subcommands
						: spaces === 1
							? parentCmd.subcommands.filter(
									(sub) => sub.name.startsWith(subInput) && sub.name !== subInput
								)
							: []; // Subcommand fully typed, stop showing list
				items.push(
					...filtered.map((sub) => ({
						name: sub.name,
						description: sub.description,
						usage: sub.usage,
						type: 'subcommand' as const
					}))
				);
			}

			return items;
		}
	});

	// Reset selected index when suggestions change
	$effect(() => {
		const _ = suggestions.length;
		selectedIndex = -1;
	});

	function applyCompletion(item: AutocompleteItem) {
		const rawInput = shellStore.input; // raw input with potential trailing spaces
		const input = rawInput.trim();
		const ns = contextManager.namespace;

		if (ns) {
			// In context, replace entire input with the subcommand name
			shellStore.input = item.name + ' ';
			showAutocomplete = true; // Keep open to show examples
		} else {
			const parts = input.split(/\s+/);
			if (parts.length <= 1) {
				// Replace the command
				shellStore.input = item.name + ' ';
				showAutocomplete = true; // Keep open to show subcommands
			} else {
				// Replace the subcommand part
				parts[parts.length - 1] = item.name;
				shellStore.input = parts.join(' ') + ' ';
				showAutocomplete = true; // Keep open to show examples
			}
		}

		selectedIndex = -1;
		inputElement?.focus();
	}

	async function handleKeydown(e: KeyboardEvent) {
		// Autocomplete keyboard handling
		if (showAutocomplete && suggestions.length > 0) {
			if (e.key === 'ArrowUp') {
				e.preventDefault();
				selectedIndex = selectedIndex <= 0 ? suggestions.length - 1 : selectedIndex - 1;
				return;
			}

			if (e.key === 'ArrowDown') {
				e.preventDefault();
				selectedIndex = selectedIndex >= suggestions.length - 1 ? 0 : selectedIndex + 1;
				return;
			}

			if (e.key === 'Tab') {
				e.preventDefault();
				const target = selectedIndex >= 0 ? suggestions[selectedIndex] : suggestions[0];
				if (target) applyCompletion(target);
				return;
			}

			if (e.key === 'Enter' && selectedIndex >= 0) {
				e.preventDefault();
				applyCompletion(suggestions[selectedIndex]);
				return;
			}

			if (e.key === 'Escape') {
				e.preventDefault();
				showAutocomplete = false;
				selectedIndex = -1;
				return;
			}
		}

		// Standard command execution
		if (e.key === 'Enter') {
			if (!shellStore.input.trim()) return;
			showAutocomplete = false;

			const cmd = shellStore.input.trim();
			const currentContext = contextManager.namespace;

			const context: CommandContext = {
				navigate: (path: string) => {
					goto(path);
				},
				repositories: {
					todo: new TodoRepository(),
					budget: new BudgetRepository(),
					schedule: new ScheduleRepository()
				}
			};

			const result = await executeCommand(cmd, context);

			if (result.type === 'clear') {
				shellStore.closeOutput();
			} else if (result.type === 'navigate') {
				context.navigate(result.path);
				shellStore.addOutput(cmd, currentContext, result);
			} else if (result.type === 'context_entered') {
				shellStore.addOutput(cmd, currentContext, {
					type: 'success',
					output: `Entered ${result.namespace} context.`
				});
			} else if (result.type === 'context_exited') {
				shellStore.addOutput(cmd, currentContext, {
					type: 'success',
					output: 'Exited context.'
				});
			} else {
				shellStore.addOutput(cmd, currentContext, result);
			}

			shellStore.input = '';
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (shellStore.history.length > 0) {
				if (shellStore.historyIndex < shellStore.history.length - 1) {
					shellStore.historyIndex++;
					shellStore.input = shellStore.history[shellStore.historyIndex];
				}
			}
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (shellStore.historyIndex > 0) {
				shellStore.historyIndex--;
				shellStore.input = shellStore.history[shellStore.historyIndex];
			} else if (shellStore.historyIndex === 0) {
				shellStore.historyIndex = -1;
				shellStore.input = '';
			}
		} else if (e.key === 'Escape') {
			shellStore.input = '';
		}
	}

	function handleInput() {
		showAutocomplete = shellStore.input.trim().length > 0;
		selectedIndex = -1;
	}
</script>

<div class="w-full divide-y divide-[var(--border)]">
	{#if activeUsageHint}
		<div class="container mx-auto flex items-center gap-3 px-6 py-2.5">
			<span class="shrink-0 font-mono text-sm font-semibold">Example {activeUsageHint.name}</span>
			<div class="flex items-center gap-2">
				<span class="font-mono text-xs text-[var(--text-muted)]">{activeUsageHint.example}</span>
			</div>
			<span class="ml-auto text-[10px] text-[var(--text-muted)]">{activeUsageHint.usage}</span>
		</div>
	{/if}
	{#if showAutocomplete && suggestions.length > 0}
		<CommandAutocomplete items={suggestions} {selectedIndex} onselect={applyCompletion} />
	{/if}
	<div class="container mx-auto px-6 py-4">
		<div class="flex items-center bg-[var(--surface-elevated)]">
			<span class="mr-3 shrink-0 font-mono font-bold text-[var(--accent)]"
				>$nix{contextManager.namespace ? ` ${contextManager.namespace}` : ''}</span
			>
			<input
				bind:this={inputElement}
				bind:value={shellStore.input}
				onkeydown={handleKeydown}
				oninput={handleInput}
				type="text"
				class="w-full border-none bg-transparent font-mono text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:ring-0"
				placeholder="Type a command or (Ctrl+K for palette)"
				autocomplete="off"
				spellcheck="false"
			/>
		</div>
	</div>
</div>
