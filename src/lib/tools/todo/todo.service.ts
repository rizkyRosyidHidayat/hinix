import type { Todo } from '../../types/todo';
import type { TodoRepository } from '../../repositories/todo.repository';
import type { ScheduleRepository } from '../../repositories/schedule.repository';

export class TodoService {
  constructor(
    private repository: TodoRepository,
    private scheduleRepo?: ScheduleRepository
  ) { }

  async create(title: string, deadline?: string, description?: string): Promise<Todo> {
    const todo: Todo = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      createdAt: new Date().toISOString(),
      deadline,
      description
    };

    const created = await this.repository.create(todo);

    if (deadline && this.scheduleRepo) {
      const [date, time] = deadline.includes(' ') ? deadline.split(' ') : [deadline, undefined];
      await this.scheduleRepo.create({
        id: crypto.randomUUID(),
        title: `Task: ${title}`,
        date,
        time,
        createdAt: new Date().toISOString(),
        linkedTodoId: created.id
      });
    }

    return created;
  }

  async update(id: string, deadline?: string, description?: string): Promise<Todo> {
    // Determine what to update
    const updates: Partial<Todo> = {};
    if (deadline !== undefined) updates.deadline = deadline;
    if (description !== undefined) updates.description = description;

    const updated = await this.repository.update(id, updates);

    if (this.scheduleRepo) {
      const linked = await this.scheduleRepo.findByLinkedTodoId(id);
      if (deadline) {
        const [date, time] = deadline.includes(' ') ? deadline.split(' ') : [deadline, undefined];
        if (linked) {
          await this.scheduleRepo.update(linked.id, { date, time });
        } else {
          const todo = await this.repository.getById(id);
          if (todo) {
            await this.scheduleRepo.create({
              id: crypto.randomUUID(),
              title: `Task: ${todo.title}`,
              date,
              time,
              createdAt: new Date().toISOString(),
              linkedTodoId: id
            });
          }
        }
      } else if (linked) {
        await this.scheduleRepo.delete(linked.id);
      }
    }

    return updated;
  }

  async list(): Promise<Todo[]> {
    return await this.repository.list();
  }

  async listByDate(date: string): Promise<Todo[]> {
    return await this.repository.listByDate(date);
  }

  async complete(id: string): Promise<Todo> {
    const updated = await this.repository.update(id, {
      completed: true,
      completedAt: new Date().toISOString()
    });

    if (this.scheduleRepo) {
      const linked = await this.scheduleRepo.findByLinkedTodoId(id);
      if (linked) {
        await this.scheduleRepo.delete(linked.id);
      }
    }

    return updated;
  }

  async uncomplete(id: string): Promise<Todo> {
    const updated = await this.repository.update(id, {
      completed: false,
      completedAt: undefined
    });

    if (updated.deadline && this.scheduleRepo) {
      const linked = await this.scheduleRepo.findByLinkedTodoId(id);
      if (!linked) {
        const [date, time] = updated.deadline.includes(' ') ? updated.deadline.split(' ') : [updated.deadline, undefined];
        await this.scheduleRepo.create({
          id: crypto.randomUUID(),
          title: `Task: ${updated.title}`,
          date,
          time,
          createdAt: new Date().toISOString(),
          linkedTodoId: id
        });
      }
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);

    if (this.scheduleRepo) {
      const linked = await this.scheduleRepo.findByLinkedTodoId(id);
      if (linked) {
        await this.scheduleRepo.delete(linked.id);
      }
    }
  }
}
