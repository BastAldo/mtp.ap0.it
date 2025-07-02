import { saveToStorage } from './storage.js';
import { getExerciseById } from './exerciseRepository.js';

const WORKOUTS_STORAGE_KEY = 'workouts';
const TICK_INTERVAL = 100;

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
      case 'START_WORKOUT': {
        const { date } = action.payload;
        const dateKey = `workout-${date}`;
        const workoutItems = state.workouts[dateKey];
        if (!workoutItems || workoutItems.length === 0) break;
        stopTimer();
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
      case 'PAUSE_TRAINER': {
        if (state.trainerState === 'paused') break;
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
        if (state.trainerState === 'paused' || !state.activeWorkout) { shouldNotify = false; break; }
        const newRemaining = state.trainerContext.remaining - TICK_INTERVAL;
        if (newRemaining <= 0) {
          stopTimer();
          dispatch({ type: 'ADVANCE_TRAINER_STATE' });
          shouldNotify = false; // L'azione di avanzamento notificherà
        } else {
          newState = { ...state, trainerContext: { ...state.trainerContext, remaining: newRemaining } };
        }
        break;
      }
      case 'ADVANCE_TRAINER_STATE': {
          stopTimer();
          const { trainerState, activeWorkout, trainerContext } = state;
          if (!activeWorkout) break;
          
          const currentItem = activeWorkout.items[trainerContext.itemIndex];
          
          const getNextStateInfo = () => {
              const currentState = trainerState === 'ready' ? 'preparing' : trainerState;
              switch (currentState) {
                  case 'preparing': {
                      const firstItem = activeWorkout.items[0];
                      const nextState = firstItem.type === 'rest' ? 'rest' : 'announcing';
                      const nextContext = { ...trainerContext };
                      if (nextState === 'announcing') {
                          nextContext.currentPhase = firstItem.type === 'time' ? 'Esegui' : (Object.keys(firstItem.tempo || {})[0] || 'up');
                      }
                      return { nextState, nextContext };
                  }
                  case 'announcing':
                      return { nextState: 'action', nextContext: { ...trainerContext } };
                  case 'action': {
                      let nextContext = { ...trainerContext };
                      if (currentItem.type === 'exercise') {
                          const tempo = currentItem.tempo || {};
                          const phases = Object.keys(tempo);
                          if (nextContext.currentPhaseIndex < phases.length - 1) {
                              nextContext.currentPhaseIndex++;
                              nextContext.currentPhase = phases[nextContext.currentPhaseIndex];
                              return { nextState: 'announcing', nextContext };
                          } else {
                              nextContext.currentPhaseIndex = 0;
                              if (nextContext.currentRep < currentItem.reps) {
                                  nextContext.currentRep++;
                                  nextContext.currentPhase = phases[0] || 'up';
                                  return { nextState: 'announcing', nextContext };
                              } else if (nextContext.currentSeries < currentItem.series) {
                                  nextContext.currentSeries++;
                                  nextContext.currentRep = 1;
                                  nextContext.currentPhase = phases[0] || 'up';
                                  return { nextState: 'announcing', nextContext };
                              }
                          }
                      } else if (currentItem.type === 'time') {
                          if (nextContext.currentSeries < currentItem.series) {
                              nextContext.currentSeries++;
                              return { nextState: 'announcing', nextContext };
                          }
                      }
                      // Fallthrough to advance item
                  }
                  case 'rest': {
                      if (trainerContext.itemIndex < activeWorkout.items.length - 1) {
                          const nextItemIndex = trainerContext.itemIndex + 1;
                          const nextItem = activeWorkout.items[nextItemIndex];
                          const nextState = nextItem.type === 'rest' ? 'rest' : 'announcing';
                          const nextContext = { itemIndex: nextItemIndex, currentSeries: 1, currentRep: 1, currentPhaseIndex: 0 };
                          if (nextState === 'announcing') {
                              nextContext.currentPhase = nextItem.type === 'time' ? 'Esegui' : (Object.keys(nextItem.tempo || {})[0] || 'up');
                          }
                          return { nextState, nextContext };
                      }
                  }
              }
              return { nextState: 'finished', nextContext: { ...trainerContext } };
          };
          
          const { nextState, nextContext } = getNextStateInfo();
          
          let duration = 0;
          if (nextState !== 'finished') {
              const itemForDuration = activeWorkout.items[nextContext.itemIndex];
              switch(nextState) {
                  case 'preparing': duration = 3000; break;
                  case 'announcing': duration = 750; break;
                  case 'action':
                      if (itemForDuration.type === 'time') { duration = (itemForDuration.duration || 10) * 1000; }
                      else { const tempo = itemForDuration.tempo || {}; duration = (tempo[nextContext.currentPhase] || 1) * 1000; }
                      break;
                  case 'rest':
                      duration = (itemForDuration.duration || 60) * 1000;
                      break;
              }
          }

          newState = { ...state, trainerState: nextState, trainerContext: { ...nextContext, duration, remaining: duration } };
          if (duration > 0) {
              startTimer();
          }
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
