// --- Dati di Sviluppo Fittizi ---
// Questi dati vengono usati per popolare localStorage al primo avvio.

const MOCK_DATE_KEY = 'workout-2025-07-01';

export const mockWorkouts = {
  [MOCK_DATE_KEY]: [
    {
      id: 'test-ex-reps',
      type: 'exercise',
      exerciseId: 'test-exercise',
      name: 'Esercizio di Test (Reps)',
      series: 2,
      reps: 2,
      tempo: { up: 1, hold: 1, down: 1 },
      defaultRest: 3
    },
    {
      id: 'test-rest',
      type: 'rest',
      duration: 3
    },
    {
      id: 'test-ex-time',
      type: 'time',
      exerciseId: 'test-time-exercise',
      name: 'Esercizio di Test (Tempo)',
      series: 2,
      duration: 5,
      defaultRest: 3
    }
  ]
};
