<script lang="ts">
	import { shellStore } from '../../stores/shell.svelte';
	import { afterNavigate } from '$app/navigation';
	import Kbd from '../ui/kbd/kbd.svelte';
	import { ArrowRight } from '@lucide/svelte';
	import { executor, parseCommand } from '$lib/command';

	let inputElement = $state<HTMLInputElement | null>(null);
	let isExecuting = $state(false);

	let placeholder = $derived.by(() => {
		return `What do you want to do?`;
	});

	afterNavigate(() => {
		// Auto-focus the input reliably after any page navigation completes
		setTimeout(() => {
			inputElement?.focus();
		}, 0);
	});

	async function handleEnter() {
		if (!shellStore.input.trim() || isExecuting) return;

		let cmd = shellStore.input.trim();

		isExecuting = true;
		const now = new Date();
		const parsedCommand = parseCommand(cmd, { now });
		const result = await executor.execute(parsedCommand);
		shellStore.addOutput(result, parsedCommand);
		isExecuting = false;

		shellStore.input = '';
	}

	async function handleKeydown(e: KeyboardEvent) {
		// Standard command execution
		if (e.key === 'Enter') {
			handleEnter();
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
</script>

<div class="w-full divide-y divide-[var(--border)]">
	<div class="container mx-auto px-6 py-4">
		<div class="flex items-center">
			<input
				bind:this={inputElement}
				bind:value={shellStore.input}
				onkeydown={handleKeydown}
				type="text"
				disabled={isExecuting}
				class="w-full border-none bg-transparent font-mono text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:ring-0 disabled:opacity-50"
				{placeholder}
				autocomplete="off"
				spellcheck="false"
			/>
		</div>
		<div class="mt-6 -mr-1 flex items-center justify-end gap-2">
			<Kbd>Enter</Kbd>
			<button
				onclick={handleEnter}
				disabled={isExecuting}
				class="cursor-pointer text-[var(--accent)] disabled:opacity-50"
			>
				<ArrowRight size={16} />
			</button>
		</div>
	</div>
</div>
