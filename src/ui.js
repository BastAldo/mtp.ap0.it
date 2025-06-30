/**
 * @file ui.js
 *
 * Responsabile di tutte le manipolazioni dirette del DOM.
 * Nessun altro modulo dovrebbe accedere a document.getElementById o simili.
 */
import { getWeekStartDate, formatDate, formatDateForDisplay } from './utils.js';
import { EXERCISES } from './config.js';

// Riferimenti agli elementi principali della UI
const views = document.querySelectorAll('.view');
export const calendarView = document.getElementById('calendar-view');
export const trainerView = document.getElementById('trainer-view');
export const debriefingView = document.getElementById('debriefing-view');
export const modalOverlay = document.getElementById('modal-overlay');
const modalContent = document.getElementById('modal-content');

/**
 * Mostra una vista specifica e nasconde tutte le altre.
 * @param {string} viewId L'ID della vista da mostrare (es. 'calendar-view').
 */
export function showView(viewId) {
    views.forEach(view => {
        view.classList.remove('view--active');
        if (view.id === viewId) {
            view.classList.add('view--active');
        }
    });
}

/**
 * Genera l'HTML per la vista del calendario per una data settimana.
 * @param {Date} weekDate Una data qualsiasi all'interno della settimana da visualizzare.
 * @param {object} schedule L'oggetto con gli allenamenti pianificati.
 */
export function renderCalendar(weekDate, schedule) {
    const startDate = getWeekStartDate(weekDate);
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const day = new Date(startDate);
        day.setDate(day.getDate() + i);
        return day;
    });

    let headerHtml = `
        <div class="calendar-header">
            <button class="btn" id="prev-week-btn">&lt; Precedente</button>
            <h2>Settimana del ${formatDateForDisplay(startDate)}</h2>
            <button class="btn" id="next-week-btn">Successiva &gt;</button>
        </div>`;

    let gridHtml = '<div class="calendar-grid">';
    weekDays.forEach(day => {
        const dateKey = formatDate(day);
        const daySchedule = schedule[dateKey] || [];
        const exerciseCount = daySchedule.length;

        gridHtml += `
            <div class="day-cell" data-date="${dateKey}">
                <div class="day-cell-header">
                    <span class="day-name">${day.toLocaleDateString('it-IT', { weekday: 'long' }).toUpperCase()}</span>
                    <span class="day-number">${day.getDate()}</span>
                </div>
                <div class="day-cell-body">
                    <p>${exerciseCount > 0 ? `${exerciseCount} esercizi` : 'Nessun allenamento'}</p>
                </div>
                <div class="day-cell-footer">
                    <button class="btn btn-secondary" ${exerciseCount === 0 ? 'disabled' : ''}>START</button>
                </div>
            </div>
        `;
    });
    gridHtml += '</div>';

    calendarView.innerHTML = headerHtml + gridHtml;
}

/** Apre la modale */
export function openModal() {
    modalOverlay.classList.add('modal-overlay--active');
}

/** Chiude la modale */
export function closeModal() {
    modalOverlay.classList.remove('modal-overlay--active');
}

/**
 * Renderizza la modale che mostra gli esercizi del giorno.
 * @param {string} dateKey - La data YYYY-MM-DD.
 * @param {object} schedule - L'oggetto schedule completo.
 */
export function renderDailyWorkoutModal(dateKey, schedule) {
    const scheduledIds = schedule[dateKey] || [];
    const scheduledExercises = scheduledIds.map(id => EXERCISES.find(ex => ex.id === id));

    let listItems = scheduledExercises.map(ex => `
        <li class="modal-list-item">
            <span>${ex.name}</span>
            <button class="btn btn-danger" data-action="remove-exercise" data-exercise-id="${ex.id}">Rimuovi</button>
        </li>
    `).join('');

    if (scheduledExercises.length === 0) {
        listItems = '<p>Nessun esercizio pianificato per oggi.</p>';
    }

    modalContent.innerHTML = `
        <h3>Allenamento del ${dateKey}</h3>
        <ul class="modal-list">${listItems}</ul>
        <div class="modal-actions">
            <button class="btn btn-primary" data-action="show-library">Aggiungi Esercizio</button>
            <button class="btn" data-action="close-modal">Chiudi</button>
        </div>
    `;
}

/** Renderizza la modale che mostra la libreria di esercizi. */
export function renderExerciseLibraryModal() {
    let listItems = EXERCISES.map(ex => `
        <li class="modal-list-item">
            <div>
                <strong>${ex.name}</strong>
                <p style="color: var(--text-secondary); font-size: 0.9em;">${ex.description}</p>
            </div>
            <button class="btn btn-secondary" data-action="add-exercise" data-exercise-id="${ex.id}">Aggiungi</button>
        </li>
    `).join('');

    modalContent.innerHTML = `
        <h3>Libreria Esercizi</h3>
        <ul class="modal-list">${listItems}</ul>
        <div class="modal-actions">
            <button class="btn" data-action="close-modal">Chiudi</button>
        </div>
    `;
}
