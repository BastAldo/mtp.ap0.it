import { initializeAudio } from './audio.js';
import { initCalendar } from './calendar.js';
import { initModals, openDailyWorkoutModal } from './modals.js';
import { startTrainer } from './trainer.js';

function initializeApp() {
  initializeAudio();
  initCalendar();
  initModals();

  // --- Event Delegation ---
  const calendarGrid = document.getElementById('calendar-grid');
  calendarGrid.addEventListener('click', (event) => {
    const target = event.target;
    const dayCell = target.closest('.day-cell');

    if (!dayCell) return;

    if (target.classList.contains('btn-start')) {
      // Cliccato "INIZIA"
      // Logica placeholder per ottenere gli esercizi del giorno
      const exerciseIds = ['pushups', 'squats', 'plank'];
      startTrainer(exerciseIds);
    } else {
      // Cliccato sulla cella per modificare
      const date = dayCell.dataset.date;
      openDailyWorkoutModal(date);
    }
  });
}

// Wait for the DOM to be fully loaded before running the app
document.addEventListener('DOMContentLoaded', initializeApp);
