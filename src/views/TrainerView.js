import store from '../modules/store.js';

let animationFrameId = null;
let animationStartTime = null;

const PhasedExerciseRunner = {
    init(element) {
        this.element = element;
    },
    start() {
        store.dispatch({ type: 'UPDATE_TRAINER_CONTEXT', payload: { currentPhaseIndex: 0 } });
        this.runNextPhase();
    },
    runNextPhase() {
        const { activeWorkout, trainerContext } = store.getState();
        const currentExercise = activeWorkout.items[trainerContext.itemIndex];
        const isTimeBased = currentExercise.type === 'time';

        if (isTimeBased) {
            store.dispatch({ type: 'UPDATE_TRAINER_CONTEXT', payload: { currentPhase: 'Esegui' } });
            store.dispatch({ type: 'SET_TRAINER_STATE', payload: 'announcing' });
            return;
        }

        const tempo = currentExercise.tempo || { up: 1, hold: 1, down: 2 };
        const phases = Object.keys(tempo);

        if (trainerContext.currentPhaseIndex >= phases.length) {
            // Repetition is complete, advance logic and then decide next state
            store.dispatch({ type: 'ADVANCE_TRAINER_LOGIC' });
            const newState = store.getState();
            const newCurrentItem = newState.activeWorkout.items[newState.trainerContext.itemIndex];
            
            if (newCurrentItem.type === 'exercise' && newCurrentItem.reps > 1) {
                store.dispatch({ type: 'SET_TRAINER_STATE', payload: 'rest' });
            } else {
                store.dispatch({ type: 'SET_TRAINER_STATE', payload: 'announcing' });
            }
            return;
        }

        const phaseName = phases[trainerContext.currentPhaseIndex];
        store.dispatch({ type: 'UPDATE_TRAINER_CONTEXT', payload: { currentPhase: phaseName } });
        store.dispatch({ type: 'SET_TRAINER_STATE', payload: 'announcing' });
    },
    execute() {
        const { activeWorkout, trainerContext } = store.getState();
        const currentItem = activeWorkout.items[trainerContext.itemIndex];
        let duration;
        let onCompleteCallback;

        if (currentItem.type === 'time') {
            duration = (currentItem.duration || 10) * 1000;
            onCompleteCallback = () => {
                store.dispatch({ type: 'ADVANCE_TRAINER_LOGIC' });
                store.dispatch({ type: 'SET_TRAINER_STATE', payload: 'rest' });
            };
        } else {
            const tempo = currentItem.tempo || { up: 1, hold: 1, down: 2 };
            duration = (tempo[trainerContext.currentPhase] || 1) * 1000;
            onCompleteCallback = () => {
                store.dispatch({ type: 'UPDATE_TRAINER_CONTEXT', payload: { currentPhaseIndex: trainerContext.currentPhaseIndex + 1 } });
                this.runNextPhase();
            };
        }
        this.element.dispatchEvent(new CustomEvent('animateRing', { detail: { duration, onComplete: onCompleteCallback } }));
    }
};

export function init(element) {
    PhasedExerciseRunner.init(element);
    
    element.addEventListener('click', (event) => {
        const mainButton = event.target.closest('.trainer-main-btn');
        if (!mainButton) return;
        
        const { trainerState } = store.getState();
        switch (trainerState) {
            case 'ready':
                store.dispatch({ type: 'SET_TRAINER_STATE', payload: 'preparing' });
                break;
            case 'paused':
                store.dispatch({ type: 'RESUME_TRAINER' });
                break;
            case 'preparing':
            case 'action':
            case 'rest':
            case 'announcing':
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
                const elapsed = performance.now() - animationStartTime;
                const remaining = mainButton.dataset.duration - elapsed;
                store.dispatch({ type: 'PAUSE_TRAINER', payload: { remaining: remaining > 0 ? remaining : 0, duration: mainButton.dataset.duration } });
                break;
        }
    });

    element.addEventListener('animateRing', ({ detail }) => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        const ringEl = element.querySelector('.progress-ring__foreground');
        const timerEl = element.querySelector('.progress-ring__timer');
        if (!ringEl || !timerEl) return;
        const circumference = 2 * Math.PI * ringEl.r.baseVal.value;
        const { trainerContext } = store.getState();
        
        const isResuming = trainerContext.stateBeforePause && trainerContext.remaining > 0;
        const duration = isResuming ? trainerContext.remaining : detail.duration;
        let startTime = performance.now();
        animationStartTime = startTime;
        if (isResuming) {
            store.dispatch({ type: 'UPDATE_TRAINER_CONTEXT', payload: { remaining: 0, stateBeforePause: null }});
        }
        
        const animationStep = (timestamp) => {
            const elapsed = timestamp - startTime;
            const progress = Math.min(1, elapsed / duration);
            ringEl.style.strokeDashoffset = circumference * (1 - progress);
            
            if (store.getState().trainerState !== 'announcing') {
              timerEl.textContent = Math.ceil((duration - elapsed) / 1000);
            } else {
              timerEl.textContent = '';
            }

            if (elapsed < duration) {
                animationFrameId = requestAnimationFrame(animationStep);
            } else {
                ringEl.style.strokeDashoffset = 0;
                timerEl.textContent = 0;
                if (detail.onComplete) detail.onComplete();
            }
        };
        animationFrameId = requestAnimationFrame(animationStep);
    });

    function runStateLogic() {
        const { trainerState, trainerContext, activeWorkout } = store.getState();
        
        if (animationFrameId && trainerState !== 'paused') {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        switch(trainerState) {
            case 'preparing':
                element.dispatchEvent(new CustomEvent('animateRing', { detail: { duration: 3000, onComplete: () => PhasedExerciseRunner.start() } }));
                break;
            case 'announcing':
                element.dispatchEvent(new CustomEvent('animateRing', { detail: { duration: 750, onComplete: () => store.dispatch({ type: 'SET_TRAINER_STATE', payload: 'action' }) } }));
                break;
            case 'action':
                PhasedExerciseRunner.execute();
                break;
            case 'rest': {
                const currentItem = activeWorkout.items[trainerContext.itemIndex];
                let restDuration = 60; // Default
                if (currentItem.type === 'rest') {
                    restDuration = currentItem.duration;
                } else if (currentItem.exerciseId) {
                    restDuration = getExerciseById(currentItem.exerciseId)?.defaultRest || 60;
                }
                element.dispatchEvent(new CustomEvent('animateRing', { detail: { duration: restDuration * 1000, onComplete: () => {
                    store.dispatch({type: 'SET_TRAINER_STATE', payload: 'announcing'});
                } } }));
                break;
            }
        }
    }

    function render() {
        const { activeWorkout, trainerState, trainerContext } = store.getState();
        if (!activeWorkout) { element.innerHTML = '<h2>Nessun workout attivo.</h2>'; return; }
        const currentItem = activeWorkout.items[trainerContext.itemIndex];
        const radius = 90;
        const circumference = 2 * Math.PI * radius;
        let phaseText = '', instructionText = '', buttonText = '', timerText = '', phaseClass = '';
        let ringOffset = circumference;
        const isTimeBasedExercise = currentItem.type === 'time';
        let currentDuration = 0;

        switch (trainerState) {
            case 'ready':
                phaseText = 'PRONTO'; instructionText = `Premi INIZIA per cominciare`; buttonText = 'INIZIA';
                break;
            case 'preparing':
                phaseText = 'PREPARATI'; instructionText = 'Inizia il movimento...'; buttonText = 'PAUSA'; timerText = '3'; currentDuration = 3000;
                break;
            case 'rest': {
                let restDuration = 60;
                if (currentItem.type === 'rest') restDuration = currentItem.duration;
                else if (currentItem.exerciseId) restDuration = getExerciseById(currentItem.exerciseId)?.defaultRest || 60;
                phaseText = 'RIPOSO'; instructionText = 'Recupera'; buttonText = 'PAUSA'; timerText = restDuration; currentDuration = restDuration * 1000;
                break;
            }
            case 'announcing':
                phaseText = trainerContext.currentPhase?.toUpperCase() || '';
                instructionText = `Prossima fase: ${phaseText}`; buttonText = 'PAUSA'; phaseClass = 'is-flashing'; currentDuration = 750;
                break;
            case 'action':
                phaseText = trainerContext.currentPhase?.toUpperCase() || '';
                if (isTimeBasedExercise) { currentDuration = currentItem.duration * 1000; }
                else { const tempo = currentItem.tempo || {}; currentDuration = (tempo[trainerContext.currentPhase] || 1) * 1000; }
                instructionText = 'Esegui il movimento'; buttonText = 'PAUSA';
                break;
            case 'paused': {
                const prevState = trainerContext.stateBeforePause;
                if(prevState === 'preparing') { phaseText = 'PREPARATI'; }
                else if(prevState === 'rest') { phaseText = 'RIPOSO'; }
                else if(prevState === 'announcing') { phaseText = trainerContext.currentPhase?.toUpperCase() || ''; phaseClass = 'is-flashing'; }
                else { phaseText = trainerContext.currentPhase?.toUpperCase() || ''; }
                instructionText = 'Pausa'; buttonText = 'RIPRENDI'; 
                if(prevState !== 'announcing') { timerText = Math.ceil(trainerContext.remaining/1000); }
                ringOffset = circumference * (1 - ( (trainerContext.duration - trainerContext.remaining) / trainerContext.duration) );
                currentDuration = trainerContext.duration;
                break;
            }
            case 'finished':
                phaseText = 'FINE'; instructionText = 'Workout completato!'; buttonText = 'DEBRIEFING';
                break;
            default: phaseText = 'IDLE'; instructionText = 'Stato non riconosciuto'; buttonText = 'RESET';
        }
        const headerTitle = currentItem.name || 'Riposo';
        const seriesText = (isTimeBasedExercise || currentItem.type === 'exercise') ? `SERIE ${trainerContext.currentSeries} / ${currentItem.series || 1}` : '';
        const repsText = !isTimeBasedExercise ? `REP ${trainerContext.currentRep} / ${currentItem.reps || 1}` : '';
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
                    </div>
                </footer>
            </div>
        `;
        if (trainerState !== 'paused') {
          runStateLogic();
        }
    }
    store.subscribe(render);
    render();
}
