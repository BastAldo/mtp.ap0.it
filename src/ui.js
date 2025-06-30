/**
 * @file ui.js
 *
 * Responsabile di tutte le manipolazioni dirette del DOM.
 * Nessun altro modulo dovrebbe accedere a document.getElementById o simili.
 */

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
