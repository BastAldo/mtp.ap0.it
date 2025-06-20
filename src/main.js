/**
 * @file main.js
 * ---
 * Main application entry point.
 * Orchestrates the different modules of the application:
 * - Initializes UI components.
 * - Handles user interactions (view navigation, opening modals).
 * - Manages the overall application flow.
 */

import * as storage from './storage.js';
import * as ui from './ui.js';
import { startTrainer } from './trainer.js';
import { getWeek, getDayName, getFormattedDate } from './utils.js';

// --- STATE ---
let currentWeekOffset = 0;
let selectedDate = null; // Used for modals to know which day they're editing

// --- INITIALIZATION ---
function initialize() {
  setupEventListeners();
  renderCurrentWeek();
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
  // Calendar Navigation
  document.getElementById('prev-week-btn').addEventListener('click', showPreviousWeek);
  document.getElementById('next-week-btn').addEventListener('click', showNextWeek);

  // Modals
  document.getElementById('close-daily-modal-btn').addEventListener('click', ui.closeDailyWorkoutModal);
  document.getElementById('close-library-modal-btn').addEventListener('click', ui.closeExerciseLibraryModal);
  document.getElementById('add-exercise-btn').addEventListener('click', () => ui.openExerciseLibraryModal(handleSelectExercise));

  // Event delegation for dynamically created elements
  document.body.addEventListener('click', handleDynamicClicks);
}

/**
 * Handles clicks on dynamically generated elements like day cells, start buttons, etc.
 * @param {Event} event The click event.
 */
function handleDynamicClicks(event) {
  const target = event.target;

  // Open Daily Workout Modal
  if (target.closest('.day-cell') && !target.closest('.day-actions')) {
    const dayCell = target.closest('.day-cell');
    selectedDate = dayCell.dataset.date;
    const workouts = storage.getWorkoutsForDate(selectedDate);
    ui.openDailyWorkoutModal(selectedDate, workouts, handleRemoveExercise);
  }

  // Start Trainer
  if (target.id === 'start-day-btn') {
    const dayCell = target.closest('.day-cell');
    const date = dayCell.dataset.date;
    const exerciseIds = storage.getWorkoutsForDate(date).map(w => w.id);
    if (exerciseIds.length > 0) {
      startTrainer(exerciseIds);
    }
  }
}


// --- CALENDAR LOGIC ---
function renderCurrentWeek() {
  const week = getWeek(currentWeekOffset);
  ui.updateCalendar(week, handleDayCellClick, handleStartWorkout);
}

function showPreviousWeek() {
  currentWeekOffset--;
  renderCurrentWeek();
}

function showNextWeek() {
  currentWeekOffset++;
  renderCurrentWeek();
}

function handleDayCellClick(date) {
  selectedDate = date;
  const workouts = storage.getWorkoutsForDate(date);
  ui.openDailyWorkoutModal(date, workouts, handleRemoveExercise);
}

function handleStartWorkout(date) {
    const exerciseIds = storage.getWorkoutsForDate(date).map(w => w.id);
    if (exerciseIds.length > 0) {
        startTrainer(exerciseIds);
    }
}

// --- WORKOUT MANAGEMENT ---

/**
 * Callback for when an exercise is selected from the library.
 * @param {string} exerciseId The ID of the selected exercise.
 */
function handleSelectExercise(exerciseId) {
    storage.addWorkoutToDate(selectedDate, exerciseId);
    ui.closeExerciseLibraryModal();
    // Re-render the daily workout modal to show the new exercise
    const updatedWorkouts = storage.getWorkoutsForDate(selectedDate);
    ui.renderDailyExercises(updatedWorkouts, handleRemoveExercise);
    // Also, re-render the calendar to update the summary
    renderCurrentWeek();
}

/**
 * Callback for when an exercise is removed from the daily list.
 * @param {string} exerciseId The ID of the exercise to remove.
 */
function handleRemoveExercise(exerciseId) {
  storage.removeWorkoutFromDate(selectedDate, exerciseId);
  // Re-render the daily workout modal
  const updatedWorkouts = storage.getWorkoutsForDate(selectedDate);
  ui.renderDailyExercises(updatedWorkouts, handleRemoveExercise);
  // Also, re-render the calendar to update the summary
  renderCurrentWeek();
}


// --- STARTUP ---
document.addEventListener('DOMContentLoaded', initialize);
