/**
 * @file ui.js
 * Responsible for all direct DOM manipulations.
 * It acts as the "view" layer of the application.
 */

// Views
const configView = document.getElementById('config-view');
const trainerView = document.getElementById('trainer-view');

// Trainer elements
const exerciseNameEl = document.getElementById('exercise-name');
const seriesCounterEl = document.getElementById('series-counter');
const timerEl = document.getElementById('timer');
const statusMessageEl = document.getElementById('status-message');
const pauseButton = document.getElementById('pause-button');
const resumeButton = document.getElementById('resume-button');
const nextExerciseButton = document.getElementById('next-exercise-button');


/**
 * Shows a specific view and hides all others.
 * @param {('config'|'trainer')} viewName The name of the view to show.
 */
export function showView(viewName) {
    configView.style.display = 'none';
    trainerView.style.display = 'none';

    if (viewName === 'config') {
        configView.style.display = 'block';
    } else if (viewName === 'trainer') {
        trainerView.style.display = 'block';
    }
}

/**
 * Updates the entire trainer UI based on the current state.
 * @param {object} state The state object from the trainer module.
 * @param {string} state.exerciseName
 * @param {number} state.currentSeries
 * @param {number} state.totalSeries
 * @param {number} state.time
 * @param {string} state.statusMessage
 * @param {boolean} state.isLastExercise
 * @param {boolean} state.isExerciseCompleted
 * @param {boolean} state.isWorkoutCompleted
 */
export function updateTrainerUI(state) {
    exerciseNameEl.textContent = state.exerciseName;
    seriesCounterEl.textContent = `Series ${state.currentSeries} / ${state.totalSeries}`;
    timerEl.textContent = String(state.time).padStart(2, '0');
    statusMessageEl.textContent = state.statusMessage;

    if (state.isWorkoutCompleted) {
      nextExerciseButton.style.display = 'none';
      pauseButton.style.display = 'none';
      resumeButton.style.display = 'none';
    } else if (state.isExerciseCompleted) {
      nextExerciseButton.style.display = 'inline-block';
      pauseButton.style.display = 'none';
      resumeButton.style.display = 'none';
    } else {
      nextExerciseButton.style.display = 'none';
    }
}

/**
 * Toggles the visibility of the Pause and Resume buttons.
 * @param {boolean} isPaused - True if the trainer is paused.
 */
export function togglePause(isPaused) {
    if (nextExerciseButton.style.display !== 'none') return; // Don't show pause/resume if next is visible

    pauseButton.style.display = isPaused ? 'none' : 'inline-block';
    resumeButton.style.display = isPaused ? 'inline-block' : 'none';
}
