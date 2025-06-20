/**
 * @file ui.js
 * Responsible for all direct DOM manipulations and user feedback (visual/audio).
 */

// --- Elements ---
const views = {
  calendar: document.getElementById('calendar-view'),
  trainer: document.getElementById('trainer-view'),
  debriefing: document.getElementById('debriefing-view')
};
const trainerExerciseTitle = document.getElementById('trainer-exercise-title');
const trainerSeriesCounter = document.getElementById('trainer-series-counter');
const trainerMainText = document.getElementById('trainer-main-text');
const trainerMainDisplay = document.getElementById('trainer-main-display');
const trainerDescription = document.getElementById('trainer-description');
const trainerFullDescription = document.getElementById('trainer-full-description');
const startSessionBtn = document.getElementById('start-session-btn');
const pauseResumeBtn = document.getElementById('pause-resume-btn');
const terminateBtn = document.getElementById('terminate-btn');
const progressRingFg = document.getElementById('progress-ring-foreground');

export function updateProgressOnly(percentage) {
  if (isNaN(percentage)) return;
  const offset = 100 - percentage;
  progressRingFg.style.strokeDashoffset = Math.max(0, Math.min(100, offset));
}

export function showView(viewName) {
  Object.values(views).forEach(view => view.classList.remove('view--active'));
  if (views[viewName]) views[viewName].classList.add('view--active');
}

function getExerciseDetails(exercise) {
  if (!exercise) return '';
  if (exercise.type === 'reps') {
    const tempo = exercise.tempo;
    return `${exercise.series} serie × ${exercise.reps} rip. | Tempo: up ${tempo.up}s - hold ${tempo.hold}s - down ${tempo.down}s`;
  } else { // time
    return `${exercise.series} serie × ${exercise.duration} secondi`;
  }
}

export function updateTrainerUI(state) {
  const { exercise, currentSeries, currentRep, phase, totalDuration, currentState, pausedState } = state;
  const displayState = currentState === 'paused' ? pausedState : state;

  trainerExerciseTitle.textContent = displayState.exercise ? displayState.exercise.name : 'Workout';
  trainerDescription.textContent = getExerciseDetails(displayState.exercise);
  trainerFullDescription.textContent = displayState.exercise ? displayState.exercise.description : '';
  
  if (displayState.exercise) {
    let seriesText = `Serie ${displayState.currentSeries} / ${displayState.exercise.series}`;
    const isAction = currentState === 'action' || (currentState === 'paused' && pausedState?.currentState === 'action');
    if (displayState.exercise.type === 'reps' && isAction) {
      seriesText += `  |  Rip. ${displayState.currentRep} / ${displayState.exercise.reps}`;
    }
    trainerSeriesCounter.textContent = seriesText;
  } else {
    trainerSeriesCounter.textContent = '';
  }

  if (currentState === 'paused') {
      const interruptedPhase = pausedState?.phase || '';
      trainerMainText.innerHTML = `PAUSA<br><small style="text-transform: capitalize;">${interruptedPhase.toLowerCase()}</small>`;
  } else if (displayState.totalDuration > 0) {
      trainerMainText.innerHTML = `${displayState.phase}<br><small>${displayState.totalDuration}s</small>`;
  } else {
      trainerMainText.textContent = displayState.phase;
  }

  if (currentState === 'announcing') {
      trainerMainDisplay.classList.add('is-flashing');
  } else {
      trainerMainDisplay.classList.remove('is-flashing');
  }
  
  startSessionBtn.style.display = currentState === 'ready' ? 'block' : 'none';
  const inProgress = currentState !== 'ready' && currentState !== 'idle' && currentState !== 'finished';
  pauseResumeBtn.style.display = inProgress ? 'block' : 'none';
  terminateBtn.style.display = inProgress ? 'block' : 'none';
  
  const canBeInterrupted = currentState === 'action' || currentState === 'announcing' || currentState === 'paused';
  pauseResumeBtn.disabled = !canBeInterrupted;
  terminateBtn.textContent = 'Termina';
  pauseResumeBtn.textContent = currentState === 'paused' ? 'Riprendi' : 'Pausa';
}

export function initTrainerControls(handlers) {
    startSessionBtn.addEventListener('click', () => handlers.onConfirmStart());
    pauseResumeBtn.addEventListener('click', () => handlers.onPauseResume());
    terminateBtn.addEventListener('click', () => handlers.onTerminate());
}
