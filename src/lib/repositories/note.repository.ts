import type { Note } from '../types/note';
import { db } from '../db/database';
import { dbState } from '../stores/db.svelte';

export class NoteRepository {
  async create(note: Note): Promise<Note> {
    await db.notes.add(note);
    dbState.notify('notes');
    return note;
  }

  async list(): Promise<Note[]> {
    return db.notes.orderBy('updatedAt').reverse().toArray();
  }

  async getById(id: string): Promise<Note | undefined> {
    return db.notes.get(id);
  }

  async update(id: string, changes: Partial<Note>): Promise<Note> {
    await db.notes.update(id, changes);
    dbState.notify('notes');
    const updated = await this.getById(id);
    if (!updated) throw new Error('Note not found');
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.notes.delete(id);
    dbState.notify('notes');
  }

  /** Search notes by title or content (case-insensitive) */
  async search(query: string): Promise<Note[]> {
    const q = query.toLowerCase();
    const all = await this.list();
    return all.filter(
      n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  }
}
