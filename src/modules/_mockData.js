// --- Dati di Sviluppo Fittizi ---
// Questi dati vengono usati per popolare localStorage al primo avvio.

// Nota: la data corrente è 30 Giugno 2025.
// Questo allenamento è per Martedì 1 Luglio 2025.
const MOCK_DATE_KEY = 'workout-2025-07-01';

export const mockWorkouts = {
  [MOCK_DATE_KEY]: [
    {
      id: 'squat-1',
      type: 'exercise',
      exerciseId: 'squat',
      name: 'Squat',
      series: 3,
      reps: 10
    },
    {
      id: 'rest-1',
      type: 'rest',
      duration: 90 // secondi
    },
    {
      id: 'pushups-1',
      type: 'exercise',
      exerciseId: 'pushups',
      name: 'Push-ups',
      series: 3,
      reps: 12
    }
  ]
};
