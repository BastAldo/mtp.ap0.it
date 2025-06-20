/**
 * @file main.js
 * The main entry point for the application.
 * Orchestrates all other modules.
 */
import { initCalendar } from './calendar.js';
import { initModals } from './modal.js';
import { initTrainerControls } from './ui.js';
import { confirmStart, pauseOrResumeTrainer, terminateTrainer } from './trainer.js';
import { initDebriefing } from './debriefing.js';

/**
 * The main function to initialize the application.
 */
function main() {
  console.log('Application Initialized.');
  
  // Initialize all primary components
  initCalendar();
  initModals();
  initDebriefing();
  initTrainerControls({
    onConfirmStart: confirmStart,
    onPauseResume: pauseOrResumeTrainer,
    onTerminate: terminateTrainer
  });
}

// Initialize the app once the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', main);
