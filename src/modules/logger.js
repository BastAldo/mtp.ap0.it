// --- Middleware di Logging Intelligente ---

function formatLogMessage(action, state) {
    const { type, payload } = action;
    const { currentView, trainerState, trainerContext } = state;

    let message = `View: ${currentView}`;

    if (currentView === 'trainer' && trainerContext.executionPlan) {
        const { executionPlan, currentStepIndex } = trainerContext;
        const step = executionPlan[currentStepIndex];
        if (step) {
            message += ` | Trainer: ${trainerState} | Step: ${step.type} (${step.headerTitle})`;
        }
    }
    
    if(payload) {
      message += ` | Payload: ${JSON.stringify(payload)}`;
    }

    return message;
}

export function logger(action, state) {
    // Ignora le azioni "rumorose" per mantenere la console pulita
    const noisyActions = ['TICK'];
    if (noisyActions.includes(action.type)) {
        return;
    }

    console.groupCollapsed(`%c[${action.type}]`, 'color: #88aaff; font-weight: bold;');
    console.log(`%c${formatLogMessage(action, state)}`, 'color: #aaa');
    console.groupEnd();
}
