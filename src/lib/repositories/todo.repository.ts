import type { Todo } from '../types/todo';
import { db } from '../db/database';
import { dbState } from '../stores/db.svelte';
import { syncService } from '../sync/sync.service';

export class TodoRepository {
  async create(todo: Todo): Promise<Todo> {
    await db.todos.add(todo);
    dbState.notify('todos');
    syncService.pushRow('todos', todo);
    return todo;
  }

  async list(): Promise<Todo[]> {
    return db.todos.orderBy('createdAt').reverse().toArray();
  }

  async listByDate(date: string): Promise<Todo[]> {
    return db.todos.where('createdAt').equals(date).toArray();
  }

  async getById(id: string): Promise<Todo | undefined> {
    return db.todos.get(id);
  }

  async update(id: string, changes: Partial<Todo>): Promise<Todo> {
    await db.todos.update(id, changes);
    dbState.notify('todos');
    const updated = await this.getById(id);
    if (!updated) throw new Error('Todo not found');
    syncService.pushRow('todos', updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.todos.delete(id);
    dbState.notify('todos');
    syncService.deleteRow('todos', id);
  }
}
