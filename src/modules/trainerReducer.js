// --- Reducer Puro per la Logica del Trainer ---

const initialState = {
    status: 'idle', // idle, ready, running, paused, finished
    executionPlan: null,
    currentStepIndex: 0,
    stepStartTime: 0,
    remaining: 0,
    activeWorkout: null,    // Dati originali del workout attivo
    completedWorkout: null, // Dati per il debriefing
};

function advanceStep(state) {
  const nextStepIndex = state.currentStepIndex + 1;
  if (nextStepIndex >= state.executionPlan.length) {
    return { ...state, status: 'finished' };
  }
  
  const nextStep = state.executionPlan[nextStepIndex];
  
  if (nextStep.type === 'finished') {
    return {
      ...state,
      status: 'finished',
      currentStepIndex: nextStepIndex,
      completedWorkout: { completed: true }
    };
  }
  
  return {
    ...state,
    currentStepIndex: nextStepIndex,
    stepStartTime: performance.now(),
    remaining: nextStep.duration,
  };
}

export function trainerReducer(state = initialState, action) {
    switch (action.type) {
        case 'START_WORKOUT_PLAN': {
          return {
            ...initialState,
            status: 'ready',
            executionPlan: action.payload,
            activeWorkout: { date: new Date().toISOString(), items: action.payload.map(p => p.item).filter(Boolean) }
          };
        }

        case 'START_TRAINER': {
            if (state.status === 'ready') {
                const firstStep = state.executionPlan[0];
                return {
                    ...state,
                    status: 'running',
                    stepStartTime: performance.now(),
                    remaining: firstStep.duration,
                };
            }
            return state;
        }

        case 'PAUSE_TRAINER': {
            if (state.status === 'running') {
                return { ...state, status: 'paused' };
            }
            return state;
        }

        case 'RESUME_TRAINER': {
            if (state.status === 'paused') {
                // Ricalcola lo stepStartTime per riprendere correttamente
                return { ...state, status: 'running', stepStartTime: performance.now() - (state.executionPlan[state.currentStepIndex].duration - state.remaining) };
            }
            return state;
        }
        
        case 'TICK': {
          if (state.status !== 'running') return state;

          const { timestamp } = action.payload;
          const { duration } = state.executionPlan[state.currentStepIndex];
          const elapsedTime = timestamp - state.stepStartTime;
          const newRemaining = duration - elapsedTime;

          if (newRemaining <= 0) {
            return advanceStep(state);
          }

          return { ...state, remaining: newRemaining };
        }

        case 'TERMINATE_WORKOUT': {
          const currentStep = state.executionPlan[state.currentStepIndex];
          const terminationPoint = {
            itemIndex: state.activeWorkout.items.findIndex(i => i.id === currentStep.item?.id) || 0,
            currentSeries: currentStep.context?.currentSeries || 1,
          };
          return { ...state, status: 'finished', completedWorkout: { completed: false, terminationPoint }};
        }
        
        case 'RESET_TRAINER': {
          return { ...initialState, completedWorkout: action.payload };
        }

        default:
            return state;
    }
}
