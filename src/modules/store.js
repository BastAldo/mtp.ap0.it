console.log('File loaded: store.js');
import { saveToStorage } from './storage.js';
import { getExerciseById } from './exerciseRepository.js';
import { generatePlan } from './planGenerator.js';

const WORKOUTS_STORAGE_KEY = 'workouts';
const clone = (data) => JSON.parse(JSON.stringify(data));

const trainerInitialState = {
    status: 'idle',
    executionPlan: null,
    currentStepIndex: 0,
    stepStartTime: 0,
    remaining: 0,
    activeWorkout: null,
    completedWorkout: null,
};

function createStore() {
  let state = {
    currentView: 'calendar',
    focusedDate: new Date(),
    workouts: {},
    isModalOpen: false,
    modalContext: null,
    notice: null,
    trainer: { ...trainerInitialState },
  };

  const subscribers = new Set();
  function notify() { subscribers.forEach(callback => callback()); }

  const dispatch = (action) => {
    console.log(`Dispatching: ${action.type}`);
    const oldState = state;
    
    let newState = { ...state };

    // --- Trainer Logic (Re-integrated for stability) ---
    const trainerState = { ...newState.trainer };
    switch (action.type) {
        case 'START_WORKOUT': {
            const { date } = action.payload;
            const workoutItems = newState.workouts[`workout-${date}`];
            if (workoutItems?.length > 0) {
                const plan = generatePlan(workoutItems);
                newState.currentView = 'trainer';
                trainerState.status = 'ready';
                trainerState.executionPlan = plan;
                trainerState.activeWorkout = { date, items: workoutItems };
                trainerState.currentStepIndex = 0;
            }
            break;
        }
        case 'START_TRAINER':
            if (trainerState.status === 'ready') {
                trainerState.status = 'running';
                trainerState.stepStartTime = performance.now();
                trainerState.remaining = trainerState.executionPlan[0].duration;
            }
            break;
        case 'PAUSE_TRAINER':
            if (trainerState.status === 'running') {
                trainerState.status = 'paused';
            }
            break;
        case 'RESUME_TRAINER':
            if (trainerState.status === 'paused') {
                trainerState.status = 'running';
                trainerState.stepStartTime = performance.now() - (trainerState.executionPlan[trainerState.currentStepIndex].duration - trainerState.remaining);
            }
            break;
        case 'TICK':
            if (trainerState.status === 'running') {
                const { timestamp } = action.payload;
                const { duration } = trainerState.executionPlan[trainerState.currentStepIndex];
                const elapsedTime = timestamp - trainerState.stepStartTime;
                const newRemaining = duration - elapsedTime;

                if (newRemaining <= 0) {
                    const nextStepIndex = trainerState.currentStepIndex + 1;
                    if (nextStepIndex < trainerState.executionPlan.length) {
                        const nextStep = trainerState.executionPlan[nextStepIndex];
                        trainerState.currentStepIndex = nextStepIndex;
                        trainerState.stepStartTime = performance.now();
                        trainerState.remaining = nextStep.duration;
                        if (nextStep.type === 'finished') {
                            trainerState.status = 'finished';
                            trainerState.completedWorkout = { ...trainerState.activeWorkout, completed: true };
                        }
                    }
                } else {
                    trainerState.remaining = newRemaining;
                }
            }
            break;
        case 'TERMINATE_WORKOUT':
            if (trainerState.status !== 'idle' && trainerState.status !== 'finished') {
                const currentStep = trainerState.executionPlan[trainerState.currentStepIndex];
                const itemIndex = trainerState.activeWorkout.items.findIndex(i => i.id === currentStep.item?.id);
                trainerState.status = 'finished';
                trainerState.completedWorkout = { ...trainerState.activeWorkout, completed: false, terminationPoint: { itemIndex: itemIndex > -1 ? itemIndex : 0, currentSeries: currentStep.context?.currentSeries || 1 }};
                newState.currentView = 'debriefing';
            }
            break;
        case 'FINISH_WORKOUT':
            if (trainerState.status === 'finished') {
                newState.currentView = 'debriefing';
            }
            break;
    }
    newState.trainer = trainerState;

    // --- General App Logic ---
    switch (action.type) {
      case 'CHANGE_VIEW': newState.currentView = action.payload; break;
      case 'PREV_WEEK': { const d = new Date(newState.focusedDate); d.setDate(d.getDate() - 7); newState.focusedDate = d; break; }
      case 'NEXT_WEEK': { const d = new Date(newState.focusedDate); d.setDate(d.getDate() + 7); newState.focusedDate = d; break; }
      case 'SET_WORKOUTS': newState.workouts = action.payload; break;
      case 'OPEN_MODAL': newState.isModalOpen = true; newState.modalContext = action.payload; break;
      case 'CLOSE_MODAL': newState.isModalOpen = false; newState.modalContext = null; break;
      case 'SHOW_NOTICE': newState.notice = { message: action.payload.message, id: Date.now() }; break;
      case 'ADD_EXERCISE_ITEM': { const { date, exerciseId } = action.payload; const dateKey = `workout-${date}`; const exercise = getExerciseById(exerciseId); if (!exercise) break; const newItem = { ...exercise, id: `item-${Date.now()}`, type: exercise.type || 'exercise', exerciseId: exercise.id }; const newWorkouts = clone(newState.workouts); const dayWorkout = newWorkouts[dateKey] || []; dayWorkout.push(newItem); newWorkouts[dateKey] = dayWorkout; newState.workouts = newWorkouts; newState.modalContext = { type: 'EDIT_WORKOUT', date }; break; }
      case 'ADD_REST_ITEM': { const { date } = action.payload; const dateKey = `workout-${date}`; const newItem = { id: `item-${Date.now()}`, type: 'rest', duration: 60 }; const newWorkouts = clone(newState.workouts); const dayWorkout = newWorkouts[dateKey] || []; dayWorkout.push(newItem); newWorkouts[dateKey] = dayWorkout; newState.workouts = newWorkouts; break; }
      case 'REMOVE_WORKOUT_ITEM': { const { date, itemId } = action.payload; const dateKey = `workout-${date}`; const newWorkouts = clone(newState.workouts); newWorkouts[dateKey] = (newWorkouts[dateKey] || []).filter(item => item.id !== itemId); newState.workouts = newWorkouts; break; }
      case 'UPDATE_REST_DURATION': { const { date, itemId, newDuration } = action.payload; const dateKey = `workout-${date}`; const newWorkouts = clone(newState.workouts); const dayWorkout = newWorkouts[dateKey] || []; const itemIndex = dayWorkout.findIndex(item => item.id === itemId); if (itemIndex > -1 && dayWorkout[itemIndex].type === 'rest') { dayWorkout[itemIndex].duration = newDuration; newWorkouts[dateKey] = dayWorkout; newState.workouts = newWorkouts; } break; }
      case 'REORDER_WORKOUT_ITEMS': { const { date, draggedItemId, targetItemId } = action.payload; const dateKey = `workout-${date}`; const newWorkouts = clone(newState.workouts); const items = newWorkouts[dateKey] || []; const draggedIndex = items.findIndex(item => item.id === draggedItemId); const targetIndex = items.findIndex(item => item.id === targetItemId); if (draggedIndex > -1 && targetIndex > -1) { const [draggedItem] = items.splice(draggedIndex, 1); items.splice(targetIndex, 0, draggedItem); newWorkouts[dateKey] = items; newState.workouts = newWorkouts; } break; }
    }
    
    state = newState;

    if (oldState.workouts !== state.workouts) {
      saveToStorage(WORKOUTS_STORAGE_KEY, state.workouts);
    }
    notify();
  };

  return {
    getState: () => state,
    subscribe: (callback) => { subscribers.add(callback); return () => subscribers.delete(callback); },
    dispatch,
  };
}

const store = createStore();
export default store;
