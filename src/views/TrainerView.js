import store from '../modules/store.js';

let animationFrameId = null;

function advanceTrainer() {
  store.dispatch({ type: 'ADVANCE_TRAINER_LOGIC' });
}

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
        if (currentExercise.type === 'time') {
            store.dispatch({ type: 'SET_TRAINER_STATE', payload: 'action' });
            return;
        }
        const tempo = currentExercise.tempo || { up: 1, hold: 1, down: 2 };
        const phases = Object.keys(tempo);
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
        const { activeWorkout, trainerContext } = store.getState();
        const currentItem = activeWorkout.items[trainerContext.itemIndex];
        let duration;
        if (currentItem.type === 'time') {
            duration = (currentItem.duration || 10) * 1000;
        } else {
            const tempo = currentItem.tempo || { up: 1, hold: 1, down: 2 };
            duration = (tempo[trainerContext.currentPhase] || 1) * 1000;
        }
        this.element.dispatchEvent(new CustomEvent('animateRing', { detail: { duration, onComplete: currentItem.type === 'time' ? advanceTrainer : () => this.runNextPhaseAfterAction(trainerContext) } }));
    },
    runNextPhaseAfterAction(prevContext) {
      store.dispatch({ type: 'UPDATE_TRAINER_CONTEXT', payload: { currentPhaseIndex: prevContext.currentPhaseIndex + 1 } });
      this.runNextPhase();
    }
};

export function init(element) {
    PhasedExerciseRunner.init(element);
    
    element.addEventListener('click', (event) => {
        const mainButton = event.target.closest('.trainer-main-btn');
        if (mainButton) {
            const currentState = store.getState().trainerState;
            if (currentState === 'ready') store.dispatch({ type: 'SET_TRAINER_STATE', payload: 'preparing' });
        }
    });

    element.addEventListener('animateRing', ({ detail }) => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        const ringEl = element.querySelector('.progress-ring__foreground');
        const timerEl = element.querySelector('.progress-ring__timer');
        if (!ringEl || !timerEl) return;
        const circumference = 2 * Math.PI * ringEl.r.baseVal.value;
        let startTime = null;

        const animationStep = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(1, elapsed / detail.duration);
            ringEl.style.strokeDashoffset = circumference * (1 - progress);
            timerEl.textContent = Math.ceil((detail.duration - elapsed) / 1000);
            if (elapsed < detail.duration) {
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
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        const { trainerState, trainerContext } = store.getState();
        if (trainerState === 'preparing') {
            element.dispatchEvent(new CustomEvent('animateRing', { detail: { duration: 3000, onComplete: () => PhasedExerciseRunner.start() } }));
        } else if (trainerState === 'announcing') {
            setTimeout(() => store.dispatch({ type: 'SET_TRAINER_STATE', payload: 'action' }), 750);
        } else if (trainerState === 'action') {
            PhasedExerciseRunner.execute();
        } else if (trainerState === 'rest') {
            element.dispatchEvent(new CustomEvent('animateRing', { detail: { duration: (trainerContext.restDuration || 60) * 1000, onComplete: advanceTrainer } }));
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
        switch (trainerState) {
            case 'ready':
                phaseText = 'PRONTO'; instructionText = `Premi INIZIA per cominciare`; buttonText = 'INIZIA';
                break;
            case 'preparing':
                phaseText = 'PREPARATI'; instructionText = 'Inizia il movimento...'; buttonText = 'PAUSA'; timerText = '3';
                break;
            case 'rest':
                phaseText = 'RIPOSO'; instructionText = 'Recupera'; buttonText = 'PAUSA'; timerText = trainerContext.restDuration || 60;
                break;
            case 'announcing':
                phaseText = isTimeBasedExercise ? 'ESEGUI' : (trainerContext.currentPhase?.toUpperCase() || '');
                instructionText = `Prossima fase: ${phaseText}`; buttonText = 'PAUSA';
                if (!isTimeBasedExercise) phaseClass = 'is-flashing';
                break;
            case 'action':
                phaseText = isTimeBasedExercise ? 'ESEGUI' : (trainerContext.currentPhase?.toUpperCase() || '');
                instructionText = 'Esegui il movimento'; buttonText = 'PAUSA';
                break;
            case 'finished':
                phaseText = 'FINE'; instructionText = 'Workout completato!'; buttonText = 'DEBRIEFING';
                break;
            default: phaseText = 'IDLE'; instructionText = 'Stato non riconosciuto'; buttonText = 'RESET';
        }
        const headerTitle = currentItem.name || 'Riposo';
        const seriesText = `SERIE ${trainerContext.currentSeries} / ${currentItem.series || 1}`;
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
