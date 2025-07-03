import { saveToStorage } from './storage.js';
import { getExerciseById } from './exerciseRepository.js';
import { generatePlan } from './planGenerator.js';
import { trainerReducer } from './trainerReducer.js';
import { logger } from './logger.js';

const WORKOUTS_STORAGE_KEY = 'workouts';
const clone = (data) => JSON.parse(JSON.stringify(data));

function createStore() {
  let state = {
    currentView: 'calendar',
    focusedDate: new Date(),
    workouts: {},
    isModalOpen: false,
    modalContext: null,
    notice: null,
    trainer: trainerReducer(undefined, {}), // Inizializza lo stato del trainer
  };

  const subscribers = new Set();
  function notify() { subscribers.forEach(callback => callback()); }

  const dispatch = (action) => {
    const oldState = { ...state };
    let newState = { ...state };
    let shouldNotify = true;
    
    // La logica del trainer è ora delegata al suo reducer
    newState.trainer = trainerReducer(state.trainer, action);
    
    // Altre logiche di stato
    switch (action.type) {
      case 'CHANGE_VIEW': newState = { ...newState, currentView: action.payload }; break;
      case 'PREV_WEEK': { const d = new Date(state.focusedDate); d.setDate(d.getDate() - 7); newState = { ...newState, focusedDate: d }; break; }
      case 'NEXT_WEEK': { const d = new Date(state.focusedDate); d.setDate(d.getDate() + 7); newState = { ...newState, focusedDate: d }; break; }
      case 'SET_WORKOUTS': newState = { ...newState, workouts: action.payload }; break;
      case 'OPEN_MODAL': newState = { ...newState, isModalOpen: true, modalContext: action.payload }; break;
      case 'CLOSE_MODAL': newState = { ...newState, isModalOpen: false, modalContext: null }; break;
      case 'SHOW_NOTICE': newState = { ...newState, notice: { message: action.payload.message, id: Date.now() } }; break;
      case 'ADD_EXERCISE_ITEM': { const { date, exerciseId } = action.payload; const dateKey = `workout-${date}`; const exercise = getExerciseById(exerciseId); if (!exercise) break; const newItem = { ...exercise, id: `item-${Date.now()}`, type: exercise.type || 'exercise', exerciseId: exercise.id }; const newWorkouts = clone(state.workouts); const dayWorkout = newWorkouts[dateKey] || []; dayWorkout.push(newItem); newWorkouts[dateKey] = dayWorkout; newState = { ...newState, workouts: newWorkouts, modalContext: { type: 'EDIT_WORKOUT', date } }; break; }
      case 'ADD_REST_ITEM': { const { date } = action.payload; const dateKey = `workout-${date}`; const newItem = { id: `item-${Date.now()}`, type: 'rest', duration: 60 }; const newWorkouts = clone(state.workouts); const dayWorkout = newWorkouts[dateKey] || []; dayWorkout.push(newItem); newWorkouts[dateKey] = dayWorkout; newState = { ...newState, workouts: newWorkouts }; break; }
      case 'REMOVE_WORKOUT_ITEM': { const { date, itemId } = action.payload; const dateKey = `workout-${date}`; const newWorkouts = clone(state.workouts); newWorkouts[dateKey] = (newWorkouts[dateKey] || []).filter(item => item.id !== itemId); newState = { ...newState, workouts: newWorkouts }; break; }
      case 'UPDATE_REST_DURATION': { const { date, itemId, newDuration } = action.payload; const dateKey = `workout-${date}`; const newWorkouts = clone(state.workouts); const dayWorkout = newWorkouts[dateKey] || []; const itemIndex = dayWorkout.findIndex(item => item.id === itemId); if (itemIndex > -1 && dayWorkout[itemIndex].type === 'rest') { dayWorkout[itemIndex].duration = newDuration; newWorkouts[dateKey] = dayWorkout; newState = { ...newState, workouts: newWorkouts }; } break; }
      case 'REORDER_WORKOUT_ITEMS': { const { date, draggedItemId, targetItemId } = action.payload; const dateKey = `workout-${date}`; const newWorkouts = clone(state.workouts); const items = newWorkouts[dateKey] || []; const draggedIndex = items.findIndex(item => item.id === draggedItemId); const targetIndex = items.findIndex(item => item.id === targetItemId); if (draggedIndex > -1 && targetIndex > -1) { const [draggedItem] = items.splice(draggedIndex, 1); items.splice(targetIndex, 0, draggedItem); newWorkouts[dateKey] = items; newState = { ...newState, workouts: newWorkouts }; } break; }
      
      // Logica per gestire gli effetti collaterali dello stato del trainer
      case 'START_WORKOUT_SESSION': {
        const { date } = action.payload;
        const workoutItems = state.workouts[`workout-${date}`];
        if (workoutItems?.length > 0) {
          const plan = generatePlan(workoutItems);
          newState.currentView = 'trainer';
          newState.trainer = trainerReducer(newState.trainer, { type: 'START_WORKOUT_PLAN', payload: plan });
        }
        break;
      }
      case 'FINISH_WORKOUT_SESSION': {
        const { activeWorkout, completedWorkout } = state.trainer;
        const debriefData = { ...activeWorkout, ...completedWorkout };
        newState.currentView = 'debriefing';
        newState.trainer = trainerReducer(newState.trainer, { type: 'RESET_TRAINER', payload: debriefData });
        break;
      }
      case 'TERMINATE_WORKOUT_SESSION': {
        const { activeWorkout, completedWorkout } = state.trainer;
        const debriefData = { ...activeWorkout, ...completedWorkout };
        newState.currentView = 'debriefing';
        newState.trainer = trainerReducer(newState.trainer, { type: 'RESET_TRAINER', payload: debriefData });
        break;
      }
    }
    
    state = newState;

    if (shouldNotify) {
      logger(action, state);
      if (state.workouts !== oldState.workouts) {
        saveToStorage(WORKOUTS_STORAGE_KEY, state.workouts);
      }
      notify();
    }
  };

  return {
    getState: () => ({ ...state, trainerState: state.trainer.status, trainerContext: state.trainer }),
    subscribe: (callback) => { subscribers.add(callback); return () => subscribers.delete(callback); },
    dispatch,
  };
}

const store = createStore();
export default store;
