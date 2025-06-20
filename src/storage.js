/**
 * @file storage.js
 * Handles all interactions with the browser's localStorage.
 * This is the single source of truth for data persistence.
 */

const WORKOUTS_KEY = 'mio_trainer_workouts';

/**
 * Retrieves the entire workouts object from localStorage.
 * @returns {Object} The workouts object, or an empty object if none exists.
 */
export function getWorkouts() {
  try {
    const workouts = localStorage.getItem(WORKOUTS_KEY);
    return workouts ? JSON.parse(workouts) : {};
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return {};
  }
}

/**
 * Saves the entire workouts object to localStorage.
 * @param {Object} workouts - The workouts object to save.
 */
export function saveWorkouts(workouts) {
  try {
    localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
  } catch (error) {
    console.error("Error writing to localStorage:", error);
  }
}

/**
 * Retrieves the list of exercises for a specific date key.
 * @param {string} dateKey - The date in 'YYYY-MM-DD' format.
 * @returns {Array} An array of exercise IDs for the given date, or an empty array.
 */
export function getWorkoutsForDate(dateKey) {
  const workouts = getWorkouts();
  return workouts[dateKey] || [];
}

/**
 * Saves a list of exercises for a specific date key.
 * @param {string} dateKey - The date in 'YYYY-MM-DD' format.
 * @param {Array} exercises - An array of exercise objects to save for the given date.
 */
export function saveWorkoutsForDate(dateKey, exercises) {
  const workouts = getWorkouts();
  workouts[dateKey] = exercises;
  saveWorkouts(workouts);
}
