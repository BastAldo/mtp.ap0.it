import store from '../modules/store.js';

function render(element) {
    const { trainerState, trainerContext } = store.getState();
    const { executionPlan, currentStepIndex, remaining } = trainerContext;

    if (!executionPlan || executionPlan.length === 0) {
        element.innerHTML = '<h2>Nessun piano di workout attivo.</h2>';
        return;
    }

    const currentStep = executionPlan[currentStepIndex];
    const { type, duration, headerTitle, mainText, context = {} } = currentStep;

    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    let ringOffset = circumference;
    
    let timerText = '', buttonText = '', instructionText = '';
    const isFlashing = type === 'announcing';
    const terminateButtonHidden = trainerState === 'finished' || trainerState === 'ready';

    // Corrected condition: Only show timer when running or paused.
    if (duration > 0 && (trainerState === 'running' || trainerState === 'paused')) {
        timerText = Math.ceil(remaining / 1000);
    }

    switch (trainerState) {
        case 'ready': buttonText = 'INIZIA'; instructionText = 'Premi INIZIA per cominciare'; break;
        case 'running': buttonText = 'PAUSA'; instructionText = 'Esegui'; break;
        case 'paused': buttonText = 'RIPRENDI'; instructionText = 'Pausa'; break;
        case 'finished': buttonText = 'DEBRIEFING'; instructionText = 'Ben fatto!'; break;
        default: buttonText = '...';
    }
    
    let subHeaderText = '';
    if (context.totalSeries) {
        subHeaderText = `SERIE ${context.currentSeries}/${context.totalSeries}`;
        if (context.totalReps) {
            subHeaderText += ` | REP ${context.currentRep}/${context.totalReps}`;
        }
    }

    element.innerHTML = `
        <div class="trainer-container">
            <header class="trainer-header">
                <h2>${headerTitle}</h2>
                <p>${subHeaderText}</p>
            </header>
            <div class="progress-ring">
                <svg>
                    <circle class="progress-ring__background" stroke-width="10" r="${radius}" cx="50%" cy="50%"></circle>
                    <circle class="progress-ring__foreground" style="stroke-dashoffset: ${ringOffset};" stroke-width="10" r="${radius}" cx="50%" cy="50%" stroke-dasharray="${circumference}"></circle>
                </svg>
                <div class="progress-ring__text">
                    <div class="progress-ring__phase ${isFlashing ? 'is-flashing' : ''}">${mainText}</div>
                    <div class="progress-ring__timer">${timerText}</div>
                </div>
            </div>
            <footer class="trainer-footer">
                <p class="trainer-instruction">${instructionText}</p>
                <div class="trainer-controls">
                    <button class="trainer-main-btn">${buttonText}</button>
                    <button class="trainer-terminate-btn" ${terminateButtonHidden ? 'hidden' : ''}>Termina</button>
                </div>
            </footer>
        </div>
    `;
}

export function init(element) {
    element.addEventListener('click', (event) => {
        const mainButton = event.target.closest('.trainer-main-btn');
        const terminateButton = event.target.closest('.trainer-terminate-btn');

        if (terminateButton) {
            store.dispatch({ type: 'PAUSE_TRAINER' });
            store.dispatch({ type: 'OPEN_MODAL', payload: { type: 'CONFIRM_TERMINATION' } });
            return;
        }

        if (!mainButton) return;
        const { trainerState } = store.getState();

        switch (trainerState) {
            case 'ready': store.dispatch({ type: 'START_TRAINER' }); break;
            case 'running': store.dispatch({ type: 'PAUSE_TRAINER' }); break;
            case 'paused': store.dispatch({ type: 'RESUME_TRAINER' }); break;
            case 'finished': store.dispatch({ type: 'FINISH_WORKOUT' }); break;
        }
    });

    store.subscribe(() => {
        if (element.classList.contains('view--active')) {
            render(element);
        }
    });

    if (element.classList.contains('view--active')) {
      render(element);
    }
}
