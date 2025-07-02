import store from '../modules/store.js';

function render(element) {
    const { activeWorkout, trainerState, trainerContext } = store.getState();
    if (!activeWorkout) {
        element.innerHTML = '<h2>Nessun workout attivo.</h2>';
        return;
    }

    const currentItem = activeWorkout.items[trainerContext.itemIndex];
    const radius = 90;
    const circumference = 2 * Math.PI * radius;

    let phaseText = '', instructionText = '', buttonText = '', timerText = '', phaseClass = '';
    let ringOffset = circumference;
    const isExercise = currentItem.type === 'exercise' || currentItem.type === 'time';
    let terminateButtonHidden = trainerState === 'finished' || trainerState === 'ready';

    const { duration, remaining } = trainerContext;
    if (duration > 0) {
        const progress = (duration - remaining) / duration;
        ringOffset = circumference * (1 - progress);
    }

    switch (trainerState) {
        case 'ready':
            phaseText = 'PRONTO'; instructionText = `Premi INIZIA per cominciare`; buttonText = 'INIZIA';
            break;
        case 'preparing':
            phaseText = 'PREPARATI'; instructionText = 'Inizia il movimento...'; buttonText = 'PAUSA'; timerText = Math.ceil(remaining / 1000);
            break;
        case 'rest':
            phaseText = 'RIPOSO'; instructionText = 'Recupera'; buttonText = 'PAUSA'; timerText = Math.ceil(remaining / 1000);
            break;
        case 'announcing':
            phaseText = trainerContext.currentPhase?.toUpperCase() || ''; instructionText = `Prossima fase: ${phaseText}`; buttonText = 'PAUSA'; phaseClass = 'is-flashing';
            break;
        case 'action':
            phaseText = trainerContext.currentPhase?.toUpperCase() || ''; instructionText = 'Esegui il movimento'; buttonText = 'PAUSA'; timerText = Math.ceil(remaining / 1000);
            break;
        case 'paused':
            const prevState = trainerContext.stateBeforePause;
            if(prevState === 'preparing') { phaseText = 'PREPARATI'; }
            else if(prevState === 'rest') { phaseText = 'RIPOSO'; }
            else if(prevState === 'announcing' || prevState === 'action') {
                phaseText = trainerContext.currentPhase?.toUpperCase() || '';
                if (prevState === 'announcing') { phaseClass = 'is-flashing'; }
            }
            instructionText = 'Pausa'; buttonText = 'RIPRENDI';
            if(prevState !== 'announcing') { timerText = Math.ceil(remaining / 1000); }
            break;
        case 'finished':
            phaseText = 'FINE'; instructionText = 'Workout completato!'; buttonText = 'DEBRIEFING';
            break;
        default:
            phaseText = 'IDLE'; instructionText = 'Stato non riconosciuto'; buttonText = 'RESET';
    }

    const headerTitle = currentItem.name || 'Riposo';
    const seriesText = isExercise ? `SERIE ${trainerContext.currentSeries} / ${currentItem.series || 1}` : '';
    const repsText = currentItem.type === 'exercise' ? `REP ${trainerContext.currentRep} / ${currentItem.reps || 1}` : '';

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
                    <div class="progress-ring__phase ${phaseClass}">${phaseText}</div>
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
            case 'ready':
                store.dispatch({ type: 'SET_TRAINER_STATE', payload: 'preparing' });
                break;
            case 'paused':
                store.dispatch({ type: 'RESUME_TRAINER' });
                break;
            case 'finished':
                store.dispatch({ type: 'FINISH_WORKOUT' });
                break;
            case 'preparing':
            case 'action':
            case 'rest':
            case 'announcing':
                store.dispatch({ type: 'PAUSE_TRAINER' });
                break;
        }
    });

    store.subscribe(() => {
        if(element.classList.contains('view--active')) {
            render(element);
        }
    });

    render(element);
}
