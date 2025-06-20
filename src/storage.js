/**
 * @file storage.js
 * ---
 * Handles all interactions with the browser's localStorage.
 * It's responsible for saving, retrieving, and deleting workout data.
 * The data is stored under a single key, `workoutSchedule`, as a JSON string.
 *
 * Data Structure:
 * {
 * "YYYY-MM-DD": ["exId1", "exId2", ...],
 * "YYYY-MM-DD": ["exId3"],
 * ...
 * }
 */
import { ALL_EXERCISES } from './workouts.js';

const STORAGE_KEY = 'workoutSchedule';

/**
 * Retrieves the entire workout schedule from localStorage.
 * @returns {Object} The schedule object.
 */
function getSchedule() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {};
}

/**
 * Saves the entire workout schedule to localStorage.
 * @param {Object} schedule The schedule object to save.
 */
function saveSchedule(schedule) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
}

/**
 * Retrieves the workout data for a specific date.
 * @param {string} date - The date in 'YYYY-MM-DD' format.
 * @returns {Array<Object>} An array of full exercise objects for the given date.
 */
export function getWorkoutsForDate(date) {
  const schedule = getSchedule();
  const exerciseIds = schedule[date] || [];
  return exerciseIds.map(id => ALL_EXERCISES.find(ex => ex.id === id)).filter(Boolean);
}

/**
 * Adds an exercise to a specific date's workout.
 * @param {string} date - The date in 'YYYY-MM-DD' format.
 * @param {string} exerciseId - The ID of the exercise to add.
 */
export function addWorkoutToDate(date, exerciseId) {
  const schedule = getSchedule();
  if (!schedule[date]) {
    schedule[date] = [];
  }
  if (!schedule[date].includes(exerciseId)) {
    schedule[date].push(exerciseId);
  }
  saveSchedule(schedule);
}

/**
 * Removes an exercise from a specific date's workout.
 * @param {string} date - The date in 'YYYY-MM-DD' format.
 * @param {string} exerciseId - The ID of the exercise to remove.
 */
export function removeWorkoutFromDate(date, exerciseId) {
  const schedule = getSchedule();
  if (schedule[date]) {
    schedule[date] = schedule[date].filter(id => id !== exerciseId);
    // If the day becomes empty, remove the key to keep the storage clean
    if (schedule[date].length === 0) {
      delete schedule[date];
    }
  }
  saveSchedule(schedule);
}
