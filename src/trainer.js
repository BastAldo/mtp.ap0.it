/**
 * @file trainer.js
 * ---
 * Contains the entire state machine logic for the training session.
 * This module is completely decoupled from the DOM. It receives workout data,
 * manages the state (ready, preparing, action, rest, etc.), and uses callback
 * functions provided by the UI module to display updates.
 */

import * as ui from './ui.js';
import { ALL_EXERCISES } from './workouts.js';
import { playTick } from './utils.js';

const ANNOUNCE_DURATION = 750; // ms
const PREPARE_DURATION = 3; // seconds

// --- STATE ---
// This object holds the entire state of the current training session.
let trainerState = {
  state: 'idle', // idle, ready, announcing, preparing, action, paused, rest, finished
  exercises: [], // a queue of exercises for the current session
  currentExerciseIndex: -1,
  currentSeries: 0,
  currentRep: 0,
  timerId: null, // To store setInterval reference
  countdown: 0,
};

// --- PUBLIC API ---

/**
 * Initializes and starts the trainer with a list of exercise IDs.
 * @param {Array<string>} exerciseIds - List of exercise IDs to be performed.
 */
export function startTrainer(exerciseIds) {
  if (!exerciseIds || exerciseIds.length === 0) {
    console.error("Trainer started with no exercises.");
    return;
  }
  // Reset state and populate with new workout
  resetTrainerState();
  trainerState.exercises = exerciseIds
    .map(id => ALL_EXERCISES.find(ex => ex.id === id))
    .filter(Boolean);

  ui.showView('trainer');
  nextStep();
}

// --- STATE MACHINE LOGIC ---

/**
 * The core of the trainer. Determines the next state and executes it.
 */
function nextStep() {
  const currentExercise = getCurrentExercise();

  // Case 1: Workout is finished
  if (!currentExercise) {
    runFinishedState();
    return;
  }

  // Case 2: Starting a new exercise
  if (trainerState.currentSeries === 0) {
    trainerState.currentExerciseIndex++;
    trainerState.currentSeries = 1;
    trainerState.currentRep = 1;
    runReadyState();
    return;
  }

  // Case 3: Finished all series for the current exercise
  if (trainerState.currentSeries > currentExercise.series) {
    trainerState.currentExerciseIndex++;
    trainerState.currentSeries = 1;
    trainerState.currentRep = 1;
     // Check if this was the last exercise
    if (trainerState.currentExerciseIndex >= trainerState.exercises.length) {
        runFinishedState();
    } else {
        runReadyState();
    }
    return;
  }
  
  // Case 4: Proceeding to the next set (start with rest)
  runRestState();
}

/**
 * Runs the READY state. The user has to manually start the set.
 */
function runReadyState() {
  trainerState.state = 'ready';
  const exercise = getCurrentExercise();
  ui.updateTrainerUI(exercise, trainerState.currentSeries, 'PRONTI?', `Premi 'PAUSA' per iniziare la serie`);
  // The 'pause' button doubles as a 'start' button here.
  // We will repurpose it in the UI module. For now, we wait for user input.
  // The transition to the next state is handled by the PAUSE/RESUME button's event listener.
}

export function handleAction() {
  switch (trainerState.state) {
      case 'ready':
          runAnnouncingPhase('PREPARATI', runPreparingPhase);
          break;
      case 'action':
          runPausedState();
          break;
      case 'paused':
          resumeActionState();
          break;
      case 'rest':
          // Pausing during rest is not yet implemented.
          break;
  }
}

/**
 * Runs a short "announcing" phase to alert the user of what's next.
 * @param {string} text - The text to display (e.g., "UP", "REST").
 * @param {function} nextPhaseCallback - The function to call after the announcement.
 */
function runAnnouncingPhase(text, nextPhaseCallback) {
  trainerState.state = 'announcing';
  ui.updateTrainerMainDisplay(text, true);
  playTick();
  
  setTimeout(() => {
    ui.updateTrainerMainDisplay(text, false); // Stop flashing
    nextPhaseCallback();
  }, ANNOUNCE_DURATION);
}


/**
 * Runs the PREPARING state (countdown before the first set).
 */
function runPreparingPhase() {
  trainerState.state = 'preparing';
  trainerState.countdown = PREPARE_DURATION;
  ui.updateTrainerMainDisplay(trainerState.countdown);
  
  trainerState.timerId = setInterval(() => {
      trainerState.countdown--;
      playTick();
      ui.updateTrainerMainDisplay(trainerState.countdown);
      if (trainerState.countdown <= 0) {
          clearInterval(trainerState.timerId);
          runActionState();
      }
  }, 1000);
}

function runActionState() {
    trainerState.state = 'action';
    const exercise = getCurrentExercise();
    // Logic for timed vs reps exercise will go here
    // For now, let's just simulate a 5s action
    trainerState.countdown = 5;
    ui.updateTrainerMainDisplay(trainerState.countdown);

    trainerState.timerId = setInterval(() => {
        trainerState.countdown--;
        ui.updateTrainerMainDisplay(trainerState.countdown);
        if (trainerState.countdown <= 0) {
            clearInterval(trainerState.timerId);
            trainerState.currentSeries++;
            nextStep(); // This will trigger the rest phase
        }
    }, 1000);
}

function runPausedState() {
    trainerState.state = 'paused';
    clearInterval(trainerState.timerId);
    ui.setPaused(true);
}

function resumeActionState() {
    trainerState.state = 'action';
    ui.setPaused(false);
    // To resume correctly, we need to know what kind of action was paused.
    // This simplified version just restarts the action timer.
    runActionState();
}

function runRestState() {
    trainerState.state = 'rest';
    const exercise = getCurrentExercise();
    trainerState.countdown = exercise.rest;

    runAnnouncingPhase('RIPOSO', () => {
        ui.updateTrainerMainDisplay(trainerState.countdown);
        trainerState.timerId = setInterval(() => {
            trainerState.countdown--;
            playTick();
            ui.updateTrainerMainDisplay(trainerState.countdown);
            if (trainerState.countdown <= 0) {
                clearInterval(trainerState.timerId);
                runAnnouncingPhase('PREPARATI', runPreparingPhase);
            }
        }, 1000);
    });
}

function runFinishedState() {
    trainerState.state = 'finished';
    console.log("Workout Finished!");
    // Transition to debriefing view
}

/**
 * Resets the trainer's state to its initial values.
 */
function resetTrainerState() {
  if (trainerState.timerId) {
    clearInterval(trainerState.timerId);
  }
  trainerState = {
    state: 'idle',
    exercises: [],
    currentExerciseIndex: -1,
    currentSeries: 0,
    currentRep: 0,
    timerId: null,
    countdown: 0,
  };
}

// --- HELPERS ---
function getCurrentExercise() {
  return trainerState.exercises[trainerState.currentExerciseIndex];
}
