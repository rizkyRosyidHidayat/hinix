<script lang="ts">
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { Switch } from '$lib/components/ui/switch';
	import {
		CheckSquare,
		DollarSign,
		Calendar,
		Calculator,
		Timer,
		FileText,
		CheckCircle
	} from '@lucide/svelte';

	const features = [
		{
			id: 'todo',
			label: 'Tasks',
			icon: CheckSquare,
			description: 'Manage your daily tasks and to-do lists.'
		},
		{
			id: 'budget',
			label: 'Budget',
			icon: DollarSign,
			description: 'Track your expenses and income.'
		},
		{
			id: 'schedule',
			label: 'Schedule',
			icon: Calendar,
			description: 'Plan your events and calendar.'
		},
		{
			id: 'calculator',
			label: 'Calculator',
			icon: Calculator,
			description: 'Perform calculations and unit conversions.'
		},
		{
			id: 'timer',
			label: 'Timer',
			icon: Timer,
			description: 'Set pomodoro timers and countdowns.'
		},
		{ id: 'notes', label: 'Notes', icon: FileText, description: 'Save markdown notes and ideas.' },
		{
			id: 'habits',
			label: 'Habits',
			icon: CheckCircle,
			description: 'Track your daily productivity and habits.'
		}
	] as const;
</script>

<svelte:head>
	<title>Settings | HiNix</title>
</svelte:head>

<div class="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
	<div>
		<h1 class="text-xl font-bold tracking-tight text-[var(--accent)] md:text-3xl">Settings</h1>
		<p class="mt-2 text-[var(--text-muted)]">Manage your HiNix modules and features.</p>
	</div>

	<div class="space-y-6">
		<div
			class="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-sm"
		>
			<h2 class="mb-6 border-b border-[var(--border)] pb-4 text-xl font-semibold">Appearance</h2>
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h3 class="font-medium text-[var(--text-primary)]">Theme</h3>
					<p class="mt-1 text-sm text-[var(--text-muted)]">
						Select your preferred application theme.
					</p>
				</div>
				<div
					class="flex w-full items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1 sm:w-auto"
				>
					{#each ['system', 'light', 'dark'] as theme (theme)}
						<button
							onclick={() =>
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								settingsStore.setTheme(theme as any)}
							class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:flex-none {settingsStore.theme ===
							theme
								? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
								: 'text-[var(--text-secondary)] hover:bg-[var(--background)] hover:text-[var(--text-primary)]'}"
						>
							<span class="capitalize">{theme}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>

		<div
			class="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-sm"
		>
			<h2 class="mb-6 border-b border-[var(--border)] pb-4 text-xl font-semibold">Modules</h2>

			<div class="space-y-6">
				{#each features as feature (feature.id)}
					<div class="flex items-center justify-between gap-4">
						<div class="flex items-start gap-4">
							<div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
								<feature.icon size={20} class="text-[var(--text-primary)]" />
							</div>
							<div>
								<h3 class="font-medium text-[var(--text-primary)]">{feature.label}</h3>
								<p class="mt-1 text-sm text-[var(--text-muted)]">{feature.description}</p>
							</div>
						</div>
						<Switch
							checked={settingsStore.features[feature.id]}
							onCheckedChange={(v) => settingsStore.toggleFeature(feature.id, v)}
						/>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
