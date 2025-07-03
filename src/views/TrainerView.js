import store from '../modules/store.js';

const UI_ELEMENTS = {};
const radius = 90;
const circumference = 2 * Math.PI * radius;

function renderStructure(element) {
    element.innerHTML = `
        <div class="trainer-container">
            <header class="trainer-header">
                <h2 data-ui="headerTitle"></h2>
                <p data-ui="descriptionText" class="trainer-description"></p>
            </header>
            <div class="progress-ring">
                <svg>
                    <circle class="progress-ring__background" stroke-width="10" r="${radius}" cx="50%" cy="50%"></circle>
                    <circle data-ui="progressRing" class="progress-ring__foreground" stroke-width="10" r="${radius}" cx="50%" cy="50%" stroke-dasharray="${circumference}"></circle>
                </svg>
                <div class="progress-ring__text">
                    <div data-ui="mainPhaseText" class="progress-ring__phase"></div>
                    <div data-ui="timerText" class="progress-ring__timer"></div>
                </div>
            </div>
            <footer class="trainer-footer">
                <p data-ui="instructionText" class="trainer-instruction"></p>
                <div class="trainer-controls">
                    <button data-ui="mainButton" class="trainer-main-btn"></button>
                    <button data-ui="terminateButton" class="trainer-terminate-btn">Termina</button>
                </div>
            </footer>
        </div>
    `;

    element.querySelectorAll('[data-ui]').forEach(el => {
        UI_ELEMENTS[el.dataset.ui] = el;
    });
}

function updateDynamicContent() {
    const { trainer } = store.getState();
    if (!trainer || !trainer.executionPlan) return;

    const { status, executionPlan, currentStepIndex, remaining } = trainer;
    const currentStep = executionPlan[currentStepIndex];
    if (!currentStep) return;
    
    const { type, duration, headerTitle, mainText, context = {}, item } = currentStep;
    const isAnnouncing = type === 'announcing-phase';

    UI_ELEMENTS.headerTitle.textContent = headerTitle;
    UI_ELEMENTS.descriptionText.textContent = item?.description || '';
    
    let mainPhaseText = '';
    let timerText = '';
    if (status !== 'ready') {
        mainPhaseText = (type === 'rest') ? 'RIPOSO' : mainText;
        if (type === 'preparing') mainPhaseText = 'Preparati';
    }
    UI_ELEMENTS.mainPhaseText.textContent = mainPhaseText;
    UI_ELEMENTS.mainPhaseText.classList.toggle('is-flashing', isAnnouncing);
    if (duration > 0 && status !== 'ready') {
        timerText = String(Math.ceil(remaining / 1000));
    }
    UI_ELEMENTS.timerText.textContent = timerText;
    
    let buttonText = '...';
    let instructionText = '';
    switch (status) {
        case 'ready': buttonText = 'INIZIA'; instructionText = 'Premi INIZIA per cominciare'; break;
        case 'running': buttonText = 'PAUSA'; instructionText = (type === 'rest') ? mainText : 'Esegui'; break;
        case 'paused': buttonText = 'RIPRENDI'; instructionText = 'Pausa'; break;
        case 'finished': buttonText = 'Completato!'; instructionText = 'Ben fatto!'; break;
    }
    UI_ELEMENTS.mainButton.textContent = buttonText;
    UI_ELEMENTS.instructionText.textContent = instructionText;
    UI_ELEMENTS.mainButton.disabled = (status === 'finished');
    UI_ELEMENTS.terminateButton.disabled = (status === 'ready' || status === 'finished');

    const progress = (duration > 0 && !isAnnouncing && status === 'running') ? (duration - remaining) / duration : (remaining === 0 ? 1 : 0);
    UI_ELEMENTS.progressRing.style.strokeDashoffset = circumference * (1 - progress);
}


export function init(element) {
    renderStructure(element);

    UI_ELEMENTS.mainButton.addEventListener('click', () => {
        const { status } = store.getState().trainer;
        switch (status) {
            case 'ready': store.dispatch({ type: 'START_TRAINER' }); break;
            case 'running': store.dispatch({ type: 'PAUSE_TRAINER' }); break;
            case 'paused': store.dispatch({ type: 'RESUME_TRAINER' }); break;
        }
    });

    UI_ELEMENTS.terminateButton.addEventListener('click', () => {
        store.dispatch({ type: 'PAUSE_TRAINER' });
        store.dispatch({ type: 'OPEN_MODAL', payload: { type: 'CONFIRM_TERMINATION' } });
    });
    
    store.subscribe(() => {
        if (element.classList.contains('view--active')) {
            updateDynamicContent();
        }
    });
    
    updateDynamicContent();
}
