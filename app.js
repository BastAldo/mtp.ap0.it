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
        controls: document.getElementById('trainer-controls'),
        startBtn: document.getElementById('start-exercise-btn'),
        nextSetBtn: document.getElementById('next-set-btn'),
        nextExerciseBtn: document.getElementById('next-exercise-btn'),
        endWorkoutBtn: document.getElementById('end-workout-btn'),
        nextExercisePreview: document.getElementById('next-exercise-preview'),
    },
    debrief: {
        summaryContainer: document.getElementById('debrief-summary'),
        textArea: document.getElementById('debrief-text-area'),
        copyBtn: document.getElementById('copy-debrief-btn'),
        backToCalendarBtn: document.getElementById('back-to-calendar-btn'),
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

// --- STATO GLOBALE ---
let trainerInterval = null;
let audioContext;

const state = {
    currentWeekOffset: 0,
    workoutRoutines: JSON.parse(localStorage.getItem('workoutRoutines')) || {},
    workoutHistory: JSON.parse(localStorage.getItem('workoutHistory')) || [],
    
    activeWorkout: null,
    editingDate: null,
    
    // State machine del trainer
    trainerStatus: 'idle', // idle, ready, preparing, action, rest
    currentExerciseIndex: 0,
    currentSeries: 1,
    currentRep: 1,
    countdownValue: 3,
    completedExercises: [],
};

// --- AUDIO ---
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.warn('Web Audio API is not supported.');
    }
}

function playTick() {
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.2);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
}

// --- LOGICA PRINCIPALE ---
function saveRoutines() { localStorage.setItem('workoutRoutines', JSON.stringify(state.workoutRoutines)); }
function saveHistory() { localStorage.setItem('workoutHistory', JSON.stringify(state.workoutHistory)); }

function startWorkout(date) {
    const routine = state.workoutRoutines[date];
    if (!routine || routine.length === 0) return;
    
    state.activeWorkout = JSON.parse(JSON.stringify(routine)); // Deep copy
    state.currentExerciseIndex = 0;
    state.completedExercises = [];
    
    advanceWorkoutState(); // Inizia dal primo esercizio
    showView('trainer');
}

function advanceWorkoutState() {
    const exercise = state.activeWorkout?.[state.currentExerciseIndex];

    if (!exercise) {
        // Workout Finito
        state.trainerStatus = 'finished';
        updateUI();
        return;
    }

    // Se è un nuovo esercizio
    if (state.trainerStatus !== 'rest') {
        state.currentSeries = 1;
        state.currentRep = 1;
    }
    state.trainerStatus = 'ready';
    updateUI();
}

// --- MOTORE DEL TRAINER ---
function trainerTick() {
    state.countdownValue--;
    playTick();
    
    if (state.countdownValue <= 0) {
        if(state.trainerStatus === 'preparing') {
            state.trainerStatus = 'action';
            const exercise = state.activeWorkout[state.currentExerciseIndex];
            if (exercise.type === 'time') {
                state.countdownValue = exercise.defaultParams.duration;
            } else {
                clearInterval(trainerInterval);
                trainerInterval = null;
            }
        } else if (state.trainerStatus === 'rest') {
            // Fine del riposo, passa all'azione successiva
             clearInterval(trainerInterval);
             trainerInterval = null;
             state.currentSeries++;
             state.trainerStatus = 'ready';
             handleTrainerAction(); // Simula il click per ripartire
        } else if (state.trainerStatus === 'action' && state.activeWorkout[state.currentExerciseIndex].type === 'time') {
            // Fine di un esercizio a tempo
            clearInterval(trainerInterval);
            trainerInterval = null;
            handleSetCompletion();
        }
    }
    updateUI();
}

function handleSetCompletion() {
    const exercise = state.activeWorkout[state.currentExerciseIndex];
    
    if (state.currentSeries < exercise.defaultParams.series) {
        // Ci sono altre serie, vai in pausa
        state.trainerStatus = 'rest';
        state.countdownValue = exercise.defaultParams.rest;
        if(state.countdownValue > 0) {
            if (trainerInterval) clearInterval(trainerInterval);
            trainerInterval = setInterval(trainerTick, 1000);
        }
    } else {
        // Serie finite, esercizio completato
        logCompletedExercise();
        state.currentExerciseIndex++;
        state.trainerStatus = 'idle'; // Stato intermedio prima di 'ready'
        advanceWorkoutState();
    }
    updateUI();
}

function logCompletedExercise() {
    const exercise = state.activeWorkout[state.currentExerciseIndex];
    const log = {
        name: exercise.name,
        sets: exercise.defaultParams.series,
        reps: exercise.defaultParams.reps,
        duration: exercise.defaultParams.duration,
        completedAt: new Date().toISOString()
    };
    state.completedExercises.push(log);
    state.workoutHistory.push(log);
    saveHistory();
}

// --- FUNZIONI DI RENDER ---
function showView(viewId) {
    for (const id in dom.views) {
        if (dom.views[id]) dom.views[id].classList.toggle('view--active', id === viewId);
    }
}

function renderTrainer() {
    const exercise = state.activeWorkout?.[state.currentExerciseIndex];
    if (!exercise) return;

    const params = exercise.defaultParams;
    dom.trainer.name.textContent = exercise.name;
    dom.trainer.description.textContent = exercise.description;
    dom.trainer.counters.textContent = `Serie: ${state.currentSeries} / ${params.series} | ${params.reps ? `Rip: ${params.reps}` : `Tempo: ${params.duration}s`}`;
    
    // Mostra/nasconde i pulsanti
    const show = (btn) => btn.style.display = 'inline-block';
    const hide = (btn) => btn.style.display = 'none';
    [dom.trainer.startBtn, dom.trainer.nextSetBtn, dom.trainer.nextExerciseBtn, dom.trainer.endWorkoutBtn].forEach(hide);

    dom.trainer.display.classList.remove('is-flashing');

    switch (state.trainerStatus) {
        case 'ready':
            show(dom.trainer.startBtn);
            dom.trainer.display.textContent = 'PREPARATI';
            break;
        case 'preparing':
            dom.trainer.display.textContent = state.countdownValue;
            dom.trainer.display.classList.add('is-flashing');
            break;
        case 'action':
            if (exercise.type === 'time') {
                dom.trainer.display.textContent = state.countdownValue;
            } else {
                dom.trainer.display.textContent = `ESEGUI ${params.reps} RIPETIZIONI`;
                show(dom.trainer.nextSetBtn);
                dom.trainer.nextSetBtn.textContent = "SERIE COMPLETATA";
            }
            break;
        case 'rest':
            show(dom.trainer.nextSetBtn);
            dom.trainer.nextSetBtn.textContent = `INIZIA SERIE (${state.countdownValue}s)`;
            dom.trainer.display.textContent = 'RECUPERO';
            break;
        case 'finished':
            renderDebrief();
            showView('debriefing');
            break;
    }

    const nextExercise = state.activeWorkout?.[state.currentExerciseIndex + 1];
    dom.trainer.nextExercisePreview.textContent = nextExercise ? `Prossimo: ${nextExercise.name}` : 'Ultimo esercizio!';
}

function renderDebrief() {
    let summary = `<h3>Riepilogo Allenamento</h3><ul>`;
    state.completedExercises.forEach(ex => {
        summary += `<li>✅ ${ex.name} (${ex.sets} x ${ex.reps || `${ex.duration}s`})</li>`;
    });
    summary += `</ul>`;
    dom.debrief.summaryContainer.innerHTML = summary;

    let textReport = "Report Allenamento:\n";
    state.completedExercises.forEach(ex => {
        textReport += `- ${ex.name}: ${ex.sets} serie da ${ex.reps ? `${ex.reps} ripetizioni` : `${ex.duration} secondi`}.\n`;
    });
    dom.debrief.textArea.value = textReport;
}

// ... tutte le altre funzioni di render (calendario, modali) ...
function renderCalendar() {
    if (!dom.calendar.grid) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() + 6) % 7);
    startOfWeek.setDate(startOfWeek.getDate() + state.currentWeekOffset * 7);

    const formatter = new Intl.DateTimeFormat('it-IT', { month: 'long', day: 'numeric' });
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    dom.calendar.weekDisplay.textContent = `${formatter.format(startOfWeek)} - ${formatter.format(endOfWeek)}`;
    dom.calendar.grid.innerHTML = '';
    
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(day.getDate() + i);
        const dateString = day.toISOString().split('T')[0];
        const dayCell = document.createElement('div');
        dayCell.className = 'day-cell';
        if (day.toDateString() === new Date().toDateString()) dayCell.classList.add('today');
        
        const routine = state.workoutRoutines[dateString];
        dayCell.innerHTML = `
            <div class="day-header">${day.toLocaleDateString('it-IT', { weekday: 'short' })}</div>
            <div class="day-number">${day.getDate()}</div>
            ${routine && routine.length > 0 ? `<div class="workout-summary">${routine.length} esercizi</div><button class="start-btn-small">INIZIA</button>` : ''}
        `;
        dayCell.onclick = (e) => {
            if (e.target.classList.contains('start-btn-small')) {
                startWorkout(dateString);
            } else {
                openWorkoutEditor(dateString);
            }
        };
        dom.calendar.grid.appendChild(dayCell);
    }
}
function renderDailyWorkoutList() {
    const routine = state.workoutRoutines[state.editingDate] || [];
    const listEl = dom.modals.dailyWorkoutsList;
    if (!listEl) return;
    listEl.innerHTML = '';
    if (routine.length === 0) {
        listEl.innerHTML = `<p class="empty-list-placeholder">Nessun esercizio. Aggiungine uno!</p>`;
        return;
    }
    routine.forEach((exercise, index) => {
        const item = document.createElement('div');
        item.className = 'workout-item';
        item.innerHTML = `<div class="workout-item-details"><strong>${exercise.name}</strong></div><button class="remove-exercise-btn" data-index="${index}">&times;</button>`;
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
        item.innerHTML = `<strong>${exercise.name}</strong><p style="font-size:0.8em; color: var(--text-secondary);">${exercise.description}</p>`;
        listEl.appendChild(item);
    });
}

function updateUI() {
    switch (state.trainerStatus) {
        case 'idle':
        case 'finished':
            renderCalendar();
            break;
        default:
            renderTrainer();
            break;
    }
}

// --- EVENT HANDLERS & INITIALIZATION ---
function handleTrainerAction(event) {
    const action = event.target.id;
    const currentStatus = state.trainerStatus;

    if (currentStatus === 'ready' && action === 'start-exercise-btn') {
        state.trainerStatus = 'preparing';
        state.countdownValue = 3;
        if (trainerInterval) clearInterval(trainerInterval);
        trainerInterval = setInterval(trainerTick, 1000);
    } else if (currentStatus === 'action' && exercise.type === 'ripetizioni' && action === 'next-set-btn') {
        handleSetCompletion();
    } else if (currentStatus === 'rest' && action === 'next-set-btn') {
        // Salta il resto del recupero
        clearInterval(trainerInterval);
        trainerInterval = null;
        state.currentSeries++;
        state.trainerStatus = 'ready';
        handleTrainerAction({ target: { id: 'start-exercise-btn' } });
    }
    updateUI();
}

function setupEventListeners() {
    dom.calendar.prevWeekBtn?.addEventListener('click', () => { state.currentWeekOffset--; updateUI(); });
    dom.calendar.nextWeekBtn?.addEventListener('click', () => { state.currentWeekOffset++; updateUI(); });
    
    dom.trainer.controls?.addEventListener('click', handleTrainerAction);
    
    dom.debrief.backToCalendarBtn?.addEventListener('click', () => { state.trainerStatus = 'idle'; showView('calendar'); updateUI(); });
    dom.debrief.copyBtn?.addEventListener('click', () => {
        dom.debrief.textArea.select();
        document.execCommand('copy');
    });

    dom.modals.closeEditorBtn?.addEventListener('click', () => { state.editingDate = null; dom.modals.editor.classList.remove('visible'); updateUI(); });
    dom.modals.addExerciseBtn?.addEventListener('click', () => dom.modals.library.classList.add('visible'));
    dom.modals.closeLibraryBtn?.addEventListener('click', () => dom.modals.library.classList.remove('visible'));

    dom.modals.exerciseLibraryList?.addEventListener('click', e => {
        const target = e.target.closest('.library-item');
        if (target?.dataset.name) addExerciseToRoutine(target.dataset.name);
    });
    
    dom.modals.dailyWorkoutsList?.addEventListener('click', e => {
        const target = e.target.closest('.remove-exercise-btn');
        if (target?.dataset.index) removeExerciseFromRoutine(parseInt(target.dataset.index, 10));
    });
}

function main() {
    initAudio();
    setupEventListeners();
    showView('calendar');
    updateUI();
}

main();