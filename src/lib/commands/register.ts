/**
 * Central command registration — called once from +layout.svelte.
 * Keeps business logic out of UI components.
 */
import { registry } from './registry';
import { todoCommand } from '../tools/todo/todo.commands';
import { budgetCommand } from '../tools/budget/budget.commands';
import { scheduleCommand } from '../tools/schedule/schedule.commands';
import { calculatorCommand } from '../tools/calculator/calculator.commands';
import { timerCommand } from '../tools/timer/timer.commands';
import { notesCommand } from '../tools/notes/notes.commands';
import { habitsCommand } from '../tools/habits/habits.commands';
import { settingsCommand } from '../tools/settings/settings.command';
import { clearCommand, dashboardCommand, statisticsCommand, helpCommand, aboutCommand } from '../tools/system/system.commands';

let registered = false;

export function registerAllCommands(): void {
  if (registered) return;
  registered = true;

  registry.register(todoCommand);
  registry.register(budgetCommand);
  registry.register(scheduleCommand);
  registry.register(calculatorCommand);
  registry.register(timerCommand);
  registry.register(notesCommand);
  registry.register(habitsCommand);
  registry.register(clearCommand);
  registry.register(dashboardCommand);
  registry.register(statisticsCommand);
  // registry.register(historyCommand);
  registry.register(helpCommand);
  registry.register(aboutCommand);
  registry.register(settingsCommand);
}
