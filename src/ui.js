/**
 * @file ui.js
 * ---
 * Responsible for all direct DOM manipulations.
 * This module contains functions to show/hide views, update the calendar,
 * manage modals, and update the trainer interface based on data it receives.
 * It is the "View" layer of the application.
 */

import { getDayName, getFormattedDate } from './utils.js';
import * as storage from './storage.js';
import { ALL_EXERCISES } from './workouts.js';
import { handleAction } from './trainer.js';

// --- DOM Element References ---
const views = {
  calendar: document.getElementById('calendar-view'),
  trainer: document.getElementById('trainer-view'),
  debriefing: document.getElementById('debriefing-view'),
};
const calendarGrid = document.getElementById('calendar-grid');
const currentWeekTitle = document.getElementById('current-week-title');

// Modals
const dailyWorkoutModal = document.getElementById('daily-workout-modal');
const exerciseLibraryModal = document.getElementById('exercise-library-modal');
const modalTitle = document.getElementById('modal-title');
const dailyExercisesList = document.getElementById('daily-exercises-list');
const exerciseLibraryList = document.getElementById('exercise-library-list');

// Trainer View Elements
const trainerView = document.getElementById('trainer-view');
const trainerExerciseTitle = document.getElementById('trainer-exercise-title');
const trainerSeriesCounter = document.getElementById('trainer-series-counter');
const trainerMainDisplay = document.getElementById('trainer-main-display');
const trainerExerciseDescription = document.getElementById('trainer-exercise-description');
const pauseBtn = document.getElementById('trainer-pause-btn');
const resumeBtn = document.getElementById('trainer-resume-btn');
const endBtn = document.getElementById('trainer-end-btn');


// --- View Management ---

/**
 * Shows a specific view and hides all others.
 * @param {string} viewName - The name of the view to show ('calendar', 'trainer', 'debriefing').
 */
export function showView(viewName) {
  for (const key in views) {
    if (key === viewName) {
      views[key].classList.add('view--active');
    } else {
      views[key].classList.remove('view--active');
    }
  }
}

// --- Calendar UI ---

/**
 * Updates the entire calendar display for a given week.
 * @param {Array<Date>} week - An array of 7 Date objects representing the week.
 * @param {function} dayClickHandler - Callback for when a day cell is clicked.
 * @param {function} startWorkoutHandler - Callback for when a start button is clicked.
 */
export function updateCalendar(week, dayClickHandler, startWorkoutHandler) {
  calendarGrid.innerHTML = '';
  const firstDay = week[0];
  const lastDay = week[6];
  currentWeekTitle.textContent = `Settimana ${getFormattedDate(firstDay, { month: 'short', day: 'numeric' })} - ${getFormattedDate(lastDay, { month: 'short', day: 'numeric' })}`;

  week.forEach(date => {
    const dateString = getFormattedDate(date);
    const dayCell = createDayCell(date, dateString, dayClickHandler, startWorkoutHandler);
    calendarGrid.appendChild(dayCell);
  });
}

/**
 * Creates a single day cell element for the calendar.
 * @returns {HTMLElement} The created day cell element.
 */
function createDayCell(date, dateString, dayClickHandler, startWorkoutHandler) {
  const dayCell = document.createElement('div');
  dayCell.className = 'day-cell';
  dayCell.dataset.date = dateString;

  const workouts = storage.getWorkoutsForDate(dateString);
  const workoutCount = workouts.length;
  const hasWorkouts = workoutCount > 0;

  dayCell.innerHTML = `
    <div class="day-header">
      <span class="day-name">${getDayName(date)}</span>
      <span class="day-number">${date.getDate()}</span>
    </div>
    <div class="day-summary">
      ${hasWorkouts ? `${workoutCount} eserciz${workoutCount > 1 ? 'i' : 'o'}` : 'Nessun allenamento'}
    </div>
    <div class="day-actions">
      <button id="start-day-btn" class="btn btn-secondary" ${!hasWorkouts ? 'disabled' : ''}>INIZIA</button>
    </div>
  `;

  // Add event listeners
  dayCell.addEventListener('click', (e) => {
      if (!e.target.closest('.day-actions')) {
          dayClickHandler(dateString);
      }
  });

  dayCell.querySelector('#start-day-btn').addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent day cell click
      startWorkoutHandler(dateString);
  });

  return dayCell;
}

// --- Modal UI ---

export function openDailyWorkoutModal(date, workouts, removeHandler) {
  modalTitle.textContent = `Allenamento del ${getFormattedDate(new Date(date), { weekday: 'long', month: 'long', day: 'numeric' })}`;
  renderDailyExercises(workouts, removeHandler);
  dailyWorkoutModal.style.display = 'flex';
}

export function closeDailyWorkoutModal() {
  dailyWorkoutModal.style.display = 'none';
}

export function openExerciseLibraryModal(selectHandler) {
  renderExerciseLibrary(selectHandler);
  exerciseLibraryModal.style.display = 'flex';
}

export function closeExerciseLibraryModal() {
  exerciseLibraryModal.style.display = 'none';
}

export function renderDailyExercises(workouts, removeHandler) {
  dailyExercisesList.innerHTML = '';
  if (workouts.length === 0) {
    dailyExercisesList.innerHTML = '<li>Nessun esercizio aggiunto.</li>';
    return;
  }
  workouts.forEach(exercise => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${exercise.name}</span>
      <button class="remove-exercise-btn" data-id="${exercise.id}">&times;</button>
    `;
    li.querySelector('.remove-exercise-btn').addEventListener('click', () => removeHandler(exercise.id));
    dailyExercisesList.appendChild(li);
  });
}

function renderExerciseLibrary(selectHandler) {
    exerciseLibraryList.innerHTML = '';
    ALL_EXERCISES.forEach(exercise => {
        const li = document.createElement('li');
        li.textContent = exercise.name;
        li.dataset.id = exercise.id;
        li.addEventListener('click', () => selectHandler(exercise.id));
        exerciseLibraryList.appendChild(li);
    });
}


// --- Trainer UI ---
pauseBtn.addEventListener('click', handleAction);
resumeBtn.addEventListener('click', handleAction);


/**
 * Updates the entire trainer view, except for the controls.
 * @param {object} exercise - The current exercise object.
 * @param {number} currentSeries - The current series number.
 * @param {string} mainDisplayText - Text for the main large display.
 * @param {string} descriptionText - Text for the smaller description area.
 */
export function updateTrainerUI(exercise, currentSeries, mainDisplayText, descriptionText) {
    trainerExerciseTitle.textContent = exercise.name;
    trainerSeriesCounter.textContent = `Serie ${currentSeries} / ${exercise.series}`;
    trainerMainDisplay.textContent = mainDisplayText;
    trainerMainDisplay.classList.remove('is-flashing');
    trainerExerciseDescription.textContent = descriptionText || (exercise.type === 'reps' ? `${exercise.reps} ripetizioni` : `${exercise.duration} secondi`);
}

/**
 * Updates only the main display of the trainer (e.g., for countdowns).
 * @param {string|number} text - The text or number to display.
 * @param {boolean} [isFlashing=false] - Whether to apply the flashing animation.
 */
export function updateTrainerMainDisplay(text, isFlashing = false) {
    trainerMainDisplay.textContent = text;
    if (isFlashing) {
        trainerMainDisplay.classList.add('is-flashing');
    } else {
        trainerMainDisplay.classList.remove('is-flashing');
    }
}

/**
 * Manages the state of the trainer control buttons.
 * @param {'ready' | 'active' | 'paused'} state The current trainer state.
 */
export function updateTrainerControls(state) {
  if (state === 'ready') {
      pauseBtn.textContent = 'INIZIA';
      pauseBtn.style.display = 'inline-block';
      resumeBtn.style.display = 'none';
  } else if (state === 'active') {
      pauseBtn.textContent = 'PAUSA';
      pauseBtn.style.display = 'inline-block';
      resumeBtn.style.display = 'none';
  } else if (state === 'paused') {
      pauseBtn.style.display = 'none';
      resumeBtn.style.display = 'inline-block';
  }
}
