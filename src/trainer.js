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
  countdown: 0,
  totalDuration: 0,
  message: '',
  timerId: null,
  prevState: null
};

function clearTimers() {
  clearInterval(state.timerId);
  clearTimeout(state.timerId);
  state.timerId = null;
}

function setState(newState, payload = {}) {
  clearTimers();
  state = { ...state, ...payload, currentState: newState, message: '' };
  ui.updateTrainerUI(state);

  switch (newState) {
    case STATES.READY:
      state.exercise = state.workout[state.currentExerciseIndex];
      state.currentSeries = 1;
      ui.updateTrainerUI(state); // Update UI to show the initial state and "Inizia" button
      break;

    case STATES.PREPARING:
      setState(STATES.ANNOUNCING, { phase: 'announcing', message: 'Preparati!', nextState: STATES.ACTION });
      break;

    case STATES.ACTION:
       runCountdown(3, 'VIA!', 3, () => {
          if (state.exercise.type === 'reps') {
              state.currentRep = 1;
              runTempoCycle();
          } else {
              runCountdown(state.exercise.duration, 'Stop!', state.exercise.duration, STATES.REST);
          }
      });
      break;

    case STATES.REST:
      const isLastSeries = state.currentSeries >= state.exercise.series;
      const isLastExercise = isLastSeries && state.currentExerciseIndex >= state.workout.length - 1;

      if (isLastExercise) {
          setState(STATES.FINISHED);
          return;
      }

      setState(STATES.ANNOUNCING, {
          phase: 'announcing',
          message: 'Riposo',
          nextState: STATES.REST_COUNTDOWN
      });
      break;

    case STATES.REST_COUNTDOWN:
      runCountdown(state.exercise.rest, 'Pronti', state.exercise.rest, () => {
           if (state.currentSeries < state.exercise.series) {
              state.currentSeries++;
              setState(STATES.PREPARING);
           } else {
              state.currentExerciseIndex++;
              setState(STATES.READY);
           }
      });
      break;

    case STATES.ANNOUNCING:
      ui.playTick();
      state.timerId = setTimeout(() => {
        const next = state.nextState;
        state.nextState = null;
        setState(next);
      }, 750);
      break;

    case STATES.FINISHED:
        ui.showView('calendar');
        break;

    case STATES.IDLE:
    case STATES.PAUSED:
      break;
  }
}

function runCountdown(seconds, message, totalDuration, onCompleteOrNextState) {
    state.countdown = seconds;
    state.totalDuration = totalDuration;
    state.phase = message;
    ui.updateTrainerUI(state);
    ui.playTick();

    state.timerId = setInterval(() => {
        state.countdown--;
        ui.updateTrainerUI(state);
        if (state.countdown > 0) ui.playTick();
        else { ui.playTick(); ui.playTick(); }

        if (state.countdown <= 0) {
            clearInterval(state.timerId);
            if (typeof onCompleteOrNextState === 'function') {
                state.timerId = setTimeout(onCompleteOrNextState, 1000);
            } else {
                setState(onCompleteOrNextState);
            }
        }
    }, 1000);
}

function runTempoCycle() {
    const tempo = state.exercise.tempo;
    const repCountMessage = `${state.currentRep} / ${state.exercise.reps}`;

    const executePhase = (phaseName, duration, nextPhase) => {
        if (duration > 0) {
            runCountdown(duration, phaseName.toUpperCase(), duration, nextPhase);
        } else {
            nextPhase();
        }
    };

    const doDown = () => executePhase('down', tempo.down, doUp);
    const doHold = () => executePhase('hold', tempo.hold, doDown);
    const doUp = () => {
        if (state.currentRep < state.exercise.reps) {
            state.currentRep++;
            executePhase('up', tempo.up, doHold);
        } else {
            setState(STATES.REST);
        }
    };
    executePhase('up', tempo.up, doHold);
}

export function startTrainer(exercises) {
  if (!exercises || exercises.length === 0) return;
  state.workout = JSON.parse(JSON.stringify(exercises));
  state.currentExerciseIndex = 0;
  ui.showView('trainer');
  setState(STATES.READY);
}

export function confirmStart() {
  if (state.currentState === STATES.READY) {
    setState(STATES.PREPARING);
  }
}

export function pauseOrResumeTrainer() {
    if (state.currentState === STATES.PAUSED) {
        const restartState = state.prevState;
        setState(restartState);
    } else {
        clearTimers();
        state.prevState = state.currentState;
        setState(STATES.PAUSED);
    }
}

export function terminateTrainer() {
    clearTimers();
    setState(STATES.IDLE);
    ui.showView('calendar');
}
