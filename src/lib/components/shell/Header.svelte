<script lang="ts">
	import { Calculator, CheckSquare, Clock, DollarSign, Calendar } from 'lucide-svelte';
	import { timerStore } from '../../stores/timer.svelte';
	import * as NavigationMenu from '$lib/components/ui/navigation-menu';

	const navItems = [
		{ label: 'Calculator', path: '/calculator', icon: Calculator },
		{ label: 'Todo', path: '/todo', icon: CheckSquare },
		{ label: 'Timer', path: '/timer', icon: Clock },
		{ label: 'Budget', path: '/budget', icon: DollarSign },
		{ label: 'Schedule', path: '/schedule', icon: Calendar }
	];
</script>

<aside
	class="sticky top-0 z-10 flex w-full items-center justify-between bg-[var(--background)] px-6 py-3"
>
	<NavigationMenu.Root>
		<NavigationMenu.List class="gap-3">
			<NavigationMenu.Item>
				<NavigationMenu.Link>
					{#snippet child()}
						<a href="/" class="-mt-1 flex items-center transition-opacity hover:opacity-80">
							<h1 class="text-2xl font-bold tracking-tight text-[var(--accent)]">HiNix</h1>
						</a>
					{/snippet}
				</NavigationMenu.Link>
			</NavigationMenu.Item>
			<NavigationMenu.Item>
				<NavigationMenu.Trigger
					class="bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
					>Tools</NavigationMenu.Trigger
				>
				<NavigationMenu.Content>
					<ul class="w-[200px]">
						{#each navItems as item}
							<li>
								<NavigationMenu.Link>
									{#snippet child()}
										<a
											href={item.path}
											class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
										>
											<item.icon size={16} />
											{item.label}
										</a>
									{/snippet}
								</NavigationMenu.Link>
							</li>
						{/each}
					</ul>
				</NavigationMenu.Content>
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
				{Math.floor(timerStore.state.remainingMs / 60000)
					.toString()
					.padStart(2, '0')}:{(Math.floor(timerStore.state.remainingMs / 1000) % 60)
					.toString()
					.padStart(2, '0')}
			</div>
		</a>
	{/if}
</aside>
