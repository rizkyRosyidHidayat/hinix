export interface ScheduleItem {
  id: string;
  title: string;
  date: string;
  time?: string;
  createdAt: string;
  linkedTodoId?: string;
  linkedHabitId?: string;
  linkedNoteId?: string;
}
