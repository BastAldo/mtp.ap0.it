/**
 * @file workouts.js
 * ---
 * Defines the complete list of all available exercises in the application.
 * This acts as the central database of workouts.
 *
 * Each exercise object has the following structure:
 * - id: A unique string identifier.
 * - name: The display name of the exercise.
 * - type: 'reps' or 'time'.
 *
 * For 'reps' type:
 * - series: Number of sets.
 * - reps: Number of repetitions per set.
 * - rest: Rest time in seconds between sets.
 * - tempo: An object { up, hold, down } defining the time in seconds for each phase of a rep.
 *
 * For 'time' type:
 * - series: Number of sets.
 * - duration: Duration in seconds for each set.
 * - rest: Rest time in seconds between sets.
 */

export const ALL_EXERCISES = [
  {
    id: 'fakepushup',
    name: 'fake Piegamenti sulle braccia',
    type: 'reps',
    series: 1,
    reps: 1,
    rest: 6,
    tempo: { up: 1, hold: 0, down: 2 },
  },
  {
    id: 'squat',
    name: 'Squat a corpo libero',
    type: 'reps',
    series: 3,
    reps: 12,
    rest: 60,
    tempo: { up: 1, hold: 0, down: 2 },
  },
  {
    id: 'pushup',
    name: 'Piegamenti sulle braccia',
    type: 'reps',
    series: 3,
    reps: 10,
    rest: 60,
    tempo: { up: 1, hold: 0, down: 2 },
  },
  {
    id: 'plank',
    name: 'Plank',
    type: 'time',
    series: 3,
    duration: 45, // seconds
    rest: 45,
  },
  {
    id: 'lunges',
    name: 'Affondi',
    type: 'reps',
    series: 3,
    reps: 10, // per gamba
    rest: 60,
    tempo: { up: 1, hold: 0, down: 1 },
  },
  {
    id: 'jumping_jacks',
    name: 'Jumping Jacks',
    type: 'time',
    series: 1,
    duration: 60,
    rest: 0,
  },
  {
    id: 'burpees',
    name: 'Burpees',
    type: 'reps',
    series: 3,
    reps: 8,
    rest: 90,
    tempo: null, // Not tempo-based
  },
];
