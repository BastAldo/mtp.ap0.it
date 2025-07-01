import store from './modules/store.js';
import { init as initCalendarView } from './views/CalendarView.js';
import { init as initTrainerView } from './views/TrainerView.js';
import { init as initModal } from './ui/Modal.js';
import { loadFromStorage, saveToStorage } from './modules/storage.js';
import { mockWorkouts } from './modules/_mockData.js';

const WORKOUTS_STORAGE_KEY = 'workouts';

const views = {
    calendar: document.getElementById('calendar-view'),
    trainer: document.getElementById('trainer-view'),
    debriefing: document.getElementById('debriefing-view'),
};
const initializedViews = new Set();

function initializeApp() {
  let workouts = loadFromStorage(WORKOUTS_STORAGE_KEY);
  if (!workouts) {
    saveToStorage(WORKOUTS_STORAGE_KEY, mockWorkouts);
    workouts = mockWorkouts;
  }
  store.dispatch({ type: 'SET_WORKOUTS', payload: workouts });

  initCalendarView(views.calendar);
  initializedViews.add('calendar');
  initModal(document.getElementById('modal-container'));
}

let currentActiveView = views.calendar;
function handleViewChange() {
  const { currentView } = store.getState();
  const newActiveViewEl = views[currentView];

  if (currentActiveView !== newActiveViewEl) {
    currentActiveView.classList.remove('view--active');
    newActiveViewEl.classList.add('view--active');
    currentActiveView = newActiveViewEl;

    // Inizializza la vista solo la prima volta che viene mostrata
    if (!initializedViews.has(currentView)) {
      if (currentView === 'trainer') {
        initTrainerView(views.trainer);
      }
      // Aggiungere qui l'inizializzazione di altre viste future
      initializedViews.add(currentView);
    }
  }
}

store.subscribe(handleViewChange);
initializeApp();
console.log('App "Mio Trainer Personale" inizializzata.');
