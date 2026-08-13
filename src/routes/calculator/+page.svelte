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

<div class="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500">
	<div>
		<h1 class="text-3xl font-bold tracking-tight text-[var(--accent)]">Calculator</h1>
		<p class="mt-1 font-mono text-sm text-[var(--text-muted)]">calc &lt;expression&gt;</p>
	</div>

	<div class="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-sm">
		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleCalculate();
			}}
			class="space-y-6"
		>
			<div>
				<label for="expression" class="mb-2 block text-sm font-medium text-[var(--text-secondary)]"
					>Expression</label
				>
				<input
					id="expression"
					type="text"
					bind:value={expression}
					placeholder="e.g. 50 * 20 + (100 / 3)"
					class="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-4 font-mono text-xl text-[var(--text-primary)] transition-all outline-none focus:ring-2 focus:ring-[var(--accent)]"
				/>
			</div>

			<button
				type="submit"
				disabled={!expression.trim()}
				class="w-full rounded-lg bg-[var(--accent)] px-4 py-3 font-bold text-[var(--background)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
			>
				Calculate
			</button>
		</form>

		{#if result !== null}
			<div class="mt-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
				<div class="mb-2 text-sm text-[var(--text-muted)]">Result:</div>
				<div class="font-mono text-4xl font-bold break-all text-[var(--text-primary)]">
					{result}
				</div>
			</div>
		{:else if error !== null}
			<div class="mt-8 rounded-lg border border-red-900/50 bg-red-950/30 p-6">
				<div class="font-medium text-red-400">Error:</div>
				<div class="mt-1 text-red-300">{error}</div>
			</div>
		{/if}
	</div>
</div>
