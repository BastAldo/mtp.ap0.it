import { staticExercises } from '../data/_staticExercises.js';

// Il Repository attualmente restituisce solo la lista statica.
// In futuro, potrà essere esteso per includere altre fonti
// (es. esercizi custom dall'utente memorizzati in localStorage).
export function getExercises() {
  return staticExercises;
}

export function getExerciseById(id) {
  return getExercises().find(exercise => exercise.id === id);
}
