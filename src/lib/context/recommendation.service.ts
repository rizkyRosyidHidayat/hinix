/**
 * RecommendationService — analyzes HiNixContext and generates
 * prioritized action/insight/reminder cards for the dashboard.
 *
 * Pure rule-based logic, no AI. Uses current time for nearest-time
 * awareness (e.g. "event starts in 15 minutes").
 */
import type { HiNixContext } from './context.types';
import type { Recommendation } from './recommendation.types';
import type { FeatureSettings } from '../stores/settings.svelte';
import { registry } from '$lib/commands/registry';

function command(name: string, sub: string) {
  const cmd = registry.get(name);
  const subCmd = cmd?.subcommands?.find((s) => s.name === sub);
  return `${name} ${subCmd?.example}`;
}

export function getRecommendations(
  ctx: HiNixContext,
  features: FeatureSettings,
  now: Date = new Date()
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  // ── Schedule recommendations ──
  if (features.schedule) {
    const todaySchedules = ctx.upcoming.schedules
      .filter((e) => e.date === ctx.today.date && e.time && e.time >= currentTimeStr)
      .sort((a, b) => a.time!.localeCompare(b.time!));

    if (todaySchedules.length > 0) {
      const next = todaySchedules[0];
      const [h, m] = next.time!.split(':').map(Number);
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
          action: { label: 'View Schedule', path: '/schedule' },
        });
      } else if (diffMin > 60) {
        recommendations.push({
          id: `schedule-upcoming-${next.id}`,
          type: 'insight',
          priority: 'low',
          icon: 'Calendar',
          title: `Next event: "${next.title}" at ${next.time}`,
          description: `You have ${todaySchedules.length} event${todaySchedules.length > 1 ? 's' : ''} remaining today.`,
          action: { label: 'View Schedule', path: '/schedule' },
        });
      }
    } else if (ctx.today.events === 0) {
      recommendations.push({
        id: 'schedule-empty',
        type: 'action',
        priority: 'low',
        icon: 'CalendarPlus',
        title: 'No events scheduled today',
        description: 'Plan your day by adding an event to your schedule.',
        action: { label: 'Add Event', path: '/schedule', command: command('schedule', 'add') },
      });
    }
  }

  // ── Todo recommendations ──
  if (features.todo) {
    const pending = ctx.today.tasks;
    const completed = ctx.today.completedTasks;

    if (pending > 0) {
      recommendations.push({
        id: 'todo-pending',
        type: 'action',
        priority: pending >= 5 ? 'high' : 'medium',
        icon: 'CheckSquare',
        title: `${pending} task${pending > 1 ? 's' : ''} pending`,
        description: `You've completed ${completed} so far. Keep going!`,
        action: { label: 'View Tasks', path: '/todo' },
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
    } else {
      recommendations.push({
        id: 'todo-empty',
        type: 'action',
        priority: 'low',
        icon: 'ListPlus',
        title: 'No tasks for today',
        description: 'Start your day by adding a task.',
        action: { label: 'Add Task', path: '/todo', command: command('todo', 'add') },
      });
    }
  }

  // ── Habits recommendations ──
  if (features.habits && ctx.habits) {
    const { completed, total, remaining } = ctx.habits;

    if (total > 0 && remaining > 0) {
      recommendations.push({
        id: 'habits-remaining',
        type: 'action',
        priority: remaining === total ? 'high' : 'medium',
        icon: 'Target',
        title: `${remaining} habit${remaining > 1 ? 's' : ''} left today`,
        description: `${completed} of ${total} completed. Don't break the streak!`,
        action: { label: 'View Habits', path: '/habits' },
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
    } else {
      recommendations.push({
        id: 'habits-empty',
        type: 'action',
        priority: 'low',
        icon: 'Target',
        title: 'No habits for today',
        description: 'Start your day by adding a habit.',
        action: { label: 'Add Habit', path: '/habits', command: command('habits', 'add') },
      });
    }
  }

  // ── Budget recommendations ──
  if (features.budget) {
    const { expenses, remaining } = ctx.finance;

    if (remaining < 0) {
      recommendations.push({
        id: 'budget-overspent',
        type: 'reminder',
        priority: 'high',
        icon: 'AlertTriangle',
        title: 'Budget is in the red',
        description: `You've overspent by ${Math.abs(remaining).toLocaleString()} this month. Review your finances.`,
        action: { label: 'View Budget', path: '/budget' },
      });
    } else if (ctx.today.expenses > 0) {
      recommendations.push({
        id: 'budget-today',
        type: 'insight',
        priority: 'low',
        icon: 'DollarSign',
        title: `Spent ${ctx.today.expenses.toLocaleString()} today`,
        description: `Monthly remaining: ${remaining.toLocaleString()}`,
        action: { label: 'View Budget', path: '/budget' },
      });
    } else if (expenses === 0) {
      recommendations.push({
        id: 'budget-no-log',
        type: 'action',
        priority: 'low',
        icon: 'Receipt',
        title: 'No expenses logged today',
        description: 'Track your spending by logging an expense.',
        action: { label: 'Log Expense', path: '/budget', command: command('budget', 'add') },
      });
    }
  }

  // ── Notes recommendations ──
  if (features.notes) {
    if (ctx.recent.pinnedNotes.length === 0) {
      recommendations.push({
        id: 'notes-no-pinned',
        type: 'action',
        priority: 'low',
        icon: 'Pin',
        title: 'No pinned notes',
        description: 'Pin important notes on your dashboard for quick access.',
        action: { label: 'View Notes', path: '/notes', command: command('notes', 'add') },
      });
    }
  }

  // Sort: high → medium → low
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}
