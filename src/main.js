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
import * as trainer from './trainer.js';

/**
 * Il ciclo di rendering principale dell'applicazione.
 * Viene chiamato ogni volta che lo stato cambia per aggiornare la UI.
 */
function appCycle() {
    const schedule = store.getSchedule();
    ui.renderCalendar(state.currentDate, schedule);
}

/**
 * Gestisce tutti i click sulla vista calendario (navigazione, start, apertura modale).
 * @param {Event} event
 */
function handleCalendarClick(event) {
    const target = event.target;
    
    // Caso 1: Click sui pulsanti di navigazione della settimana
    if (target.id === 'prev-week-btn' || target.id === 'next-week-btn') {
        state.currentDate.setDate(state.currentDate.getDate() + (target.id === 'next-week-btn' ? 7 : -7));
        appCycle();
        return;
    }
    
    const dayCell = target.closest('.day-cell');
    if (!dayCell) return; // Esce se il click non è in una cella (es. nello spazio tra le celle)
    
    const dateKey = dayCell.dataset.date;
    
    // Caso 2: Click sul pulsante START
    if (target.matches('.btn-secondary')) {
        const schedule = store.getSchedule();
        const exerciseIds = schedule[dateKey] || [];
        if (exerciseIds.length > 0) {
            ui.showView('trainer-view');
            trainer.start(exerciseIds);
        }
        return; // Esce per non aprire la modale
    }

    // Caso 3: Click su qualsiasi altra parte della cella per aprire la modale
    state.selectedDateKey = dateKey;
    const schedule = store.getSchedule();
    ui.renderDailyWorkoutModal(dateKey, schedule);
    ui.openModal();
}

/**
 * Gestisce tutti i click all'interno del sistema di modali.
 * @param {Event} event
 */
function handleModalClick(event) {
    const target = event.target;
    if (target.id === 'modal-overlay') {
        ui.closeModal();
        return;
    }

    const action = target.dataset.action;
    if (!action) return;

    switch (action) {
        case 'close-modal': ui.closeModal(); break;
        case 'show-library': ui.renderExerciseLibraryModal(state.selectedDateKey); break;
        case 'add-exercise': {
            const exerciseId = target.dataset.exerciseId;
            store.addExerciseToDate(state.selectedDateKey, exerciseId);
            ui.renderDailyWorkoutModal(state.selectedDateKey, store.getSchedule());
            appCycle();
            break;
        }
        case 'remove-exercise': {
            const exerciseId = target.dataset.exerciseId;
            store.removeExerciseFromDate(state.selectedDateKey, exerciseId);
            ui.renderDailyWorkoutModal(state.selectedDateKey, store.getSchedule());
            appCycle();
            break;
        }
    }
}

/**
 * Gestisce i click sui controlli del trainer.
 * @param {Event} event 
 */
function handleTrainerControls(event) {
    const action = event.target.dataset.action;
    if (!action) return;

    switch (action) {
        case 'start-series': trainer.startSeries(); break;
        case 'pause': trainer.pause(); break;
        case 'resume': trainer.resume(); break;
        case 'stop': trainer.stop(); break;
    }
}

function init() {
    console.log("MTP App Initialized.");
    // Aggiungi i listener degli eventi principali
    ui.calendarView.addEventListener('click', handleCalendarClick);
    ui.modalOverlay.addEventListener('click', handleModalClick);
    ui.trainerControls.addEventListener('click', handleTrainerControls);

    // Esegui il primo rendering
    appCycle();
    ui.showView('calendar-view');
}

document.addEventListener('DOMContentLoaded', init);
