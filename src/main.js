/**
 * @file main.js
 * The main entry point for the application.
 * Orchestrates all other modules.
 */
import * as storage from './storage.js';
import { initCalendar } from './calendar.js';
import { initModals } from './modal.js';
import { initTrainerControls } from './ui.js';
import { confirmStart, pauseOrResumeTrainer, terminateTrainer } from './trainer.js';


/**
 * The main function to initialize the application.
 */
function main() {
  console.log('Application Initialized.');
  console.log('Fetching all workouts from storage:', storage.getWorkouts());

  // Initialize all primary components
  initCalendar();
  initModals();
  // Wire up trainer controls once at startup
  initTrainerControls({
    onConfirmStart: confirmStart,
    onPauseResume: pauseOrResumeTrainer,
    onTerminate: terminateTrainer
  });
}

// Initialize the app once the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', main);
