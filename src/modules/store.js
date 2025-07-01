import { saveToStorage } from './storage.js';
import { getExerciseById } from './exerciseRepository.js';

const WORKOUTS_STORAGE_KEY = 'workouts';

function createStore() {
  let state = {
    currentView: 'calendar',
    focusedDate: new Date(),
    workouts: {},
    isModalOpen: false,
    modalContext: null,
    activeWorkout: null,
    trainerState: 'idle', // idle, ready, preparing, announcing, action, rest, paused, finished
    trainerContext: {}, // Contesto dinamico del trainer (serie, rep, fase corrente)
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
      case 'REMOVE_WORKOUT_ITEM': { /* ... (invariato) ... */ break; }
      case 'UPDATE_REST_DURATION': { /* ... (invariato) ... */ break; }
      case 'ADD_REST_ITEM': { /* ... (invariato) ... */ break; }
      case 'ADD_EXERCISE_ITEM': { /* ... (invariato) ... */ break; }
      case 'START_WORKOUT': {
        const { date } = action.payload;
        const dateKey = `workout-${date}`;
        const workoutItems = state.workouts[dateKey];
        if (!workoutItems || workoutItems.length === 0) break;
        state = {
          ...state,
          currentView: 'trainer',
          activeWorkout: { date, items: workoutItems },
          trainerState: 'ready',
          trainerContext: { itemIndex: 0, currentSeries: 1, currentRep: 1 }
        };
        break;
      }
      case 'SET_TRAINER_STATE': {
        state = { ...state, trainerState: action.payload };
        break;
      }
      case 'UPDATE_TRAINER_CONTEXT': {
        state = { ...state, trainerContext: { ...state.trainerContext, ...action.payload }};
        break;
      }
      case 'ADVANCE_TRAINER_LOGIC': {
        const { activeWorkout, trainerContext } = state;
        const currentItem = activeWorkout.items[trainerContext.itemIndex];
        const maxReps = currentItem.reps || 1;
        const maxSeries = currentItem.series || 1;

        let nextContext = { ...trainerContext };
        let nextState = state.trainerState;

        if (nextContext.currentRep < maxReps) {
          nextContext.currentRep++;
          // Passa direttamente alla prossima ripetizione senza tornare a 'ready'
          nextState = 'preparing'; // Inizia subito la preparazione per la prossima rep
        } else if (nextContext.currentSeries < maxSeries) {
          nextContext.currentSeries++;
          nextContext.currentRep = 1;
          const exerciseDef = getExerciseById(currentItem.exerciseId);
          nextContext.restDuration = exerciseDef?.defaultRest || 60;
          nextState = 'rest';
        } else {
          if (trainerContext.itemIndex < activeWorkout.items.length - 1) {
            nextContext.itemIndex++;
            const nextItem = activeWorkout.items[nextContext.itemIndex];
            if(nextItem.type === 'exercise') {
              nextContext.currentSeries = 1;
              nextContext.currentRep = 1;
              nextState = 'preparing'; // Prepara il prossimo esercizio
            } else {
              nextContext.restDuration = nextItem.duration;
              nextState = 'rest'; // Esegui un item di riposo
            }
          } else {
            nextState = 'finished';
          }
        }
        state = { ...state, trainerState: nextState, trainerContext: nextContext };
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
