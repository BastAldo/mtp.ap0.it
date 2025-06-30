/**
 * @file ui.js
 *
 * Responsabile di tutte le manipolazioni dirette del DOM.
 * Nessun altro modulo dovrebbe accedere a document.getElementById o simili.
 */
import { getWeekStartDate, formatDate, formatDateForDisplay } from './utils.js';

// Riferimenti agli elementi principali della UI
const views = document.querySelectorAll('.view');
export const calendarView = document.getElementById('calendar-view');
export const trainerView = document.getElementById('trainer-view');
export const debriefingView = document.getElementById('debriefing-view');

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
