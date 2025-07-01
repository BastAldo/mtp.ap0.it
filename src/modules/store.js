import { saveToStorage } from './storage.js';
import { getExerciseById } from './exerciseRepository.js';

const WORKOUTS_STORAGE_KEY = 'workouts';

const cloneWorkouts = (workouts) => JSON.parse(JSON.stringify(workouts));

function createStore() {
  let state = {
    currentView: 'calendar',
    focusedDate: new Date(),
    workouts: {},
    isModalOpen: false,
    modalContext: null,
    activeWorkout: null,
    trainerState: 'idle',
    trainerContext: {},
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
      case 'ADD_EXERCISE_ITEM': {
          const { date, exerciseId } = action.payload;
          const dateKey = `workout-${date}`;
          const exercise = getExerciseById(exerciseId);
          if (!exercise) break;

          const newItem = {
              ...exercise,
              id: `item-${Date.now()}`,
              type: 'exercise',
              exerciseId: exercise.id,
          };

          const newWorkouts = cloneWorkouts(state.workouts);
          const dayWorkout = newWorkouts[dateKey] || [];
          dayWorkout.push(newItem);
          newWorkouts[dateKey] = dayWorkout;
          state = { ...state, workouts: newWorkouts, modalContext: { type: 'EDIT_WORKOUT', date } };
          break;
      }
      case 'ADD_REST_ITEM': {
          const { date } = action.payload;
          const dateKey = `workout-${date}`;
          const newItem = {
              id: `item-${Date.now()}`,
              type: 'rest',
              duration: 60
          };
          const newWorkouts = cloneWorkouts(state.workouts);
          const dayWorkout = newWorkouts[dateKey] || [];
          dayWorkout.push(newItem);
          newWorkouts[dateKey] = dayWorkout;
          state = { ...state, workouts: newWorkouts };
          break;
      }
      case 'REMOVE_WORKOUT_ITEM': {
          const { date, itemId } = action.payload;
          const dateKey = `workout-${date}`;
          const newWorkouts = cloneWorkouts(state.workouts);
          const dayWorkout = newWorkouts[dateKey] || [];
          newWorkouts[dateKey] = dayWorkout.filter(item => item.id !== itemId);
          state = { ...state, workouts: newWorkouts };
          break;
      }
      case 'UPDATE_REST_DURATION': {
          const { date, itemId, newDuration } = action.payload;
          const dateKey = `workout-${date}`;
          const newWorkouts = cloneWorkouts(state.workouts);
          const dayWorkout = newWorkouts[dateKey] || [];
          const itemIndex = dayWorkout.findIndex(item => item.id === itemId);
          if (itemIndex > -1 && dayWorkout[itemIndex].type === 'rest') {
              dayWorkout[itemIndex].duration = newDuration;
              newWorkouts[dateKey] = dayWorkout;
              state = { ...state, workouts: newWorkouts };
          }
          break;
      }
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
      case 'PAUSE_TRAINER': {
        if (state.trainerState === 'paused' || state.trainerState === 'ready' || state.trainerState === 'finished') break;
        const { remaining, duration } = action.payload;
        const stateBeforePause = state.trainerState;
        state = {
          ...state,
          trainerState: 'paused',
          trainerContext: { ...state.trainerContext, remaining, duration, stateBeforePause },
        };
        break;
      }
      case 'RESUME_TRAINER': {
        if (state.trainerState !== 'paused') break;
        const { stateBeforePause } = state.trainerContext;
        state = { ...state, trainerState: stateBeforePause };
        break;
      }
      case 'UPDATE_TRAINER_CONTEXT': {
        state = { ...state, trainerContext: { ...state.trainerContext, ...action.payload }};
        break;
      }
      case 'ADVANCE_TRAINER_LOGIC': {
        const { activeWorkout, trainerContext } = state;
        const currentItem = activeWorkout.items[trainerContext.itemIndex];
        let nextContext = { ...trainerContext };
        let nextState;

        // Logica unificata per avanzare al prossimo item
        const advanceToNextItem = () => {
            if (trainerContext.itemIndex < activeWorkout.items.length - 1) {
                nextContext.itemIndex++;
                const nextItem = activeWorkout.items[nextContext.itemIndex];
                if (nextItem.type === 'exercise' || nextItem.type === 'time') {
                    nextContext.currentSeries = 1;
                    nextContext.currentRep = 1;
                    nextState = 'announcing';
                } else { // rest
                    nextContext.restDuration = nextItem.duration;
                    nextState = 'rest';
                }
            } else {
                nextState = 'finished';
            }
        };

        // Logica per avanzamento in esercizi a tempo
        if (currentItem.type === 'time') {
            if (nextContext.currentSeries < currentItem.series) {
                nextContext.currentSeries++;
                nextContext.restDuration = getExerciseById(currentItem.exerciseId)?.defaultRest || 60;
                nextState = 'rest';
            } else {
                advanceToNextItem();
            }
        }
        // Logica per avanzamento in esercizi a ripetizioni
        else if (currentItem.type === 'exercise') {
            const maxReps = currentItem.reps || 1;
            const maxSeries = currentItem.series || 1;

            if (nextContext.currentRep < maxReps) {
                nextContext.currentRep++;
                nextState = 'announcing';
            } else if (nextContext.currentSeries < maxSeries) {
                nextContext.currentSeries++;
                nextContext.currentRep = 1;
                nextContext.restDuration = getExerciseById(currentItem.exerciseId)?.defaultRest || 60;
                nextState = 'rest';
            } else {
                advanceToNextItem();
            }
        }
        // Logica per avanzare dopo un riposo
        else if (currentItem.type === 'rest') {
            advanceToNextItem();
        }

        state = { ...state, trainerState: nextState, trainerContext: nextContext };
        break;
      }
      default:
        console.warn(`Azione non riconosciuta: ${action.type}`);
        return;
    }
    if (state !== oldState) {
      if (state.workouts !== oldState.workouts) {
        saveToStorage(WORKOUTS_STORAGE_KEY, state.workouts);
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
