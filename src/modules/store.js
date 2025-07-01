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

  // Custom Logger Function
  function logState(actionType, state) {
      const { activeWorkout, trainerState, trainerContext } = state;
      if (!activeWorkout) return;

      const currentItem = activeWorkout.items[trainerContext.itemIndex];
      const exerciseName = currentItem?.name || 'Riposo';
      const series = `${trainerContext.currentSeries || '-'}/${currentItem?.series || '-'}`;
      const reps = `${trainerContext.currentRep || '-'}/${currentItem?.reps || '-'}`;

      let status = trainerState.toUpperCase();
      if (trainerState === 'announcing' || trainerState === 'action') {
          status += ` (${trainerContext.currentPhase || 'N/A'})`;
      }

      const logString = `Esercizio: ${exerciseName} | Serie: ${series} | Rep: ${reps} | Stato: ${status}`;

      console.log(`%c[${actionType}]`, 'color: #88aaff; font-weight: bold;', logString);
  }

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
      case 'TIMER_COMPLETE': {
        const { trainerState, activeWorkout, trainerContext } = state;
        const currentItem = activeWorkout.items[trainerContext.itemIndex];

        const advanceToNextItem = () => {
          if (trainerContext.itemIndex < activeWorkout.items.length - 1) {
            const nextItemIndex = trainerContext.itemIndex + 1;
            const nextItem = activeWorkout.items[nextItemIndex];
            const newContext = { itemIndex: nextItemIndex, currentSeries: 1, currentRep: 1, currentPhaseIndex: 0 };
            const newState = nextItem.type === 'rest' ? 'rest' : 'announcing';
            if (nextItem.type !== 'rest') {
                newContext.currentPhase = nextItem.type === 'time' ? 'Esegui' : (Object.keys(nextItem.tempo || {})[0] || 'up');
            }
            return { newState, newContext };
          }
          return null; // Signals workout is finished
        };

        let nextState = trainerState;
        let nextContext = { ...trainerContext };

        switch (trainerState) {
          case 'preparing':
            nextState = 'announcing';
            const firstItem = activeWorkout.items[0];
            if (firstItem.type === 'time') { nextContext.currentPhase = 'Esegui'; }
            else { const tempo = firstItem.tempo || {}; nextContext.currentPhase = Object.keys(tempo)[0] || 'up'; }
            break;

          case 'announcing':
            nextState = 'action';
            break;

          case 'action': {
            if (currentItem.type === 'exercise') {
              const tempo = currentItem.tempo || {};
              const phases = Object.keys(tempo);
              const nextPhaseIndex = trainerContext.currentPhaseIndex + 1;

              if (nextPhaseIndex < phases.length) { // More phases in this rep
                nextState = 'announcing';
                nextContext.currentPhaseIndex = nextPhaseIndex;
                nextContext.currentPhase = phases[nextPhaseIndex];
              } else { // Rep complete
                nextContext.currentPhaseIndex = 0; // Reset for next rep
                if (trainerContext.currentRep < currentItem.reps) {
                  nextContext.currentRep++;
                  nextState = 'announcing'; // Start next rep immediately
                  nextContext.currentPhase = phases[0] || 'up';
                } else if (trainerContext.currentSeries < currentItem.series) {
                  nextContext.currentSeries++;
                  nextContext.currentRep = 1;
                  nextState = 'announcing'; // Start next series immediately
                  nextContext.currentPhase = phases[0] || 'up';
                } else { // Exercise complete
                  const advance = advanceToNextItem();
                  if (advance) { nextState = advance.newState; nextContext = { ...nextContext, ...advance.newContext }; }
                  else { nextState = 'finished'; }
                }
              }
            } else if (currentItem.type === 'time') {
                if (trainerContext.currentSeries < currentItem.series) {
                    nextContext.currentSeries++;
                    nextState = 'announcing'; // Start next series immediately
                    nextContext.currentPhase = 'Esegui';
                } else {
                    const advance = advanceToNextItem();
                    if (advance) { nextState = advance.newState; nextContext = { ...nextContext, ...advance.newContext }; }
                    else { nextState = 'finished'; }
                }
            }
            break;
          }

          case 'rest': {
            // After an explicit rest, always advance to the next item
            const advance = advanceToNextItem();
            if (advance) { nextState = advance.newState; nextContext = { ...nextContext, ...advance.newContext }; }
            else { nextState = 'finished'; }
            break;
          }
        }
        newState = { ...state, trainerState: nextState, trainerContext: nextContext };
        break;
      }
      default:
        return;
    }
    state = newState;
    if (state !== oldState) {
      logState(action.type, state);
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
