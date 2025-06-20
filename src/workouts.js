/**
 * @file workouts.js
 * Contains the master list of all available exercises in the application.
 */

export const ALL_EXERCISES = [
  {
    id: 'pushup',
    name: 'Push Up',
    type: 'reps',
    series: 3,
    reps: 10,
    rest: 60, // seconds
    tempo: { up: 1, hold: 1, down: 2 }, // seconds
    description: "Esercizio a corpo libero per pettorali, tricipiti e spalle. Mantenere il corpo in linea retta dalla testa ai talloni."
  },
  {
    id: 'squat',
    name: 'Squat a corpo libero',
    type: 'reps',
    series: 3,
    reps: 12,
    rest: 60,
    tempo: { up: 1, hold: 0, down: 2 },
    description: "Esercizio fondamentale per gambe e glutei. Scendere come per sedersi su una sedia, mantenendo la schiena dritta."
  },
  {
    id: 'plank',
    name: 'Plank',
    type: 'time',
    series: 1,
    duration: 45, // seconds
    rest: 45,
    description: "Esercizio isometrico per il core. Mantenere una linea retta e contrarre gli addominali per tutta la durata."
  },
  {
    id: 'burpees',
    name: 'Burpees',
    type: 'reps',
    series: 4,
    reps: 8,
    rest: 90,
    tempo: { up: 1, hold: 0, down: 1 },
    description: "Esercizio total body ad alta intensità. Combina un push-up, uno squat e un salto verticale in un unico movimento fluido."
  },
  {
    id: 'jumping_jacks',
    name: 'Jumping Jacks',
    type: 'time',
    series: 1,
    duration: 60,
    rest: 30,
    description: "Esercizio cardiovascolare classico per riscaldamento o per aumentare la frequenza cardiaca."
  },
  {
    id: 'calf_raises',
    name: 'Calf Raises',
    type: 'reps',
    series: 3,
    reps: 15,
    rest: 45,
    tempo: { up: 1, hold: 1, down: 2 },
    description: "Esercizio di isolamento per i polpacci. Sollevarsi sulla punta dei piedi, mantenere la contrazione e scendere lentamente."
  }
];