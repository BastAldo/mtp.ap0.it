/**
 * @file trainer.js
 * Contains the entire state machine logic for the training session.
 * It is decoupled from the DOM.
 */
import * as ui from './ui.js';

const STATES = {
  IDLE: 'idle',
  READY: 'ready',
  ANNOUNCING: 'announcing',
  PREPARING: 'preparing',
  ACTION: 'action',
  PAUSED: 'paused',
  REST: 'rest',
  FINISHED: 'finished',
};

let state = {
  currentState: STATES.IDLE,
  workout: [],
  exercise: null,
  currentExerciseIndex: 0,
  currentSeries: 0,
  phase: '',
  countdown: 0,
  message: '',
  timerId: null,
};

function setState(newState, payload = {}) {
  state = { ...state, ...payload, currentState: newState };
  console.log(`Transition to: ${newState}`, state);

  switch (newState) {
    case STATES.READY:
      state.exercise = state.workout[state.currentExerciseIndex];
      state.currentSeries = 1;
      state.message = 'Premi INIZIA'; // Placeholder for a real start button
      ui.updateTrainerUI(state);
      // For now, we auto-start the preparation phase
      setTimeout(() => setState(STATES.PREPARING), 1000);
      break;

    case STATES.PREPARING:
      setState(STATES.ANNOUNCING, { phase: 'announcing', message: 'Preparati!', nextState: STATES.PREPARING_COUNTDOWN });
      break;
      
    case STATES.ANNOUNCING:
      ui.updateTrainerUI(state);
      ui.playTick();
      state.timerId = setTimeout(() => {
          // After announcing, proceed to the actual action (e.g., the countdown)
          if (state.nextState) {
              const next = state.nextState;
              state.nextState = null; // Clear the next state
              setState(next);
          }
      }, 750); // Announce phase duration
      break;
    
    case STATES.PREPARING_COUNTDOWN:
      runCountdown(3, 'Inizia!', STATES.ACTION);
      break;
    
    // Future states (ACTION, REST, etc.) will be handled here
  }
}

function runCountdown(seconds, finalMessage, nextState) {
    state.countdown = seconds;
    ui.updateTrainerUI(state);
    ui.playTick();

    state.timerId = setInterval(() => {
        state.countdown--;
        ui.updateTrainerUI(state);
        ui.playTick();

        if (state.countdown <= 0) {
            clearInterval(state.timerId);
            state.message = finalMessage;
            ui.updateTrainerUI(state);
            setTimeout(() => setState(nextState), 1000);
        }
    }, 1000);
}

export function startTrainer(exercises) {
  if (!exercises || exercises.length === 0) {
    console.error('Cannot start trainer without exercises.');
    return;
  }
  
  // Deep copy to avoid modifying original data
  state.workout = JSON.parse(JSON.stringify(exercises));
  state.currentExerciseIndex = 0;

  ui.showView('trainer');
  setState(STATES.READY);
}
