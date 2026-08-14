<script lang="ts">
	import { Clock } from '@lucide/svelte';
	import { timerStore } from '../../stores/timer.svelte';
	import * as NavigationMenu from '$lib/components/ui/navigation-menu';
	import Kbd from '../ui/kbd/kbd.svelte';
	import { shellStore } from '$lib/stores/shell.svelte';

	function handleOpenCommandPallete() {
		shellStore.isCommandPaletteOpen = !shellStore.isCommandPaletteOpen;
	}
</script>

<header
	class="sticky top-0 z-10 flex w-full items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-6 py-3"
>
	<NavigationMenu.Root>
		<NavigationMenu.List class="gap-6">
			<NavigationMenu.Item>
				<NavigationMenu.Link>
					{#snippet child()}
						<a href="/" class="flex items-center transition-opacity hover:opacity-80">
							<h1 class="text-2xl font-bold tracking-tight text-[var(--accent)]">HiNix</h1>
						</a>
					{/snippet}
				</NavigationMenu.Link>
			</NavigationMenu.Item>
			<NavigationMenu.Item onclick={handleOpenCommandPallete}>
				<span class="cursor-pointer text-sm font-medium">Commands</span>
				<Kbd>Ctrl + K</Kbd>
			</NavigationMenu.Item>
			<NavigationMenu.Item>
				<NavigationMenu.Link>
					{#snippet child()}
						<a href="/settings" class="text-sm font-medium"> Settings </a>
					{/snippet}
				</NavigationMenu.Link>
			</NavigationMenu.Item>
			<NavigationMenu.Item>
				<NavigationMenu.Link>
					{#snippet child()}
						<a href="/help" class="text-sm font-medium"> Help </a>
					{/snippet}
				</NavigationMenu.Link>
			</NavigationMenu.Item>
		</NavigationMenu.List>
	</NavigationMenu.Root>

	{#if timerStore.state.status === 'running' || timerStore.state.status === 'paused'}
		<a
			href="/timer"
			class="flex items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 shadow-sm transition-colors hover:bg-[var(--surface-elevated)]"
		>
			<div class="flex items-center gap-2">
				<Clock
					size={16}
					class="text-[var(--accent)] {timerStore.state.status === 'running'
						? 'animate-pulse'
						: ''}"
				/>
				<span
					class="hidden text-xs font-medium tracking-wider text-[var(--text-muted)] uppercase sm:inline-block"
				>
					{timerStore.state.status}
				</span>
			</div>
			<div class="font-mono text-sm font-bold text-[var(--text-primary)]">
				{timerStore.state.label}
			</div>
		</a>
	{/if}
</header>
