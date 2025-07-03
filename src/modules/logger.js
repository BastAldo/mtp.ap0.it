function formatLogMessage(action, state) {
    const { type } = action;
    const { currentView, trainer } = state;

    let message = `View: ${currentView}`;

    if (currentView === 'trainer' && trainer.executionPlan) {
        const { status, executionPlan, currentStepIndex } = trainer;
        const step = executionPlan[currentStepIndex];
        if (step) {
            message += ` | Trainer: ${status} | Step: ${step.type} (${step.headerTitle})`;
        }
    }
    
    return message;
}

export function logger(action, state) {
    const noisyActions = ['TICK'];
    if (noisyActions.includes(action.type)) {
        return;
    }

    console.groupCollapsed(`%c[${action.type}]`, 'color: #88aaff; font-weight: bold;');
    console.log(`%c${formatLogMessage(action, state)}`, 'color: #aaa');
    console.groupEnd();
}
