<script lang="ts">
	import { shellStore } from '$lib/stores/shell.svelte';
	import {
		CheckSquare,
		Calendar,
		Target,
		Banknote,
		Home,
		Terminal,
		MousePointer
	} from '@lucide/svelte';

	const navItems = [
		{
			icon: Home,
			onClick: () => shellStore.clearActiveDomain(),
			domain: null
		},
		{
			icon: CheckSquare,
			onClick: () => shellStore.setActiveDomain('todo'),
			domain: 'todo'
		},
		{
			icon: Calendar,
			onClick: () => shellStore.setActiveDomain('schedule'),
			domain: 'schedule'
		},
		{
			icon: Target,
			onClick: () => shellStore.setActiveDomain('habit'),
			domain: 'habit'
		},
		{
			icon: Banknote,
			onClick: () => shellStore.setActiveDomain('budget'),
			domain: 'budget'
		}
	];

	const controlItems = [
		{
			icon: MousePointer,
			onClick: () => shellStore.setControlState('pointer'),
			controlState: 'pointer'
		},
		{
			icon: Terminal,
			onClick: () => shellStore.setControlState('terminal'),
			controlState: 'terminal'
		}
	];

	const activatedDomain = $derived(shellStore.activatedDomain);
	const controlStateSelected = $derived(shellStore.controlState);
</script>

<div class="sticky bottom-4 z-10 mx-auto flex w-full max-w-max gap-4">
	<div
		class="flex items-center gap-2 rounded-3xl border border-[var(--border)] bg-[var(--surface-elevated)] px-2 py-2"
	>
		{#each navItems as { icon: Icon, onClick, domain }, idx (idx)}
			<button
				onclick={onClick}
				tabindex={idx}
				class="cursor-pointer p-2 transition-all duration-200 outline-none focus-visible:outline-none {activatedDomain ===
				domain
					? 'text-[var(--accent)]'
					: 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}"
			>
				<Icon size={20} />
			</button>
		{/each}
	</div>
	<div
		class="flex items-center gap-2 rounded-3xl border border-[var(--border)] bg-[var(--surface-elevated)] px-2 py-2"
	>
		{#each controlItems as { icon: Icon, onClick, controlState }, idx (idx)}
			<button
				tabindex={idx}
				onclick={onClick}
				class="cursor-pointer p-2 transition-all duration-200 outline-none focus-visible:outline-none {controlState ===
				controlStateSelected
					? 'text-[var(--accent)]'
					: 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}"
			>
				<Icon size={20} />
			</button>
		{/each}
	</div>
</div>
