/**
 * @file storage.js
 * Handles all interactions with localStorage.
 */

const EXERCISES_KEY = 'workout_exercises';

// Initial default data
const defaultExercises = [
    { id: '1', name: 'Push-up', duration: 30, rest: 15, series: 3 },
    { id: '2', name: 'Squat', duration: 45, rest: 20, series: 3 },
    { id: '3', name: 'Plank', duration: 60, rest: 15, series: 2 },
    { id: '4', name: 'Jumping Jacks', duration: 60, rest: 20, series: 2 }
];

/**
 * Initializes the storage with default exercises if it's empty.
 */
function initializeStorage() {
    if (!localStorage.getItem(EXERCISES_KEY)) {
        localStorage.setItem(EXERCISES_KEY, JSON.stringify(defaultExercises));
    }
}

/**
 * Retrieves all exercises from localStorage.
 * @returns {object[]} An array of exercise objects.
 */
export function getAllExercises() {
    const exercises = localStorage.getItem(EXERCISES_KEY);
    return exercises ? JSON.parse(exercises) : [];
}

/**
 * Saves an array of exercises to localStorage.
 * @param {object[]} exercises - The array of exercises to save.
 */
export function saveExercises(exercises) {
    localStorage.setItem(EXERCISES_KEY, JSON.stringify(exercises));
}

/**
 * Retrieves a single exercise by its ID.
 * @param {string} id - The ID of the exercise.
 * @returns {object | undefined} The exercise object or undefined if not found.
 */
export function getExerciseById(id) {
    const exercises = getAllExercises();
    return exercises.find(ex => ex.id === id);
}

// Initialize storage on load
initializeStorage();
