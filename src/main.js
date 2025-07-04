console.log('%cMTP Build: 3.0.1 - Stato Instabile Documentato', 'color: #orange; font-size: 1.2em; font-weight: bold;');
import store from './modules/store.js';
import { init as initCalendarView } from './views/CalendarView.js';
import { init as initTrainerView } from './views/TrainerView.js';
import { init as initDebriefingView } from './views/DebriefingView.js';
import { init as initModal } from './ui/Modal.js';
import { init as initNotice } from './ui/Notice.js';
import { loadFromStorage, saveToStorage } from './modules/storage.js';

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
    workouts = {};
    saveToStorage(WORKOUTS_STORAGE_KEY, workouts);
  }
  store.dispatch({ type: 'SET_WORKOUTS', payload: workouts });

  initCalendarView(views.calendar);
  initializedViews.add('calendar');
  initModal(document.getElementById('modal-container'));
  initNotice(document.getElementById('notice-container'));
}

function handleViewChange() {
  const { currentView } = store.getState();
  const newActiveViewEl = views[currentView];

  if (newActiveViewEl && newActiveViewEl.id !== store.currentActiveViewId) {
    const oldView = document.querySelector('.view--active');
    if(oldView) oldView.classList.remove('view--active');
    
    newActiveViewEl.classList.add('view--active');
    store.currentActiveViewId = newActiveViewEl.id;

    if (!initializedViews.has(currentView)) {
      if (currentView === 'trainer') initTrainerView(views.trainer);
      else if (currentView === 'debriefing') initDebriefingView(views.debriefing);
      initializedViews.add(currentView);
    }
  }
}

store.subscribe(handleViewChange);
initializeApp();
