import store from '../modules/store.js';

let stateTimer = null; // Un solo timer per gestire tutte le transizioni di stato a tempo

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
            clearTimeout(stateTimer);
            stateTimer = null;
        }

        if (trainerState === 'preparing') {
            stateTimer = setTimeout(() => {
                store.dispatch({ type: 'SET_TRAINER_STATE', payload: 'announcing' });
            }, 3000);
        } else if (trainerState === 'announcing') {
            stateTimer = setTimeout(() => {
                // Prossimo stato dopo l'annuncio
                store.dispatch({ type: 'SET_TRAINER_STATE', payload: 'action' });
            }, 750);
        }
    }

    function render() {
        const { activeWorkout, trainerState } = store.getState();
        if (!activeWorkout) {
            element.innerHTML = '<h2>Nessun workout attivo.</h2>';
            return;
        }

        const currentExercise = activeWorkout.items[0] || { name: 'Workout' };
        const radius = 90;
        const circumference = 2 * Math.PI * radius;

        let phaseText = '', instructionText = '', buttonText = '', timerText = '', phaseClass = '';

        switch (trainerState) {
            case 'ready':
                phaseText = 'READY';
                instructionText = 'Premi INIZIA per cominciare';
                buttonText = 'INIZIA';
                break;
            case 'preparing':
                phaseText = 'PREP';
                instructionText = 'Preparati...';
                buttonText = 'PAUSA';
                timerText = '3';
                break;
            case 'announcing':
                phaseText = 'UP'; // Esempio
                instructionText = 'Prossima fase: UP';
                buttonText = 'PAUSA';
                phaseClass = 'is-flashing';
                break;
            case 'action':
                phaseText = 'UP'; // Stato di azione vero e proprio
                instructionText = 'Esegui il movimento';
                buttonText = 'PAUSA';
                timerText = '1.5';
                break;
            default:
                phaseText = 'IDLE';
                instructionText = 'Stato non riconosciuto';
                buttonText = 'RESET';
        }

        element.innerHTML = `
            <div class="trainer-container">
                <header class="trainer-header">
                    <h2>${currentExercise.name}</h2>
                    <p>SERIES 1 / ${currentExercise.series || 3}</p>
                </header>
                <div class="progress-ring">
                    <svg>
                        <circle class="progress-ring__background" stroke-width="10" r="${radius}" cx="50%" cy="50%"></circle>
                        <circle class="progress-ring__foreground" stroke-width="10" r="${radius}" cx="50%" cy="50%"
                            stroke-dasharray="${circumference}"
                            stroke-dashoffset="${circumference}"
                        ></circle>
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
