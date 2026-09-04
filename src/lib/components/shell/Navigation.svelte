<script lang="ts">
	import { shellStore } from '$lib/stores/shell.svelte';
	import {
		CheckSquare,
		Calendar,
		Target,
		Receipt,
		Home,
		Terminal,
		FileText,
		ChevronRight
	} from '@lucide/svelte';
	import { slide } from 'svelte/transition';

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
			icon: FileText,
			onClick: () => shellStore.setActiveDomain('note'),
			domain: 'note'
		},
		{
			icon: Receipt,
			onClick: () => shellStore.setActiveDomain('budget'),
			domain: 'budget'
		},
		{
			icon: Target,
			onClick: () => shellStore.setActiveDomain('habit'),
			domain: 'habit'
		}
	];

	const controlItems = [
		{
			icon: Terminal,
			onClick: () => shellStore.setControlState('terminal'),
			controlState: 'terminal'
		}
	];

	const activatedDomain = $derived(shellStore.activatedDomain);
	const controlStateSelected = $derived(shellStore.controlState);

	let isHovered = $state(false);

	let isHiddenItemSelected = $derived(
		!isHovered && navItems.slice(3).some((item) => item.domain === activatedDomain)
	);
</script>

<div class="sticky bottom-4 z-10 mx-auto flex w-full max-w-max gap-4">
	<div
		role="navigation"
		aria-label="Main Navigation"
		class="flex items-center gap-2 rounded-3xl border border-[var(--border)] bg-[var(--surface-elevated)] px-2 py-2"
		onmouseenter={() => (isHovered = true)}
		onmouseleave={() => (isHovered = false)}
	>
		{#each navItems as { icon: Icon, onClick, domain }, idx (idx)}
			{#if isHovered || idx < 3}
				<button
					onclick={onClick}
					tabindex={idx}
					transition:slide={{ axis: 'x', duration: 200 }}
					class="cursor-pointer p-2 transition-all duration-200 outline-none focus-visible:outline-none {activatedDomain ===
					domain
						? 'text-[var(--accent)]'
						: 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}"
				>
					<Icon size={20} />
				</button>
			{/if}
		{/each}
		{#if !isHovered && navItems.length > 3}
			<div transition:slide={{ axis: 'x', duration: 100 }} class="flex items-center">
				<div
					class="p-2 transition-all duration-100 {isHiddenItemSelected
						? 'text-[var(--accent)]'
						: 'text-[var(--text-muted)]'}"
				>
					<ChevronRight size={20} />
				</div>
			</div>
		{/if}
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
