/**
 * @file ui.js
 *
 * Responsabile di tutte le manipolazioni dirette del DOM.
 * Nessun altro modulo dovrebbe accedere a document.getElementById o simili.
 */
import { getWeekStartDate, formatDate, formatDateForDisplay } from './utils.js';
import { EXERCISES } from './config.js';

// --- Elementi DOM ---
const views = document.querySelectorAll('.view');
export const calendarView = document.getElementById('calendar-view');
export const trainerView = document.getElementById('trainer-view');
export const debriefingView = document.getElementById('debriefing-view');
export const modalOverlay = document.getElementById('modal-overlay');
const modalContent = document.getElementById('modal-content');

// Elementi Trainer
const trainerExerciseName = document.getElementById('trainer-exercise-name');
const trainerSeriesCounter = document.getElementById('trainer-series-counter');
const trainerMainDisplay = document.getElementById('trainer-main-display');
const trainerExerciseDescription = document.getElementById('trainer-exercise-description');
export const trainerControls = document.getElementById('trainer-controls');
const startSeriesBtn = trainerControls.querySelector('[data-action="start-series"]');
const pauseBtn = trainerControls.querySelector('[data-action="pause"]');
const resumeBtn = trainerControls.querySelector('[data-action="resume"]');

/**
 * Mostra una vista specifica e nasconde tutte le altre.
 * @param {string} viewId
 */
export function showView(viewId) {
    views.forEach(view => {
        view.classList.toggle('view--active', view.id === viewId);
    });
}

/** Aggiorna la UI del trainer in base allo stato fornito dalla state machine */
export function updateTrainerUI(state) {
    const { currentExercise, currentSeries, currentState, countdown, phase } = state;

    trainerExerciseName.textContent = currentExercise.name;
    trainerExerciseDescription.textContent = currentExercise.description;

    if (currentState === 'ready') {
        trainerSeriesCounter.textContent = `Serie 1 di ${currentExercise.series || '...'}`;
        trainerMainDisplay.textContent = 'READY';
        trainerMainDisplay.classList.remove('is-flashing');
        startSeriesBtn.style.display = 'inline-block';
        pauseBtn.style.display = 'none';
        resumeBtn.style.display = 'none';
    } else {
        trainerSeriesCounter.textContent = `Serie ${currentSeries} di ${currentExercise.series || '...'}`;
        startSeriesBtn.style.display = 'none';
    }

    if (currentState === 'announcing') {
        trainerMainDisplay.textContent = phase.toUpperCase();
        trainerMainDisplay.classList.add('is-flashing');
    } else {
        trainerMainDisplay.classList.remove('is-flashing');
    }

    if (currentState === 'action' || currentState === 'preparing' || currentState === 'rest') {
        trainerMainDisplay.textContent = countdown;
        pauseBtn.style.display = 'inline-block';
        resumeBtn.style.display = 'none';
    }

    if (currentState === 'paused') {
        trainerMainDisplay.textContent = countdown;
        pauseBtn.style.display = 'none';
        resumeBtn.style.display = 'inline-block';
    }
}

// --- Funzioni Calendario e Modale ---
export function renderCalendar(weekDate, schedule) {
    const startDate = getWeekStartDate(weekDate);
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const day = new Date(startDate);
        day.setDate(day.getDate() + i);
        return day;
    });
    let headerHtml = `<div class="calendar-header"><button class="btn" id="prev-week-btn">&lt; Precedente</button><h2>Settimana del ${formatDateForDisplay(startDate)}</h2><button class="btn" id="next-week-btn">Successiva &gt;</button></div>`;
    let gridHtml = '<div class="calendar-grid">';
    weekDays.forEach(day => {
        const dateKey = formatDate(day);
        const daySchedule = schedule[dateKey] || [];
        const exerciseCount = daySchedule.length;
        gridHtml += `<div class="day-cell" data-date="${dateKey}"><div class="day-cell-header"><span class="day-name">${day.toLocaleDateString('it-IT', { weekday: 'long' }).toUpperCase()}</span><span class="day-number">${day.getDate()}</span></div><div class="day-cell-body"><p>${exerciseCount > 0 ? `${exerciseCount} esercizi` : 'Nessun allenamento'}</p></div><div class="day-cell-footer"><button class="btn btn-secondary" ${exerciseCount === 0 ? 'disabled' : ''}>START</button></div></div>`;
    });
    gridHtml += '</div>';
    calendarView.innerHTML = headerHtml + gridHtml;
}
export function openModal() { modalOverlay.classList.add('modal-overlay--active'); }
export function closeModal() { modalOverlay.classList.remove('modal-overlay--active'); }
export function renderDailyWorkoutModal(dateKey, schedule) {
    const scheduledIds = schedule[dateKey] || [];
    const scheduledExercises = scheduledIds.map(id => EXERCISES.find(ex => ex.id === id));
    let listItems = scheduledExercises.map(ex => `<li class="modal-list-item"><span>${ex.name}</span><button class="btn btn-danger" data-action="remove-exercise" data-exercise-id="${ex.id}">Rimuovi</button></li>`).join('');
    if (scheduledExercises.length === 0) { listItems = '<p>Nessun esercizio pianificato per oggi.</p>'; }
    modalContent.innerHTML = `<h3>Allenamento del ${dateKey}</h3><ul class="modal-list">${listItems}</ul><div class="modal-actions"><button class="btn btn-primary" data-action="show-library">Aggiungi Esercizio</button><button class="btn" data-action="close-modal">Chiudi</button></div>`;
}
export function renderExerciseLibraryModal() {
    let listItems = EXERCISES.map(ex => `<li class="modal-list-item"><div><strong>${ex.name}</strong><p style="color: var(--text-secondary); font-size: 0.9em;">${ex.description}</p></div><button class="btn btn-secondary" data-action="add-exercise" data-exercise-id="${ex.id}">Aggiungi</button></li>`).join('');
    modalContent.innerHTML = `<h3>Libreria Esercizi</h3><ul class="modal-list">${listItems}</ul><div class="modal-actions"><button class="btn" data-action="close-modal">Chiudi</button></div>`;
}
