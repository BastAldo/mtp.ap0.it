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
        name: document.getElementById('exercise-name'),
        counters: document.getElementById('trainer-counters'),
        display: document.getElementById('trainer-main-display'),
        description: document.getElementById('exercise-description'),
        actionBtn: document.getElementById('trainer-action-btn'),
        nextExercise: document.getElementById('next-exercise-preview'),
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
    // Stati per il trainer
    trainerStatus: 'ready', // 'ready', 'preparing', 'running', 'paused', 'finished'
    currentExerciseIndex: 0,
    currentSeries: 1,
    countdownValue: 0,
};

// --- FUNZIONI DI LOGICA ---
function saveRoutines() {
    localStorage.setItem('workoutRoutines', JSON.stringify(state.workoutRoutines));
}

function addExerciseToRoutine(exerciseName) {
    const exerciseData = WORKOUTS.find(ex => ex.name === exerciseName);
    if (!exerciseData || !state.editingDate) return;

    if (!state.workoutRoutines[state.editingDate]) {
        state.workoutRoutines[state.editingDate] = [];
    }
    state.workoutRoutines[state.editingDate].push({ ...exerciseData });
    
    saveRoutines();
    renderDailyWorkoutList();
    closeLibraryModal();
}

function removeExerciseFromRoutine(index) {
    if (!state.editingDate || !state.workoutRoutines[state.editingDate]) return;
    state.workoutRoutines[state.editingDate].splice(index, 1);
    saveRoutines();
    renderDailyWorkoutList();
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
    if (!state.workoutRoutines[date] || state.workoutRoutines[date].length === 0) return;
    
    state.activeWorkout = state.workoutRoutines[date];
    state.trainerStatus = 'ready';
    state.currentExerciseIndex = 0;
    state.currentSeries = 1;
    
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
    updateUI();
}

function openLibraryModal() {
    renderExerciseLibrary();
    dom.modals.library.classList.add('visible');
}

function closeLibraryModal() {
    dom.modals.library.classList.remove('visible');
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
        dom.calendar.weekDisplay.textContent = `${startOfWeek.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}`;
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
        dayCell.innerHTML = `<div><div class="day-header">${dayNames[i]}</div><div class="day-number">${date.getDate()}</div></div><div>${routinesForDay.length > 0 ? `<div class="workout-summary">${routinesForDay.length} esercizi</div>` : ''}<button class="start-btn-small" ${routinesForDay.length === 0 ? 'disabled' : ''}>INIZIA</button></div>`;
        dom.calendar.grid.appendChild(dayCell);
    }
}

function renderDailyWorkoutList() {
    const routine = state.workoutRoutines[state.editingDate] || [];
    const listEl = dom.modals.dailyWorkoutsList;
    if (!listEl) return;
    listEl.innerHTML = '';
    if (routine.length === 0) {
        listEl.innerHTML = `<p class="empty-list-placeholder">Nessun esercizio per oggi. Aggiungine uno!</p>`;
        return;
    }
    routine.forEach((exercise, index) => {
        const item = document.createElement('div');
        item.className = 'workout-item';
        item.innerHTML = `<div class="workout-item-details"><strong>${exercise.name}</strong></div><button class="remove-exercise-btn" data-index="${index}" title="Rimuovi esercizio">&times;</button>`;
        listEl.appendChild(item);
    });
}

function renderExerciseLibrary() {
    const listEl = dom.modals.exerciseLibraryList;
    if (!listEl) return;
    listEl.innerHTML = '';
    WORKOUTS.forEach(exercise => {
        const item = document.createElement('div');
        item.className = 'library-item';
        item.dataset.name = exercise.name;
        item.innerHTML = `<strong>${exercise.name}</strong><p>${exercise.description}</p>`;
        listEl.appendChild(item);
    });
}

function renderTrainer() {
    if (!state.activeWorkout) return;
    const exercise = state.activeWorkout?.[state.currentExerciseIndex];
    if (!exercise) return;

    dom.trainer.name.textContent = exercise.name;
    dom.trainer.description.textContent = exercise.description;

    switch (state.trainerStatus) {
        case 'ready':
            const params = exercise.defaultParams;
            dom.trainer.counters.textContent = `Serie: ${params.series || 1} | ${params.reps ? `Rip: ${params.reps}` : `Tempo: ${params.duration}s`}`;
            dom.trainer.display.textContent = "PREMI PER INIZIARE";
            dom.trainer.actionBtn.textContent = "AVVIA ESERCIZIO";
            break;
    }

    const nextExercise = state.activeWorkout?.[state.currentExerciseIndex + 1];
    dom.trainer.nextExercise.textContent = nextExercise ? `Prossimo: ${nextExercise.name}` : 'Ultimo esercizio!';
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
function handleTrainerAction() {
    console.log(`Azione richiesta con stato: ${state.trainerStatus}`);
    if (state.trainerStatus === 'ready') {
        state.trainerStatus = 'preparing';
        console.log(`Nuovo stato: ${state.trainerStatus}`);
        updateUI();
    }
}

function setupEventListeners() {
    if (dom.calendar.prevWeekBtn) dom.calendar.prevWeekBtn.addEventListener('click', goToPrevWeek);
    if (dom.calendar.nextWeekBtn) dom.calendar.nextWeekBtn.addEventListener('click', goToNextWeek);
    
    if (dom.calendar.grid) {
        dom.calendar.grid.addEventListener('click', (event) => {
            const dayCell = event.target.closest('.day-cell');
            if (!dayCell || !dayCell.dataset.date) return;
            const date = dayCell.dataset.date;
            if (event.target.classList.contains('start-btn-small')) {
                startWorkout(date);
            } else {
                openWorkoutEditor(date);
            }
        });
    }

    if (dom.modals.closeEditorBtn) dom.modals.closeEditorBtn.addEventListener('click', closeWorkoutEditor);
    if (dom.modals.addExerciseBtn) dom.modals.addExerciseBtn.addEventListener('click', openLibraryModal);
    if (dom.modals.closeLibraryBtn) dom.modals.closeLibraryBtn.addEventListener('click', closeLibraryModal);

    if (dom.modals.exerciseLibraryList) {
        dom.modals.exerciseLibraryList.addEventListener('click', (event) => {
            const target = event.target.closest('.library-item');
            if (target && target.dataset.name) {
                addExerciseToRoutine(target.dataset.name);
            }
        });
    }

    if (dom.modals.dailyWorkoutsList) {
        dom.modals.dailyWorkoutsList.addEventListener('click', (event) => {
            const target = event.target.closest('.remove-exercise-btn');
            if (target && target.dataset.index) {
                removeExerciseFromRoutine(parseInt(target.dataset.index, 10));
            }
        });
    }

    if (dom.trainer.actionBtn) {
        dom.trainer.actionBtn.addEventListener('click', handleTrainerAction);
    }
}

function main() {
    setupEventListeners();
    showView('calendar');
    updateUI();
}

main();