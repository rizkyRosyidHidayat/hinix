import type { Todo } from '../../types/todo';
import type { TodoRepository } from '../../repositories/todo.repository';
import type { ScheduleRepository } from '../../repositories/schedule.repository';

export class TodoService {
	constructor(
		private repository: TodoRepository,
		private scheduleRepo?: ScheduleRepository
	) {}

	async create(title: string, deadline?: string, linkedNoteId?: string): Promise<Todo> {
		const todo: Todo = {
			id: crypto.randomUUID(),
			title,
			completed: false,
			createdAt: new Date().toISOString(),
			date: new Date().toISOString().split('T')[0],
			deadline,
			linkedNoteId
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

	async update(id: string, deadline?: string, linkedNoteId?: string, title?: string): Promise<Todo> {
		// Determine what to update
		const updates: Partial<Todo> = {};
		if (deadline !== undefined) updates.deadline = deadline;
		if (linkedNoteId !== undefined) updates.linkedNoteId = linkedNoteId;
		if (title !== undefined) updates.title = title;

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

	async linkNote(todoId: string, noteId: string): Promise<Todo> {
		return await this.repository.update(todoId, { linkedNoteId: noteId });
	}

	async unlinkNote(todoId: string): Promise<Todo> {
		return await this.repository.update(todoId, { linkedNoteId: undefined });
	}

	async list(): Promise<Todo[]> {
		return (await this.repository.list()).sort((a, b) => {
			if (a.deadline && b.deadline) {
				return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
			}
			if (a.deadline) return -1;
			if (b.deadline) return 1;
			return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
		});
	}

	async listByDate(date: string): Promise<Todo[]> {
		return (await this.repository.listByDate(date)).sort((a, b) => {
			if (a.deadline && b.deadline) {
				return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
			}
			if (a.deadline) return -1;
			if (b.deadline) return 1;
			return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
		});
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
				const [date, time] = updated.deadline.includes(' ')
					? updated.deadline.split(' ')
					: [updated.deadline, undefined];
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
