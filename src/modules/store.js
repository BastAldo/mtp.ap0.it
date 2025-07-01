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
    const oldState = { ...state };
    let newState = { ...state };

    switch (action.type) {
      case 'CHANGE_VIEW': newState = { ...state, currentView: action.payload }; break;
      case 'PREV_WEEK': { const d=new Date(state.focusedDate); d.setDate(d.getDate()-7); newState={...state, focusedDate:d}; break; }
      case 'NEXT_WEEK': { const d=new Date(state.focusedDate); d.setDate(d.getDate()+7); newState={...state, focusedDate:d}; break; }
      case 'SET_WORKOUTS': newState = { ...state, workouts: action.payload }; break;
      case 'OPEN_MODAL': newState = { ...state, isModalOpen: true, modalContext: action.payload }; break;
      case 'CLOSE_MODAL': newState = { ...state, isModalOpen: false, modalContext: null }; break;
      case 'ADD_EXERCISE_ITEM': {
          const { date, exerciseId } = action.payload;
          const dateKey = `workout-${date}`;
          const exercise = getExerciseById(exerciseId);
          if (!exercise) break;
          const newItem = { ...exercise, id: `item-${Date.now()}`, type: exercise.type || 'exercise', exerciseId: exercise.id };
          const newWorkouts = cloneWorkouts(state.workouts);
          const dayWorkout = newWorkouts[dateKey] || [];
          dayWorkout.push(newItem);
          newWorkouts[dateKey] = dayWorkout;
          newState = { ...state, workouts: newWorkouts, modalContext: { type: 'EDIT_WORKOUT', date } };
          break;
      }
      case 'ADD_REST_ITEM': {
          const { date } = action.payload;
          const dateKey = `workout-${date}`;
          const newItem = { id: `item-${Date.now()}`, type: 'rest', duration: 60 };
          const newWorkouts = cloneWorkouts(state.workouts);
          const dayWorkout = newWorkouts[dateKey] || [];
          dayWorkout.push(newItem);
          newWorkouts[dateKey] = dayWorkout;
          newState = { ...state, workouts: newWorkouts };
          break;
      }
      case 'REMOVE_WORKOUT_ITEM': {
          const { date, itemId } = action.payload;
          const dateKey = `workout-${date}`;
          const newWorkouts = cloneWorkouts(state.workouts);
          newWorkouts[dateKey] = (newWorkouts[dateKey] || []).filter(item => item.id !== itemId);
          newState = { ...state, workouts: newWorkouts };
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
              newState = { ...state, workouts: newWorkouts };
          }
          break;
      }
      case 'START_WORKOUT': {
        const { date } = action.payload;
        const dateKey = `workout-${date}`;
        const workoutItems = state.workouts[dateKey];
        if (!workoutItems || workoutItems.length === 0) break;
        newState = {
          ...state,
          currentView: 'trainer',
          activeWorkout: { date, items: workoutItems },
          trainerState: 'ready',
          trainerContext: { itemIndex: 0, currentSeries: 1, currentRep: 1, currentPhaseIndex: 0 }
        };
        break;
      }
      case 'SET_TRAINER_STATE': {
        newState = { ...state, trainerState: action.payload };
        break;
      }
      case 'PAUSE_TRAINER': {
        if (['paused', 'ready', 'finished'].includes(state.trainerState)) break;
        const { remaining, duration } = action.payload;
        newState = {
          ...state,
          trainerState: 'paused',
          trainerContext: { ...state.trainerContext, remaining, duration, stateBeforePause: state.trainerState },
        };
        break;
      }
      case 'RESUME_TRAINER': {
        if (state.trainerState !== 'paused') break;
        newState = { ...state, trainerState: state.trainerContext.stateBeforePause };
        break;
      }
      case 'UPDATE_TRAINER_CONTEXT': {
        newState = { ...state, trainerContext: { ...state.trainerContext, ...action.payload }};
        break;
      }
      case 'ADVANCE_TRAINER_LOGIC': {
        const { activeWorkout, trainerContext } = state;
        const currentItem = activeWorkout.items[trainerContext.itemIndex];
        let nextContext = { ...trainerContext };
        let nextStateStr = state.trainerState;

        const advanceToNextItem = () => {
            if (trainerContext.itemIndex < activeWorkout.items.length - 1) {
                nextContext = { ...nextContext, itemIndex: trainerContext.itemIndex + 1, currentSeries: 1, currentRep: 1, currentPhaseIndex: 0 };
                const nextItem = activeWorkout.items[nextContext.itemIndex];
                nextStateStr = (nextItem.type === 'rest') ? 'rest' : 'announcing';
                if (nextItem.type === 'rest') nextContext.restDuration = nextItem.duration;
            } else {
                nextStateStr = 'finished';
            }
        };

        if (currentItem.type === 'exercise') {
            if (nextContext.currentRep < currentItem.reps) {
                nextContext.currentRep++;
                nextContext.currentPhaseIndex = 0;
                nextStateStr = 'announcing';
            } else if (nextContext.currentSeries < currentItem.series) {
                nextContext.currentSeries++;
                nextContext.currentRep = 1;
                nextContext.currentPhaseIndex = 0;
                nextContext.restDuration = getExerciseById(currentItem.exerciseId)?.defaultRest || 60;
                nextStateStr = 'rest';
            } else {
                advanceToNextItem();
            }
        } else if (currentItem.type === 'time') {
            if (nextContext.currentSeries < currentItem.series) {
                nextContext.currentSeries++;
                nextContext.restDuration = getExerciseById(currentItem.exerciseId)?.defaultRest || 60;
                nextStateStr = 'rest';
            } else {
                advanceToNextItem();
            }
        } else if (state.trainerState === 'rest') {
            // After resting, we announce the next rep/exercise
            nextStateStr = 'announcing';
        }
        newState = { ...state, trainerState: nextStateStr, trainerContext: nextContext };
        break;
      }
      default:
        return;
    }
    state = newState;
    if (state !== oldState) {
      console.log(
        `%cACTION: ${action.type}`, 'color: #88aaff; font-weight: bold;',
        {
          payload: action.payload,
          trainerState: state.trainerState,
          context: state.trainerContext
        }
      );
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
