/**
 * @file main.js
 *
 * Punto di ingresso principale dell'applicazione "Mio Trainer Personale".
 * Orchestra i vari moduli (UI, stato, logica, etc.).
 */
import * as ui from './ui.js';
import * as store from './store.js';
import { EXERCISES } from './config.js';

function init() {
    console.log("MTP App Initialized.");

    // Carica i dati salvati e loggali per verifica
    const schedule = store.getSchedule();
    console.log("Loaded schedule from store:", schedule);
    console.log("Available exercises from config:", EXERCISES);

    // Mostra la vista iniziale
    ui.showView('calendar-view');
}

// Assicurati che il DOM sia completamente caricato prima di eseguire la logica
document.addEventListener('DOMContentLoaded', init);
