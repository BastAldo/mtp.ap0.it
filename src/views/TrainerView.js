import store from '../modules/store.js';

export function init(element) {
    const radius = 90;
    const circumference = 2 * Math.PI * radius;

    element.addEventListener('click', (event) => {
        const mainButton = event.target.closest('.trainer-main-btn');
        if (mainButton) {
            const currentState = store.getState().trainerState;
            if (currentState === 'ready') {
                store.dispatch({ type: 'SET_TRAINER_STATE', payload: 'preparing' });
            }
            // Aggiungere qui la logica per gli altri stati (es. PAUSA)
        }
    });

    function render() {
        const { activeWorkout, trainerState } = store.getState();
        if (!activeWorkout) {
            element.innerHTML = '<h2>Nessun workout attivo.</h2>';
            return;
        }

        const currentExercise = activeWorkout.items.find(item => item.type === 'exercise') || { name: 'Workout' };

        let phaseText = '';
        let instructionText = '';
        let buttonText = '';

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
            // Aggiungere qui gli altri stati
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
                        <div class="progress-ring__timer"></div>
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
    }
    store.subscribe(render);
    render();
}
