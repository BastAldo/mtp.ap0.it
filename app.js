import { WORKOUTS } from './workouts.js';

// --- ELEMENTI DEL DOM ---
const dom = {
    views: {
        calendar: document.getElementById('calendar-view'),
        trainer: document.getElementById('trainer-view'),
        debriefing: document.getElementById('debriefing-view'),
    },
    calendar: {
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
        dailyWorkoutsList: document.getElementById('daily-workouts-list'),
        addExerciseBtn: document.getElementById('add-exercise-btn'),
        closeEditorBtn: document.getElementById('close-editor-btn'),
        
        library: document.getElementById('library-modal'),
        exerciseLibraryList: document.getElementById('exercise-library-list'),
        closeLibraryBtn: document.getElementById('close-library-btn'),
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

function addExerciseToRoutine(exerciseName) {
    const exerciseData = WORKOUTS.find(ex => ex.name === exerciseName);
    if (!exerciseData) return;

    // Crea la routine per il giorno se non esiste
    if (!state.workoutRoutines[state.editingDate]) {
        state.workoutRoutines[state.editingDate] = [];
    }
    // Aggiunge una copia dell'esercizio con i suoi parametri di default
    state.workoutRoutines[state.editingDate].push({ ...exerciseData });
    
    saveRoutines();
    renderDailyWorkoutList(); // Aggiorna la lista nell'editor
    closeLibraryModal();
}

function removeExerciseFromRoutine(index) {
    if (!state.editingDate || !state.workoutRoutines[state.editingDate]) return;

    state.workoutRoutines[state.editingDate].splice(index, 1);
    saveRoutines();
    renderDailyWorkoutList(); // Aggiorna la lista
}

function goToPrevWeek() { state.currentWeekOffset--; updateUI(); }
function goToNextWeek() { state.currentWeekOffset++; updateUI(); }
function startWorkout(date) {
    if (!state.workoutRoutines[date]) return;
    state.activeWorkout = state.workoutRoutines[date];
    showView('trainer');
    updateUI();
}

// --- LOGICA MODALI ---
function openWorkoutEditor(date) {
    state.editingDate = date;
    const dateObj = new Date(date);
    const userTimezoneOffset = dateObj.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(dateObj.getTime() + userTimezoneOffset);
    dom.modals.editorTitle.textContent = `Allenamento del ${adjustedDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}`;
    renderDailyWorkoutList();
    dom.modals.editor.classList.add('visible');
}

function closeWorkoutEditor() {
    state.editingDate = null;
    dom.modals.editor.classList.remove('visible');
    updateUI(); // Aggiorna il calendario nel caso siano stati aggiunti esercizi
}

function openLibraryModal() {
    renderExerciseLibrary();
    dom.modals.library.classList.add('visible');
}

function closeLibraryModal() {
    dom.modals.library.classList.remove('visible');
}

// --- FUNZIONI DI RENDER ---
function showView(viewId) { /* ... codice invariato ... */ }
function renderCalendar() { /* ... codice invariato ... */ }

function renderDailyWorkoutList() {
    const routine = state.workoutRoutines[state.editingDate] || [];
    const listEl = dom.modals.dailyWorkoutsList;
    listEl.innerHTML = '';

    if (routine.length === 0) {
        listEl.innerHTML = `<p class="empty-list-placeholder">Nessun esercizio per oggi. Aggiungine uno!</p>`;
        return;
    }

    routine.forEach((exercise, index) => {
        const item = document.createElement('div');
        item.className = 'workout-item';
        item.innerHTML = `
            <div class="workout-item-details">
                <strong>${exercise.name}</strong>
            </div>
            <button class="remove-exercise-btn" data-index="${index}" title="Rimuovi esercizio">&times;</button>
        `;
        listEl.appendChild(item);
    });
}

function renderExerciseLibrary() {
    const listEl = dom.modals.exerciseLibraryList;
    listEl.innerHTML = '';
    WORKOUTS.forEach(exercise => {
        const item = document.createElement('div');
        item.className = 'library-item';
        item.dataset.name = exercise.name;
        item.innerHTML = `
            <strong>${exercise.name}</strong>
            <p>${exercise.description}</p>
        `;
        listEl.appendChild(item);
    });
}

function renderTrainer() { /* ... codice invariato ... */ }

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
    // ... listener per bottoni settimana ...

    dom.calendar.grid.addEventListener('click', (event) => { /* ... codice invariato ... */ });
    
    // Listener per i modali
    dom.modals.closeEditorBtn.addEventListener('click', closeWorkoutEditor);
    dom.modals.addExerciseBtn.addEventListener('click', openLibraryModal);
    dom.modals.closeLibraryBtn.addEventListener('click', closeLibraryModal);

    // Event Delegation per la lista della libreria
    dom.modals.exerciseLibraryList.addEventListener('click', (event) => {
        const target = event.target.closest('.library-item');
        if (target && target.dataset.name) {
            addExerciseToRoutine(target.dataset.name);
        }
    });
    
    // Event Delegation per la rimozione di esercizi
    dom.modals.dailyWorkoutsList.addEventListener('click', (event) => {
        const target = event.target.closest('.remove-exercise-btn');
        if(target && target.dataset.index) {
            removeExerciseFromRoutine(parseInt(target.dataset.index, 10));
        }
    });
}

function main() {
    setupEventListeners();
    showView('calendar');
    updateUI();
}

main();