import type { Todo } from '../types/todo';
import { db } from '../db/database';

export class TodoRepository {
  async create(todo: Todo): Promise<Todo> {
    await db.todos.add(todo);
    return todo;
  }

  async list(): Promise<Todo[]> {
    return db.todos.orderBy('createdAt').reverse().toArray();
  }

  async getById(id: string): Promise<Todo | undefined> {
    return db.todos.get(id);
  }

  async update(id: string, changes: Partial<Todo>): Promise<Todo> {
    await db.todos.update(id, changes);
    const updated = await this.getById(id);
    if (!updated) throw new Error('Todo not found');
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.todos.delete(id);
  }
}
