<script lang="ts">
	import { Terminal, Command } from '@lucide/svelte';
	import { registry } from '$lib/commands/registry';
	import { Kbd } from '$lib/components/ui/kbd';
	const commands = registry.getAll();
</script>

<svelte:head>
	<title>Help & Guidance | HiNix</title>
</svelte:head>

<div class="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
	<div>
		<h1 class="text-xl font-bold tracking-tight text-[var(--accent)] md:text-3xl">
			Help & Guidance
		</h1>
		<p class="mt-1 text-[var(--text-muted)]">Learn how to navigate and use your personal OS.</p>
	</div>

	<!-- Core Concept -->
	<div>
		<h2 class="mb-4 flex items-center gap-2 text-xl font-semibold text-[var(--text-primary)]">
			<Terminal size={20} class="text-[var(--accent)]" />
			Terminal-First Experience
		</h2>
		<p class="mb-4 leading-relaxed text-[var(--text-secondary)]">
			HiNix is designed around a terminal-first workflow. While you can use the graphical interfaces
			for various tools, the fastest way to interact with the system is through the Command Palette
			located at the bottom of the screen.
		</p>
		<div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
			<p class="mb-3 text-sm font-medium text-[var(--text-primary)]">Keyboard Shortcuts:</p>
			<ul class="space-y-3 text-sm text-[var(--text-muted)]">
				<li class="flex items-center gap-3">
					<Kbd>Ctrl</Kbd>
					+
					<Kbd>K</Kbd>
					<span>Focus the command bar from anywhere</span>
				</li>
				<li class="flex items-center gap-3">
					<Kbd>Esc</Kbd>
					<span>Clear the current command or blur the input</span>
				</li>
				<li class="flex items-center gap-3">
					<Kbd>↑</Kbd>
					/
					<Kbd>↓</Kbd>
					<span>Navigate command history and autocomplete suggestions</span>
				</li>
			</ul>
		</div>

		<div class="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
			<p class="mb-2 text-sm font-medium text-[var(--text-primary)]">
				Command Contexts (Namespaces)
			</p>
			<p class="mb-3 text-sm leading-relaxed text-[var(--text-muted)]">
				Many commands group related actions into a single <strong>namespace</strong>. When you run a
				command like
				<code
					class="rounded bg-[var(--surface-elevated)] px-1 font-mono text-xs text-[var(--accent)]"
					>todo</code
				> without any arguments, you will "enter" the todo context.
			</p>
			<ul class="space-y-3 text-sm text-[var(--text-muted)]">
				<li class="flex items-center gap-3">
					<span class="mt-0.5 inline-flex size-1.5 shrink-0 rounded-full bg-[var(--accent)]"></span>
					<div>
						<span class="font-medium text-[var(--text-primary)]">Entering Context:</span> Typing
						<code class="font-mono text-[var(--accent)]">todo</code>
						enters the namespace. Now, instead of typing
						<code class="font-mono text-[var(--accent)]">todo add "Buy milk"</code>, you can simply
						type <code class="font-mono text-[var(--accent)]">add "Buy milk"</code>.
					</div>
				</li>
				<li class="flex items-center gap-3">
					<span class="mt-0.5 inline-flex size-1.5 shrink-0 rounded-full bg-[var(--error)]"></span>
					<div>
						<span class="font-medium text-[var(--text-primary)]">Exiting Context:</span> To leave an
						active context and return to the main system view, type
						<code class="font-mono text-[var(--error)]">exit</code> and press Enter.
					</div>
				</li>
			</ul>
		</div>
	</div>

	<!-- Available Commands -->
	<div>
		<h2 class="mb-6 flex items-center gap-2 text-xl font-semibold text-[var(--text-primary)]">
			<Command size={20} class="text-[var(--accent)]" />
			Available Commands
		</h2>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-1">
			{#each commands as cmd (cmd.name)}
				<div
					id={cmd.name}
					class="scroll-mt-16 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--accent)]/30"
				>
					<div class="mb-2 flex items-center gap-2">
						<span class="font-mono font-bold text-[var(--accent)]">{cmd.name}</span>
						{#if cmd.aliases?.length}
							<span class="text-xs text-[var(--text-muted)]">Alias:</span>
							<span class="text-xs text-[var(--text-muted)]">({cmd.aliases.join(', ')})</span>
						{/if}
					</div>
					<p class="mb-3 text-sm text-[var(--text-secondary)]">{cmd.description}</p>

					{#if cmd.subcommands && cmd.subcommands.length > 0}
						<div class="divide-y divide-[var(--border)] font-mono text-xs text-[var(--text-muted)]">
							{#each cmd.subcommands as sub (sub.name)}
								<div class="py-3">
									<div class="flex items-center justify-between gap-4">
										<p><span class="opacity-50">$nix</span> {cmd.name} {sub.usage}</p>
										<p>{sub.description}</p>
									</div>
									{#if sub.flags && sub.flags.length > 0}
										<div class="mt-3 text-[10px] text-[var(--text-muted)]">
											<p class="mb-1 font-semibold">Flags:</p>
											<ul class="flex flex-col gap-1.5 pl-4">
												{#each sub.flags as flag (flag.name)}
													<li class="flex items-center justify-between gap-4">
														<span class="min-w-max font-medium">{flag.usage}</span>
														<span>{flag.description}</span>
													</li>
												{/each}
											</ul>
										</div>
									{/if}
									{#if sub.example}
										<div class="mt-2 text-[10px] text-[var(--text-muted)]">
											<p class="mb-1 font-semibold">Example:</p>
											<span class="opacity-50">$nix</span>
											{cmd.name}
											{sub.example}
										</div>
									{/if}
									{#if sub.flags && sub.flags.length > 0}
										<div class="mt-2 text-[10px] text-[var(--text-muted)]">
											<ul class="flex flex-col gap-1.5">
												{#each sub.flags as flag (flag.name)}
													<li>
														<span class="opacity-50">$nix</span>
														{sub.example}
														{flag.example}
													</li>
												{/each}
											</ul>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{:else if cmd.usage}
						<div class="font-mono text-xs text-[var(--text-muted)]">
							<span class="opacity-50">$nix</span>
							{cmd.usage}
						</div>
						{#if cmd.example}
							<div class="mt-1 pl-4 text-[10px] text-[var(--text-muted)] opacity-70">
								Example: <span class="opacity-50">$nix</span>
								{cmd.example}
							</div>
						{/if}
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>
