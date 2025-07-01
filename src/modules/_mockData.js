// --- Dati di Sviluppo Fittizi ---
// Questi dati vengono usati per popolare localStorage al primo avvio.

const MOCK_DATE_KEY = 'workout-2025-07-01';

export const mockWorkouts = {
  [MOCK_DATE_KEY]: [
    {
      id: 'test-ex-1',
      type: 'exercise',
      exerciseId: 'test-exercise',
      name: 'Esercizio di Test',
      series: 2,
      reps: 2,
      tempo: { up: 1, hold: 1, down: 1 }
    },
    {
      id: 'squat-1',
      type: 'exercise',
      exerciseId: 'squat',
      name: 'Squat',
      series: 3,
      reps: 10,
      tempo: { up: 2, hold: 0, down: 2 }
    },
    {
      id: 'rest-1',
      type: 'rest',
      duration: 90 // secondi
    },
    {
      id: 'pushups-1',
      type: 'exercise',
      exerciseId: 'push-ups',
      name: 'Push-ups',
      series: 3,
      reps: 12,
      tempo: { up: 1, hold: 0, down: 2 }
    }
  ]
};
