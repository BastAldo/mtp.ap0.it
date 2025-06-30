/**
 * @file main.js
 * This is the entry point of the application.
 * It handles the orchestration between the UI and the application logic.
 */

import { loadExercises, getSelectedExercises } from './config.js';
import { startTrainer, pause, resume, nextExercise } from './trainer.js';
import { showView } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initial setup
    showView('config');
    loadExercises();

    // Event Listeners
    const startButton = document.getElementById('start-training-button');
    const pauseButton = document.getElementById('pause-button');
    const resumeButton = document.getElementById('resume-button');
    const nextExerciseButton = document.getElementById('next-exercise-button');

    startButton.addEventListener('click', () => {
        const selectedExercises = getSelectedExercises();
        if (selectedExercises.length > 0) {
            startTrainer(selectedExercises);
        } else {
            alert('Please select at least one exercise.');
        }
    });

    pauseButton.addEventListener('click', () => {
        pause();
    });

    resumeButton.addEventListener('click', () => {
        resume();
    });

    nextExerciseButton.addEventListener('click', () => {
      nextExercise();
    });
});
