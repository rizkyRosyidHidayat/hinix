import type { Note } from '../../types/note';
import { NoteRepository } from '../../repositories/note.repository';

export class NotesService {
  private repository: NoteRepository;

  constructor(repository?: NoteRepository) {
    this.repository = repository ?? new NoteRepository();
  }

  async create(title: string, content = ''): Promise<Note> {
    const now = new Date().toISOString();
    const note: Note = {
      id: crypto.randomUUID(),
      title,
      content,
      createdAt: now,
      updatedAt: now,
    };
    return await this.repository.create(note);
  }

  async list(): Promise<Note[]> {
    return await this.repository.list();
  }

  async getById(id: string): Promise<Note | undefined> {
    return await this.repository.getById(id);
  }

  async update(id: string, changes: Partial<Pick<Note, 'title' | 'content'>>): Promise<Note> {
    return await this.repository.update(id, {
      ...changes,
      updatedAt: new Date().toISOString(),
    });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async search(query: string): Promise<Note[]> {
    return await this.repository.search(query);
  }
}
