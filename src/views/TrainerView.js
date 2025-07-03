import store from '../modules/store.js';

function render(element) {
    const { trainer } = store.getState();
    if (!trainer || !trainer.executionPlan || !trainer.executionPlan[trainer.currentStepIndex]) {
        element.innerHTML = '<h2>Caricamento...</h2>';
        return;
    }

    const { status, executionPlan, currentStepIndex, remaining } = trainer;
    const currentStep = executionPlan[currentStepIndex];
    const { type, duration, headerTitle, mainText, context = {} } = currentStep;

    const radius = 90;
    const circumference = 2 * Math.PI * radius;

    let timerText = '', buttonText = '', instructionText = '', mainPhaseText = mainText;
    const isAnnouncing = type === 'announcing-phase';
    const terminateButtonHidden = status === 'finished' || status === 'ready';

    const progress = duration > 0 ? (duration - Math.max(0, remaining)) / duration : 0;
    const ringOffset = circumference * (1 - progress);

    if (duration > 0 && (status === 'running' || status === 'paused')) {
        timerText = String(Math.ceil(remaining / 1000));
    }
    if(type === 'preparing') timerText = String(Math.ceil(remaining / 1000));

    switch (status) {
        case 'ready': buttonText = 'INIZIA'; instructionText = 'Premi INIZIA per cominciare'; break;
        case 'running': buttonText = 'PAUSA'; instructionText = 'Esegui'; break;
        case 'paused': buttonText = 'RIPRENDI'; instructionText = 'Pausa'; break;
        case 'finished': buttonText = 'DEBRIEFING'; instructionText = 'Ben fatto!'; break;
        default: buttonText = '...';
    }
    
    const subHeaderText = context.totalSeries ? `SERIE ${context.currentSeries}/${context.totalSeries}` : '';
    if (type === 'rest') {
        instructionText = mainText; // Mostra il prossimo esercizio durante il riposo
        mainPhaseText = "RIPOSO";
    }
    
    element.innerHTML = `
        <div class="trainer-container">
            <header class="trainer-header">
                <h2>${headerTitle}</h2>
                <p>${subHeaderText || '&nbsp;'}</p>
            </header>
            <div class="progress-ring">
                <svg>
                    <circle class="progress-ring__background" stroke-width="10" r="${radius}" cx="50%" cy="50%"></circle>
                    <circle class="progress-ring__foreground" style="stroke-dashoffset: ${ringOffset};" stroke-width="10" r="${radius}" cx="50%" cy="50%" stroke-dasharray="${circumference}"></circle>
                </svg>
                <div class="progress-ring__text">
                    <div class="progress-ring__phase ${isAnnouncing ? 'is-flashing' : ''}">${mainPhaseText}</div>
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

        const { trainer } = store.getState();
        if (!trainer) return;

        if (terminateButton) {
            store.dispatch({ type: 'OPEN_MODAL', payload: { type: 'CONFIRM_TERMINATION' } });
            return;
        }

        if (!mainButton) return;

        switch (trainer.status) {
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
