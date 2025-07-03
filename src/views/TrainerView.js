import store from '../modules/store.js';

function render(element) {
    const { trainer } = store.getState();
    const { status, executionPlan, currentStepIndex, remaining } = trainer;

    if (!executionPlan || !executionPlan[currentStepIndex]) {
        element.innerHTML = '<h2>Nessun workout attivo.</h2>';
        return;
    }

    const currentStep = executionPlan[currentStepIndex];
    const { type, duration, headerTitle, mainText } = currentStep;

    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    
    let timerText = '', buttonText = '', instructionText = '';
    const isFlashing = type === 'announcing';
    const terminateButtonHidden = status === 'finished' || status === 'ready';
    
    const progress = duration > 0 ? (duration - Math.max(0, remaining)) / duration : 0;
    const ringOffset = circumference * (1 - progress);

    if (duration > 0 && (status === 'running' || status === 'paused')) {
        timerText = Math.ceil(remaining / 1000);
    }

    switch (status) {
        case 'ready': buttonText = 'INIZIA'; instructionText = 'Premi INIZIA per cominciare'; break;
        case 'running': buttonText = 'PAUSA'; instructionText = 'Esegui'; break;
        case 'paused': buttonText = 'RIPRENDI'; instructionText = 'Pausa'; break;
        case 'finished': buttonText = 'DEBRIEFING'; instructionText = 'Ben fatto!'; break;
        default: buttonText = '...';
    }
    
    const subHeaderText = currentStep.context?.totalSeries ? `SERIE ${currentStep.context.currentSeries}/${currentStep.context.totalSeries}` : '';

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
            store.dispatch({ type: 'TERMINATE_WORKOUT' });
            return;
        }

        if (!mainButton) return;
        const { status } = store.getState().trainer;

        switch (status) {
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
