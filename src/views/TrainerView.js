import store from '../modules/store.js';

let stateTimer = null;

function advanceTrainer() {
  store.dispatch({ type: 'ADVANCE_TRAINER_LOGIC' });
}

const PhasedExerciseRunner = {
    start(element) {
        this.element = element;
        store.dispatch({ type: 'UPDATE_TRAINER_CONTEXT', payload: { currentPhaseIndex: 0 } });
        this.runNextPhase();
    },

    runNextPhase() {
        const { activeWorkout, trainerContext } = store.getState();
        const currentExercise = activeWorkout.items[trainerContext.itemIndex];
        const phases = currentExercise.tempo || ['down', 'hold', 'up'];
        const currentPhaseIndex = trainerContext.currentPhaseIndex;

        if (currentPhaseIndex >= phases.length) {
            advanceTrainer();
            return;
        }

        const phaseName = phases[currentPhaseIndex];
        store.dispatch({ type: 'UPDATE_TRAINER_CONTEXT', payload: { currentPhase: phaseName } });
        store.dispatch({ type: 'SET_TRAINER_STATE', payload: 'announcing' });
    },

    execute() {
        const { trainerContext } = store.getState();
        const phaseName = trainerContext.currentPhase;
        const durationMap = { 'up': 1.5, 'hold': 1, 'down': 2 };
        const duration = (durationMap[phaseName] || 1) * 1000;
        let elapsed = 0;
        const interval = 50;

        const timerEl = this.element.querySelector('.progress-ring__timer');
        const ringEl = this.element.querySelector('.progress-ring__foreground');
        const radius = ringEl.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;

        stateTimer = setInterval(() => {
            elapsed += interval;
            const progress = Math.min(1, elapsed / duration);
            const offset = circumference * (1 - progress);
            ringEl.style.strokeDashoffset = offset;
            if (timerEl) timerEl.textContent = Math.ceil((duration - elapsed) / 1000);

            if (elapsed >= duration) {
                clearInterval(stateTimer);
                ringEl.style.strokeDashoffset = 0; // Forza il completamento
                store.dispatch({ type: 'UPDATE_TRAINER_CONTEXT', payload: { currentPhaseIndex: trainerContext.currentPhaseIndex + 1 } });
                this.runNextPhase();
            }
        }, interval);
    }
};

export function init(element) {
    element.addEventListener('click', (event) => {
        const mainButton = event.target.closest('.trainer-main-btn');
        if (mainButton) {
            const currentState = store.getState().trainerState;
            if (currentState === 'ready') {
                store.dispatch({ type: 'SET_TRAINER_STATE', payload: 'preparing' });
            }
        }
    });

    function runStateLogic() {
        const { trainerState, trainerContext } = store.getState();
        if (stateTimer) { clearInterval(stateTimer); stateTimer = null; }

        const timerEl = element.querySelector('.progress-ring__timer');
        const ringEl = element.querySelector('.progress-ring__foreground');
        if (!ringEl) return; // Guardia per evitare errori se l'elemento non è ancora renderizzato
        const radius = ringEl.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;

        if (trainerState === 'preparing') {
            const duration = 3000;
            let elapsed = 0;
            const interval = 50;
            if (timerEl) timerEl.textContent = '3';
            ringEl.style.strokeDashoffset = circumference;
            stateTimer = setInterval(() => {
                elapsed += interval;
                const progress = Math.min(1, elapsed / duration);
                const offset = circumference * (1 - progress);
                ringEl.style.strokeDashoffset = offset;
                if (timerEl) timerEl.textContent = Math.ceil((duration - elapsed) / 1000);
                if (elapsed >= duration) {
                    clearInterval(stateTimer);
                    ringEl.style.strokeDashoffset = 0; // Forza il completamento
                    PhasedExerciseRunner.start(element);
                }
            }, interval);
        } else if (trainerState === 'announcing') {
            stateTimer = setTimeout(() => store.dispatch({ type: 'SET_TRAINER_STATE', payload: 'action' }), 750);
        } else if (trainerState === 'action') {
            PhasedExerciseRunner.execute();
        } else if (trainerState === 'rest') {
            const restDuration = trainerContext.restDuration || 60;
            let timeLeft = restDuration;
            if (timerEl) timerEl.textContent = timeLeft;
            stateTimer = setInterval(() => {
                timeLeft--;
                if (timerEl) timerEl.textContent = timeLeft;
                if (timeLeft <= 0) {
                    clearInterval(stateTimer);
                    advanceTrainer();
                }
            }, 1000);
        }
    }

    function render() {
        const { activeWorkout, trainerState, trainerContext } = store.getState();
        if (!activeWorkout) { element.innerHTML = '<h2>Nessun workout attivo.</h2>'; return; }

        const currentItem = activeWorkout.items[trainerContext.itemIndex];
        const isExercise = currentItem.type === 'exercise';
        const radius = 90;
        const circumference = 2 * Math.PI * radius;

        let phaseText = '', instructionText = '', buttonText = '', timerText = '', phaseClass = '';
        let ringOffset = circumference;

        switch (trainerState) {
            case 'ready':
                phaseText = 'PRONTO';
                instructionText = `Premi INIZIA per cominciare`;
                buttonText = 'INIZIA';
                break;
            case 'preparing':
                phaseText = 'PREPARATI'; instructionText = 'Inizia il movimento...'; buttonText = 'PAUSA'; timerText = '3';
                ringOffset = circumference;
                break;
            case 'rest':
                phaseText = 'RIPOSO'; instructionText = 'Recupera per la prossima serie'; buttonText = 'PAUSA';
                timerText = trainerContext.restDuration || 60;
                break;
            case 'announcing':
                phaseText = trainerContext.currentPhase?.toUpperCase() || '';
                instructionText = `Prossima fase: ${phaseText}`;
                buttonText = 'PAUSA';
                phaseClass = 'is-flashing';
                break;
            case 'action':
                phaseText = trainerContext.currentPhase?.toUpperCase() || '';
                instructionText = 'Esegui il movimento';
                buttonText = 'PAUSA';
                ringOffset = circumference;
                break;
            case 'finished':
                phaseText = 'FINE'; instructionText = 'Workout completato!'; buttonText = 'DEBRIEFING';
                break;
            default:
                phaseText = 'IDLE'; instructionText = 'Stato non riconosciuto'; buttonText = 'RESET';
        }

        const headerTitle = isExercise ? currentItem.name : 'Riposo';
        const seriesText = isExercise ? `SERIE ${trainerContext.currentSeries} / ${currentItem.series || 1}` : '';
        const repsText = isExercise ? `REP ${trainerContext.currentRep} / ${currentItem.reps || 1}` : '';

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
                    </div>
                </footer>
            </div>
        `;
        runStateLogic();
    }
    store.subscribe(render);
    render();
}
