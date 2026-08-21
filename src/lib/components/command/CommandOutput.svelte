<script lang="ts">
	import type { CommandResult } from '../../commands/types';
	import { CheckCircle, XCircle, ChevronRight, RefreshCw } from '@lucide/svelte';

	let { result } = $props<{ result: CommandResult }>();
</script>

<div class="mt-1 font-mono break-words whitespace-pre-wrap">
	{#if result.type === 'text'}
		<div class="pl-2 text-[var(--text-primary)]">{result.output}</div>
	{:else if result.type === 'success'}
		<div class="flex items-start gap-2 text-[var(--success)]">
			<CheckCircle size={16} class="mt-0.5 shrink-0" />
			<span>{result.output}</span>
		</div>
	{:else if result.type === 'error'}
		<div class="flex items-start gap-2 text-[var(--error)]">
			<XCircle size={16} class="mt-0.5 shrink-0" />
			<span>{result.output}</span>
		</div>
	{:else if result.type === 'navigate'}
		<div class="flex items-start gap-2 text-[var(--accent)] italic">
			<ChevronRight size={16} class="mt-0.5 shrink-0" />
			<span>Navigated to {result.path}</span>
		</div>
	{:else if result.type === 'view'}
		<div class="text-[var(--text-primary)] italic">View: {result.view}</div>
	{:else if result.type === 'loading'}
		<div class="flex items-start gap-2 text-[var(--text-muted)]">
			<RefreshCw size={16} class="mt-0.5 shrink-0 animate-spin" />
			<span>{result.output}</span>
		</div>
	{/if}
</div>
