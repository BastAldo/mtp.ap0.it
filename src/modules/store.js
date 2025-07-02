import { saveToStorage } from './storage.js';
import { getExerciseById } from './exerciseRepository.js';

const WORKOUTS_STORAGE_KEY = 'workouts';
const TICK_INTERVAL = 100; // ms

const cloneWorkouts = (workouts) => JSON.parse(JSON.stringify(workouts));

function createStore() {
  let timerInterval = null;

  let state = {
    currentView: 'calendar',
    focusedDate: new Date(),
    workouts: {},
    isModalOpen: false,
    modalContext: null,
    notice: null,
    activeWorkout: null,
    completedWorkout: null,
    trainerState: 'idle',
    trainerContext: {},
  };

  const subscribers = new Set();
  function notify() { subscribers.forEach(callback => callback()); }

  function logState(actionType, state) {
      if (actionType.startsWith('@@')) return;
      const { activeWorkout, trainerState, trainerContext } = state;
      if (!activeWorkout) return;
      const currentItem = activeWorkout.items[trainerContext.itemIndex];
      const exerciseName = currentItem?.name || 'Riposo';
      const series = `${trainerContext.currentSeries || '-'}/${currentItem?.series || '-'}`;
      const reps = `${trainerContext.currentRep || '-'}/${currentItem?.reps || '-'}`;
      let status = trainerState.toUpperCase();
      if (trainerState === 'announcing' || trainerState === 'action') { status += ` (${trainerContext.currentPhase || 'N/A'})`; }
      const logString = `Esercizio: ${exerciseName} | Serie: ${series} | Rep: ${reps} | Stato: ${status}`;
      console.log(`%c[${actionType}]`, 'color: #88aaff; font-weight: bold;', logString);
  }

  // --- Timer Logic ---
  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  };

  const startTimer = () => {
    stopTimer();
    timerInterval = setInterval(() => {
      dispatch({ type: 'TIMER_TICK' });
    }, TICK_INTERVAL);
  };

  const dispatch = (action) => {
    const oldState = { ...state };
    let newState = { ...state };
    let shouldNotify = true;

    switch (action.type) {
      case 'CHANGE_VIEW': newState = { ...state, currentView: action.payload }; break;
      case 'PREV_WEEK': { const d=new Date(state.focusedDate); d.setDate(d.getDate()-7); newState={...state, focusedDate:d}; break; }
      case 'NEXT_WEEK': { const d=new Date(state.focusedDate); d.setDate(d.getDate()+7); newState={...state, focusedDate:d}; break; }
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
          trainerContext: { itemIndex: 0, currentSeries: 1, currentRep: 1, currentPhaseIndex: 0, duration: 0, remaining: 0 }
        };
        break;
      }
      case 'FINISH_WORKOUT': {
        stopTimer();
        newState = { ...state, currentView: 'debriefing', completedWorkout: { ...state.activeWorkout, completed: true }, activeWorkout: null, trainerState: 'idle', trainerContext: {} };
        break;
      }
      case 'TERMINATE_WORKOUT': {
        stopTimer();
        const { activeWorkout, trainerContext } = state;
        const partialWorkout = { date: activeWorkout.date, fullPlan: activeWorkout.fullPlan, completed: false, terminationPoint: trainerContext };
        newState = { ...state, currentView: 'debriefing', completedWorkout: partialWorkout, activeWorkout: null, trainerState: 'idle', trainerContext: {} };
        break;
      }
      case 'SET_TRAINER_STATE': {
          const nextTrainerState = action.payload;
          const { activeWorkout, trainerContext } = state;
          const currentItem = activeWorkout.items[trainerContext.itemIndex];
          let duration = 0;

          switch(nextTrainerState) {
              case 'preparing': duration = 3000; break;
              case 'announcing': duration = 750; break;
              case 'action':
                  if (currentItem.type === 'time') { duration = (currentItem.duration || 10) * 1000; }
                  else { const tempo = currentItem.tempo || {}; duration = (tempo[trainerContext.currentPhase] || 1) * 1000; }
                  break;
              case 'rest':
                  duration = (currentItem.duration || 60) * 1000;
                  break;
          }
          newState = { ...state, trainerState: nextTrainerState, trainerContext: { ...state.trainerContext, duration, remaining: duration, stateBeforePause: null } };
          if (duration > 0) startTimer();
          break;
      }
      case 'PAUSE_TRAINER': {
        if (['paused', 'ready', 'finished'].includes(state.trainerState)) break;
        stopTimer();
        newState = { ...state, trainerState: 'paused', trainerContext: { ...state.trainerContext, stateBeforePause: state.trainerState } };
        break;
      }
      case 'RESUME_TRAINER': {
        if (state.trainerState !== 'paused') break;
        newState = { ...state, trainerState: state.trainerContext.stateBeforePause };
        startTimer();
        break;
      }
      case 'TIMER_TICK': {
        if (state.trainerState === 'paused') { shouldNotify = false; break; }
        const newRemaining = state.trainerContext.remaining - TICK_INTERVAL;
        if (newRemaining <= 0) {
          stopTimer();
          dispatch({ type: 'TIMER_COMPLETE' });
        } else {
          newState = { ...state, trainerContext: { ...state.trainerContext, remaining: newRemaining } };
        }
        break;
      }
      case 'TIMER_COMPLETE': {
        if (!state.activeWorkout) return;
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
          return null;
        };

        let nextState = trainerState;
        let nextContext = { ...trainerContext };

        switch (trainerState) {
          case 'preparing': {
            const firstItem = activeWorkout.items[0];
            if (firstItem.type === 'rest') { nextState = 'rest'; }
            else {
                nextState = 'announcing';
                if (firstItem.type === 'time') { nextContext.currentPhase = 'Esegui'; }
                else { const tempo = firstItem.tempo || {}; nextContext.currentPhase = Object.keys(tempo)[0] || 'up'; }
            }
            break;
          }
          case 'announcing': nextState = 'action'; break;
          case 'action': {
            if (currentItem.type === 'exercise') {
              const tempo = currentItem.tempo || {};
              const phases = Object.keys(tempo);
              const nextPhaseIndex = trainerContext.currentPhaseIndex + 1;
              if (nextPhaseIndex < phases.length) {
                nextState = 'announcing';
                nextContext.currentPhaseIndex = nextPhaseIndex;
                nextContext.currentPhase = phases[nextPhaseIndex];
              } else {
                nextContext.currentPhaseIndex = 0;
                if (trainerContext.currentRep < currentItem.reps) {
                  nextContext.currentRep++;
                  nextState = 'announcing';
                  nextContext.currentPhase = phases[0] || 'up';
                } else if (trainerContext.currentSeries < currentItem.series) {
                  nextContext.currentSeries++;
                  nextContext.currentRep = 1;
                  nextState = 'announcing';
                  nextContext.currentPhase = phases[0] || 'up';
                } else {
                  const advance = advanceToNextItem();
                  if (advance) { nextState = advance.newState; nextContext = { ...nextContext, ...advance.newContext }; }
                  else { nextState = 'finished'; }
                }
              }
            } else if (currentItem.type === 'time') {
                if (trainerContext.currentSeries < currentItem.series) {
                    nextContext.currentSeries++;
                    nextState = 'announcing';
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
            const advance = advanceToNextItem();
            if (advance) { nextState = advance.newState; nextContext = { ...nextContext, ...advance.newContext }; }
            else { nextState = 'finished'; }
            break;
          }
        }
        // Immediately dispatch the next state change
        dispatch({ type: 'SET_TRAINER_STATE', payload: nextState });
        newState = { ...state, trainerContext: nextContext };
        break;
      }
      default:
        action.type = '@@UNKNOWN';
        shouldNotify = false;
        break;
    }

    state = newState;
    if (shouldNotify && state !== oldState) {
      logState(action.type, state);
      if (state.workouts !== oldState.workouts) {
        saveToStorage(WORKOUTS_STORAGE_KEY, state.workouts);
      }
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
