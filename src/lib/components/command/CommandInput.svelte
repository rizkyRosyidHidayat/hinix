<script lang="ts">
  import { shellStore } from '../../stores/shell.svelte';
  import { executeCommand } from '../../commands/executor';
  import { goto } from '$app/navigation';
  import { TodoRepository } from '../../repositories/todo.repository';
  import { BudgetRepository } from '../../repositories/budget.repository';
  import { ScheduleRepository } from '../../repositories/schedule.repository';
  import { registry } from '../../commands/registry';
  import { todoCommand } from '../../tools/todo/todo.commands';
  import { budgetCommand } from '../../tools/budget/budget.commands';
  import { scheduleCommand } from '../../tools/schedule/schedule.commands';
  import { calculatorCommand } from '../../tools/calculator/calculator.commands';
  import { timerCommand } from '../../tools/timer/timer.commands';
  import { clearCommand, dashboardCommand, historyCommand } from '../../commands/system.commands';
  import type { CommandContext } from '../../commands/types';

  // Register commands on mount if they haven't been
  if (registry.getAll().length === 0) {
    registry.register(todoCommand);
    registry.register(budgetCommand);
    registry.register(scheduleCommand);
    registry.register(calculatorCommand);
    registry.register(timerCommand);
    registry.register(clearCommand);
    registry.register(dashboardCommand);
    registry.register(historyCommand);
  }

  let inputElement: HTMLInputElement;

  async function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      if (!shellStore.input.trim()) return;
      
      const cmd = shellStore.input.trim();
      
      const context: CommandContext = {
        navigate: (path: string) => {
          goto(path);
        },
        repositories: {
          todo: new TodoRepository(),
          budget: new BudgetRepository(),
          schedule: new ScheduleRepository()
        }
      };

      const result = await executeCommand(cmd, context);
      
      if (result.type === 'clear') {
        shellStore.closeOutput();
      } else if (result.type === 'navigate') {
        // Special case: just navigate, clear input, don't necessarily log navigation
        context.navigate(result.path);
        shellStore.addOutput(cmd, result); // Optional: you can choose not to log navigation to output
      } else {
        shellStore.addOutput(cmd, result);
      }
      
      shellStore.input = '';
      
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (shellStore.history.length > 0) {
        if (shellStore.historyIndex < shellStore.history.length - 1) {
          shellStore.historyIndex++;
          shellStore.input = shellStore.history[shellStore.historyIndex];
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (shellStore.historyIndex > 0) {
        shellStore.historyIndex--;
        shellStore.input = shellStore.history[shellStore.historyIndex];
      } else if (shellStore.historyIndex === 0) {
        shellStore.historyIndex = -1;
        shellStore.input = '';
      }
    } else if (e.key === 'Escape') {
      shellStore.input = '';
    }
  }
</script>

<input
  bind:this={inputElement}
  bind:value={shellStore.input}
  onkeydown={handleKeydown}
  type="text"
  class="w-full bg-transparent border-none outline-none text-[var(--text-primary)] font-mono text-sm placeholder:text-[var(--text-muted)] focus:ring-0"
  placeholder="Type a command or 'help' (Ctrl+K for palette)"
  autocomplete="off"
  spellcheck="false"
  autofocus
/>
