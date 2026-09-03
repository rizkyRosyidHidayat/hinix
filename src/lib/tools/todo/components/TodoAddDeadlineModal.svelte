<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { X } from '@lucide/svelte';
	import Kbd from '$lib/components/ui/kbd/kbd.svelte';

	let { isOpen, onClose, onSubmit, initialDeadline } = $props<{
		isOpen: boolean;
		onClose: () => void;
		onSubmit: (deadline: string) => void;
		initialDeadline?: string;
	}>();

	let dd = $state('');
	let mm = $state('');
	let yyyy = $state('');
	let hh = $state('');
	let mmin = $state('');
	let dateInput = $state<HTMLInputElement>();

	let isValidDate = $derived(dd.length >= 1 && mm.length >= 1 && yyyy.length === 4);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isOpen) {
			onClose();
		}
		if (e.key === 'Enter' && isOpen && isValidDate) {
			e.preventDefault();
			handleSubmit();
		}
	}

	function handleSubmit() {
		if (isValidDate) {
			const dateStr = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
			// default to end of the day
			let timeStr = '';
			if (hh && mmin) {
				timeStr = `${hh.padStart(2, '0')}:${mmin.padStart(2, '0')}`;
			}
			const deadline = `${dateStr} ${timeStr}`;
			onSubmit(deadline);
			dd = '';
			mm = '';
			yyyy = '';
			hh = '';
			mmin = '';
		}
	}

	$effect(() => {
		if (isOpen) {
			if (initialDeadline) {
				const [date, time] = initialDeadline.includes(' ')
					? initialDeadline.split(' ')
					: [initialDeadline, ''];
				const [y, m, d] = date.split('-');
				yyyy = y || '';
				mm = m || '';
				dd = d || '';
				if (time) {
					const [h, mi] = time.split(':');
					hh = h || '';
					mmin = mi || '';
				} else {
					hh = '';
					mmin = '';
				}
			} else {
				dd = new Date().getDate().toString();
				mm = (new Date().getMonth() + 1).toString();
				yyyy = new Date().getFullYear().toString();
				hh = '18';
				mmin = '00';
			}
			if (dateInput) {
				dateInput.focus();
			}
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[15vh] backdrop-blur-sm"
		onclick={onClose}
		transition:fade={{ duration: 150 }}
	>
		<div
			class="w-full max-w-sm overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
			onclick={(e) => e.stopPropagation()}
			transition:slide={{ duration: 200, axis: 'y' }}
		>
			<div class="flex items-center gap-1 border-b border-[var(--border)] px-4 py-3">
				<h2 class="flex-1 items-center gap-2 font-bold text-[var(--text-primary)]">Set Deadline</h2>
				<Kbd>Esc</Kbd>
				<button
					class="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
					onclick={onClose}
					aria-label="Close"
				>
					<X size={18} />
				</button>
			</div>

			<div class="px-4 py-6">
				<div class="flex flex-col gap-6">
					<div class="flex flex-col gap-2">
						<span class="text-sm font-medium text-[var(--text-primary)]">Date (DD / MM / YYYY)</span
						>
						<div class="flex items-center gap-2">
							<input
								bind:this={dateInput}
								type="text"
								inputmode="numeric"
								placeholder="DD"
								maxlength="2"
								bind:value={dd}
								oninput={() => {
									dd = dd.replace(/\D/g, '');
									if (parseInt(dd) > 31) dd = '31';
								}}
								class="w-16 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-center text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]/40"
							/>
							<span class="text-[var(--text-muted)]">/</span>
							<input
								type="text"
								inputmode="numeric"
								placeholder="MM"
								maxlength="2"
								bind:value={mm}
								oninput={() => {
									mm = mm.replace(/\D/g, '');
									if (parseInt(mm) > 12) mm = '12';
								}}
								class="w-16 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-center text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]/40"
							/>
							<span class="text-[var(--text-muted)]">/</span>
							<input
								type="text"
								inputmode="numeric"
								placeholder="YYYY"
								maxlength="4"
								bind:value={yyyy}
								oninput={() => (yyyy = yyyy.replace(/\D/g, ''))}
								class="w-20 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-center text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]/40"
							/>
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<span class="text-sm font-medium text-[var(--text-primary)]">Time (Optional, 24h)</span>
						<div class="flex items-center gap-2">
							<input
								type="text"
								inputmode="numeric"
								placeholder="HH"
								maxlength="2"
								bind:value={hh}
								oninput={() => {
									hh = hh.replace(/\D/g, '');
									if (parseInt(hh) > 23) hh = '23';
								}}
								class="w-16 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-center text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]/40"
							/>
							<span class="text-[var(--text-muted)]">:</span>
							<input
								type="text"
								inputmode="numeric"
								placeholder="MM"
								maxlength="2"
								bind:value={mmin}
								oninput={() => {
									mmin = mmin.replace(/\D/g, '');
									if (parseInt(mmin) > 59) mmin = '59';
								}}
								class="w-16 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-center text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]/40"
							/>
						</div>
					</div>
				</div>
			</div>

			<div
				class="flex items-center justify-end gap-3 border-t border-[var(--border)] px-4 py-3 text-xs text-[var(--text-muted)]"
			>
				<Kbd>Enter</Kbd>
				<button
					onclick={handleSubmit}
					disabled={!isValidDate}
					class="cursor-pointer rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
				>
					Set Deadline
				</button>
			</div>
		</div>
	</div>
{/if}
