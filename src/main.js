/**
 * @file main.js
 * The main entry point for the application.
 * Orchestrates all other modules.
 */
import * as storage from './storage.js';

/**
 * The main function to initialize the application.
 */
function main() {
  console.log('Application Initialized.');
  console.log('Fetching all workouts from storage:', storage.getWorkouts());
  // Qui inizieremo a orchestrare gli altri moduli (UI, Calendar, etc.)
}

// Initialize the app once the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', main);
