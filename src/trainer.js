/**
 * @file trainer.js
 * Contains the entire state machine logic for the training session.
 * It is completely decoupled from the DOM.
 */
import * as ui from './ui.js';

const PREPARATION_TIME = 5;

// Application states
const State = {
    IDLE: 'IDLE',
    PREPARING: 'PREPARING',
    WORKING: 'WORKING',
    RESTING: 'RESTING',
    PAUSED: 'PAUSED',
    EXERCISE_COMPLETED: 'EXERCISE_COMPLETED',
    WORKOUT_COMPLETED: 'WORKOUT_COMPLETED',
};

let currentState = State.IDLE;
let pausedState = null;

let exercises = [];
let currentExerciseIndex = 0;
let currentSeries = 1;
let countdown = 0;
let intervalId = null;

function getCurrentExercise() {
    return exercises[currentExerciseIndex];
}

function tick() {
    countdown--;
    updateUI();

    if (countdown <= 0) {
        transitionToNextState();
    }
}

function transitionToNextState() {
    const exercise = getCurrentExercise();
    switch (currentState) {
        case State.PREPARING:
            currentState = State.WORKING;
            countdown = exercise.duration;
            break;

        case State.WORKING:
            if (currentSeries < exercise.series) {
                currentState = State.RESTING;
                countdown = exercise.rest;
                currentSeries++;
            } else {
                // Exercise finished
                clearInterval(intervalId);
                intervalId = null;
                currentState = State.EXERCISE_COMPLETED;
            }
            break;

        case State.RESTING:
            currentState = State.WORKING;
            countdown = exercise.duration;
            break;
    }
    updateUI();
}

function updateUI() {
    const exercise = getCurrentExercise();
    const isPaused = currentState === State.PAUSED;

    let statusMessage = currentState;
    if(currentState === State.PREPARING) statusMessage = `Get Ready: ${exercise.name}`;
    if(currentState === State.WORKING) statusMessage = 'Work!';
    if(currentState === State.RESTING) statusMessage = 'Rest';
    if(currentState === State.PAUSED) statusMessage = 'Paused';
    if(currentState === State.EXERCISE_COMPLETED) statusMessage = `Exercise '${exercise.name}' Complete!`;
    if(currentState === State.WORKOUT_COMPLETED) statusMessage = `Workout Complete!`;


    ui.updateTrainerUI({
        exerciseName: exercise.name,
        currentSeries: currentSeries,
        totalSeries: exercise.series,
        time: countdown,
        statusMessage: statusMessage,
        isLastExercise: currentExerciseIndex >= exercises.length - 1,
        isExerciseCompleted: currentState === State.EXERCISE_COMPLETED,
        isWorkoutCompleted: currentState === State.WORKOUT_COMPLETED,
    });
    ui.togglePause(isPaused);
}

function startInterval() {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(tick, 1000);
}

// --- Public API ---

export function startTrainer(exerciseConfigs) {
    exercises = exerciseConfigs;
    currentExerciseIndex = 0;
    currentSeries = 1;
    currentState = State.PREPARING;
    countdown = PREPARATION_TIME;

    ui.showView('trainer');
    updateUI();
    startInterval();
}

export function pause() {
    if (currentState !== State.WORKING && currentState !== State.RESTING && currentState !== State.PREPARING) return;
    clearInterval(intervalId);
    pausedState = currentState;
    currentState = State.PAUSED;
    updateUI();
}

export function resume() {
    if (currentState !== State.PAUSED) return;
    currentState = pausedState;
    pausedState = null;
    updateUI();
    startInterval();
}

export function nextExercise() {
  if (currentState !== State.EXERCISE_COMPLETED) return;

  if (currentExerciseIndex < exercises.length - 1) {
      currentExerciseIndex++;
      currentSeries = 1;
      currentState = State.PREPARING;
      countdown = PREPARATION_TIME;
      updateUI();
      startInterval();
  } else {
      currentState = State.WORKOUT_COMPLETED;
      updateUI();
  }
}
