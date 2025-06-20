/**
 * @file trainer.js
 * Contains the entire state machine logic for the training session.
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
  totalDuration: 0,
  animationFrameId: null,
  timerStartTime: 0,
  timeOffsetMs: 0, // Time already elapsed when resuming
  onTimerComplete: null,
};

function clearTimers() {
  cancelAnimationFrame(state.animationFrameId);
  state.animationFrameId = null;
}

function setState(newState, payload = {}) {
  clearTimers();
  state = { ...state, ...payload, currentState: newState };
  ui.updateTrainerUI(state);

  switch (newState) {
    case STATES.READY:
      state.exercise = state.workout[state.currentExerciseIndex];
      state.currentSeries = 1;
      state.phase = "Pronto?";
      ui.updateTrainerUI(state);
      break;

    case STATES.PREPARING:
      setState(STATES.ANNOUNCING, { phase: 'Preparati!', onTimerComplete: () => setState(STATES.ACTION) });
      break;

    case STATES.ACTION:
       runCountdown(3, 'VIA!', () => {
          if (state.exercise.type === 'reps') {
              state.currentRep = 1;
              runTempoCycle();
          } else {
              runCountdown(state.exercise.duration, 'Azione', () => setState(STATES.REST));
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
      setState(STATES.ANNOUNCING, { phase: 'Riposo', onTimerComplete: () => setState(STATES.REST_COUNTDOWN) });
      break;

    case STATES.REST_COUNTDOWN:
      runCountdown(state.exercise.rest, 'Riposo', () => {
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
      runCountdown(0.75, state.phase, state.onTimerComplete);
      break;

    case STATES.FINISHED:
        ui.showView('calendar');
        break;
  }
}

function runCountdown(duration, phaseText, onComplete, timeOffsetMs = 0) {
    state.totalDuration = duration;
    state.phase = phaseText;
    state.onTimerComplete = onComplete;
    state.timeOffsetMs = timeOffsetMs;
    state.timerStartTime = Date.now();

    // Initial UI update for the text and series/rep counters
    ui.updateTrainerUI(state);

    const tick = () => {
        const elapsedMs = (Date.now() - state.timerStartTime) + state.timeOffsetMs;
        const progress = Math.min(100, (elapsedMs / (duration * 1000)) * 100);
        ui.updateProgressOnly(progress);

        if (elapsedMs >= duration * 1000) {
            ui.playTick();
            clearTimers();
            if (state.onTimerComplete) state.onTimerComplete();
        } else {
            state.animationFrameId = requestAnimationFrame(tick);
        }
    };
    
    tick();
}

function runTempoCycle() {
    const tempo = state.exercise.tempo;
    const executePhase = (phaseName, duration, nextPhase) => {
        if (duration > 0) runCountdown(duration, phaseName.toUpperCase(), nextPhase);
        else nextPhase();
    };
    const doDown = () => executePhase('down', tempo.down, doUp);
    const doHold = () => executePhase('hold', tempo.hold, doDown);
    const doUp = () => {
        if (state.currentRep < state.exercise.reps) {
            state.currentRep++;
            ui.updateTrainerUI(state);
            executePhase('up', tempo.up, doHold);
        } else {
            setState(STATES.REST);
        }
    };
    doUp();
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
      // RESUMING
      const prevState = state.prevState;
      state.currentState = prevState.currentState;
      runCountdown(prevState.totalDuration, prevState.phase, prevState.onTimerComplete, prevState.timeOffsetMs);
  } else {
      // PAUSING
      clearTimers();
      const elapsed = (Date.now() - state.timerStartTime) + state.timeOffsetMs;
      const pausedState = { ...state, timeOffsetMs: elapsed }; // Save the exact state when paused
      setState(STATES.PAUSED, { prevState: pausedState });
  }
}

export function terminateTrainer() {
    clearTimers();
    state = { ...state, currentState: STATES.IDLE }; // Reset state
    ui.showView('calendar');
}
