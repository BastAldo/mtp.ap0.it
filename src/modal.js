/**
 * @file modal.js
 * Handles all logic for the workout editor and exercise library modals.
 */
import * as storage from './storage.js';
import { ALL_EXERCISES } from './workouts.js';
import { renderCalendar } from './calendar.js';

// DOM Elements
const dayModal = document.getElementById('day-modal');
const libraryModal = document.getElementById('library-modal');
const modalDateTitle = document.getElementById('modal-date-title');
const modalExerciseList = document.getElementById('modal-exercise-list');
const libraryExerciseList = document.getElementById('library-exercise-list');
const addExerciseBtn = document.getElementById('add-exercise-btn');
const addAllBtn = document.getElementById('add-all-btn');
const closeDayModalBtn = document.getElementById('close-day-modal-btn');
const closeLibraryModalBtn = document.getElementById('close-library-modal-btn');

// State
let currentEditingDateKey = null;

function renderDayExercises() {
  modalExerciseList.innerHTML = '';
  const exercises = storage.getWorkoutsForDate(currentEditingDateKey);
  if (exercises.length === 0) {
    modalExerciseList.innerHTML = `<li class="empty-list-item">Aggiungi un esercizio per iniziare.</li>`;
    return;
  }

  exercises.forEach((exercise, index) => {
    const li = document.createElement('li');
    li.className = 'modal-list-item';
    li.innerHTML = `
      <span>${exercise.name}</span>
      <button class="btn btn-danger remove-exercise-btn" data-index="${index}">Rimuovi</button>
    `;
    modalExerciseList.appendChild(li);
  });
}

function renderLibrary() {
  libraryExerciseList.innerHTML = '';
  ALL_EXERCISES.forEach(exercise => {
    const li = document.createElement('li');
    li.className = 'modal-list-item';
    li.innerHTML = `
      <span>${exercise.name}</span>
      <button class="btn btn-success add-from-library-btn" data-id="${exercise.id}">Aggiungi</button>
    `;
    libraryExerciseList.appendChild(li);
  });
}

export function openDayModal(dateKey) {
  currentEditingDateKey = dateKey;
  const date = new Date(dateKey + 'T00:00:00'); // Ensure correct date object
  modalDateTitle.textContent = `Allenamento per ${date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}`;
  renderDayExercises();
  dayModal.style.display = 'flex';
}

function closeDayModal() {
  dayModal.style.display = 'none';
  renderCalendar();
}

function openLibraryModal() {
  renderLibrary();
  libraryModal.style.display = 'flex';
}

function closeLibraryModal() {
  libraryModal.style.display = 'none';
}

export function initModals() {
  closeDayModalBtn.addEventListener('click', closeDayModal);
  closeLibraryModalBtn.addEventListener('click', closeLibraryModal);
  addExerciseBtn.addEventListener('click', openLibraryModal);

  addAllBtn.addEventListener('click', () => {
    storage.saveWorkoutsForDate(currentEditingDateKey, ALL_EXERCISES);
    renderDayExercises();
  });

  modalExerciseList.addEventListener('click', (event) => {
    if (event.target.matches('.remove-exercise-btn')) {
      const indexToRemove = parseInt(event.target.dataset.index, 10);
      const exercises = storage.getWorkoutsForDate(currentEditingDateKey);
      exercises.splice(indexToRemove, 1);
      storage.saveWorkoutsForDate(currentEditingDateKey, exercises);
      renderDayExercises();
    }
  });

  libraryExerciseList.addEventListener('click', (event) => {
    if (event.target.matches('.add-from-library-btn')) {
      const exerciseId = event.target.dataset.id;
      const exerciseToAdd = ALL_EXERCISES.find(ex => ex.id === exerciseId);
      if (exerciseToAdd) {
        const currentExercises = storage.getWorkoutsForDate(currentEditingDateKey);
        // Avoid duplicates
        if (!currentExercises.some(ex => ex.id === exerciseId)) {
          currentExercises.push(exerciseToAdd);
          storage.saveWorkoutsForDate(currentEditingDateKey, currentExercises);
        }
      }
      renderDayExercises();
      closeLibraryModal();
    }
  });
}
