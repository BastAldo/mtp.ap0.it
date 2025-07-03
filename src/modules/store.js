import { saveToStorage } from './storage.js';
import { getExerciseById } from './exerciseRepository.js';
import { generatePlan } from './planGenerator.js';

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
    trainerState: 'idle', 
    trainerContext: {}, 
  };

  const subscribers = new Set();
  function notify() { subscribers.forEach(callback => callback()); }

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
      case 'ADD_EXERCISE_ITEM': { const { date, exerciseId } = action.payload; const dateKey = `workout-${date}`; const exercise = getExerciseById(exerciseId); if (!exercise) break; const newItem = { ...exercise, id: `item-${Date.now()}`, type: exercise.type || 'exercise', exerciseId: exercise.id }; const newWorkouts = cloneWorkouts(state.workouts); const dayWorkout = newWorkouts[dateKey] || []; dayWorkout.push(newItem); newWorkouts[dateKey] = dayWorkout; newState = { ...state, workouts: newWorkouts, modalContext: { type: 'EDIT_WORKOUT', date } }; break; }
      case 'ADD_REST_ITEM': { const { date } = action.payload; const dateKey = `workout-${date}`; const newItem = { id: `item-${Date.now()}`, type: 'rest', duration: 60 }; const newWorkouts = cloneWorkouts(state.workouts); const dayWorkout = newWorkouts[dateKey] || []; dayWorkout.push(newItem); newWorkouts[dateKey] = dayWorkout; newState = { ...state, workouts: newWorkouts }; break; }
      case 'REMOVE_WORKOUT_ITEM': { const { date, itemId } = action.payload; const dateKey = `workout-${date}`; const newWorkouts = cloneWorkouts(state.workouts); newWorkouts[dateKey] = (newWorkouts[dateKey] || []).filter(item => item.id !== itemId); newState = { ...state, workouts: newWorkouts }; break; }
      case 'UPDATE_REST_DURATION': { const { date, itemId, newDuration } = action.payload; const dateKey = `workout-${date}`; const newWorkouts = cloneWorkouts(state.workouts); const dayWorkout = newWorkouts[dateKey] || []; const itemIndex = dayWorkout.findIndex(item => item.id === itemId); if (itemIndex > -1 && dayWorkout[itemIndex].type === 'rest') { dayWorkout[itemIndex].duration = newDuration; newWorkouts[dateKey] = dayWorkout; newState = { ...state, workouts: newWorkouts }; } break; }
      case 'REORDER_WORKOUT_ITEMS': { const { date, draggedItemId, targetItemId } = action.payload; const dateKey = `workout-${date}`; const newWorkouts = cloneWorkouts(state.workouts); const items = newWorkouts[dateKey] || []; const draggedIndex = items.findIndex(item => item.id === draggedItemId); const targetIndex = items.findIndex(item => item.id === targetItemId); if (draggedIndex > -1 && targetIndex > -1) { const [draggedItem] = items.splice(draggedIndex, 1); items.splice(targetIndex, 0, draggedItem); newWorkouts[dateKey] = items; newState = { ...state, workouts: newWorkouts }; } break; }

      // --- TRAINER LIFECYCLE (REFACTORED) ---
      case 'START_WORKOUT': {
        const { date } = action.payload;
        const workoutItems = state.workouts[`workout-${date}`];
        if (!workoutItems || workoutItems.length === 0) break;
        const plan = generatePlan(workoutItems);
        newState = { ...state, currentView: 'trainer', activeWorkout: { date, items: workoutItems }, trainerState: 'ready', trainerContext: { executionPlan: plan, currentStepIndex: 0 } };
        break;
      }
      case 'START_TRAINER': {
        if (state.trainerState === 'ready') {
          const firstStep = state.trainerContext.executionPlan[0];
          newState = { ...state, trainerState: 'running', trainerContext: { ...state.trainerContext, remaining: firstStep.duration } };
        }
        break;
      }
      case 'TIMER_TICK': {
        if (state.trainerState !== 'running') { shouldNotify = false; break; }
        const newRemaining = (state.trainerContext.remaining || 0) - action.payload.tick;

        if (newRemaining > 0) {
          newState = { ...state, trainerContext: { ...state.trainerContext, remaining: newRemaining } };
        } else {
          const { executionPlan, currentStepIndex } = state.trainerContext;
          const nextStepIndex = currentStepIndex + 1;

          if (nextStepIndex >= executionPlan.length) {
            const fullPlan = state.activeWorkout.items;
            newState = { ...state, currentView: 'debriefing', completedWorkout: { ...state.activeWorkout, completed: true, fullPlan }, activeWorkout: null, trainerState: 'idle', trainerContext: {} };
            break;
          }

          const nextStep = executionPlan[nextStepIndex];

          if (nextStep.type === 'finished') {
            newState = { ...state, trainerState: 'finished', trainerContext: { ...state.trainerContext, currentStepIndex: nextStepIndex, remaining: 0 }};
          } else {
            newState = { ...state, trainerState: 'running', trainerContext: { ...state.trainerContext, currentStepIndex: nextStepIndex, remaining: nextStep.duration }};
          }
        }
        break;
      }
      case 'PAUSE_TRAINER': {
        if (state.trainerState === 'running') {
          newState = { ...state, trainerState: 'paused' };
        }
        break;
      }
      case 'RESUME_TRAINER': {
        if (state.trainerState === 'paused') {
          newState = { ...state, trainerState: 'running' };
        }
        break;
      }
      case 'FINISH_WORKOUT': {
        const fullPlan = state.activeWorkout.items;
        newState = { ...state, currentView: 'debriefing', completedWorkout: { ...state.activeWorkout, completed: true, fullPlan }, activeWorkout: null, trainerState: 'idle', trainerContext: {} };
        break;
      }
      case 'TERMINATE_WORKOUT': {
        const { activeWorkout, trainerContext } = state;
        const { executionPlan, currentStepIndex } = trainerContext;
        const fullPlan = activeWorkout.items;
        
        const currentStep = executionPlan[currentStepIndex];
        const currentItem = currentStep?.item;
        const originalItemIndex = currentItem ? fullPlan.findIndex(i => i.id === currentItem.id) : -1;

        const terminationPoint = {
          itemIndex: originalItemIndex > -1 ? originalItemIndex : 0,
          currentSeries: currentStep?.context?.currentSeries || 1,
        };

        const partialWorkout = { ...activeWorkout, completed: false, fullPlan, terminationPoint };
        newState = { ...state, currentView: 'debriefing', completedWorkout: partialWorkout, activeWorkout: null, trainerState: 'idle', trainerContext: {} };
        break;
      }
      default: shouldNotify = false; break;
    }

    state = newState;
    if (shouldNotify) {
      if (state.workouts !== oldState.workouts) { saveToStorage(WORKOUTS_STORAGE_KEY, state.workouts); }
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
