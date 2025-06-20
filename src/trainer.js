/**
 * @file trainer.js
 * Contains the entire state machine logic for the training session.
 */
import * as ui from './ui.js';
import { showDebriefing } from './debriefing.js';

const STATES = {
  IDLE: 'idle',
  READY: 'ready',
  ANNOUNCING: 'announcing',
  ACTION: 'action',
  PAUSED: 'paused',
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
  // --- Pause/Resume State ---
  timerStartTime: 0,
  timeOffsetMs: 0,
  onTimerComplete: null,
  pausedState: null,
};

function clearTimers() {
  cancelAnimationFrame(state.animationFrameId);
  state.animationFrameId = null;
}

function setState(newState, payload = {}) {
  clearTimers();
  state = { ...state, ...payload, currentState: newState };
  if (newState !== STATES.PAUSED) {
      ui.updateTrainerUI(state);
  }
}

function transitionTo(phaseText, duration, onCompleteAction) {
  setState(STATES.ANNOUNCING, { phase: phaseText, totalDuration: duration });
  setTimeout(() => {
    if (state.currentState === STATES.ANNOUNCING) {
       if (onCompleteAction) onCompleteAction();
    }
  }, 750);
}

function runCountdown(duration, phaseText, onComplete, timeOffsetMs = 0) {
    setState(STATES.ACTION, { phase: phaseText, totalDuration: duration });
    state.onTimerComplete = onComplete;
    state.timeOffsetMs = timeOffsetMs;
    state.timerStartTime = Date.now();
    const tick = () => {
        const elapsedMs = (Date.now() - state.timerStartTime) + state.timeOffsetMs;
        const progress = Math.min(100, (elapsedMs / (duration * 1000)) * 100);
        ui.updateProgressOnly(progress);
        if (elapsedMs >= duration * 1000) {
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
        if (duration > 0) transitionTo(phaseName.toUpperCase(), duration, () => runCountdown(duration, phaseName.toUpperCase(), nextPhase));
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
            handleRest();
        }
    };
    doUp();
}

function handleRest() {
  // First, check if the workout is absolutely over. If so, finish immediately.
  const isLastSeries = state.currentSeries >= state.exercise.series;
  const isLastExercise = state.currentExerciseIndex >= state.workout.length - 1;
  if (isLastSeries && isLastExercise) {
      setState(STATES.FINISHED);
      const result = { ...state, wasTerminated: false };
      showDebriefing(result);
      return;
  }

  // If not, define what to do AFTER the rest is complete.
  const onRestComplete = () => {
      // Re-evaluate state at the moment the rest finishes.
      const wasLastSeries = state.currentSeries >= state.exercise.series;

      if (wasLastSeries) {
          // End of series for this exercise, move to the next one.
          state.currentExerciseIndex++;
          state.currentSeries = 1;
          startExercise();
      } else {
          // More series of the same exercise to do.
          state.currentSeries++;
          startExercise();
      }
  };
  
  // Start the rest period.
  transitionTo('Riposo', state.exercise.rest, () => runCountdown(state.exercise.rest, 'Riposo', onRestComplete));
}

function startExercise() {
  state.exercise = state.workout[state.currentExerciseIndex];
  state.currentRep = 0; // Reset rep count for new exercise
  transitionTo("Pronti?", 3, () => {
      runCountdown(3, 'VIA!', () => {
          if (state.exercise.type === 'reps') {
              runTempoCycle();
          } else {
              transitionTo("Azione", state.exercise.duration, () => runCountdown(state.exercise.duration, "Azione", handleRest));
          }
      });
  });
}

export function startTrainer(exercises) {
  if (!exercises || exercises.length === 0) return;
  const freshState = { workout: JSON.parse(JSON.stringify(exercises)), currentExerciseIndex: 0, currentSeries: 0, currentRep: 0 };
  state = { ...state, ...freshState };
  ui.showView('trainer');
  setState(STATES.READY, {phase: "Pronto?"});
}

export function confirmStart() {
  if (state.currentState === STATES.READY) startExercise();
}

export function pauseOrResumeTrainer() {
  if (state.currentState === STATES.PAUSED) {
      // RESUMING
      const ps = state.pausedState;
      runCountdown(ps.totalDuration, ps.phase, ps.onTimerComplete, ps.timeOffsetMs);
  } else {
      // PAUSING
      clearTimers();
      const elapsed = (Date.now() - state.timerStartTime) + state.timeOffsetMs;
      const pausedContext = {
          totalDuration: state.totalDuration,
          phase: state.phase,
          onTimerComplete: state.onTimerComplete,
          timeOffsetMs: elapsed,
          exercise: state.exercise,
          currentSeries: state.currentSeries,
          currentRep: state.currentRep,
          currentState: state.currentState
      };
      setState(STATES.PAUSED, { pausedState: pausedContext });
      ui.updateTrainerUI(state);
  }
}

export function terminateTrainer() {
    clearTimers();
    const result = { ...state, wasTerminated: true };
    showDebriefing(result);
    setState(STATES.IDLE, { phase: '' });
}
