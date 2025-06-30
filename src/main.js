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
 * Gestisce gli eventi di click per la navigazione del calendario.
 * @param {Event} event
 */
function handleCalendarNavigation(event) {
    const targetId = event.target.id;

    if (targetId === 'prev-week-btn') {
        state.currentDate.setDate(state.currentDate.getDate() - 7);
        appCycle();
    }

    if (targetId === 'next-week-btn') {
        state.currentDate.setDate(state.currentDate.getDate() + 7);
        appCycle();
    }
}

function init() {
    console.log("MTP App Initialized.");

    // Aggiungi i listener degli eventi principali
    ui.calendarView.addEventListener('click', handleCalendarNavigation);

    // Carica i dati salvati e loggali per verifica
    const schedule = store.getSchedule();
    console.log("Loaded schedule from store:", schedule);
    console.log("Available exercises from config:", EXERCISES);

    // Mostra la vista iniziale ed esegui il primo rendering
    ui.showView('calendar-view');
    appCycle();
}

// Assicurati che il DOM sia completamente caricato prima di eseguire la logica
document.addEventListener('DOMContentLoaded', init);
