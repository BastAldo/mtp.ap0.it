import { saveToStorage } from './storage.js';
import { getExerciseById } from './exerciseRepository.js';
import { generatePlan } from './planGenerator.js';
import * as timer from './timer.js';

const WORKOUTS_STORAGE_KEY = 'workouts';
const ADVANCE_STEP_DELAY = 150;

const trainerInitialState = {
    status: 'idle',
    executionPlan: null,
    currentStepIndex: 0,
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
  function notify() { for (const callback of subscribers) { callback(); } }

  function handleTimerTick(tick) {
      dispatch({ type: 'TIMER_TICK', payload: { tick } });
  }

  const dispatch = (action) => {
    if (!['TIMER_TICK', 'ADVANCE_STEP', 'GO_TO_DEBRIEFING'].includes(action.type)) {
      console.log(`%c[${action.type}]`, 'color: #88aaff; font-weight: bold;', action.payload || '');
    }

    const oldState = state;
    const newState = { ...state, trainer: { ...state.trainer } };

    switch (action.type) {
      case 'CHANGE_VIEW': newState.currentView = action.payload; break;
      case 'PREV_WEEK': { const d = new Date(newState.focusedDate); d.setDate(d.getDate() - 7); newState.focusedDate = d; break; }
      case 'NEXT_WEEK': { const d = new Date(newState.focusedDate); d.setDate(d.getDate() + 7); newState.focusedDate = d; break; }
      case 'SET_WORKOUTS': newState.workouts = action.payload; break;
      case 'OPEN_MODAL': newState.isModalOpen = true; newState.modalContext = action.payload; break;
      case 'CLOSE_MODAL': newState.isModalOpen = false; newState.modalContext = null; break;
      case 'SHOW_NOTICE': newState.notice = { message: action.payload.message, id: Date.now() }; break;
      case 'ADD_EXERCISE_ITEM': { const { date, exerciseId } = action.payload; const dateKey = `workout-${date}`; const exercise = getExerciseById(exerciseId); if (!exercise) break; const newItem = { ...exercise, id: `item-${Date.now()}`, type: exercise.type || 'exercise', exerciseId: exercise.id }; const dayWorkout = [...(newState.workouts[dateKey] || [])]; dayWorkout.push(newItem); newState.workouts = { ...newState.workouts, [dateKey]: dayWorkout }; newState.modalContext = { type: 'EDIT_WORKOUT', date }; break; }
      case 'ADD_REST_ITEM': { const { date } = action.payload; const dateKey = `workout-${date}`; const newItem = { id: `item-${Date.now()}`, type: 'rest', duration: 60 }; const dayWorkout = [...(newState.workouts[dateKey] || [])]; dayWorkout.push(newItem); newState.workouts = { ...newState.workouts, [dateKey]: dayWorkout }; break; }
      case 'REMOVE_WORKOUT_ITEM': { const { date, itemId } = action.payload; const dateKey = `workout-${date}`; const updatedWorkout = (newState.workouts[dateKey] || []).filter(item => item.id !== itemId); newState.workouts = { ...newState.workouts, [dateKey]: updatedWorkout }; break; }
      case 'UPDATE_REST_DURATION': { const { date, itemId, newDuration } = action.payload; const dateKey = `workout-${date}`; const dayWorkout = (newState.workouts[dateKey] || []).map(item => item.id === itemId ? { ...item, duration: newDuration } : item); newState.workouts = { ...newState.workouts, [dateKey]: dayWorkout }; break; }
      case 'REORDER_WORKOUT_ITEMS': { const { date, draggedItemId, targetItemId } = action.payload; const dateKey = `workout-${date}`; const items = [...(newState.workouts[dateKey] || [])]; const draggedIndex = items.findIndex(item => item.id === draggedItemId); const targetIndex = items.findIndex(item => item.id === targetItemId); if (draggedIndex > -1 && targetIndex > -1) { const [draggedItem] = items.splice(draggedIndex, 1); items.splice(targetIndex, 0, draggedItem); newState.workouts = { ...newState.workouts, [dateKey]: items }; } break; }
      
      case 'START_WORKOUT': {
        newState.trainer = { ...trainerInitialState }; // Reset before starting
        const { date } = action.payload;
        const workoutItems = newState.workouts[`workout-${date}`];
        if (workoutItems?.length > 0) {
          const plan = generatePlan(workoutItems);
          newState.currentView = 'trainer';
          newState.trainer = { ...newState.trainer, status: 'ready', executionPlan: plan, activeWorkout: { date, items: workoutItems } };
        }
        break;
      }
      case 'START_TRAINER':
        if (newState.trainer.status === 'ready') {
          newState.trainer.status = 'running';
          const firstStep = newState.trainer.executionPlan[0];
          newState.trainer.remaining = firstStep.duration;
          timer.start(handleTimerTick);
        }
        break;
      case 'PAUSE_TRAINER':
        if (newState.trainer.status === 'running') {
          newState.trainer.status = 'paused';
          timer.stop();
        }
        break;
      case 'RESUME_TRAINER':
        if (newState.trainer.status === 'paused') {
          newState.trainer.status = 'running';
          timer.start(handleTimerTick);
        }
        break;
      case 'TIMER_TICK':
        if (newState.trainer.status === 'running') {
          const newRemaining = newState.trainer.remaining - action.payload.tick;
          if (newRemaining <= 0) {
            newState.trainer.remaining = 0;
            timer.stop();
            setTimeout(() => dispatch({ type: 'ADVANCE_STEP' }), ADVANCE_STEP_DELAY);
          } else {
            newState.trainer.remaining = newRemaining;
          }
        }
        break;
      case 'ADVANCE_STEP': {
          const { executionPlan, currentStepIndex } = newState.trainer;
          const nextStepIndex = currentStepIndex + 1;
          if (nextStepIndex < executionPlan.length) {
              const nextStep = executionPlan[nextStepIndex];
              newState.trainer.currentStepIndex = nextStepIndex;
              newState.trainer.remaining = nextStep.duration;

              if (nextStep.type === 'finished') {
                  newState.trainer.status = 'finished';
                  newState.trainer.completedWorkout = { ...newState.trainer.activeWorkout, completed: true };
                  setTimeout(() => dispatch({ type: 'GO_TO_DEBRIEFING' }), 2000);
              } else {
                  timer.start(handleTimerTick);
              }
          }
          break;
      }
      case 'TERMINATE_WORKOUT':
        if (newState.trainer.status !== 'idle' && newState.trainer.status !== 'finished') {
          timer.stop();
          const { executionPlan, currentStepIndex, activeWorkout } = newState.trainer;
          const currentStep = executionPlan[currentStepIndex];
          const itemIndex = activeWorkout.items.findIndex(i => i.id === currentStep.item?.id);
          newState.trainer.status = 'finished';
          newState.trainer.completedWorkout = { ...activeWorkout, completed: false, terminationPoint: { itemIndex: itemIndex > -1 ? itemIndex : 0, currentSeries: currentStep.context?.currentSeries || 1 } };
          newState.currentView = 'debriefing';
        }
        break;
      case 'GO_TO_DEBRIEFING':
        newState.currentView = 'debriefing';
        break;
      case 'FINISH_WORKOUT':
        newState.trainer = { ...trainerInitialState };
        newState.currentView = 'calendar';
        break;
    }

    state = newState;
    if (JSON.stringify(state.workouts) !== JSON.stringify(oldState.workouts)) {
      saveToStorage(WORKOUTS_STORAGE_KEY, state.workouts);
    }
    notify();
  };

  return { getState: () => state, subscribe: (callback) => { subscribers.add(callback); return () => subscribers.delete(callback); }, dispatch };
}

const store = createStore();
export default store;
