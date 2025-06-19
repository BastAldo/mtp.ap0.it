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
    editingDate: null, // NUOVO: tiene traccia della data che stiamo modificando
};

// --- FUNZIONI DI LOGICA ---
function goToPrevWeek() { /* ... codice invariato ... */ }
function goToNextWeek() { /* ... codice invariato ... */ }
function startWorkout(date) { /* ... codice invariato ... */ }

function openWorkoutEditor(date) {
    state.editingDate = date;
    dom.modals.editorTitle.textContent = `Allenamento del ${new Date(date).toLocaleDateString('it-IT')}`;
    // Qui in futuro popoleremo la lista degli esercizi
    dom.modals.editor.classList.add('visible');
}

function closeWorkoutEditor() {
    state.editingDate = null;
    dom.modals.editor.classList.remove('visible');
}

// --- FUNZIONI DI RENDER ---
function showView(viewId) { /* ... codice invariato ... */ }
function renderCalendar() { /* ... codice invariato ... */ }
function renderTrainer() { /* ... codice invariato ... */ }

function updateUI() {
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

    // Listener per la griglia del calendario
    dom.calendar.grid.addEventListener('click', (event) => {
        const target = event.target;
        const dayCell = target.closest('.day-cell');
        if (!dayCell) return;

        const date = dayCell.dataset.date;

        if (target.classList.contains('start-btn-small')) {
            startWorkout(date);
        } else {
            openWorkoutEditor(date);
        }
    });
    
    // Listener per chiudere il modale
    dom.modals.closeEditorBtn.addEventListener('click', closeWorkoutEditor);
}

function main() {
    setupEventListeners();
    showView('calendar');
    updateUI();
}

// Avviamo l'app
main();