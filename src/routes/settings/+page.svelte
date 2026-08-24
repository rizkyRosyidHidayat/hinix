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
		CheckCircle,
		InfoIcon
	} from '@lucide/svelte';
	import Title from '$lib/components/shell/Title.svelte';
	import { syncStore } from '$lib/stores/sync.svelte';
	import { syncService } from '$lib/sync/sync.service';
	import { APPS_SCRIPT_TEMPLATE } from '$lib/sync/google-apps-script';
	import {
		Cloud,
		Check,
		Copy,
		RefreshCw,
		UploadCloud,
		AlertTriangle,
		DownloadCloud
	} from '@lucide/svelte';
	import { ContextService } from '$lib/context/context.service';
	import type { HiNixContext } from '$lib/context/context.types';
	import { dbState } from '$lib/stores/db.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	let copyStatus = $state('');
	let tempUrl = $derived('');
	let service = new ContextService();
	let ctx = $state<HiNixContext>(service.initContext);

	// Check if all data is empty
	const isAllEmpty = $derived(
		ctx.today.tasks === 0 &&
			ctx.today.completedTasks === 0 &&
			ctx.today.events === 0 &&
			ctx.today.expenses === 0 &&
			ctx.finance.income === 0 &&
			ctx.finance.expenses === 0 &&
			(!ctx.habits || ctx.habits.total === 0) &&
			ctx.recent.pinnedNotes.length === 0 &&
			ctx.upcoming.schedules &&
			ctx.upcoming.todos.length === 0
	);

	$effect(() => {
		tempUrl = syncStore.scriptUrl;

		dbState.subscribe('todos');
		dbState.subscribe('budget');
		dbState.subscribe('schedules');
		dbState.subscribe('notes');
		dbState.subscribe('habits');
		dbState.subscribe('settings');

		service.getDashboardContext().then((res) => {
			ctx = res;
		});
	});

	function copyScript() {
		navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
		copyStatus = 'Copied!';
		setTimeout(() => (copyStatus = ''), 2000);
	}

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

<Title title="Settings" />

<div class="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
	<div>
		<h1 class="text-xl font-bold tracking-tight text-[var(--accent)] md:text-3xl">Settings</h1>
		<p class="mt-2 text-[var(--text-muted)]">Manage your HiNix modules and features.</p>
	</div>

	<div class="space-y-6">
		<div class="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
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
								? 'bg-[var(--accent)] text-[var(--background)]'
								: 'text-[var(--text-secondary)] hover:bg-[var(--background)] hover:text-[var(--text-primary)]'}"
						>
							<span class="capitalize">{theme}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>

		<div class="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
			<div class="mb-6 flex items-center justify-between border-b border-[var(--border)] pb-4">
				<h2 class="text-xl font-semibold">Google Sheets Sync</h2>
				<div
					class="flex items-center gap-2 text-sm {syncStore.enabled
						? 'text-green-500'
						: 'text-[var(--text-muted)]'}"
				>
					<Cloud size={16} />
					{syncStore.enabled ? 'Connected' : 'Disconnected'}
				</div>
			</div>

			<div class="space-y-6">
				{#if syncStore.enabled}
					<div
						class="flex items-start gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-sm text-amber-600 dark:border-amber-500/30 dark:text-amber-400"
					>
						<AlertTriangle size={18} class="mt-0.5 shrink-0" />
						<p>
							<strong>Warning:</strong> Do not modify the data directly in the Google Sheet. Doing so
							can cause data conflicts and syncing errors. The sheet is solely intended as a cloud save
							mechanism.
						</p>
					</div>
				{/if}
				<div class="space-y-2">
					<label for="script" class="font-medium text-[var(--text-primary)]">Apps Script URL</label>
					<div class="flex gap-2">
						<input
							id="script"
							type="text"
							bind:value={tempUrl}
							placeholder="https://script.google.com/macros/s/.../exec"
							class="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
						/>
						<button
							onclick={() => {
								if (tempUrl) {
									syncStore.setScriptUrl(tempUrl);
									syncStore.setEnabled(true);
								} else {
									syncStore.setScriptUrl('');
									syncStore.setEnabled(false);
								}
							}}
							class="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-90"
						>
							Save
						</button>
					</div>
					<p class="text-xs text-[var(--text-muted)]">
						Deploy the script below to your Google Sheet and paste the Web App URL here.
					</p>
				</div>

				{#if syncStore.enabled}
					<div class="flex flex-wrap gap-3 pt-2">
						<button
							onclick={() => syncService.pushAllTables()}
							class="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--background)]"
							disabled={syncStore.status === 'syncing'}
						>
							<UploadCloud size={16} />
							Push to Sheet
						</button>
						<button
							onclick={() => syncService.pullAllTables()}
							class="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--background)] disabled:opacity-50"
							disabled={syncStore.status === 'syncing' || !isAllEmpty}
						>
							<DownloadCloud size={16} />
							Pull from Sheet
						</button>
						<Tooltip.Root>
							<Tooltip.Trigger
								><InfoIcon size={16} class="text-[var(--text-muted)]" /></Tooltip.Trigger
							>
							<Tooltip.Content>
								<p>Pull is enabled if all data is empty.</p>
							</Tooltip.Content>
						</Tooltip.Root>
						<div class="ml-auto flex items-center text-xs text-[var(--text-muted)]">
							{#if syncStore.status === 'syncing'}
								<RefreshCw size={12} class="mr-1 animate-spin" /> Syncing...
							{:else if syncStore.lastSyncAt}
								Last sync: {new Date(syncStore.lastSyncAt).toLocaleString()}
							{/if}
						</div>
					</div>
				{/if}

				<div
					class="mt-8 space-y-4 rounded-lg border border-[var(--border)] bg-[var(--background)] p-4"
				>
					<div class="flex items-center justify-between">
						<h3 class="font-medium text-[var(--text-primary)]">Setup Instructions</h3>
					</div>
					<ol class="list-inside list-decimal space-y-2 text-sm text-[var(--text-muted)]">
						<li>Create a new Google Sheet</li>
						<li>Go to <strong>Extensions &gt; Apps Script</strong></li>
						<li>Delete the existing code and paste the code below</li>
						<li>Click <strong>Deploy &gt; New deployment</strong></li>
						<li>Select type: <strong>Web App</strong></li>
						<li>Execute as: <strong>Me</strong>, Who has access: <strong>Anyone</strong></li>
						<li>Click Deploy (and authorize), then copy the resulting URL above</li>
					</ol>

					<div
						class="relative mt-4 overflow-hidden rounded-md bg-[#1e1e1e] p-4 font-mono text-xs text-[#d4d4d4]"
					>
						<button
							onclick={copyScript}
							class="absolute top-2 right-2 flex items-center gap-1 rounded bg-[#2d2d2d] px-2 py-1 text-[#d4d4d4] transition-colors hover:bg-[#3d3d3d]"
						>
							{#if copyStatus}
								<Check size={14} /> {copyStatus}
							{:else}
								<Copy size={14} /> Copy
							{/if}
						</button>
						<pre class="max-h-48 overflow-x-auto whitespace-pre-wrap">{APPS_SCRIPT_TEMPLATE}</pre>
					</div>
				</div>
			</div>
		</div>

		<div class="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
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
