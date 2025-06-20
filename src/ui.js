/**
 * @file ui.js
 * Responsible for all direct DOM manipulations and user feedback (visual/audio).
 */

// --- Views ---
const calendarView = document.getElementById('calendar-view');
const trainerView = document.getElementById('trainer-view');
const debriefingView = document.getElementById('debriefing-view');
const views = { calendar: calendarView, trainer: trainerView, debriefing: debriefingView };

// --- Trainer View Elements ---
const trainerExerciseTitle = document.getElementById('trainer-exercise-title');
const trainerSeriesCounter = document.getElementById('trainer-series-counter');
const trainerMainText = document.getElementById('trainer-main-text');
const trainerMainDisplay = document.getElementById('trainer-main-display');
const trainerDescription = document.getElementById('trainer-description');
const pauseResumeBtn = document.getElementById('pause-resume-btn');
const terminateBtn = document.getElementById('terminate-btn');


/**
 * Shows the specified view and hides all others.
 * @param {'calendar' | 'trainer' | 'debriefing'} viewName The name of the view to show.
 */
export function showView(viewName) {
  Object.values(views).forEach(view => view.classList.remove('view--active'));
  if (views[viewName]) {
    views[viewName].classList.add('view--active');
  }
}

/**
 * Updates the entire trainer UI based on the current state of the workout.
 * @param {object} state The current state object from the trainer module.
 */
export function updateTrainerUI(state) {
  const { exercise, currentSeries, phase, countdown, message, currentState } = state;

  trainerExerciseTitle.textContent = exercise ? exercise.name : 'Pronti?';
  trainerSeriesCounter.textContent = exercise ? `Serie ${currentSeries} / ${exercise.series}` : '';
  trainerMainText.textContent = message || countdown;
  trainerDescription.textContent = phase ? `Fase: ${phase.toUpperCase()}` : '';

  // Update button text and state
  terminateBtn.disabled = currentState === 'idle' || currentState === 'finished';
  pauseResumeBtn.disabled = !(currentState === 'action' || currentState === 'paused');
  
  if (currentState === 'paused') {
      pauseResumeBtn.textContent = 'Riprendi';
  } else {
      pauseResumeBtn.textContent = 'Pausa';
  }

  // Handle flashing animation for announcements
  if (phase === 'announcing') {
    trainerMainDisplay.classList.add('is-flashing');
  } else {
    trainerMainDisplay.classList.remove('is-flashing');
  }
}

/**
 * Attaches event listeners to the trainer control buttons.
 * @param {object} handlers - Object with callback functions.
 * @param {function} handlers.onPauseResume - The function to call when pause/resume is clicked.
 * @param {function} handlers.onTerminate - The function to call when terminate is clicked.
 */
export function initTrainerControls(handlers) {
    pauseResumeBtn.addEventListener('click', () => handlers.onPauseResume());
    terminateBtn.addEventListener('click', () => handlers.onTerminate());
}

/**
 * Plays a short, high-frequency audio tick.
 * Uses Web Audio API for precise timing.
 */
let audioCtx;
export function playTick() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A6 note
  gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);

  oscillator.start(audioCtx.currentTime);
  oscillator.stop(audioCtx.currentTime + 0.05);
}
