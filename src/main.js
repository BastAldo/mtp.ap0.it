import store from './modules/store.js';
import { init as initCalendarView } from './views/CalendarView.js';
import { loadFromStorage, saveToStorage } from './modules/storage.js';
import { mockWorkouts } from './modules/_mockData.js';

const WORKOUTS_STORAGE_KEY = 'workouts';

// Cache delle viste per performance
const views = {
    calendar: document.getElementById('calendar-view'),
    trainer: document.getElementById('trainer-view'),
    debriefing: document.getElementById('debriefing-view'),
};

// --- Funzione di Inizializzazione App ---
function initializeApp() {
  let workouts = loadFromStorage(WORKOUTS_STORAGE_KEY);

  // Se non ci sono dati in localStorage, popola con i dati mock
  if (!workouts) {
    console.log('Nessun dato trovato in localStorage. Popolamento con dati mock.');
    saveToStorage(WORKOUTS_STORAGE_KEY, mockWorkouts);
    workouts = mockWorkouts;
  }

  // Invia i dati allo store
  store.dispatch({ type: 'SET_WORKOUTS', payload: workouts });

  // Inizializza le viste
  initCalendarView(views.calendar);

  // Aggiungere qui l'inizializzazione di altre viste...
}

// --- Logica di Cambio Vista ---
let currentActiveView = views.calendar;
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
initializeApp();
console.log('App "Mio Trainer Personale" inizializzata e dati caricati.');
