/**
 * @file trainer.js
 * Contiene tutta la logica della state machine per la sessione di allenamento.
 */
import * as ui from './ui.js';
import { playTick } from './audio.js';
import { WORKOUTS } from './workouts.js'; // Assumendo che gli allenamenti del giorno siano passati

// --- State ---
let state = 'idle'; // idle, ready, announcing, preparing, action, paused, rest, finished
let workoutPlan = []; // Lista di esercizi per la sessione
let currentExerciseIndex = 0;
let currentSeries = 1;
let currentRep = 1;
let timer = null;
let timerValue = 0;

// --- Funzioni private ---

function runState() {
  console.log(`TRAINER STATE: ${state.toUpperCase()}`);
  switch (state) {
    case 'ready':
      const exercise = workoutPlan[currentExerciseIndex];
      ui.updateTrainerUI(exercise, currentSeries);
      ui.setMainDisplayText("PREMI PER INIZIARE");
      // Qui si potrebbe aggiungere un event listener per iniziare
      break;
    // ... implementazione degli altri stati (announcing, action, etc.)
  }
}

// --- API Pubblica ---

/**
 * Inizia la sessione di allenamento.
 * @param {string[]} exerciseIds - Array di ID degli esercizi da eseguire.
 */
export function startTrainer(exerciseIds) {
  console.log('Starting trainer with exercises:', exerciseIds);

  workoutPlan = exerciseIds.map(id => WORKOUTS.find(w => w.id === id));
  if (workoutPlan.some(e => !e)) {
    console.error("Uno o più esercizi non trovati!", exerciseIds);
    return;
  }

  currentExerciseIndex = 0;
  currentSeries = 1;
  state = 'ready';

  ui.showView('trainer');
  runState();
}
