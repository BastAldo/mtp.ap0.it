import store from '../modules/store.js';
import { getExerciseById } from '../modules/exerciseRepository.js';

let animationFrameId = null;
let animationStartTime = null;

function runStateBasedTimer(element) {
    const { trainerState, trainerContext, activeWorkout } = store.getState();
    
    if (animationFrameId && trainerState !== 'paused') {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    const onComplete = () => store.dispatch({ type: 'TIMER_COMPLETE' });
    const currentItem = activeWorkout.items[trainerContext.itemIndex];
    let duration = 0;

    switch(trainerState) {
        case 'preparing':
            duration = 3000;
            break;
        case 'announcing':
            duration = 750;
            break;
        case 'action':
            if (currentItem.type === 'time') {
                duration = (currentItem.duration || 10) * 1000;
            } else {
                const tempo = currentItem.tempo || {};
                duration = (tempo[trainerContext.currentPhase] || 1) * 1000;
            }
            break;
        case 'rest': {
            let restDuration = 60; // Default
            if (currentItem.type === 'rest') {
                restDuration = currentItem.duration;
            } else if (currentItem.exerciseId) {
                restDuration = getExerciseById(currentItem.exerciseId)?.defaultRest || 60;
            }
            duration = restDuration * 1000;
            break;
        }
        default:
            return; // No timer for states like 'ready', 'paused', 'finished'
    }
    
    const ringEl = element.querySelector('.progress-ring__foreground');
    const timerEl = element.querySelector('.progress-ring__timer');
    if (!ringEl || !timerEl) return;
    const circumference = 2 * Math.PI * ringEl.r.baseVal.value;
    
    const isResuming = trainerContext.stateBeforePause && trainerContext.remaining > 0;
    const animationDuration = isResuming ? trainerContext.remaining : duration;
    let startTime = performance.now();
    animationStartTime = startTime;
    if (isResuming) {
        store.dispatch({ type: 'UPDATE_TRAINER_CONTEXT', payload: { remaining: 0, stateBeforePause: null }});
    }

    const animationStep = (timestamp) => {
        const elapsed = timestamp - startTime;
        const progress = Math.min(1, elapsed / animationDuration);
        ringEl.style.strokeDashoffset = circumference * (1 - progress);
        
        if (store.getState().trainerState !== 'announcing') {
          timerEl.textContent = Math.ceil((animationDuration - elapsed) / 1000);
        } else {
          timerEl.textContent = '';
        }

        if (elapsed < animationDuration) {
            animationFrameId = requestAnimationFrame(animationStep);
        } else {
            ringEl.style.strokeDashoffset = 0;
            timerEl.textContent = 0;
            if (onComplete) onComplete();
        }
    };
    animationFrameId = requestAnimationFrame(animationStep);
}

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
    let currentDuration = 0;
    let terminateButtonHidden = trainerState === 'finished' || trainerState === 'ready';

    switch (trainerState) {
        case 'ready':
            phaseText = 'PRONTO'; instructionText = `Premi INIZIA per cominciare`; buttonText = 'INIZIA';
            break;
        case 'preparing':
            phaseText = 'PREPARATI'; instructionText = 'Inizia il movimento...'; buttonText = 'PAUSA'; timerText = '3'; currentDuration = 3000;
            break;
        case 'rest': {
            let restDuration = 60;
            if (currentItem.type === 'rest') { restDuration = currentItem.duration; }
            else if (currentItem.exerciseId) { restDuration = getExerciseById(currentItem.exerciseId)?.defaultRest || 60; }
            phaseText = 'RIPOSO'; instructionText = 'Recupera'; buttonText = 'PAUSA'; timerText = restDuration; currentDuration = restDuration * 1000;
            break;
        }
        case 'announcing':
            phaseText = trainerContext.currentPhase?.toUpperCase() || '';
            instructionText = `Prossima fase: ${phaseText}`; buttonText = 'PAUSA'; phaseClass = 'is-flashing'; currentDuration = 750;
            break;
        case 'action':
            phaseText = trainerContext.currentPhase?.toUpperCase() || '';
            if (currentItem.type === 'time') { currentDuration = currentItem.duration * 1000; }
            else { const tempo = currentItem.tempo || {}; currentDuration = (tempo[trainerContext.currentPhase] || 1) * 1000; }
            instructionText = 'Esegui il movimento'; buttonText = 'PAUSA';
            break;
        case 'paused': {
            const prevState = trainerContext.stateBeforePause;
            if(prevState === 'preparing') { phaseText = 'PREPARATI'; currentDuration = 3000; }
            else if(prevState === 'rest') { phaseText = 'RIPOSO'; let restDuration = 60; if (currentItem.type === 'rest') { restDuration = currentItem.duration; } else if (currentItem.exerciseId) { restDuration = getExerciseById(currentItem.exerciseId)?.defaultRest || 60; } currentDuration = restDuration * 1000; }
            else if(prevState === 'announcing' || prevState === 'action') {
                phaseText = trainerContext.currentPhase?.toUpperCase() || '';
                if (prevState === 'announcing') { phaseClass = 'is-flashing'; currentDuration = 750; }
                else { if (currentItem.type === 'time') { currentDuration = currentItem.duration * 1000; } else { const tempo = currentItem.tempo || {}; currentDuration = (tempo[trainerContext.currentPhase] || 1) * 1000; } }
            }
            instructionText = 'Pausa'; buttonText = 'RIPRENDI'; 
            if(prevState !== 'announcing') { timerText = Math.ceil(trainerContext.remaining/1000); }
            ringOffset = circumference * (1 - ( (currentDuration - trainerContext.remaining) / currentDuration) );
            break;
        }
        case 'finished':
            phaseText = 'FINE'; instructionText = 'Workout completato!'; buttonText = 'DEBRIEFING';
            break;
        default: phaseText = 'IDLE'; instructionText = 'Stato non riconosciuto'; buttonText = 'RESET';
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
                    <button class="trainer-main-btn" data-duration="${currentDuration}">${buttonText}</button>
                    <button class="trainer-terminate-btn" ${terminateButtonHidden ? 'hidden' : ''}>Termina</button>
                </div>
            </footer>
        </div>
    `;
}

export function init(element) {
    let lastState = null;

    element.addEventListener('click', (event) => {
        const mainButton = event.target.closest('.trainer-main-btn');
        const terminateButton = event.target.closest('.trainer-terminate-btn');

        if (terminateButton) {
            const currentState = store.getState().trainerState;
            if (currentState !== 'paused') {
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
                const elapsed = performance.now() - animationStartTime;
                const duration = mainButton?.dataset?.duration || 0;
                const remaining = duration - elapsed;
                store.dispatch({ type: 'PAUSE_TRAINER', payload: { remaining: remaining > 0 ? remaining : 0, duration } });
            }
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
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
                const elapsed = performance.now() - animationStartTime;
                const duration = mainButton.dataset.duration;
                const remaining = duration - elapsed;
                store.dispatch({ type: 'PAUSE_TRAINER', payload: { remaining: remaining > 0 ? remaining : 0, duration } });
                break;
        }
    });

    store.subscribe(() => {
        const currentState = store.getState();
        const trainerState = currentState.trainerState;

        if(element.classList.contains('view--active')) {
            render(element);
            // Only start a timer if the state has meaningfully changed to a timed one
            if (trainerState !== lastState) {
                if (['preparing', 'announcing', 'action', 'rest'].includes(trainerState)) {
                    runStateBasedTimer(element);
                }
            }
        }
        lastState = trainerState;
    });

    render(element); // Initial render
}
