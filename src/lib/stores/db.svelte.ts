class DbState {
  todos = $state(0);
  budget = $state(0);
  schedules = $state(0);
  notes = $state(0);
  habits = $state(0);

  notify(store: 'todos' | 'budget' | 'schedules' | 'notes' | 'habits') {
    this[store]++;
  }

  subscribe(store: 'todos' | 'budget' | 'schedules' | 'notes' | 'habits') {
    return this[store];
  }
}

export const dbState = new DbState();
