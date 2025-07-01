import store from '../modules/store.js';

export function init(element) {
    function render() {
        const { activeWorkout } = store.getState();
        if (!activeWorkout) {
            element.innerHTML = '<h2>Nessun workout attivo.</h2>';
            return;
        }

        const currentExercise = activeWorkout.items.find(item => item.type === 'exercise') || { name: 'Workout' };
        const radius = 90;
        const circumference = 2 * Math.PI * radius;

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
                        <div class="progress-ring__phase">READY</div>
                        <div class="progress-ring__timer"></div>
                    </div>
                </div>
                <footer class="trainer-footer">
                    <p class="trainer-instruction">Premi PAUSA per iniziare</p>
                    <div class="trainer-controls">
                        <button>PAUSE</button>
                    </div>
                </footer>
            </div>
        `;
    }
    render();
}
