<script lang="ts">
  import { onMount } from 'svelte';
  import { ScheduleRepository } from '$lib/repositories/schedule.repository';
  import { ScheduleService } from '$lib/tools/schedule/schedule.service';
  import type { ScheduleItem } from '$lib/types/schedule';
  import { Plus, Trash2, Calendar, Clock } from 'lucide-svelte';
  import { dbState } from '$lib/stores/db.svelte';
  
  let items = $state<ScheduleItem[]>([]);
  let service = new ScheduleService(new ScheduleRepository());
  
  let selectedDate = $state(new Date().toISOString().split('T')[0]);
  let newTitle = $state('');
  let newTime = $state('');

  async function loadData() {
    items = await service.listByDate(selectedDate);
  }

  // Reactive statement to reload data when selectedDate or dbState changes
  $effect(() => {
    const _ = dbState.schedules;
    if (selectedDate && service) {
      loadData();
    }
  });

  async function handleAdd() {
    if (!newTitle.trim() || !selectedDate) return;
    await service.create(newTitle.trim(), selectedDate, newTime || undefined);
    newTitle = '';
    newTime = '';
    await loadData();
  }

  async function handleDelete(id: string) {
    await service.delete(id);
    await loadData();
  }
</script>

<svelte:head>
  <title>Schedule | HiNix</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
  <header>
    <h1 class="text-3xl font-bold tracking-tight text-[var(--accent)]">Schedule</h1>
    <p class="text-[var(--text-muted)] mt-1 font-mono text-sm">schedule [add &lt;date&gt; &lt;time&gt; &lt;title&gt; | list &lt;date&gt; | delete &lt;id&gt;]</p>
  </header>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <!-- Left Column: Calendar/Date Picker -->
    <div class="lg:col-span-1 space-y-6">
      <div class="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-5 shadow-sm">
        <label for="date-picker" class="block text-sm font-medium text-[var(--text-secondary)] mb-2">Select Date</label>
        <input 
          id="date-picker"
          type="date" 
          bind:value={selectedDate}
          class="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-3 text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </div>

      <div class="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-5 shadow-sm space-y-4">
        <h3 class="font-semibold border-b border-[var(--border)] pb-2">Add Event</h3>
        <form onsubmit={(e) => { e.preventDefault(); handleAdd(); }} class="space-y-4">
          <div>
            <label for="time" class="block text-xs text-[var(--text-muted)] mb-1">Time (Optional)</label>
            <input 
              id="time"
              type="time" 
              bind:value={newTime}
              class="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label for="title" class="block text-xs text-[var(--text-muted)] mb-1">Event Title</label>
            <input 
              id="title"
              type="text" 
              bind:value={newTitle}
              placeholder="e.g. Project Meeting"
              class="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
              required
            />
          </div>
          <button
            type="submit"
            disabled={!newTitle.trim()}
            class="w-full bg-[var(--accent)] text-[var(--background)] px-4 py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add Event
          </button>
        </form>
      </div>
    </div>

    <!-- Right Column: Events List -->
    <div class="lg:col-span-2">
      <div class="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm h-full min-h-[400px] flex flex-col">
        <div class="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
          <h2 class="font-semibold flex items-center gap-2">
            <Calendar size={18} class="text-[var(--accent)]" />
            Events for {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </h2>
          <div class="text-xs bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-1 rounded-full font-medium">
            {items.length} {items.length === 1 ? 'event' : 'events'}
          </div>
        </div>
        
        <div class="flex-1 overflow-y-auto">
          {#if items.length === 0}
            <div class="h-full flex flex-col items-center justify-center p-8 text-center text-[var(--text-muted)]">
              <Calendar size={48} class="mb-4 opacity-20" />
              <p>No events scheduled for this day.</p>
            </div>
          {:else}
            <ul class="divide-y divide-[var(--border)]">
              {#each items.sort((a, b) => (a.time || '24:00').localeCompare(b.time || '24:00')) as item (item.id)}
                <li class="flex items-center gap-4 p-5 hover:bg-[var(--surface)] transition-colors group">
                  <div class="shrink-0 w-16 text-center">
                    {#if item.time}
                      <div class="font-mono font-bold text-lg text-[var(--text-primary)]">{item.time}</div>
                    {:else}
                      <div class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">All Day</div>
                    {/if}
                  </div>
                  
                  <div class="w-1 h-12 rounded-full {item.time ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}"></div>
                  
                  <div class="flex-1 min-w-0">
                    <h3 class="text-lg font-medium text-[var(--text-primary)] truncate">{item.title}</h3>
                  </div>

                  <button
                    onclick={() => handleDelete(item.id)}
                    class="text-[var(--text-muted)] hover:text-[var(--error)] transition-colors p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--error)] opacity-0 group-hover:opacity-100"
                    aria-label="Delete event"
                  >
                    <Trash2 size={20} />
                  </button>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
