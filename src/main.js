console.log('File loaded: main.js');
import store from './modules/store.js';
import { init as initCalendarView } from './views/CalendarView.js';
import { init as initTrainerView } from './views/TrainerView.js';
import { init as initDebriefingView } from './views/DebriefingView.js';
import { init as initModal } from './ui/Modal.js';
import { init as initNotice } from './ui/Notice.js';
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
  console.log('Initializing App...');
  let workouts = loadFromStorage(WORKOUTS_STORAGE_KEY);
  if (!workouts) {
    saveToStorage(WORKOUTS_STORAGE_KEY, mockWorkouts);
    workouts = mockWorkouts;
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
  if(!views[currentView]) return; // Safety check

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

function gameLoop(timestamp) {
    store.dispatch({ type: 'TICK', payload: { timestamp } });
    requestAnimationFrame(gameLoop);
}

store.subscribe(handleViewChange);

initializeApp();
requestAnimationFrame(gameLoop);
