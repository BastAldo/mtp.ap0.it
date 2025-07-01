import { saveToStorage } from './storage.js';
import { getExerciseById } from './exerciseRepository.js';

const WORKOUTS_STORAGE_KEY = 'workouts';

function createStore() {
  let state = { /* ... (stato invariato) ... */ };
  // ... (resto del codice invariato fino a dispatch) ...
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
      case 'CHANGE_VIEW': state = { ...state, currentView: action.payload }; break;
      case 'PREV_WEEK': { const d=new Date(state.focusedDate); d.setDate(d.getDate()-7); state={...state, focusedDate:d}; break; }
      case 'NEXT_WEEK': { const d=new Date(state.focusedDate); d.setDate(d.getDate()+7); state={...state, focusedDate:d}; break; }
      case 'SET_WORKOUTS': state = { ...state, workouts: action.payload }; break;
      case 'OPEN_MODAL': state = { ...state, isModalOpen: true, modalContext: action.payload }; break;
      case 'CLOSE_MODAL': state = { ...state, isModalOpen: false, modalContext: null }; break;
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
        const newWorkoutDay = state.workouts[dateKey].map(item => item.id === itemId ? { ...item, duration: newDuration } : item);
        state = { ...state, workouts: { ...state.workouts, [dateKey]: newWorkoutDay } };
        break;
      }
      case 'ADD_REST_ITEM': {
        const { date } = action.payload;
        const dateKey = `workout-${date}`;
        const newRestItem = { id: `rest-${Date.now()}`, type: 'rest', duration: 60 };
        const currentItems = state.workouts[dateKey] || [];
        const newWorkoutDay = [...currentItems, newRestItem];
        state = { ...state, workouts: { ...state.workouts, [dateKey]: newWorkoutDay } };
        break;
      }
      case 'ADD_EXERCISE_ITEM': {
        const { date, exerciseId } = action.payload;
        const exerciseTemplate = getExerciseById(exerciseId);
        if (!exerciseTemplate) break;

        const newExerciseItem = {
          ...exerciseTemplate,
          id: `ex-${Date.now()}`, // ID istanza univoco
          type: exerciseTemplate.type || 'exercise', // Default a 'exercise'
        };

        const dateKey = `workout-${date}`;
        const currentItems = state.workouts[dateKey] || [];
        const newWorkoutDay = [...currentItems, newExerciseItem];

        state = {
          ...state,
          workouts: { ...state.workouts, [dateKey]: newWorkoutDay },
          // Torna alla vista dell'editor dopo aver aggiunto l'esercizio
          modalContext: { type: 'EDIT_WORKOUT', date },
        };
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
