/**
 * @file config.js
 * Manages the workout configuration screen.
 */
import * as storage from './storage.js';

const exercisesList = document.getElementById('exercises-list');

/**
 * Loads all exercises from storage and displays them in the list.
 */
export function loadExercises() {
    const exercises = storage.getAllExercises();
    exercisesList.innerHTML = ''; // Clear existing list
    exercises.forEach(exercise => {
        const li = document.createElement('li');
        li.innerHTML = `
            <input type="checkbox" id="ex-${exercise.id}" data-exercise-id="${exercise.id}">
            <label for="ex-${exercise.id}">${exercise.name}</label>
        `;
        exercisesList.appendChild(li);
    });
}

/**
 * Gets the selected exercises from the checkboxes.
 * @returns {object[]} An array of the selected exercise objects.
 */
export function getSelectedExercises() {
    const selectedCheckboxes = exercisesList.querySelectorAll('input[type="checkbox"]:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.exerciseId);

    // Get the full exercise objects from storage based on the selected IDs
    return selectedIds.map(id => storage.getExerciseById(id)).filter(ex => ex);
}
