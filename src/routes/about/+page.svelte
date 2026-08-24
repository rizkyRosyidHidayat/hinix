<script lang="ts">
	import { Info, Settings, HeartHandshake, Shield, Coffee } from '@lucide/svelte';
	import Title from '$lib/components/shell/Title.svelte';
</script>

<Title title="About" />

<div class="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
	<div>
		<h1 class="text-xl font-bold tracking-tight text-[var(--accent)] md:text-3xl">About</h1>
		<p class="mt-1 text-[var(--text-muted)]">
			Discover more about HiNix, its core system, and how you can support the project.
		</p>
	</div>

	<!-- Detail Section -->
	<div>
		<h2 class="mb-4 flex items-center gap-2 text-xl font-semibold text-[var(--text-primary)]">
			<Info size={20} class="text-[var(--accent)]" />
			Detail
		</h2>
		<div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
			<p class="mb-4 leading-relaxed text-[var(--text-secondary)]">
				HiNix is a terminal-first personal operating system designed to streamline your daily tasks,
				from managing your budget to tracking your habits, directly through an intuitive
				command-line interface paired with a beautiful graphical interface.
			</p>
			<div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
				<div class="flex flex-col gap-1">
					<span class="font-medium text-[var(--text-muted)]">Author</span>
					<span class="text-[var(--text-primary)]">ocid</span>
				</div>
				<div class="flex flex-col gap-1">
					<span class="font-medium text-[var(--text-muted)]">Contact</span>
					<span class="text-[var(--text-primary)]">ocid.271198@gmail.com</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Legal & Privacy Section -->
	<div>
		<h2 class="mb-4 flex items-center gap-2 text-xl font-semibold text-[var(--text-primary)]">
			<Shield size={20} class="text-[var(--accent)]" />
			Legal & Privacy
		</h2>
		<div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
			<p class="leading-relaxed text-[var(--text-secondary)]">
				We believe in transparency and respecting your privacy. Please read our
				<a
					href="https://github.com/rizkyRosyidHidayat/hinix/blob/main/LICENSE.md"
					target="_blank"
					rel="noreferrer"
					class="font-medium text-[var(--accent)] hover:underline">License</a
				>
				to understand your rights. HiNix
				<strong>does not collect or store any of your personal data</strong>. All your data is saved
				securely in your local browser and/or synced directly to your own Google account via Google
				Sheets.
			</p>
		</div>
	</div>

	<!-- Description System Section -->
	<div>
		<h2 class="mb-4 flex items-center gap-2 text-xl font-semibold text-[var(--text-primary)]">
			<Settings size={20} class="text-[var(--accent)]" />
			System Architecture
		</h2>
		<div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
			<p class="mb-4 leading-relaxed text-[var(--text-secondary)]">
				Under the hood, HiNix leverages a modern tech stack designed for speed, flexibility, and
				offline-first capabilities. The system operates on a command registry pattern, where every
				action is a first-class command, enabling seamless integration between the graphical UI and
				the terminal interface.
			</p>
			<ul class="space-y-4 text-sm text-[var(--text-muted)]">
				<li class="flex items-start gap-3">
					<span class="mt-1.5 inline-flex size-1.5 shrink-0 rounded-full bg-[var(--accent)]"></span>
					<div>
						<span class="block font-medium text-[var(--text-primary)]">SvelteKit Core:</span>
						Provides a robust and highly performant foundation for reactive user interfaces and seamless
						routing.
					</div>
				</li>
				<li class="flex items-start gap-3">
					<span class="mt-1.5 inline-flex size-1.5 shrink-0 rounded-full bg-[var(--accent)]"></span>
					<div>
						<span class="block font-medium text-[var(--text-primary)]">Local-First Storage:</span>
						All your data is stored locally in your browser using IndexedDB via Dexie.js, ensuring lightning-fast
						access and complete privacy.
					</div>
				</li>
				<li class="flex items-start gap-3">
					<span class="mt-1.5 inline-flex size-1.5 shrink-0 rounded-full bg-[var(--accent)]"></span>
					<div>
						<span class="block font-medium text-[var(--text-primary)]">Command Registry:</span>
						A centralized extensible architecture that allows commands to be easily added, discovered,
						and executed with full context awareness.
					</div>
				</li>
				<li class="flex items-start gap-3">
					<span class="mt-1.5 inline-flex size-1.5 shrink-0 rounded-full bg-[var(--accent)]"></span>
					<div>
						<span class="block font-medium text-[var(--text-primary)]">Google Sheets Sync:</span>
						An optional background synchronization mechanism to keep your local data backed up securely
						to your own Google Drive.
					</div>
				</li>
			</ul>
		</div>
	</div>

	<!-- Support Us Section -->
	<div>
		<h2 class="mb-4 flex items-center gap-2 text-xl font-semibold text-[var(--text-primary)]">
			<HeartHandshake size={20} class="text-[var(--accent)]" />
			Support Us
		</h2>
		<div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
			<p class="mb-6 leading-relaxed text-[var(--text-secondary)]">
				HiNix is an open-source project built with passion. If you find this tool helpful in
				organizing your daily life, there are several ways you can support its continued
				development!
			</p>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<a
					href="https://github.com/rizkyRosyidHidayat/hinix"
					target="_blank"
					rel="noreferrer"
					class="flex flex-col items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-4 text-center transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)]/5"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="currentColor"
					>
						<path
							d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
						/>
					</svg>
					<div>
						<span class="block font-medium text-[var(--text-primary)]">Star on GitHub</span>
						<span class="text-xs text-[var(--text-muted)]">Show your support with a star</span>
					</div>
				</a>

				<a
					href="https://x.com"
					target="_blank"
					rel="noreferrer"
					class="flex flex-col items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-4 text-center transition-colors hover:border-[#1DA1F2] hover:bg-[#1DA1F2]/5"
				>
					<svg xmlns="http://w3.org" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
						/>
					</svg>

					<div>
						<span class="block font-medium text-[var(--text-primary)]">Share on X</span>
						<span class="text-xs text-[var(--text-muted)]">Tell your friends about HiNix</span>
					</div>
				</a>

				<a
					href="https://ko-fi.com/M2Y525H15R"
					target="_blank"
					rel="noreferrer"
					class="flex flex-col items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-4 text-center transition-colors hover:border-[#FF5E5B] hover:bg-[#FF5E5B]/5"
				>
					<Coffee size={24} class="text-[#FF5E5B]" />
					<div>
						<span class="block font-medium text-[var(--text-primary)]">Support Us</span>
						<span class="text-xs text-[var(--text-muted)]">Help support our work</span>
					</div>
				</a>
			</div>

			<div class="mt-6 flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
				<span>Made with</span>
				<HeartHandshake size={14} class="text-red-500" />
				<span>for the community.</span>
			</div>
		</div>
	</div>
</div>
