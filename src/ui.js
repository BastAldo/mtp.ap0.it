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
const startSessionBtn = document.getElementById('start-session-btn');
const pauseResumeBtn = document.getElementById('pause-resume-btn');
const terminateBtn = document.getElementById('terminate-btn');
const progressRingFg = document.getElementById('progress-ring-foreground');

// --- Progress Ring Setup ---
const ringRadius = progressRingFg.r.baseVal.value;
const ringCircumference = 2 * Math.PI * ringRadius;
progressRingFg.style.strokeDasharray = `${ringCircumference} ${ringCircumference}`;
progressRingFg.style.strokeDashoffset = ringCircumference;

export function updateProgressOnly(percentage) {
  if (isNaN(percentage)) return;
  const offset = ringCircumference - (percentage / 100) * ringCircumference;
  progressRingFg.style.strokeDashoffset = Math.max(0, offset);
}

export function showView(viewName) {
  Object.values(views).forEach(view => view.classList.remove('view--active'));
  if (views[viewName]) views[viewName].classList.add('view--active');
}

export function updateTrainerUI(state) {
  const { exercise, currentSeries, currentRep, phase, totalDuration, currentState } = state;

  trainerExerciseTitle.textContent = exercise ? exercise.name : 'Workout';
  
  if (exercise) {
    let seriesText = `Serie ${currentSeries} / ${exercise.series}`;
    if (exercise.type === 'reps' && (currentState === 'action' || (currentState === 'paused' && state.prevState?.currentState === 'action'))) {
      seriesText += `  |  Rip. ${currentRep} / ${exercise.reps}`;
    }
    trainerSeriesCounter.textContent = seriesText;
  } else {
    trainerSeriesCounter.textContent = '';
  }

  if (currentState === 'paused') {
      trainerMainText.textContent = "PAUSA";
  } else if (totalDuration > 0 && currentState !== 'ready') {
      trainerMainText.innerHTML = `${phase}<br><small>${totalDuration}s</small>`;
  } else {
      trainerMainText.textContent = phase;
  }
  
  startSessionBtn.style.display = currentState === 'ready' ? 'block' : 'none';
  const inProgress = currentState !== 'ready' && currentState !== 'idle' && currentState !== 'finished';
  pauseResumeBtn.style.display = inProgress ? 'block' : 'none';
  terminateBtn.style.display = inProgress ? 'block' : 'none';
  
  const canPause = currentState === 'action' || currentState === 'rest_countdown' || currentState === 'announcing' || currentState === 'paused';
  pauseResumeBtn.disabled = !canPause;
  pauseResumeBtn.textContent = currentState === 'paused' ? 'Riprendi' : 'Pausa';
}

export function initTrainerControls(handlers) {
    startSessionBtn.addEventListener('click', () => handlers.onConfirmStart());
    pauseResumeBtn.addEventListener('click', () => handlers.onPauseResume());
    terminateBtn.addEventListener('click', () => handlers.onTerminate());
}

let audioCtx;
export function playTick() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4 note
  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
  oscillator.start(audioCtx.currentTime);
  oscillator.stop(audioCtx.currentTime + 0.05);
}