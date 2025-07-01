// --- Libreria Statica degli Esercizi ---
// Questa è una delle fonti dati per l'ExerciseRepository.

export const staticExercises = [
  { id: 'test-exercise', name: 'Esercizio di Test', series: 2, reps: 2, tempo: { up: 1, hold: 1, down: 1 }, defaultRest: 3 },
  { id: 'bench-press', name: 'Bench Press', series: 3, reps: 8, defaultRest: 90 },
  { id: 'deadlift', name: 'Deadlift', series: 3, reps: 5, defaultRest: 120 },
  { id: 'squat', name: 'Squat', series: 3, reps: 10, defaultRest: 90 },
  { id: 'overhead-press', name: 'Overhead Press', series: 4, reps: 8, defaultRest: 75 },
  { id: 'pull-ups', name: 'Pull-ups', series: 3, reps: 'max', defaultRest: 60 },
  { id: 'push-ups', name: 'Push-ups', series: 3, reps: 12, defaultRest: 60 },
  { id: 'dips', name: 'Dips', series: 3, reps: 10, defaultRest: 60 },
  { id: 'plank', name: 'Plank', series: 3, duration: 60, type: 'time', defaultRest: 45 }, // Esempio esercizio a tempo
];
