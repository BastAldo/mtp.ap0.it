import { WORKOUTS } from './workouts.js';

// --- ELEMENTI DEL DOM ---
const dom = {
    views: {
        calendar: document.getElementById('calendar-view'),
        trainer: document.getElementById('trainer-view'),
        debriefing: document.getElementById('debriefing-view'),
    },
    calendar: {
        header: document.getElementById('calendar-header'),
        weekDisplay: document.getElementById('week-display'),
        grid: document.getElementById('week-grid'),
        prevWeekBtn: document.getElementById('prev-week-btn'),
        nextWeekBtn: document.getElementById('next-week-btn'),
    },
    trainer: {
        instruction: document.getElementById('trainer-instruction'),
    }
};

// --- STATO DELL'APPLICAZIONE ---
const state = {
    currentWeekOffset: 0,
    workoutRoutines: JSON.parse(localStorage.getItem('workoutRoutines')) || {},
    activeWorkout: null,
};

// --- FUNZIONI DI LOGICA ---
function goToPrevWeek() {
    state.currentWeekOffset--;
    updateUI();
}

function goToNextWeek() {
    state.currentWeekOffset++;
    updateUI();
}

function startWorkout(date) {
    console.log(`Avvio allenamento per il giorno: ${date}`);
    state.activeWorkout = state.workoutRoutines[date];
    showView('trainer');
    updateUI();
}

// --- FUNZIONI DI RENDER ---
function showView(viewId) {
    for (const id in dom.views) {
        dom.views[id].classList.toggle('view--active', id === viewId);
    }
}

function renderCalendar() {
    const today = new Date();
    today.setDate(today.getDate() + state.currentWeekOffset * 7);
    
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
    const startOfWeek = new Date(today.setDate(diff));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    dom.calendar.weekDisplay.textContent = 
        `${startOfWeek.toLocaleDateString('it-IT', {day: 'numeric', month: 'short'})} - ${endOfWeek.toLocaleDateString('it-IT', {day: 'numeric', month: 'short'})}`;

    dom.calendar.grid.innerHTML = '';

    const dayNames = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];

    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        const routinesForDay = state.workoutRoutines[dateString] || [];

        const dayCell = document.createElement('div');
        dayCell.className = 'day-cell';
        dayCell.dataset.date = dateString; // Aggiungo la data come data-attribute

        dayCell.innerHTML = `
            <div>
                <div class="day-header">${dayNames[i]}</div>
                <div class="day-number">${date.getDate()}</div>
            </div>
            <div>
                ${routinesForDay.length > 0 ? `<div class="workout-summary">${routinesForDay.length} esercizi</div>` : ''}
                <button class="start-btn-small" ${routinesForDay.length === 0 ? 'disabled' : ''}>INIZIA</button>
            </div>
        `;
        dom.calendar.grid.appendChild(dayCell);
    }
}

function renderTrainer() {
    if (!state.activeWorkout) return;
    const firstExercise = state.activeWorkout[0].name;
    dom.trainer.instruction.textContent = `Prossimo: ${firstExercise}`;
}

function updateUI() {
    // A seconda della vista attiva, renderizza cose diverse
    if (dom.views.calendar.classList.contains('view--active')) {
        renderCalendar();
    }
    if (dom.views.trainer.classList.contains('view--active')) {
        renderTrainer();
    }
}

// --- INIZIALIZZAZIONE ---
function setupEventListeners() {
    dom.calendar.prevWeekBtn.addEventListener('click', goToPrevWeek);
    dom.calendar.nextWeekBtn.addEventListener('click', goToNextWeek);

    // Event Delegation per i click sulla griglia del calendario
    dom.calendar.grid.addEventListener('click', (event) => {
        const target = event.target;
        
        // Controlla se il click è su un pulsante "INIZIA"
        if (target.classList.contains('start-btn-small')) {
            const dayCell = target.closest('.day-cell');
            if (dayCell && dayCell.dataset.date) {
                startWorkout(dayCell.dataset.date);
            }
        }
        // Altrimenti, se il click è su una cella (ma non sul bottone)
        else if (target.closest('.day-cell')) {
            const dayCell = target.closest('.day-cell');
            console.log(`Apertura editor per il giorno: ${dayCell.dataset.date}`);
            // Qui in futuro si aprirà il modale di modifica
        }
    });
}

function main() {
    setupEventListeners();
    showView('calendar');
    updateUI();
}

main();