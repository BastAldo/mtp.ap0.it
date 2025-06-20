//test 
import { WORKOUTS } from './workouts.js';

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
        mainActionBtn: document.getElementById('main-action-btn'),
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

let trainerInterval = null;
let audioContext;
const ANNOUNCE_DELAY = 750;
const REP_PHASES = ['up', 'hold', 'down'];

const state = {
    currentWeekOffset: 0,
    workoutRoutines: JSON.parse(localStorage.getItem('workoutRoutines')) || {},
    workoutHistory: JSON.parse(localStorage.getItem('workoutHistory')) || [],
    activeWorkout: null,
    editingDate: null,
    trainerStatus: 'idle',
    nextTrainerStatus: 'preparing',
    currentExerciseIndex: 0,
    currentSeries: 1,
    currentRep: 1,
    currentRepPhaseIndex: 0,
    countdownValue: 0,
    completedExercises: [],
};

// --- NUOVO: LOGGER DI DEBUG ---
function logTrainerState(message) {
    console.log(
        `%c[TRAINER] ${message}`,
        'font-weight: bold; color: #9575cd;',
        {
            status: state.trainerStatus,
            nextStatus: state.nextTrainerStatus,
            countdown: state.countdownValue,
            exercise: state.activeWorkout?.[state.currentExerciseIndex]?.name,
            series: `${state.currentSeries}/${state.activeWorkout?.[state.currentExerciseIndex]?.defaultSets}`,
            rep: `${state.currentRep}/${state.activeWorkout?.[state.currentExerciseIndex]?.defaultReps}`,
            phase: `${state.currentRepPhaseIndex}: ${REP_PHASES[state.currentRepPhaseIndex]}`
        }
    );
}

// --- AUDIO ---
function initAudio() {
    if (audioContext) return;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { console.warn('Web Audio API is not supported.'); }
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

function startAnnouncePhase(nextStatus) {
    state.trainerStatus = 'announcing';
    state.nextTrainerStatus = nextStatus;
    logTrainerState(`Inizio annuncio per: ${nextStatus}`);
    playTick();
    updateUI();

    setTimeout(() => {
        if (state.trainerStatus !== 'announcing') return; // Sicurezza contro doppi avvii
        
        state.trainerStatus = state.nextTrainerStatus;
        logTrainerState(`Fine annuncio, avvio: ${state.trainerStatus}`);

        const exercise = state.activeWorkout?.[state.currentExerciseIndex];
        if (!exercise) return;
        
        if (state.trainerStatus === 'preparing') {
            state.countdownValue = 3;
            startTimer(trainerTick);
        } else if (state.trainerStatus === 'action') {
            if (exercise.type === 'time') {
                state.countdownValue = exercise.defaultDuration;
                startTimer(trainerTick);
            } else if (exercise.type === 'reps') {
                state.currentRep = 1;
                state.currentRepPhaseIndex = 0;
                runRepPhase();
            }
        } else if (state.trainerStatus === 'rest') {
            state.countdownValue = exercise.defaultRest;
            if (state.countdownValue > 0) startTimer(trainerTick);
            else handleSetCompletion(); // Se il riposo è 0, salta
        }
    }, ANNOUNCE_DELAY);
}

function startWorkout(date) {
    const routine = state.workoutRoutines[date];
    if (!routine || routine.length === 0) return;
    
    logTrainerState('Inizio Workout');
    state.activeWorkout = JSON.parse(JSON.stringify(routine));
    state.currentExerciseIndex = 0;
    state.completedExercises = [];
    advanceWorkout();
    showView('trainer');
}

function advanceWorkout() {
    const exercise = state.activeWorkout?.[state.currentExerciseIndex];
    if (!exercise) {
        logTrainerState('Workout Finito');
        state.trainerStatus = 'finished';
        updateUI();
        return;
    }
    state.currentSeries = 1;
    state.trainerStatus = 'ready';
    logTrainerState(`Avanzamento a nuovo esercizio: ${exercise.name}`);
    updateUI();
}

function handleSetCompletion() {
    const exercise = state.activeWorkout[state.currentExerciseIndex];
    logTrainerState(`Serie ${state.currentSeries} completata`);

    if (state.currentSeries < exercise.defaultSets) {
        state.currentSeries++;
        startAnnouncePhase('rest');
    } else {
        logCompletedExercise();
        state.currentExerciseIndex++;
        advanceWorkout();
    }
}

function logCompletedExercise() { /* ... completo e invariato ... */ }

function startTimer(tickFunction) {
    clearInterval(trainerInterval); // Sicurezza extra
    trainerInterval = setInterval(tickFunction, 1000);
}

function trainerTick() {
    state.countdownValue--;
    playTick();
    logTrainerState(`Tick... countdown a ${state.countdownValue}`);

    if (state.countdownValue <= 0) {
        clearInterval(trainerInterval);
        trainerInterval = null;
        if (state.trainerStatus === 'preparing') {
            startAnnouncePhase('action');
        } else if (state.trainerStatus === 'rest') {
            state.trainerStatus = 'ready';
            handleTrainerAction();
        } else if (state.trainerStatus === 'action' && state.activeWorkout[state.currentExerciseIndex].type === 'time') {
            handleSetCompletion();
        }
    }
    updateUI();
}

function runRepPhase() {
    const exercise = state.activeWorkout[state.currentExerciseIndex];
    const phaseName = REP_PHASES[state.currentRepPhaseIndex];
    if (!phaseName) return;
    const duration = exercise.defaultTempo[phaseName];
    state.countdownValue = duration;

    logTrainerState(`Inizio fase rep: ${phaseName} (${duration}s)`);

    if (duration > 0) {
        startTimer(repPhaseTick);
    } else {
        repPhaseTick(); // Gestisce immediatamente fasi a durata 0
    }
    updateUI();
}

function repPhaseTick() {
    if (state.countdownValue > 0) state.countdownValue--;
    if (state.countdownValue <= 0.5 && state.countdownValue > 0) playTick();
    
    if (state.countdownValue <= 0) {
        clearInterval(trainerInterval);
        trainerInterval = null;
        state.currentRepPhaseIndex++;

        if (state.currentRepPhaseIndex >= REP_PHASES.length) {
            state.currentRep++;
            const exercise = state.activeWorkout[state.currentExerciseIndex];
            logTrainerState(`Ripetizione ${state.currentRep - 1} completata`);
            if (state.currentRep > exercise.defaultReps) {
                handleSetCompletion();
                return;
            }
            state.currentRepPhaseIndex = 0;
        }
        startAnnouncePhase('action');
    }
    updateUI();
}

// --- FUNZIONI DI RENDER ---
function showView(viewId) { /* ... completo e invariato ... */ }
function renderTrainer() { /* ... completo e invariato ... */ }
function renderDebrief() { /* ... completo e invariato ... */ }
function renderCalendar() { /* ... completo e invariato ... */ }
function renderDailyWorkoutList() { /* ... completo e invariato ... */ }
function renderExerciseLibrary() { /* ... completo e invariato ... */ }
function openWorkoutEditor(date) { /* ... completo e invariato ... */ }
function closeWorkoutEditor() { /* ... completo e invariato ... */ }
function openLibraryModal() { /* ... completo e invariato ... */ }
function closeLibraryModal() { /* ... completo e invariato ... */ }
function addExerciseToRoutine(exerciseName) { /* ... completo e invariato ... */ }
function removeExerciseFromRoutine(index) { /* ... completo e invariato ... */ }

function updateUI() {
    if(dom.views.trainer.classList.contains('view--active')) {
        renderTrainer();
    } else {
        renderCalendar();
    }
}

function handleTrainerAction() {
    if (state.trainerStatus === 'ready') {
        logTrainerState("Azione 'INIZIA' ricevuta");
        startAnnouncePhase('preparing');
    }
}

function setupEventListeners() {
    dom.calendar.prevWeekBtn?.addEventListener('click', () => { state.currentWeekOffset--; updateUI(); });
    dom.calendar.nextWeekBtn?.addEventListener('click', () => { state.currentWeekOffset++; updateUI(); });
    
    dom.calendar.grid?.addEventListener('click', (e) => {
        const dayCell = e.target.closest('.day-cell');
        if (dayCell) {
            if (e.target.classList.contains('start-btn-small')) startWorkout(dayCell.dataset.date);
            else openWorkoutEditor(dayCell.dataset.date);
        }
    });

    dom.trainer.mainActionBtn?.addEventListener('click', handleTrainerAction);
    dom.trainer.endWorkoutBtn?.addEventListener('click', () => {
        if (trainerInterval) clearInterval(trainerInterval);
        logTrainerState("Workout terminato manualmente");
        state.trainerStatus = 'finished';
        updateUI();
    });
    
    dom.debrief.backToCalendarBtn?.addEventListener('click', () => { state.trainerStatus = 'idle'; showView('calendar'); updateUI(); });
    dom.debrief.copyBtn?.addEventListener('click', () => {
        dom.debrief.textArea.select();
        navigator.clipboard.writeText(dom.debrief.textArea.value);
    });

    dom.modals.closeEditorBtn?.addEventListener('click', closeWorkoutEditor);
    dom.modals.addExerciseBtn?.addEventListener('click', openLibraryModal);
    dom.modals.closeLibraryBtn?.addEventListener('click', closeLibraryModal);

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
    console.log("Applicazione inizializzata. Stato iniziale:", state);
}

main();