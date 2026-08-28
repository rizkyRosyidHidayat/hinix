import nlp from 'compromise';
import datePlugin from 'compromise-dates';

// Register the dates plugin
nlp.plugin(datePlugin);

// Add HiNix-specific vocabulary so compromise tags them correctly
nlp.world().addWords({
  todo: 'Noun',
  todos: 'Noun',
  task: 'Noun',
  tasks: 'Noun',
  habit: 'Noun',
  habits: 'Noun',
  note: 'Noun',
  notes: 'Noun',
  expense: 'Noun',
  expenses: 'Noun',
  income: 'Noun',
  budget: 'Noun',
  event: 'Noun',
  events: 'Noun',
  schedule: 'Noun',
  timer: 'Noun',
  dashboard: 'Noun',
  pomodoro: 'Noun',
});

export default nlp;
