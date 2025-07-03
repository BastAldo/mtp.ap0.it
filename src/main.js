console.log('File loaded: main.js');
import store from './modules/store.js';
import { init as initCalendarView } from './views/CalendarView.js';
import { init as initTrainerView } from './views/TrainerView.js';
import { init as initDebriefingView } from './views/DebriefingView.js';
import { init as initModal } from './ui/Modal.js';
import { init as initNotice } from './ui/Notice.js';
import { loadFromStorage, saveToStorage } from './modules/storage.js';

const WORKOUTS_STORAGE_KEY = 'workouts';
const TICK_INTERVAL = 100;

const views = {
    calendar: document.getElementById('calendar-view'),
    trainer: document.getElementById('trainer-view'),
    debriefing: document.getElementById('debriefing-view'),
};
const initializedViews = new Set();

function initializeApp() {
  let workouts = loadFromStorage(WORKOUTS_STORAGE_KEY);
  if (!workouts) {
    // Inizializza con un oggetto vuoto se non c'è nulla nello storage
    workouts = {};
    saveToStorage(WORKOUTS_STORAGE_KEY, workouts);
  }
  store.dispatch({ type: 'SET_WORKOUTS', payload: workouts });

  initCalendarView(views.calendar);
  initializedViews.add('calendar');
  initModal(document.getElementById('modal-container'));
  initNotice(document.getElementById('notice-container'));
  console.log('App Initialized.');
}

let currentActiveView = views.calendar;
function handleViewChange() {
  const { currentView } = store.getState();
  const newActiveViewEl = views[currentView];

  if (currentActiveView !== newActiveViewEl) {
    currentActiveView.classList.remove('view--active');
    newActiveViewEl.classList.add('view--active');
    currentActiveView = newActiveViewEl;

    if (!initializedViews.has(currentView)) {
      if (currentView === 'trainer') initTrainerView(views.trainer);
      else if (currentView === 'debriefing') initDebriefingView(views.debriefing);
      initializedViews.add(currentView);
    }
  }
}

// --- Gestore Effetti Collaterali per il Timer del Trainer ---
let timerInterval = null;
function handleTrainerEffects() {
    const { trainer } = store.getState();
    const trainerState = trainer.status;

    if (trainerState !== 'running' && timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    if (trainerState === 'running' && !timerInterval) {
        timerInterval = setInterval(() => {
            store.dispatch({ type: 'TIMER_TICK', payload: { tick: TICK_INTERVAL } });
        }, TICK_INTERVAL);
    }
}

store.subscribe(handleViewChange);
store.subscribe(handleTrainerEffects);

initializeApp();
