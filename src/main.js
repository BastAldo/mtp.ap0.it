import store from './modules/store.js';
import { init as initCalendarView } from './views/CalendarView.js';

// Cache delle viste per performance
const views = {
    calendar: document.getElementById('calendar-view'),
    trainer: document.getElementById('trainer-view'),
    debriefing: document.getElementById('debriefing-view'),
};

// --- Inizializzazione Viste ---
// Per ora, inizializziamo solo la vista calendario
initCalendarView(views.calendar);


// --- Logica di Cambio Vista (semplificata per ora) ---
let currentActiveView = views.calendar; // Impostiamo la vista iniziale

function handleViewChange() {
    const state = store.getState();
    const newActiveViewEl = views[state.currentView];

    if (currentActiveView !== newActiveViewEl) {
        currentActiveView.classList.remove('view--active');
        newActiveViewEl.classList.add('view--active');
        currentActiveView = newActiveViewEl;
    }
}

store.subscribe(handleViewChange);

console.log('App "Mio Trainer Personale" inizializzata.');
