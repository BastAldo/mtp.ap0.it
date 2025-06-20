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
};

function clearTimers() {
  cancelAnimationFrame(state.animationFrameId);
  state.animationFrameId = null;
}

function setState(newState, payload = {}) {
  clearTimers();
  state = { ...state, ...payload, currentState: newState };
  ui.updateTrainerUI(state);
}

function transitionTo(phaseText, duration, onCompleteAction) {
  setState(STATES.ANNOUNCING, { phase: phaseText });
  setTimeout(() => {
    if (onCompleteAction) onCompleteAction();
  }, 750);
}

function runCountdown(duration, phaseText, onComplete) {
    state.totalDuration = duration;
    state.phase = phaseText;
    const startTime = Date.now();

    const tick = () => {
        const elapsedMs = Date.now() - startTime;
        const progress = Math.min(100, (elapsedMs / (duration * 1000)) * 100);
        ui.updateProgressOnly(progress);

        if (elapsedMs >= duration * 1000) {
            ui.playTick();
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
          transitionTo(phaseName.toUpperCase(), duration, () => runCountdown(duration, phaseName.toUpperCase(), nextPhase));
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
      // Future: transition to debriefing view
      setTimeout(() => ui.showView('calendar'), 2000);
      return;
  }

  const onRestComplete = () => {
      if (state.currentSeries < state.exercise.series) {
          state.currentSeries++;
          startExercise();
      } else {
          state.currentExerciseIndex++;
          state.currentSeries = 1;
          startExercise();
      }
  };
  
  transitionTo('Riposo', state.exercise.rest, () => runCountdown(state.exercise.rest, 'Riposo', onRestComplete));
}

function startExercise() {
  state.exercise = state.workout[state.currentExerciseIndex];
  transitionTo("Pronti?", 3, () => {
      runCountdown(3, 'VIA!', () => {
          setState(STATES.ACTION);
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
  console.warn("Pause/Resume functionality is currently disabled.");
}

export function terminateTrainer() {
    clearTimers();
    state = { ...state, currentState: STATES.IDLE };
    ui.showView('calendar');
}