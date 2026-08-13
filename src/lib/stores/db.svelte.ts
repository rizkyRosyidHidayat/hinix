class DbState {
  todos = $state(0);
  budget = $state(0);
  schedules = $state(0);
  notes = $state(0);

  notify(store: 'todos' | 'budget' | 'schedules' | 'notes') {
    this[store]++;
  }
}

export const dbState = new DbState();
