import store from './modules/store.js';
import { init as initCalendarView } from './views/CalendarView.js';
import { init as initTrainerView } from './views/TrainerView.js';
import { init as initDebriefingView } from './views/DebriefingView.js';
import { init as initModal } from './ui/Modal.js';
import { init as initNotice } from './ui/Notice.js';
import { loadFromStorage, saveToStorage } from './modules/storage.js';
import { mockWorkouts } from './modules/_mockData.js';

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
    saveToStorage(WORKOUTS_STORAGE_KEY, mockWorkouts);
    workouts = mockWorkouts;
  }
  store.dispatch({ type: 'SET_WORKOUTS', payload: workouts });

  initCalendarView(views.calendar);
  initializedViews.add('calendar');
  initModal(document.getElementById('modal-container'));
  initNotice(document.getElementById('notice-container'));
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

// --- Side Effect Handler for Trainer Timers ---
let timerInterval = null;
let lastTrainerState = 'idle';

function handleTrainerEffects() {
    const { trainerState, trainerContext } = store.getState();

    // State changed, so we always clear the existing timer first.
    if (trainerState !== lastTrainerState) {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        const statesWithTimers = ['preparing', 'announcing', 'action', 'rest'];
        if (statesWithTimers.includes(trainerState)) {
            // Set initial remaining time when a new timed state starts
            store.dispatch({ type: 'TIMER_TICK', payload: { tick: 0 } });

            timerInterval = setInterval(() => {
                store.dispatch({ type: 'TIMER_TICK', payload: { tick: TICK_INTERVAL } });
            }, TICK_INTERVAL);
        }
    }
    lastTrainerState = trainerState;
}

store.subscribe(handleViewChange);
store.subscribe(handleTrainerEffects); // Subscribe the effect handler

initializeApp();
console.log('App "Mio Trainer Personale" inizializzata.');
