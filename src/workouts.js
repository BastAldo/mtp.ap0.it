/**
 * @file workouts.js
 * Contains the master list of all available exercises in the application.
 */

export const ALL_EXERCISES = [
  {
    id: 'pushup',
    name: 'Push Up',
    type: 'reps',
    series: 3,
    reps: 10,
    rest: 60, // seconds
    tempo: { up: 1, hold: 1, down: 2 } // seconds
  },
  {
    id: 'squat',
    name: 'Squat a corpo libero',
    type: 'reps',
    series: 3,
    reps: 12,
    rest: 60,
    tempo: { up: 1, hold: 0, down: 2 }
  },
  {
    id: 'plank',
    name: 'Plank',
    type: 'time',
    series: 3,
    duration: 45, // seconds
    rest: 45
  },
  {
    id: 'burpees',
    name: 'Burpees',
    type: 'reps',
    series: 4,
    reps: 8,
    rest: 90,
    tempo: { up: 1, hold: 0, down: 1 }
  },
  {
    id: 'jumping_jacks',
    name: 'Jumping Jacks',
    type: 'time',
    series: 2,
    duration: 60,
    rest: 30
  },
  {
    id: 'calf_raises',
    name: 'Calf Raises',
    type: 'reps',
    series: 3,
    reps: 15,
    rest: 45,
    tempo: { up: 1, hold: 1, down: 2 }
  }
];
