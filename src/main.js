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

function init() {
    console.log("MTP App Initialized.");

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
