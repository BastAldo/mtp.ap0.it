/**
 * @file trainer.js
 * Contains the entire state machine logic for the training session.
 */
import * as ui from './ui.js';
import { showDebriefing } from './debriefing.js';
import * as storage from './storage.js';

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
  dateKey: null,
  workout: [],
  exercise: null,
  currentExerciseIndex: 0,
  currentSeries: 0,
  currentRep: 0,
  phase: '',
  totalDuration: 0,
  animationFrameId: null,
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
  setState(STATES.ANNOUNCING, { phase: phaseText, totalDuration: duration, onTimerComplete: onCompleteAction });
  setTimeout(() => {
    if (state.currentState === STATES.ANNOUNCING) {
       if (state.onTimerComplete) state.onTimerComplete();
    }
  }, 750);
}

function runCountdown(duration, phaseText, onComplete, timeOffsetMs = 0) {
    setState(STATES.ACTION, { phase: phaseText, totalDuration: duration, onTimerComplete: onComplete });
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
            handleRestBetweenSeries();
        }
    };
    doUp();
}

function handleRestBetweenSeries() {
  const isLastSeries = state.currentSeries >= state.exercise.series;
  if (isLastSeries) {
      advanceToNextWorkoutItem();
      return;
  }
  
  const onRestComplete = () => {
      state.currentSeries++;
      startExercisePhase();
  };
  
  transitionTo('Riposo', state.exercise.rest, () => runCountdown(state.exercise.rest, 'Riposo', onRestComplete));
}

function advanceToNextWorkoutItem() {
  const isLastExercise = state.currentExerciseIndex >= state.workout.length - 1;
  if(isLastExercise) {
      setState(STATES.FINISHED);
      const result = { ...state, wasTerminated: false };
      storage.addWorkoutToHistory(state.dateKey, result);
      showDebriefing(result);
  } else {
      state.currentExerciseIndex++;
      startExercisePhase();
  }
}

function startExercisePhase() {
  state.exercise = state.workout[state.currentExerciseIndex];
  state.currentRep = 0;
  
  if(state.exercise.type === 'rest') {
      transitionTo('Recupero', state.exercise.duration, () => runCountdown(state.exercise.duration, 'Recupero', advanceToNextWorkoutItem));
      return;
  }

  // Only reset series count if it's the first time for this exercise type
  if(state.currentSeries === 0) state.currentSeries = 1;

  transitionTo("Pronti?", 3, () => {
      runCountdown(3, 'VIA!', () => {
          if (state.exercise.type === 'reps') {
              runTempoCycle();
          } else { // time
              transitionTo("Azione", state.exercise.duration, () => runCountdown(state.exercise.duration, "Azione", advanceToNextWorkoutItem));
          }
      });
  });
}

export function startTrainer(exercises, dateKey) {
  if (!exercises || exercises.length === 0) return;
  const freshState = { workout: JSON.parse(JSON.stringify(exercises)), dateKey: dateKey, currentExerciseIndex: 0, currentSeries: 1, currentRep: 0 };
  state = { ...state, ...freshState };
  ui.showView('trainer');
  setState(STATES.READY, {phase: "INIZIA"});
}

export function confirmStart() {
  if (state.currentState === STATES.READY) startExercisePhase();
}

export function pauseOrResumeTrainer() {
  if (state.currentState === STATES.PAUSED) {
      const ps = state.pausedState;
      state.currentState = ps.currentState; 
      runCountdown(ps.totalDuration, ps.phase, ps.onTimerComplete, ps.timeOffsetMs);
  } else {
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
    storage.addWorkoutToHistory(state.dateKey, result);
    showDebriefing(result);
    setState(STATES.IDLE, { phase: '' });
}
