<script lang="ts">
  import { onMount } from 'svelte';
  import { TodoRepository } from '$lib/repositories/todo.repository';
  import { TodoService } from '$lib/tools/todo/todo.service';
  import type { Todo } from '$lib/types/todo';
  import { CheckCircle, Circle, Trash2, Plus } from 'lucide-svelte';
  
  let todos = $state<Todo[]>([]);
  let service: TodoService;
  let newTaskTitle = $state('');

  onMount(async () => {
    service = new TodoService(new TodoRepository());
    await loadTodos();
  });

  async function loadTodos() {
    todos = await service.list();
  }

  async function handleAdd() {
    if (!newTaskTitle.trim()) return;
    await service.create(newTaskTitle.trim());
    newTaskTitle = '';
    await loadTodos();
  }

  async function handleToggle(id: string, currentlyCompleted: boolean) {
    if (currentlyCompleted) return; // For now, only one-way complete
    await service.complete(id);
    await loadTodos();
  }

  async function handleDelete(id: string) {
    await service.delete(id);
    await loadTodos();
  }
</script>

<svelte:head>
  <title>Todo | HiNix</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
  <header>
    <h1 class="text-3xl font-bold tracking-tight text-[var(--accent)]">Todo</h1>
    <p class="text-[var(--text-muted)] mt-1 font-mono text-sm">todo [add &lt;title&gt; | list | done &lt;id&gt; | delete &lt;id&gt;]</p>
  </header>

  <!-- Add Task Form -->
  <form onsubmit={(e) => { e.preventDefault(); handleAdd(); }} class="flex gap-2">
    <input
      type="text"
      bind:value={newTaskTitle}
      placeholder="What needs to be done?"
      class="flex-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-4 py-3 text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
    />
    <button
      type="submit"
      disabled={!newTaskTitle.trim()}
      class="bg-[var(--accent)] text-[var(--background)] px-4 py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center gap-2"
    >
      <Plus size={20} />
      Add
    </button>
  </form>

  <!-- Todo List -->
  <div class="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
    {#if todos.length === 0}
      <div class="p-8 text-center text-[var(--text-muted)]">
        No tasks yet. Add one above or type <code class="font-mono bg-[var(--surface)] px-1.5 py-0.5 rounded">todo add "My task"</code>
      </div>
    {:else}
      <ul class="divide-y divide-[var(--border)]">
        {#each todos as todo (todo.id)}
          <li class="flex items-center gap-4 p-4 hover:bg-[var(--surface)] transition-colors group">
            <button
              onclick={() => handleToggle(todo.id, todo.completed)}
              class="shrink-0 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] rounded-full"
            >
              {#if todo.completed}
                <CheckCircle size={24} class="text-[var(--success)]" />
              {:else}
                <Circle size={24} class="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
              {/if}
            </button>
            
            <div class="flex-1 flex flex-col min-w-0">
              <span class="text-[var(--text-primary)] truncate {todo.completed ? 'line-through opacity-50' : ''}">
                {todo.title}
              </span>
              <span class="text-xs text-[var(--text-muted)] font-mono">
                ID: {todo.id.substring(0, 8)}
              </span>
            </div>

            <button
              onclick={() => handleDelete(todo.id)}
              class="text-[var(--text-muted)] hover:text-[var(--error)] transition-colors p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--error)] opacity-0 group-hover:opacity-100"
              aria-label="Delete task"
            >
              <Trash2 size={18} />
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
