/**
 * @file ui.js
 * Responsabile di tutte le manipolazioni dirette del DOM.
 * Offre funzioni semplici che gli altri moduli possono chiamare
 * senza conoscere la struttura dell'HTML.
 */

// Elementi Vista Trainer
const trainerView = document.getElementById('trainer-view');
const exerciseTitle = document.getElementById('exercise-title');
const seriesCounter = document.getElementById('series-counter');
const trainerMainDisplay = document.getElementById('trainer-main-display');
const exerciseDescription = document.getElementById('exercise-description');

// Elementi Vista Calendario
const calendarView = document.getElementById('calendar-view');

/**
 * Mostra una vista specifica e nasconde le altre.
 * @param {'trainer' | 'calendar'} viewName
 */
export function showView(viewName) {
  calendarView.classList.toggle('view--active', viewName === 'calendar');
  trainerView.classList.toggle('view--active', viewName === 'trainer');
}

/**
 * Aggiorna l'intera UI del trainer con i dati di un esercizio.
 * @param {object} exercise - L'oggetto dell'esercizio.
 * @param {number} currentSeries - Il numero della serie corrente.
 */
export function updateTrainerUI(exercise, currentSeries) {
  exerciseTitle.textContent = exercise.name;
  seriesCounter.textContent = `SERIE ${currentSeries} / ${exercise.series}`;
  exerciseDescription.textContent = exercise.description;
}

/**
 * Aggiorna il display principale del trainer (es. timer, testo).
 * @param {string} text
 */
export function setMainDisplayText(text) {
  trainerMainDisplay.textContent = text;
}

/**
 * Applica o rimuove l'effetto flash dal display principale.
 * @param {boolean} flashing
 */
export function setFlashing(flashing) {
  trainerMainDisplay.classList.toggle('is-flashing', flashing);
}
