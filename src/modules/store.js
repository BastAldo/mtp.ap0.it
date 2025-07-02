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
    notice: null,
    activeWorkout: null,
    completedWorkout: null,
    trainerState: 'idle', // idle, ready, preparing, announcing, action, rest, paused, finished
    trainerContext: {},
  };

  const subscribers = new Set();
  function notify() { subscribers.forEach(callback => callback()); }

  // --- FUNZIONE DI LOGGING RIPRISTINATA ---
  function logState(actionType, state) {
      if (actionType.startsWith('@@')) return;
      const { activeWorkout, trainerState, trainerContext } = state;
      if (!activeWorkout || !trainerContext.currentItem) {
          console.log(`%c[${actionType}]`, 'color: #88aaff; font-weight: bold;', `View: ${state.currentView}`);
          return;
      };
      const { currentItem, currentSeries, currentRep } = trainerContext;
      const exerciseName = currentItem.name || 'Riposo';
      const series = `${currentSeries || '-'}/${currentItem.series || '-'}`;
      const reps = `${currentRep || '-'}/${currentItem.reps || '-'}`;
      let status = trainerState.toUpperCase();
      const logString = `Esercizio: ${exerciseName} | Serie: ${series} | Rep: ${reps} | Stato: ${status}`;
      console.log(`%c[${actionType}]`, 'color: #88aaff; font-weight: bold;', logString);
  }

  const dispatch = (action) => {
    const oldState = { ...state };
    let newState = { ...state };
    let shouldNotify = true;

    switch (action.type) {
      case 'CHANGE_VIEW': newState = { ...state, currentView: action.payload }; break;
      case 'PREV_WEEK': { const d = new Date(state.focusedDate); d.setDate(d.getDate() - 7); newState = { ...state, focusedDate: d }; break; }
      case 'NEXT_WEEK': { const d = new Date(state.focusedDate); d.setDate(d.getDate() + 7); newState = { ...state, focusedDate: d }; break; }
      case 'SET_WORKOUTS': newState = { ...state, workouts: action.payload }; break;
      case 'OPEN_MODAL': newState = { ...state, isModalOpen: true, modalContext: action.payload }; break;
      case 'CLOSE_MODAL': newState = { ...state, isModalOpen: false, modalContext: null }; break;
      case 'SHOW_NOTICE': newState = { ...state, notice: { message: action.payload.message, id: Date.now() } }; break;

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
      case 'REORDER_WORKOUT_ITEMS': {
          const { date, draggedItemId, targetItemId } = action.payload;
          const dateKey = `workout-${date}`;
          const newWorkouts = cloneWorkouts(state.workouts);
          const items = newWorkouts[dateKey] || [];
          const draggedIndex = items.findIndex(item => item.id === draggedItemId);
          const targetIndex = items.findIndex(item => item.id === targetItemId);
          if (draggedIndex > -1 && targetIndex > -1) {
              const [draggedItem] = items.splice(draggedIndex, 1);
              items.splice(targetIndex, 0, draggedItem);
              newWorkouts[dateKey] = items;
              newState = { ...state, workouts: newWorkouts };
          }
          break;
      }

      // TRAINER LIFECYCLE ACTIONS
      case 'START_WORKOUT': {
        const { date } = action.payload;
        const dateKey = `workout-${date}`;
        const workoutItems = state.workouts[dateKey];
        if (!workoutItems || workoutItems.length === 0) break;
        newState = {
          ...state,
          currentView: 'trainer',
          activeWorkout: { date, items: workoutItems, completed: false, fullPlan: workoutItems },
          completedWorkout: null,
          trainerState: 'ready',
          trainerContext: { itemIndex: 0, currentSeries: 1, currentRep: 1, currentItem: workoutItems[0] }
        };
        break;
      }
      case 'FINISH_WORKOUT': {
        newState = { ...state, currentView: 'debriefing', completedWorkout: { ...state.activeWorkout, completed: true }, activeWorkout: null, trainerState: 'idle', trainerContext: {} };
        break;
      }
      case 'TERMINATE_WORKOUT': {
        const { activeWorkout, trainerContext } = state;
        const partialWorkout = { date: activeWorkout.date, fullPlan: activeWorkout.fullPlan, completed: false, terminationPoint: trainerContext };
        newState = { ...state, currentView: 'debriefing', completedWorkout: partialWorkout, activeWorkout: null, trainerState: 'idle', trainerContext: {} };
        break;
      }
      case 'START_TRAINER': {
        if(state.trainerState === 'ready') {
          const duration = 3000;
          newState = { ...state, trainerState: 'preparing', trainerContext: { ...state.trainerContext, duration, remaining: duration }};
        }
        break;
      }
      case 'PAUSE_TRAINER': {
        if (state.trainerState !== 'paused' && state.trainerState !== 'ready' && state.trainerState !== 'finished') {
          newState = { ...state, trainerState: 'paused', trainerContext: { ...state.trainerContext, stateBeforePause: state.trainerState } };
        }
        break;
      }
      case 'RESUME_TRAINER': {
        if (state.trainerState === 'paused') {
          newState = { ...state, trainerState: state.trainerContext.stateBeforePause };
        }
        break;
      }
      case 'TIMER_TICK': {
        if (state.trainerState === 'paused') { shouldNotify = false; break; }
        const newRemaining = (state.trainerContext.remaining || 0) - action.payload.tick;
        if (newRemaining > 0) {
          newState = { ...state, trainerContext: { ...state.trainerContext, remaining: newRemaining }};
        } else {
          dispatch({ type: 'ADVANCE_TRAINER_PHASE' });
          shouldNotify = false;
        }
        break;
      }
      case 'ADVANCE_TRAINER_PHASE': {
        const { trainerState, activeWorkout, trainerContext } = state;
        let nextState = trainerState;
        let nextContext = { ...trainerContext };

        if (trainerState === 'preparing') { nextState = 'announcing'; }
        else if (trainerState === 'announcing') { nextState = 'action'; }
        else if (trainerState === 'action' || trainerState === 'rest') {
            let itemIsComplete = false;
            const currentItem = trainerContext.currentItem;
            if(trainerState === 'rest') { itemIsComplete = true; }
            else if (currentItem.type === 'time') {
                if (nextContext.currentSeries < (currentItem.series || 1)) { nextContext.currentSeries++; } else { itemIsComplete = true; }
            } else if (currentItem.type === 'exercise') {
                if (nextContext.currentRep < (currentItem.reps || 1)) { nextContext.currentRep++; }
                else if (nextContext.currentSeries < (currentItem.series || 1)) { nextContext.currentSeries++; nextContext.currentRep = 1; }
                else { itemIsComplete = true; }
            }
            if (itemIsComplete) {
                if (nextContext.itemIndex < activeWorkout.items.length - 1) {
                    nextContext = { itemIndex: nextContext.itemIndex + 1, currentSeries: 1, currentRep: 1 };
                    nextState = 'announcing';
                } else { nextState = 'finished'; }
            } else { nextState = 'announcing'; }
        }

        if (nextState !== 'finished' && nextState !== state.trainerState) {
            const newItem = activeWorkout.items[nextContext.itemIndex];
            nextContext.currentItem = newItem;
            let duration = 0;
            if (newItem.type === 'rest' && trainerState !== 'rest') { nextState = 'rest'; }

            switch(nextState) {
                case 'preparing': duration = 3000; break;
                case 'announcing': duration = 750; break;
                case 'action':
                    duration = (newItem.type === 'time') ? (newItem.duration || 10) * 1000 : (newItem.tempo?.down || 1) * 1000;
                    break;
                case 'rest': duration = (newItem.duration || 60) * 1000; break;
            }
            nextContext.duration = duration;
            nextContext.remaining = duration; // --- FIX: Inizializza anche remaining ---
        }
        newState = { ...state, trainerState: nextState, trainerContext: nextContext };
        break;
      }
      default:
        action.type = '@@UNKNOWN';
        shouldNotify = false;
        break;
    }

    state = newState;
    if (shouldNotify && state !== oldState) {
      logState(action.type, state); // --- CHIAMATA AL LOGGER RIPRISTINATA ---
      if (state.workouts !== oldState.workouts) {
        saveToStorage(WORKOUTS_STORAGE_KEY, state.workouts);
      }
      notify();
    } else if (action.type === 'TIMER_TICK') {
      // Notifica comunque per aggiornare il timer nella UI, ma senza log
      notify();
    }
  };

  return {
    getState: () => ({ ...state }),
    subscribe: (callback) => { subscribers.add(callback); return () => subscribers.delete(callback); },
    dispatch,
  };
}

const store = createStore();
export default store;
