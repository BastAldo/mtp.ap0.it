import { saveToStorage } from './storage.js';

const WORKOUTS_STORAGE_KEY = 'workouts';

function createStore() {
  let state = {
    currentView: 'calendar',
    focusedDate: new Date(),
    workouts: {},
    isModalOpen: false,
    modalContext: null,
  };

  const subscribers = new Set();
  function notify() { subscribers.forEach(callback => callback()); }

  function dispatch(action) {
    const oldState = state;
    switch (action.type) {
      case 'CHANGE_VIEW':
        state = { ...state, currentView: action.payload };
        break;
      case 'PREV_WEEK': {
        const newDate = new Date(state.focusedDate);
        newDate.setDate(newDate.getDate() - 7);
        state = { ...state, focusedDate: newDate };
        break;
      }
      case 'NEXT_WEEK': {
        const newDate = new Date(state.focusedDate);
        newDate.setDate(newDate.getDate() + 7);
        state = { ...state, focusedDate: newDate };
        break;
      }
      case 'SET_WORKOUTS':
        state = { ...state, workouts: action.payload };
        break;
      case 'OPEN_MODAL':
        state = { ...state, isModalOpen: true, modalContext: action.payload };
        break;
      case 'CLOSE_MODAL':
        state = { ...state, isModalOpen: false, modalContext: null };
        break;
      case 'REMOVE_WORKOUT_ITEM': {
        const { date, itemId } = action.payload;
        const dateKey = `workout-${date}`;
        if (!state.workouts[dateKey]) break;
        const newWorkoutDay = state.workouts[dateKey].filter(item => item.id !== itemId);
        state = { ...state, workouts: { ...state.workouts, [dateKey]: newWorkoutDay } };
        break;
      }
      case 'UPDATE_REST_DURATION': {
        const { date, itemId, newDuration } = action.payload;
        const dateKey = `workout-${date}`;
        if (!state.workouts[dateKey]) break;
        const newWorkoutDay = state.workouts[dateKey].map(item =>
          item.id === itemId ? { ...item, duration: newDuration } : item
        );
        state = { ...state, workouts: { ...state.workouts, [dateKey]: newWorkoutDay } };
        break;
      }
      default:
        console.warn(`Azione non riconosciuta: ${action.type}`);
        return;
    }
    if (state !== oldState) {
      console.log(`Action: ${action.type}`, action.payload);
      if (state.workouts !== oldState.workouts) {
        saveToStorage(WORKOUTS_STORAGE_KEY, state.workouts);
        console.log('Workouts salvati in localStorage.');
      }
      notify();
    }
  }
  return {
    getState: () => ({ ...state }),
    subscribe: (callback) => { subscribers.add(callback); return () => subscribers.delete(callback); },
    dispatch,
  };
}
const store = createStore();
export default store;
