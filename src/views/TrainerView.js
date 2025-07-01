import store from '../modules/store.js';

let stateTimer = null;

const PhasedExerciseRunner = {
    start(element) {
        this.element = element;
        this.runNextPhase();
    },

    runNextPhase() {
        const { activeWorkout, trainerContext } = store.getState();
        const currentExercise = activeWorkout.items[trainerContext.itemIndex];
        const phases = currentExercise.tempo || ['down', 'hold', 'up'];
        const currentPhaseIndex = trainerContext.currentPhaseIndex || 0;

        if (currentPhaseIndex >= phases.length) {
            // Rep finita, passa alla prossima
            console.log('Rep completed');
            store.dispatch({ type: 'SET_TRAINER_STATE', payload: 'ready' }); // Placeholder
            return;
        }

        const phaseName = phases[currentPhaseIndex];
        store.dispatch({ type: 'UPDATE_TRAINER_CONTEXT', payload: { currentPhase: phaseName, currentPhaseIndex } });
        store.dispatch({ type: 'SET_TRAINER_STATE', payload: 'announcing' });
    },

    execute() {
        const { trainerContext } = store.getState();
        const phaseName = trainerContext.currentPhase;
        const durationMap = { 'up': 1.5, 'hold': 1, 'down': 2 };
        const duration = durationMap[phaseName] || 1;

        let elapsed = 0;
        const interval = 50; // ms
        const totalSteps = (duration * 1000) / interval;
        let step = 0;

        const timerEl = this.element.querySelector('.progress-ring__timer');
        const ringEl = this.element.querySelector('.progress-ring__foreground');
        const radius = ringEl.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;

        stateTimer = setInterval(() => {
            elapsed += interval;
            step++;
            const progress = elapsed / (duration * 1000);
            const offset = circumference * (1 - progress);
            ringEl.style.strokeDashoffset = offset;
            if (timerEl) timerEl.textContent = ((duration * 1000 - elapsed) / 1000).toFixed(1);

            if (elapsed >= duration * 1000) {
                clearInterval(stateTimer);
                const nextPhaseIndex = trainerContext.currentPhaseIndex + 1;
                store.dispatch({ type: 'UPDATE_TRAINER_CONTEXT', payload: { currentPhaseIndex: nextPhaseIndex } });
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
        const { trainerState } = store.getState();
        if (stateTimer) {
            clearInterval(stateTimer);
            stateTimer = null;
        }

        if (trainerState === 'preparing') {
            stateTimer = setTimeout(() => {
                store.dispatch({ type: 'UPDATE_TRAINER_CONTEXT', payload: { currentPhaseIndex: 0 } });
                PhasedExerciseRunner.start(element);
            }, 3000);
        } else if (trainerState === 'announcing') {
            stateTimer = setTimeout(() => {
                store.dispatch({ type: 'SET_TRAINER_STATE', payload: 'action' });
            }, 750);
        } else if (trainerState === 'action') {
            PhasedExerciseRunner.execute();
        }
    }

    function render() {
        const { activeWorkout, trainerState, trainerContext } = store.getState();
        if (!activeWorkout) { element.innerHTML = '<h2>Nessun workout attivo.</h2>'; return; }

        const currentExercise = activeWorkout.items[trainerContext.itemIndex] || { name: 'Workout' };
        const radius = 90;
        const circumference = 2 * Math.PI * radius;

        let phaseText = '', instructionText = '', buttonText = '', timerText = '', phaseClass = '';
        let ringOffset = circumference;

        switch (trainerState) {
            case 'ready':
                phaseText = 'READY';
                instructionText = `Premi INIZIA per cominciare`;
                buttonText = 'INIZIA';
                break;
            case 'preparing':
                phaseText = 'PREP'; instructionText = 'Preparati...'; buttonText = 'PAUSA'; timerText = '3';
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
                break;
            default:
                phaseText = 'IDLE'; instructionText = 'Stato non riconosciuto'; buttonText = 'RESET';
        }

        element.innerHTML = `
            <div class="trainer-container">
                <header class="trainer-header">
                    <h2>${currentExercise.name}</h2>
                    <p>SERIES ${trainerContext.currentSeries} / ${currentExercise.series || 1} | REP ${trainerContext.currentRep} / ${currentExercise.reps || 1}</p>
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
