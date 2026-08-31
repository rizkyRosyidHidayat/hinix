import type { CommandAction, CommandDomain, CommandEntities, CommandExecutor, CommandResult, ParsedCommand } from '../types';
import { TodoService } from '../../tools/todo/todo.service';
import { TodoRepository } from '../../repositories/todo.repository';
import { ScheduleService } from '../../tools/schedule/schedule.service';
import { ScheduleRepository } from '../../repositories/schedule.repository';
import { HabitService } from '../../tools/habits/habit.service';
import { HabitRepository } from '../../repositories/habit.repository';
import { BudgetService } from '../../tools/budget/budget.service';
import { BudgetRepository } from '../../repositories/budget.repository';
import { NotesService } from '../../tools/notes/notes.service';
import { NoteRepository } from '../../repositories/note.repository';

class AppCommandExecutor implements CommandExecutor {
  private todoService: TodoService;
  private scheduleService: ScheduleService;
  private habitService: HabitService;
  private budgetService: BudgetService;
  private notesService: NotesService;

  constructor() {
    const todoRepo = new TodoRepository();
    const scheduleRepo = new ScheduleRepository();
    const habitRepo = new HabitRepository();
    const budgetRepo = new BudgetRepository();
    const noteRepo = new NoteRepository();

    this.todoService = new TodoService(todoRepo, scheduleRepo);
    this.scheduleService = new ScheduleService(scheduleRepo, habitRepo);
    this.habitService = new HabitService(habitRepo);
    this.budgetService = new BudgetService(budgetRepo);
    this.notesService = new NotesService(noteRepo);
  }

  async execute(command: ParsedCommand): Promise<CommandResult> {
    if (command.status !== 'success' || !command.domain || !command.action) {
      throw new Error('Command cannot be executed until it is successfully parsed.');
    }

    const { domain, action, entities } = command;

    switch (domain) {
      case 'todo': return this.executeTodo(action, entities);
      case 'schedule': return this.executeSchedule(action, entities);
      case 'habit': return this.executeHabit(action, entities);
      case 'budget': return this.executeBudget(action, entities);
      case 'note': return this.executeNote(action, entities);
      default: throw new Error(`Unsupported domain: ${domain}`);
    }
  }

  private async executeTodo(action: CommandAction, entities: CommandEntities): Promise<CommandResult> {
    switch (action) {
      case 'create': {
        if (!entities.title) return { type: 'error', output: 'Title required' };
        let deadline: string | undefined;
        if (entities.datetime) deadline = entities.datetime.replace('T', ' ');
        else if (entities.date) deadline = entities.date;
        await this.todoService.create(entities.title, deadline, entities.description);
        return { type: 'success', output: `Todo created successfully` };
      }
      case 'list':
        if (entities.date) await this.todoService.listByDate(entities.date);
        await this.todoService.list();
        return { type: 'success', output: 'Todo list loaded' };
      case 'update': {
        const id = await this.findEntityId('todo', entities.search || entities.title || '');
        if (!id) return { type: 'error', output: 'Todo not found' };
        const deadline = entities.datetime ? entities.datetime.replace('T', ' ') : entities.date;
        await this.todoService.update(id, deadline, entities.description, entities.title);
        return { type: 'success', output: 'Todo updated successfully' };
      }
      case 'delete': {
        const id = await this.findEntityId('todo', entities.search || entities.title || '');
        if (!id) return { type: 'error', output: 'Todo not found' };
        await this.todoService.delete(id);
        return { type: 'success', output: 'Todo deleted successfully' };
      }
    }
  }

  private async executeSchedule(action: CommandAction, entities: CommandEntities): Promise<CommandResult> {
    switch (action) {
      case 'create':
        if (!entities.title) return { type: 'error', output: 'Title required' };
        await this.scheduleService.create(entities.title, entities.date || new Date().toISOString().split('T')[0], entities.time);
        return { type: 'success', output: 'Schedule created successfully' };
      case 'list':
        if (entities.date) await this.scheduleService.listByDate(entities.date);
        else await this.scheduleService.list();
        return { type: 'success', output: 'Schedule list loaded' };
      case 'update': {
        const id = await this.findEntityId('schedule', entities.search || entities.title || '');
        if (!id) return { type: 'error', output: 'Schedule item not found' };
        // Currently ScheduleService does not have an update method besides linkNote/unlinkNote, 
        // so we might just throw or do nothing if update is not fully supported in service yet.
        return { type: 'error', output: 'Update schedule not fully implemented' };
      }
      case 'delete': {
        const id = await this.findEntityId('schedule', entities.search || entities.title || '');
        if (!id) return { type: 'error', output: 'Schedule item not found' };
        await this.scheduleService.delete(id);
        return { type: 'success', output: 'Schedule item deleted successfully' };
      }
    }
  }

  private async executeHabit(action: CommandAction, entities: CommandEntities): Promise<CommandResult> {
    switch (action) {
      case 'create':
        if (!entities.title) return { type: 'error', output: 'Title required' };
        await this.habitService.createHabit(entities.title);
        return { type: 'success', output: 'Habit created successfully' };
      case 'list':
        await this.habitService.listHabits();
        return { type: 'success', output: 'Habit list loaded' };
      case 'update':
      case 'delete': {
        const title = entities.search || entities.title || '';
        if (!title) return { type: 'error', output: 'Habit name required' };
        if (action === 'delete') {
          await this.habitService.removeHabit(title);
          return { type: 'success', output: 'Habit deleted successfully' };
        }
        return { type: 'error', output: 'Update habit not fully implemented' };
      }
    }
  }

  private async executeBudget(action: CommandAction, entities: CommandEntities): Promise<CommandResult> {
    switch (action) {
      case 'create':
        if (!entities.amount) return { type: 'error', output: 'Amount required' };
        await this.budgetService.addExpense(entities.amount, entities.category, entities.description);
        return { type: 'success', output: 'Expense added successfully' };
      case 'list':
        await this.budgetService.list();
        return { type: 'success', output: 'Budget list loaded' };
      case 'update':
      case 'delete':
        return { type: 'error', output: 'Update/Delete budget not supported' };
    }
  }

  private async executeNote(action: CommandAction, entities: CommandEntities): Promise<CommandResult> {
    switch (action) {
      case 'create':
        if (!entities.title) return { type: 'error', output: 'Title required' };
        await this.notesService.create(entities.title, entities.description);
        return { type: 'success', output: 'Note created successfully' };
      case 'list':
        if (entities.search) await this.notesService.search(entities.search);
        else await this.notesService.list();
        return { type: 'success', output: 'Notes loaded' };
      case 'update': {
        const id = await this.findEntityId('note', entities.search || entities.title || '');
        if (!id) return { type: 'error', output: 'Note not found' };
        await this.notesService.update(id, { title: entities.title, content: entities.description });
        return { type: 'success', output: 'Note updated successfully' };
      }
      case 'delete': {
        const id = await this.findEntityId('note', entities.search || entities.title || '');
        if (!id) return { type: 'error', output: 'Note not found' };
        await this.notesService.delete(id);
        return { type: 'success', output: 'Note deleted successfully' };
      }
    }
  }

  private async findEntityId(domain: CommandDomain, query: string): Promise<string | undefined> {
    if (!query) return undefined;
    const lowerQuery = query.toLowerCase();

    switch (domain) {
      case 'todo': {
        const items = await this.todoService.list();
        return items.find(i => i.title.toLowerCase().includes(lowerQuery))?.id;
      }
      case 'schedule': {
        const items = await this.scheduleService.list();
        return items.find(i => i.title.toLowerCase().includes(lowerQuery))?.id;
      }
      case 'note': {
        const items = await this.notesService.list();
        return items.find(i => i.title.toLowerCase().includes(lowerQuery))?.id;
      }
    }
    return undefined;
  }
}

export const executor = new AppCommandExecutor();