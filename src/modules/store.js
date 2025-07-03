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
    trainerState: 'idle',
    trainerContext: {},
  };

  const subscribers = new Set();
  function notify() { subscribers.forEach(callback => callback()); }

  function logState(actionType, state) {
      if (actionType.startsWith('@@')) return;
      const { activeWorkout, trainerState, trainerContext } = state;
      if (!activeWorkout) {
          console.log(`%c[${actionType}]`, 'color: #88aaff; font-weight: bold;', `View: ${state.currentView}`);
          return;
      };
      const { currentItem, currentSeries, currentRep, currentPhase } = trainerContext;
      if(!currentItem) return;

      const exerciseName = currentItem.name || 'Riposo';
      const series = `S:${currentSeries || '-'}/${currentItem.series || '-'}`;
      const reps = `R:${currentRep || '-'}/${currentItem.reps || '-'}`;
      let status = trainerState.toUpperCase();
      if(currentPhase) status += ` (${currentPhase.toUpperCase()})`

      const logString = `Esercizio: ${exerciseName} | ${series} | ${reps} | Stato: ${status}`;
      console.log(`%c[${actionType}]`, 'color: #88aaff; font-weight: bold;', logString);
  }

  const dispatch = (action) => {
    const oldState = { ...state };
    let newState = { ...state };
    let shouldNotify = true;

    switch (action.type) {
      // ... (other cases remain the same)
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

      // TRAINER LIFECYCLE
      case 'START_WORKOUT': {
        const { date } = action.payload;
        const workoutItems = state.workouts[`workout-${date}`];
        if (!workoutItems || workoutItems.length === 0) break;
        newState = { ...state, currentView: 'trainer', activeWorkout: { date, items: workoutItems, fullPlan: workoutItems }, trainerState: 'ready', trainerContext: { itemIndex: 0, currentSeries: 1, currentRep: 1, currentItem: workoutItems[0] } };
        break;
      }
      case 'FINISH_WORKOUT': {
        newState = { ...state, currentView: 'debriefing', completedWorkout: { ...state.activeWorkout, completed: true }, activeWorkout: null, trainerState: 'idle', trainerContext: {} };
        break;
      }
      case 'TERMINATE_WORKOUT': {
        const { activeWorkout, trainerContext } = state;
        const partialWorkout = { ...activeWorkout, completed: false, terminationPoint: trainerContext };
        newState = { ...state, currentView: 'debriefing', completedWorkout: partialWorkout, activeWorkout: null, trainerState: 'idle', trainerContext: {} };
        break;
      }
      case 'START_TRAINER': {
        if (state.trainerState === 'ready') {
          const duration = 3000;
          newState = { ...state, trainerState: 'preparing', trainerContext: { ...state.trainerContext, duration, remaining: duration } };
        }
        break;
      }
      case 'PAUSE_TRAINER': {
        if (!['paused', 'ready', 'finished'].includes(state.trainerState)) {
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
          newState = { ...state, trainerContext: { ...state.trainerContext, remaining: newRemaining } };
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
        const currentItem = trainerContext.currentItem;

        // --- LOGICA DI TRANSIZIONE REIMPLEMENTATA ---

        if (trainerState === 'preparing' || trainerState === 'rest') {
          // Dopo la preparazione o il riposo, si annuncia il prossimo esercizio
          nextState = 'announcing';
        }
        else if (trainerState === 'announcing') {
          // Dopo l'annuncio, si passa all'azione
          nextState = 'action';
        }
        else if (trainerState === 'action') {
          // Logica principale: cosa fare dopo un'azione completata
          let itemIsComplete = false;
          let repIsComplete = false;

          if (currentItem.type === 'time') {
              repIsComplete = true; // Per gli ex a tempo, ogni azione è una "ripetizione"
          } else { // Esercizio a 'reps' con 'tempo'
              const tempoPhases = Object.keys(currentItem.tempo || {});
              const currentPhaseIndex = tempoPhases.indexOf(nextContext.currentPhase);
              if (currentPhaseIndex < tempoPhases.length - 1) {
                  nextContext.currentPhase = tempoPhases[currentPhaseIndex + 1];
              } else {
                  repIsComplete = true;
              }
          }

          if (repIsComplete) {
              if (nextContext.currentRep < (currentItem.reps || 1)) {
                  nextContext.currentRep++;
              } else if (nextContext.currentSeries < (currentItem.series || 1)) {
                  nextContext.currentSeries++;
                  nextContext.currentRep = 1;
                  nextState = 'rest'; // Passa al riposo tra le serie
              } else {
                  itemIsComplete = true;
              }
          }

          if (itemIsComplete) {
              if (nextContext.itemIndex < activeWorkout.items.length - 1) {
                  // Avanza al prossimo item
                  nextContext = { itemIndex: nextContext.itemIndex + 1, currentSeries: 1, currentRep: 1 };
                  nextState = 'announcing'; // Annuncia il nuovo item
              } else {
                  nextState = 'finished'; // Workout completato
              }
          } else if (nextState !== 'rest') {
            nextState = 'action'; // Continua con la prossima fase/rep
          }
        }

        // --- IMPOSTAZIONE DEL NUOVO STATO ---
        if (nextState !== 'finished') {
          const newItem = activeWorkout.items[nextContext.itemIndex];
          nextContext.currentItem = newItem;

          // Se il nuovo item è un blocco di riposo, forza lo stato a 'rest'
          if (newItem.type === 'rest' && trainerState !== 'rest') {
            nextState = 'rest';
          }

          let duration = 0;
          switch (nextState) {
            case 'announcing': duration = 750; break;
            case 'rest': duration = (newItem.defaultRest || 60) * 1000; break;
            case 'action':
              if (newItem.type === 'time') {
                duration = (newItem.duration || 10) * 1000;
              } else {
                const tempoPhases = Object.keys(newItem.tempo || { 'down': 1 });
                if (!nextContext.currentPhase) nextContext.currentPhase = tempoPhases[0];
                duration = (newItem.tempo[nextContext.currentPhase] || 1) * 1000;
              }
              break;
          }
          nextContext.duration = duration;
          nextContext.remaining = duration;
        }
        newState = { ...state, trainerState: nextState, trainerContext: nextContext };
        break;
      }
      default: shouldNotify = false; break;
    }

    state = newState;
    if (shouldNotify) {
      logState(action.type, state);
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
