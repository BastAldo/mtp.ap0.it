/**
 * @file trainer.js
 * Contains the entire state machine logic for the training session.
 */
import * as ui from './ui.js';

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
  timerStartTime: 0,
  timeOffsetMs: 0,
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

  if (newState === STATES.ANNOUNCING) {
      ui.playTick();
      setTimeout(() => {
          if (state.onTimerComplete) state.onTimerComplete();
      }, 750);
  }
}

function transitionTo(phaseText, onCompleteAction, duration = 0) {
  state.phase = phaseText;
  state.totalDuration = duration;
  state.onTimerComplete = onCompleteAction;
  setState(STATES.ANNOUNCING);
}

function runCountdown(duration, onComplete) {
    state.timerStartTime = Date.now();
    state.timeOffsetMs = 0; // Countdown always starts fresh

    const tick = () => {
        const elapsedMs = Date.now() - state.timerStartTime;
        const progress = Math.min(100, (elapsedMs / (duration * 1000)) * 100);
        ui.updateProgressOnly(progress);

        if (elapsedMs >= duration * 1000) {
            clearTimers();
            if (onComplete) onComplete();
        } else {
            state.animationFrameId = requestAnimationFrame(tick);
        }
    };
    tick();
    ui.updateTrainerUI(state);
}

function runTempoCycle() {
    const tempo = state.exercise.tempo;
    const executePhase = (phaseName, duration, nextPhase) => {
        if (duration > 0) {
          transitionTo(phaseName.toUpperCase(), () => runCountdown(duration, nextPhase), duration);
        } else {
            nextPhase();
        }
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
  const isLastSeries = state.currentSeries >= state.exercise.series;
  const isLastExercise = isLastSeries && state.currentExerciseIndex >= state.workout.length - 1;
  if (isLastExercise) {
      setState(STATES.FINISHED, {phase: 'Completato!'});
      return;
  }

  const onRestComplete = () => {
      if (state.currentSeries < state.exercise.series) {
          state.currentSeries++;
          startExercise();
      } else {
          state.currentExerciseIndex++;
          state.exercise = state.workout[state.currentExerciseIndex];
          state.currentSeries = 1;
          startExercise();
      }
  };
  
  transitionTo('Riposo', () => runCountdown(state.exercise.rest, onRestComplete), state.exercise.rest);
}

function startExercise() {
  state.exercise = state.workout[state.currentExerciseIndex];
  transitionTo("Pronti?", () => {
      runCountdown(3, 'VIA!', () => {
          setState(STATES.ACTION);
          if (state.exercise.type === 'reps') {
              runTempoCycle();
          } else {
              transitionTo("Azione", () => runCountdown(state.exercise.duration, handleRest), state.exercise.duration);
          }
      }, 3);
  });
}

export function startTrainer(exercises) {
  if (!exercises || exercises.length === 0) return;
  state = { ...state, workout: JSON.parse(JSON.stringify(exercises)), currentExerciseIndex: 0 };
  ui.showView('trainer');
  setState(STATES.READY, {phase: "Pronto?"});
}

export function confirmStart() {
  if (state.currentState === STATES.READY) {
      startExercise();
  }
}

export function pauseOrResumeTrainer() {
  // Pause/resume logic is complex with the new transition model and is disabled for now.
  console.warn("Pause/Resume functionality is currently disabled.");
}

export function terminateTrainer() {
    clearTimers();
    state = { ...state, currentState: STATES.IDLE };
    ui.showView('calendar');
}
