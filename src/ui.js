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

export function updateTrainerUI(state) {
  const { exercise, currentSeries, currentRep, phase, totalDuration, currentState } = state;

  trainerExerciseTitle.textContent = exercise ? exercise.name : 'Workout';
  
  if (exercise) {
    let seriesText = `Serie ${currentSeries} / ${exercise.series}`;
    if (exercise.type === 'reps' && (currentState === 'action')) {
      seriesText += `  |  Rip. ${currentRep} / ${exercise.reps}`;
    }
    trainerSeriesCounter.textContent = seriesText;
  } else {
    trainerSeriesCounter.textContent = '';
  }

  // Handle text display
  if (totalDuration > 0) {
      trainerMainText.innerHTML = `${phase}<br><small>${totalDuration}s</small>`;
  } else {
      trainerMainText.textContent = phase;
  }

  // Handle flashing for announcing state
  if (currentState === 'announcing') {
      trainerMainDisplay.classList.add('is-flashing');
  } else {
      trainerMainDisplay.classList.remove('is-flashing');
  }
  
  // Handle button visibility
  startSessionBtn.style.display = currentState === 'ready' ? 'block' : 'none';
  const inProgress = currentState !== 'ready' && currentState !== 'idle' && currentState !== 'finished';
  pauseResumeBtn.style.display = inProgress ? 'block' : 'none';
  terminateBtn.style.display = inProgress ? 'block' : 'none';
  
  pauseResumeBtn.disabled = true; // Pause is disabled in this version
  pauseResumeBtn.textContent = 'Pausa';
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
  oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
  oscillator.start(audioCtx.currentTime);
  oscillator.stop(audioCtx.currentTime + 0.05);
}