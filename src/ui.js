/**
 * @file ui.js
 *
 * Responsabile di tutte le manipolazioni dirette del DOM.
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
const trainerExerciseDescription = document.getElementById('trainer-exercise-description');
export const trainerControls = document.getElementById('trainer-controls');
const startSeriesBtn = trainerControls.querySelector('[data-action="start-series"]');
const pauseBtn = trainerControls.querySelector('[data-action="pause"]');
const resumeBtn = trainerControls.querySelector('[data-action="resume"]');

// Elementi Trainer Display (nuovi)
const ringBar = document.getElementById('progress-ring-bar');
const ringRadius = ringBar.r.baseVal.value;
const ringCircumference = 2 * Math.PI * ringRadius;
ringBar.style.strokeDasharray = `${ringCircumference} ${ringCircumference}`;

const displayCountdown = document.getElementById('trainer-display-countdown');
const displayAnnouncement = document.getElementById('trainer-display-announcement');
const countdownNumber = document.getElementById('trainer-countdown-number');
const phaseLabel = document.getElementById('trainer-phase-label');

/** Mostra una vista specifica e nasconde tutte le altre. */
export function showView(viewId) {
    views.forEach(view => {
        view.classList.toggle('view--active', view.id === viewId);
    });
}

function updateProgressRing(percent) {
    const offset = ringCircumference - (percent / 100) * ringCircumference;
    ringBar.style.strokeDashoffset = offset;
}

/** Aggiorna la UI del trainer in base allo stato fornito dalla state machine */
export function updateTrainerUI(state) {
    const { currentExercise, currentSeries, currentState, countdown, phase, progress } = state;

    trainerExerciseName.textContent = currentExercise.name;
    trainerExerciseDescription.textContent = currentExercise.description;
    trainerSeriesCounter.textContent = `Serie ${currentSeries} di ${currentExercise.series || '...'}`;

    const isCountdownState = ['action', 'preparing', 'rest'].includes(currentState);
    const isPausedState = currentState === 'paused';
    const isAnnouncingState = currentState === 'announcing';
    const isReadyState = currentState === 'ready';

    // Gestione visibilità sezioni display
    displayCountdown.style.display = (isCountdownState || isPausedState) ? 'block' : 'none';
    displayAnnouncement.style.display = (isAnnouncingState || isReadyState) ? 'block' : 'none';

    // Gestione lampeggio
    displayAnnouncement.classList.toggle('is-flashing', isAnnouncingState);
    
    // Aggiornamento contenuti e anello
    if (isReadyState) {
        displayAnnouncement.textContent = 'READY';
        updateProgressRing(100); // Anello pieno
    }

    if (isAnnouncingState) {
        displayAnnouncement.textContent = phase.toUpperCase();
        updateProgressRing(0); // Anello vuoto
    }

    if (isCountdownState || isPausedState) {
        countdownNumber.textContent = countdown;
        phaseLabel.textContent = phase.toUpperCase();
        updateProgressRing(progress * 100);
    }
    
    // Gestione pulsanti
    startSeriesBtn.style.display = isReadyState ? 'inline-block' : 'none';
    pauseBtn.style.display = isCountdownState ? 'inline-block' : 'none';
    resumeBtn.style.display = isPausedState ? 'inline-block' : 'none';
}

// --- Funzioni Calendario e Modale (invariate) ---
export function renderCalendar(weekDate, schedule) {
    const startDate = getWeekStartDate(weekDate);
    const weekDays = Array.from({ length: 7 }).map((_, i) => { const day = new Date(startDate); day.setDate(day.getDate() + i); return day; });
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
