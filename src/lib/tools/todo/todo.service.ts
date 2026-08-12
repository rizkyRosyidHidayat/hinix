import type { Todo } from '../../types/todo';
import type { TodoRepository } from '../../repositories/todo.repository';

export class TodoService {
  constructor(private repository: TodoRepository) {}

  async create(title: string): Promise<Todo> {
    const todo: Todo = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      createdAt: new Date().toISOString()
    };
    return await this.repository.create(todo);
  }

  async list(): Promise<Todo[]> {
    return await this.repository.list();
  }

  async complete(id: string): Promise<Todo> {
    return await this.repository.update(id, { 
      completed: true, 
      completedAt: new Date().toISOString() 
    });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
