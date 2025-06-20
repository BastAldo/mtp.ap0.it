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
  currentRep: 0,
  phase: '',
  countdown: 0, // Now represents remaining ms
  totalDuration: 0, // Now represents total ms
  timerId: null,
  timerStartTime: 0,
  timerEndTime: 0,
  prevState: null
};

function clearTimers() {
  clearInterval(state.timerId);
  state.timerId = null;
}

function setState(newState, payload = {}) {
  clearTimers();
  state = { ...state, ...payload, currentState: newState };
  ui.updateTrainerUI(state);

  switch (newState) {
    case STATES.READY:
      state.exercise = state.workout[state.currentExerciseIndex];
      state.currentSeries = 1;
      ui.updateTrainerUI(state);
      break;

    case STATES.PREPARING:
      setState(STATES.ANNOUNCING, { phase: 'Preparati!', nextState: STATES.ACTION });
      break;

    case STATES.ACTION:
       runCountdown(3000, 'VIA!', () => {
          if (state.exercise.type === 'reps') {
              state.currentRep = 1;
              runTempoCycle();
          } else {
              runCountdown(state.exercise.duration * 1000, 'Stop!', STATES.REST);
          }
      });
      break;

    case STATES.REST:
      const isLastSeries = state.currentSeries >= state.exercise.series