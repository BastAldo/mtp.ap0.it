/**
 * @file main.js
 *
 * Punto di ingresso principale dell'applicazione "Mio Trainer Personale".
 * Orchestra i vari moduli (UI, stato, logica, etc.).
 */
import * as ui from './ui.js';
import * as store from './store.js';
import { EXERCISES } from './config.js';
import { state } from './state.js';

/**
 * Il ciclo di rendering principale dell'applicazione.
 * Viene chiamato ogni volta che lo stato cambia per aggiornare la UI.
 */
function appCycle() {
    const schedule = store.getSchedule();
    ui.renderCalendar(state.currentDate, schedule);
}

/**
 * Gestisce i click sulla vista calendario (navigazione e apertura modale).
 * @param {Event} event
 */
function handleCalendarClick(event) {
    const target = event.target;
    const dayCell = target.closest('.day-cell');

    if (target.id === 'prev-week-btn') {
        state.currentDate.setDate(state.currentDate.getDate() - 7);
        appCycle();
        return;
    }

    if (target.id === 'next-week-btn') {
        state.currentDate.setDate(state.currentDate.getDate() + 7);
        appCycle();
        return;
    }

    // Se il click è su una cella ma non sul pulsante START, apri la modale
    if (dayCell && !target.classList.contains('btn-secondary')) {
        const dateKey = dayCell.dataset.date;
        state.selectedDateKey = dateKey;
        const schedule = store.getSchedule();
        ui.renderDailyWorkoutModal(dateKey, schedule);
        ui.openModal();
    }
}

/**
 * Gestisce tutti i click all'interno del sistema di modali.
 * @param {Event} event
 */
function handleModalClick(event) {
    const target = event.target;
    const schedule = store.getSchedule();

    // Chiudi modale se si clicca sull'overlay
    if (target.id === 'modal-overlay') {
        ui.closeModal();
        return;
    }

    // Logica per i pulsanti all'interno della modale
    const action = target.dataset.action;
    if (!action) return;

    switch (action) {
        case 'close-modal':
            ui.closeModal();
            break;
        case 'show-library':
            ui.renderExerciseLibraryModal(state.selectedDateKey);
            break;
        case 'add-exercise':
            {
                const exerciseId = target.dataset.exerciseId;
                store.addExerciseToDate(state.selectedDateKey, exerciseId);
                ui.renderDailyWorkoutModal(state.selectedDateKey, store.getSchedule()); // Ricarica la modale
                appCycle(); // Aggiorna il calendario in background
                break;
            }
        case 'remove-exercise':
            {
                const exerciseId = target.dataset.exerciseId;
                store.removeExerciseFromDate(state.selectedDateKey, exerciseId);
                ui.renderDailyWorkoutModal(state.selectedDateKey, store.getSchedule()); // Ricarica la modale
                appCycle(); // Aggiorna il calendario in background
                break;
            }
    }
}

function init() {
    console.log("MTP App Initialized.");

    // Aggiungi i listener degli eventi principali
    ui.calendarView.addEventListener('click', handleCalendarClick);
    ui.modalOverlay.addEventListener('click', handleModalClick);

    // Esegui il primo rendering
    appCycle();
    ui.showView('calendar-view');
}

// Assicurati che il DOM sia completamente caricato prima di eseguire la logica
document.addEventListener('DOMContentLoaded', init);
