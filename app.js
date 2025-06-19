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
    },
    modals: {
        editor: document.getElementById('editor-modal'),
        editorTitle: document.getElementById('editor-modal-title'),
        closeEditorBtn: document.getElementById('close-editor-btn'),
        library: document.getElementById('library-modal'),
    }
};

// --- STATO DELL'APPLICAZIONE ---
const state = {
    currentWeekOffset: 0,
    workoutRoutines: JSON.parse(localStorage.getItem('workoutRoutines')) || {},
    activeWorkout: null,
    editingDate: null,
};

// --- FUNZIONI DI LOGICA ---
function saveRoutines() {
    localStorage.setItem('workoutRoutines', JSON.stringify(state.workoutRoutines));
}

function goToPrevWeek() {
    state.currentWeekOffset--;
    updateUI();
}

function goToNextWeek() {
    state.currentWeekOffset++;
    updateUI();
}

function startWorkout(date) {
    if (!state.workoutRoutines[date]) return;
    state.activeWorkout = state.workoutRoutines[date];
    showView('trainer');
    updateUI();
}

function openWorkoutEditor(date) {
    state.editingDate = date;
    const dateObj = new Date(date);
    // Aggiustamento per il fuso orario per evitare di mostrare il giorno prima
    const userTimezoneOffset = dateObj.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(dateObj.getTime() + userTimezoneOffset);
    
    dom.modals.editorTitle.textContent = `Allenamento del ${adjustedDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}`;
    dom.modals.editor.classList.add('visible');
    // Futuro: renderizzare la lista di esercizi per state.editingDate
}

function closeWorkoutEditor() {
    state.editingDate = null;
    dom.modals.editor.classList.remove('visible');
}

// --- FUNZIONI DI RENDER ---
function showView(viewId) {
    for (const id in dom.views) {
        if (dom.views[id]) {
            dom.views[id].classList.toggle('view--active', id === viewId);
        }
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

    if (dom.calendar.weekDisplay) {
        dom.calendar.weekDisplay.textContent = 
            `${startOfWeek.toLocaleDateString('it-IT', {day: 'numeric', month: 'short'})} - ${endOfWeek.toLocaleDateString('it-IT', {day: 'numeric', month: 'short'})}`;
    }

    if (!dom.calendar.grid) return;
    dom.calendar.grid.innerHTML = '';

    const dayNames = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];

    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        const routinesForDay = state.workoutRoutines[dateString] || [];

        const dayCell = document.createElement('div');
        dayCell.className = 'day-cell';
        dayCell.dataset.date = dateString;

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
    if (!dom.trainer.instruction) return;
    
    if (!state.activeWorkout || state.activeWorkout.length === 0) {
        dom.trainer.instruction.textContent = 'Nessun allenamento da avviare.';
        return;
    }
    
    const firstExercise = state.activeWorkout[0];
    
    if (firstExercise && firstExercise.name) {
        dom.trainer.instruction.textContent = `Prossimo: ${firstExercise.name}`;
    } else {
        dom.trainer.instruction.textContent = 'Errore: Dati esercizio non validi.';
    }
}

function updateUI() {
    if (dom.views.calendar?.classList.contains('view--active')) {
        renderCalendar();
    }
    if (dom.views.trainer?.classList.contains('view--active')) {
        renderTrainer();
    }
}

// --- INIZIALIZZAZIONE ---
function setupEventListeners() {
    if (dom.calendar.prevWeekBtn) {
        dom.calendar.prevWeekBtn.addEventListener('click', goToPrevWeek);
    }
    if (dom.calendar.nextWeekBtn) {
        dom.calendar.nextWeekBtn.addEventListener('click', goToNextWeek);
    }
    if (dom.calendar.grid) {
        dom.calendar.grid.addEventListener('click', (event) => {
            const target = event.target;
            const dayCell = target.closest('.day-cell');
            if (!dayCell || !dayCell.dataset.date) return;

            const date = dayCell.dataset.date;
            if (target.classList.contains('start-btn-small')) {
                startWorkout(date);
            } else {
                openWorkoutEditor(date);
            }
        });
    }
    if (dom.modals.closeEditorBtn) {
        dom.modals.closeEditorBtn.addEventListener('click', closeWorkoutEditor);
    }
}

function main() {
    setupEventListeners();
    showView('calendar');
    updateUI();
}

main();