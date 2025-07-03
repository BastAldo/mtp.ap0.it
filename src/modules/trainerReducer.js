const initialState = {
    status: 'idle',
    executionPlan: null,
    currentStepIndex: 0,
    stepStartTime: 0,
    remaining: 0,
    activeWorkout: null,
    completedWorkout: null,
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
      completedWorkout: { ...state.activeWorkout, completed: true }
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
        case 'SET_PLAN': {
          const { plan, workoutItems, date } = action.payload;
          return {
            ...initialState,
            status: 'ready',
            executionPlan: plan,
            activeWorkout: { date, items: workoutItems }
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
          if (state.status === 'idle' || state.status === 'finished') return state;

          const currentStep = state.executionPlan[state.currentStepIndex];
          const itemIndex = state.activeWorkout.items.findIndex(i => i.id === currentStep.item?.id);
          const terminationPoint = {
            itemIndex: itemIndex > -1 ? itemIndex : 0,
            currentSeries: currentStep.context?.currentSeries || 1,
          };

          return {
              ...state,
              status: 'finished',
              completedWorkout: { ...state.activeWorkout, completed: false, terminationPoint }
          };
        }
        
        default:
            return state;
    }
}
