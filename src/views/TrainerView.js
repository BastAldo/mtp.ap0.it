import store from '../modules/store.js';

function render(element) {
    const { activeWorkout, trainerState, trainerContext } = store.getState();
    if (!activeWorkout) {
        element.innerHTML = '<h2>Nessun workout attivo.</h2>';
        return;
    }

    const currentItem = trainerContext.currentItem || activeWorkout.items[trainerContext.itemIndex];
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    const { duration, remaining, stateBeforePause } = trainerContext;

    let ringOffset = circumference;
    if (duration > 0 && remaining >= 0) {
        const progress = (duration - remaining) / duration;
        ringOffset = circumference * (1 - progress);
    }

    let phaseText = '', instructionText = '', buttonText = '', timerText = '', isFlashing = false;
    const terminateButtonHidden = trainerState === 'finished' || trainerState === 'ready';
    const isExercise = currentItem.type === 'exercise' || currentItem.type === 'time';
    const currentPhase = currentItem.type === 'time' ? 'Esegui' : (currentItem.tempo ? 'Fase' : 'Azione');

    switch (trainerState) {
        case 'ready':
            phaseText = 'PRONTO'; instructionText = `Premi INIZIA per cominciare`; buttonText = 'INIZIA';
            break;
        case 'preparing':
            phaseText = 'PREPARATI'; instructionText = 'Si parte...'; buttonText = 'PAUSA'; timerText = Math.ceil(remaining / 1000);
            break;
        case 'rest':
            phaseText = 'RIPOSO'; instructionText = 'Recupera le forze'; buttonText = 'PAUSA'; timerText = Math.ceil(remaining / 1000);
            break;
        case 'announcing':
            phaseText = currentItem.name; instructionText = `Prossimo Esercizio`; buttonText = 'PAUSA'; isFlashing = true;
            break;
        case 'action':
            phaseText = currentPhase.toUpperCase(); instructionText = 'Esegui il movimento'; buttonText = 'PAUSA'; timerText = Math.ceil(remaining / 1000);
            break;
        case 'paused':
            const pausedState = stateBeforePause || 'action';
            if (pausedState === 'rest') { phaseText = 'RIPOSO'; }
            else if(pausedState === 'announcing') { phaseText = currentItem.name; isFlashing = true; }
            else { phaseText = (pausedState === 'preparing') ? 'PREPARATI' : currentPhase.toUpperCase(); }
            instructionText = 'Pausa'; buttonText = 'RIPRENDI';
            if(pausedState !== 'announcing') { timerText = Math.ceil(remaining / 1000); }
            break;
        case 'finished':
            phaseText = 'FINE'; instructionText = 'Workout completato!'; buttonText = 'DEBRIEFING';
            break;
        default:
            phaseText = 'IDLE'; instructionText = 'Stato non riconosciuto'; buttonText = 'RESET';
    }

    const headerTitle = currentItem.name || 'Riposo';
    const seriesText = isExercise ? `SERIE ${trainerContext.currentSeries || 1} / ${currentItem.series || 1}` : '';
    const repsText = currentItem.type === 'exercise' ? `REP ${trainerContext.currentRep || 1} / ${currentItem.reps || 1}` : '';

    element.innerHTML = `
        <div class="trainer-container">
            <header class="trainer-header">
                <h2>${headerTitle}</h2>
                <p>${seriesText} ${repsText ? `| ${repsText}` : ''}</p>
            </header>
            <div class="progress-ring">
                <svg>
                    <circle class="progress-ring__background" stroke-width="10" r="${radius}" cx="50%" cy="50%"></circle>
                    <circle class="progress-ring__foreground" style="stroke-dashoffset: ${ringOffset};" stroke-width="10" r="${radius}" cx="50%" cy="50%" stroke-dasharray="${circumference}"></circle>
                </svg>
                <div class="progress-ring__text">
                    <div class="progress-ring__phase ${isFlashing ? 'is-flashing' : ''}">${phaseText}</div>
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
            case 'paused': store.dispatch({ type: 'RESUME_TRAINER' }); break;
            case 'finished': store.dispatch({ type: 'FINISH_WORKOUT' }); break;
            default: store.dispatch({ type: 'PAUSE_TRAINER' }); break;
        }
    });

    store.subscribe(() => {
        if (element.classList.contains('view--active')) {
            render(element);
        }
    });
    render(element);
}
