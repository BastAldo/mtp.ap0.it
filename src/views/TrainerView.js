import store from '../modules/store.js';

// Variabile per tenere traccia del timer
let countdownTimer = null;

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
        // Pulisce sempre i timer precedenti quando lo stato cambia
        if (countdownTimer) clearInterval(countdownTimer);

        if (trainerState === 'preparing') {
            let countdown = 3;
            const timerEl = element.querySelector('.progress-ring__timer');
            if(timerEl) timerEl.textContent = countdown;

            countdownTimer = setInterval(() => {
                countdown--;
                if(timerEl) timerEl.textContent = countdown;
                if (countdown === 0) {
                    clearInterval(countdownTimer);
                    store.dispatch({ type: 'SET_TRAINER_STATE', payload: 'announcing' });
                }
            }, 1000);
        }
    }

    function render() {
        const { activeWorkout, trainerState } = store.getState();
        if (!activeWorkout) {
            element.innerHTML = '<h2>Nessun workout attivo.</h2>';
            return;
        }

        const currentExercise = activeWorkout.items.find(item => item.type === 'exercise') || { name: 'Workout' };
        const radius = 90;
        const circumference = 2 * Math.PI * radius;

        let phaseText = '', instructionText = '', buttonText = '', timerText = '';

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
                break;
            case 'announcing':
                phaseText = 'UP'; // Esempio
                instructionText = 'Prossima fase: UP';
                buttonText = 'PAUSA';
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
                        <div class="progress-ring__phase">${phaseText}</div>
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
        // Esegui la logica dello stato DOPO aver renderizzato il DOM
        runStateLogic();
    }
    store.subscribe(render);
    render();
}
