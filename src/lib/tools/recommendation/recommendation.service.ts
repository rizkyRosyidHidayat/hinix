/**
 * RecommendationService — analyzes and generates
 * prioritized action/insight/reminder cards for the dashboard.
 *
 * Pure rule-based logic, no AI. Uses current time for nearest-time
 * awareness (e.g. "event starts in 15 minutes").
 */
import type { Recommendation } from './recommendation.types';
import type { FeatureSettings } from '../../stores/settings.svelte';
import { ScheduleService } from '$lib/tools/schedule/schedule.service';
import { ScheduleRepository } from '$lib/repositories/schedule.repository';
import { TodoService } from '$lib/tools/todo/todo.service';
import { TodoRepository } from '$lib/repositories/todo.repository';
import { HabitRepository } from '$lib/repositories/habit.repository';
import { HabitService } from '$lib/tools/habits/habit.service';
import { BudgetRepository } from '$lib/repositories/budget.repository';
import { BudgetService } from '$lib/tools/budget/budget.service';
// import { NotesService } from '$lib/tools/notes/notes.service';
// import { NoteRepository } from '$lib/repositories/note.repository';

export async function getRecommendations(
  features: FeatureSettings,
  now: Date = new Date()
): Promise<Recommendation[]> {
  const serviceSchedule = new ScheduleService(new ScheduleRepository());
  const serviceTodo = new TodoService(new TodoRepository());
  const serviceHabit = new HabitService(new HabitRepository());
  const serviceBudget = new BudgetService(new BudgetRepository());
  // const serviceNotes = new NotesService(new NoteRepository());

  const recommendations: Recommendation[] = [];

  // ── Schedule recommendations ──
  if (features.schedule) {
    const todaySchedules = await serviceSchedule.listByDate(now.toISOString().split('T')[0]);

    if (todaySchedules.length > 0) {
      let minDiff = Infinity;
      let maxPastDiff = -Infinity;
      let nextFuture = null;
      let nextPast = null;

      for (const current of todaySchedules) {
        if (!current.time) continue;
        const [h, m] = current.time.split(':').map(Number);
        const eventTime = new Date(now);
        eventTime.setHours(h, m, 0, 0);
        const diffMin = Math.round((eventTime.getTime() - now.getTime()) / 60000);

        if (diffMin >= 0 && diffMin < minDiff) {
          minDiff = diffMin;
          nextFuture = current;
        } else if (diffMin < 0 && diffMin > maxPastDiff) {
          maxPastDiff = diffMin;
          nextPast = current;
        }
      }

      const next = nextFuture || nextPast || todaySchedules[0];
      const [h, m] = next.time?.split(':').map(Number) || [0, 0];
      const eventTime = new Date(now);
      eventTime.setHours(h, m, 0, 0);
      const diffMin = Math.round((eventTime.getTime() - now.getTime()) / 60000);

      if (diffMin <= 60 && diffMin > 0) {
        recommendations.push({
          id: `schedule-soon-${next.id}`,
          type: 'reminder',
          priority: diffMin <= 15 ? 'high' : 'medium',
          icon: 'Clock',
          title: `"${next.title}" starts in ${diffMin} min`,
          description: `Scheduled at ${next.time} today. Get ready!`,
          action: { label: 'View Schedule', command: 'show schedule' },
        });
      } else if (diffMin > 60) {
        recommendations.push({
          id: `schedule-upcoming-${next.id}`,
          type: 'insight',
          priority: 'low',
          icon: 'Calendar',
          title: `Next event: "${next.title}" at ${next.time}`,
          description: `You have ${todaySchedules.length} event${todaySchedules.length > 1 ? 's' : ''} remaining today.`,
          action: { label: 'View Schedule', command: 'show schedule' },
        });
      } else if (diffMin < 0 && next.time) {
        recommendations.push({
          id: `schedule-late-${next.id}`,
          type: 'reminder',
          priority: 'high',
          icon: 'Clock',
          title: `"${next.title}" was late`,
          description: `Scheduled at ${next.time} today, it should have started ${Math.abs(diffMin)} min ago.`,
          action: { label: 'View Schedule', command: 'show schedule' },
        });
      } else {
        recommendations.push({
          id: `schedule-count-${next.id}`,
          type: 'reminder',
          priority: 'low',
          icon: 'Clock',
          title: `You have ${todaySchedules.length} event${todaySchedules.length > 1 ? 's' : ''} today`,
          description: `Keep it up! Go and complete your schedule!`,
          action: { label: 'View Schedule', command: 'show schedule' },
        });
      }
    }
    else if (todaySchedules.length === 0) {
      recommendations.push({
        id: 'schedule-empty',
        type: 'action',
        priority: 'low',
        icon: 'CalendarPlus',
        title: 'No events scheduled today',
        description: 'Plan your day by adding an event to your schedule.',
      });
    }
  }

  // ── Todo recommendations ──
  if (features.todo) {
    const todayTask = await serviceTodo.listByDate(now.toISOString().split('T')[0]);
    const listTask = await serviceTodo.list();
    const pendingToday = todayTask.filter(t => !t.completed).length;
    const pendingOverall = listTask.filter(t => !t.completed).length;
    const completed = todayTask.filter(t => t.completed).length;

    if (pendingToday > 0) {
      recommendations.push({
        id: 'todo-pending',
        type: 'action',
        priority: pendingToday >= 5 ? 'high' : 'medium',
        icon: 'CheckSquare',
        title: `${pendingToday} task${pendingToday > 1 ? 's' : ''} pending`,
        description: `You've completed ${completed} so far. Keep going!`,
        action: { label: 'View Tasks', command: 'show todo' },
      });
    } else if (completed > 0) {
      recommendations.push({
        id: 'todo-all-done',
        type: 'insight',
        priority: 'low',
        icon: 'PartyPopper',
        title: 'All tasks completed!',
        description: `You finished ${completed} task${completed > 1 ? 's' : ''} today. Great work!`,
      });
    } else if (pendingOverall > 0) {
      recommendations.push({
        id: 'todo-pending-overall',
        type: 'insight',
        priority: pendingOverall >= 5 ? 'high' : 'medium',
        icon: 'List',
        title: `${pendingOverall} task${pendingOverall > 1 ? 's' : ''} pending overall`,
        description: `You have ${pendingOverall} task${pendingOverall > 1 ? 's' : ''} pending overall. Don't give up!`,
        action: { label: 'View Tasks', command: 'show todo' },
      });
    }
    else {
      recommendations.push({
        id: 'todo-empty',
        type: 'action',
        priority: 'low',
        icon: 'ListPlus',
        title: 'No tasks for today',
        description: 'Start your day by adding a task.',
      });
    }
  }

  // ── Habits recommendations ──
  const habits = await serviceHabit.getTodaySummary();
  if (features.habits && habits) {
    const { completed, total, remaining } = habits;

    if (total > 0 && remaining > 0) {
      recommendations.push({
        id: 'habits-remaining',
        type: 'action',
        priority: remaining === total ? 'high' : 'medium',
        icon: 'Target',
        title: `${remaining} habit${remaining > 1 ? 's' : ''} left today`,
        description: `${completed} of ${total} completed. Don't break the streak!`,
        action: { label: 'View Habits', command: 'show habits' },
      });
    } else if (total > 0 && remaining === 0) {
      recommendations.push({
        id: 'habits-all-done',
        type: 'insight',
        priority: 'low',
        icon: 'Trophy',
        title: 'All habits done today! 🎉',
        description: `You completed all ${total} habits. Keep the streak alive!`,
      });
    }
    else {
      recommendations.push({
        id: 'habits-empty',
        type: 'action',
        priority: 'low',
        icon: 'Target',
        title: 'No habits for today',
        description: 'Start your day by adding a habit.',
      });
    }
  }

  // ── Budget recommendations ──
  if (features.budget) {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];
    const { expenses, remaining } = await serviceBudget.getSummary(firstDay, lastDay);

    if (remaining < 0) {
      recommendations.push({
        id: 'budget-overspent',
        type: 'reminder',
        priority: 'high',
        icon: 'AlertTriangle',
        title: 'Budget is in the red',
        description: `You've overspent by ${Math.abs(remaining).toLocaleString()} this month. Review your finances.`,
        action: { label: 'View Budget', command: 'show budget' },
      });
    } else if (expenses > 0) {
      recommendations.push({
        id: 'budget-today',
        type: 'insight',
        priority: 'low',
        icon: 'DollarSign',
        title: `Spent ${expenses.toLocaleString()} today`,
        description: `Monthly remaining: ${remaining.toLocaleString()}`,
        action: { label: 'View Budget', command: 'show budget' },
      });
    } else if (expenses === 0) {
      recommendations.push({
        id: 'budget-no-log',
        type: 'action',
        priority: 'low',
        icon: 'Receipt',
        title: 'No expenses logged today',
        description: 'Track your spending by logging an expense.',
      });
    }
  }

  // Notes recommendations
  // if (features.notes) {
  //   const pinnedNotes = await serviceNotes.listPinned();
  //   if (pinnedNotes.length === 0) {
  //     recommendations.push({
  //       id: 'notes-no-pinned',
  //       type: 'action',
  //       priority: 'low',
  //       icon: 'Pin',
  //       title: 'No pinned notes',
  //       description: 'Pin important notes on your dashboard for quick access.',
  //       action: { label: 'View Notes', path: '/notes', command: command('notes', 'add') },
  //     });
  //   }
  // }

  // Sort: high → medium → low
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}
