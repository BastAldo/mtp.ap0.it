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
  logicTimerId: null, // Timer for state logic (1s tick)
  uiTimerId: null,    // Timer for smooth UI updates (50ms tick)
  pausedData: null,   // Stores data needed to resume correctly
  prevState: null
};

function clearTimers() {
  clearInterval(state.logicTimerId);
  clearTimeout(state.logicTimerId);
  clearInterval(state.uiTimerId);
  state.logicTimerId = null;
  state.uiTimerId = null;
}

function setState(newState, payload = {}) {
  clearTimers();
  state = { ...state, ...payload, currentState: newState, message: '' };
  ui.updateTrainerUI(state);

  switch (newState) {
    case STATES.READY:
      state.exercise = state.workout[state.currentExerciseIndex];
      state.currentSeries = 1;
      ui.updateTrainerUI(state);
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
      setState(STATES.ANNOUNCING, { phase: 'announcing', message: 'Riposo', nextState: STATES.REST_COUNTDOWN });
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
      state.logicTimerId = setTimeout(() => {
        const next = state.nextState;
        state.nextState = null;
        setState(next);
      }, 750);
      break;

    case STATES.FINISHED:
        ui.showView('calendar');
        break;
  }
}

function runCountdown(seconds, message, totalDuration, onCompleteOrNextState, timeOffsetMs = 0) {
    const totalDurationMs = totalDuration * 1000;
    let remainingMs = (seconds * 1000) - timeOffsetMs;

    state.countdown = Math.ceil(remainingMs / 1000);
    state.totalDuration = totalDuration;
    state.phase = message;
    
    const startTime = Date.now();
    
    // UI Timer (smooth progress ring)
    state.uiTimerId = setInterval(() => {
        const elapsedMs = (Date.now() - startTime) + timeOffsetMs;
        const progress = Math.min(100, (elapsedMs / totalDurationMs) * 100);
        ui.updateProgressOnly(progress);
    }, 50);

    // Logic Timer (1s tick)
    state.logicTimerId = setInterval(() => {
        remainingMs -= 1000;
        state.countdown = Math.ceil(remainingMs / 1000);
        ui.updateTrainerUI(state);
        if (remainingMs > 0) ui.playTick();
        else { ui.playTick(); ui.playTick(); }

        if (remainingMs <= 0) {
            clearTimers();
            if (typeof onCompleteOrNextState === 'function') {
                state.logicTimerId = setTimeout(onCompleteOrNextState, 1000);
            } else {
                setState(onCompleteOrNextState);
            }
        }
    }, 1000);
    
    // Initial UI update
    ui.updateTrainerUI(state);
}

function runTempoCycle() {
    const executePhase = (phaseName, duration, nextPhase, timeOffsetMs = 0) => {
        if (duration > 0) {
            runCountdown(duration, phaseName.toUpperCase(), duration, nextPhase, timeOffsetMs);
        } else {
            nextPhase();
        }
    };

    const doDown = (offset) => executePhase('down', state.exercise.tempo.down, doUp, offset);
    const doHold = (offset) => executePhase('hold', state.exercise.tempo.hold, doDown, offset);
    const doUp = (offset) => {
        if (state.currentRep < state.exercise.reps) {
            state.currentRep++;
            executePhase('up', state.exercise.tempo.up, doHold, offset);
        } else {
            setState(STATES.REST);
        }
    };
    
    state.pausedData ? doUp(state.pausedData.remainingMs) : doUp();
}

export function startTrainer(exercises) {
  if (!exercises || exercises.length === 0) return;
  state = { ...state, workout: JSON.parse(JSON.stringify(exercises)), currentExerciseIndex: 0 };
  ui.showView('trainer');
  setState(STATES.READY);
}

export function confirmStart() {
  if (state.currentState === STATES.READY) setState(STATES.PREPARING);
}

export function pauseOrResumeTrainer() {
    if (state.currentState === STATES.PAUSED) {
        const { prevState, pausedData } = state;
        state.currentState = prevState; // Restore state before calling logic
        
        if (pausedData.type === 'countdown') {
            runCountdown(pausedData.remainingSecs, pausedData.message, pausedData.totalDuration, pausedData.onComplete);
        } else if (pausedData.type === 'tempo') {
            runTempoCycle();
        }
    } else {
        const remainingMs = (state.countdown * 1000) - (1000 - (Date.now() % 1000));
        state.pausedData = { 
            type: state.exercise.type === 'reps' ? 'tempo' : 'countdown',
            remainingMs: remainingMs,
            remainingSecs: Math.ceil(remainingMs / 1000),
            //... save other context if needed
        };
        state.prevState = state.currentState;
        clearTimers();
        setState(STATES.PAUSED);
    }
}

export function terminateTrainer() {
    clearTimers();
    setState(STATES.IDLE);
    ui.showView('calendar');
}
