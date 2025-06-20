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
        openChatBtn: document.getElementById('open-chat-btn'), // NUOVO
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
let announceTimeout = null;
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

function logTrainerState(message) {
    const exercise = state.activeWorkout?.[state.currentExerciseIndex];
    console.log(
        `%c[TRAINER] ${message}`,
        'font-weight: bold; color: #9575cd;',
        {
            status: state.trainerStatus,
            nextStatus: state.nextTrainerStatus,
            countdown: state.countdownValue,
            exercise: exercise?.name,
            series: `${state.currentSeries}/${exercise?.sets}`,
            rep: `${state.currentRep}/${exercise?.reps}`,
            phase: `${state.currentRepPhaseIndex}: ${REP_PHASES[state.currentRepPhaseIndex]}`
        }
    );
}

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

function saveRoutines() { localStorage.setItem('workoutRoutines', JSON.stringify(state.workoutRoutines)); }
function saveHistory() { localStorage.setItem('workoutHistory', JSON.stringify(state.workoutHistory)); }

function startAnnouncePhase(nextStatus) {
    state.trainerStatus = 'announcing';
    state.nextTrainerStatus = nextStatus;
    logTrainerState(`Inizio annuncio per: ${nextStatus}`);
    playTick();
    updateUI();
    clearTimeout(announceTimeout);
    announceTimeout = setTimeout(() => {
        if (state.trainerStatus !== 'announcing') return;
        state.trainerStatus = state.nextTrainerStatus;
        logTrainerState(`Fine annuncio, avvio: ${state.trainerStatus}`);
        const exercise = state.activeWorkout?.[state.currentExerciseIndex];
        if (!exercise) return;
        if (state.trainerStatus === 'preparing') {
            state.countdownValue = 3;
            startTimer(trainerTick);
        } else if (state.trainerStatus === 'action') {
            startPhase();
        } else if (state.trainerStatus === 'rest') {
            state.countdownValue = exercise.rest;
            if (state.countdownValue > 0) startTimer(trainerTick);
            else {
                state.currentSeries++;
                state.trainerStatus = 'ready';
                handleTrainerAction();
            }
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
    showView('trainer');
    advanceWorkout();
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
    if (state.currentSeries < exercise.sets) {
        startAnnouncePhase('rest');
    } else {
        logCompletedExercise();
        state.currentExerciseIndex++;
        advanceWorkout();
    }
}

function logCompletedExercise() {
    const exercise = state.activeWorkout[state.currentExerciseIndex];
    const log = {
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        duration: exercise.duration,
        completedAt: new Date().toISOString()
    };
    state.completedExercises.push(log);
    state.workoutHistory.push(log);
    saveHistory();
}

function startTimer(tickFunction) {
    clearInterval(trainerInterval);
    trainerInterval = setInterval(tickFunction, 1000);
}

function trainerTick() {
    if (state.trainerStatus === 'paused') return;
    state.countdownValue--;
    playTick();
    logTrainerState(`Tick... countdown a ${state.countdownValue}`);
    if (state.countdownValue < 0) {
        clearInterval(trainerInterval);
        trainerInterval = null;
        if (state.trainerStatus === 'preparing') {
            startAnnouncePhase('action');
        } else if (state.trainerStatus === 'rest') {
            state.currentSeries++;
            state.trainerStatus = 'ready';
            handleTrainerAction();
        } else if (state.trainerStatus === 'action' && state.activeWorkout[state.currentExerciseIndex].type === 'time') {
            handleSetCompletion();
        }
    }
    updateUI();
}

function startPhase() {
    const exercise = state.activeWorkout[state.currentExerciseIndex];
    if (exercise.type === 'time') {
        state.countdownValue = exercise.duration;
        startTimer(trainerTick);
    } else if (exercise.type === 'reps') {
        state.currentRep = 1;
        state.currentRepPhaseIndex = 0;
        runRepPhase();
    }
}

function runRepPhase() {
    const exercise = state.activeWorkout[state.currentExerciseIndex];
    const phaseName = REP_PHASES[state.currentRepPhaseIndex];
    if (!phaseName || !exercise.tempo) return;
    const duration = exercise.tempo[phaseName];
    state.countdownValue = duration;
    logTrainerState(`Inizio fase rep: ${phaseName} (${duration}s)`);
    if (duration > 0) {
        startTimer(repPhaseTick);
    } else {
        repPhaseTick();
    }
    updateUI();
}

function repPhaseTick() {
    if (state.trainerStatus === 'paused') return;
    if (state.countdownValue > 0) state.countdownValue--;
    if (state.countdownValue <= 0.5 && state.countdownValue > 0) playTick();
    if (state.countdownValue <= 0) {
        clearInterval(trainerInterval);
        trainerInterval = null;
        state.currentRepPhaseIndex++;
        if (state.currentRepPhaseIndex >= REP_PHASES.length) {
            const exercise = state.activeWorkout[state.currentExerciseIndex];
            logTrainerState(`Ripetizione ${state.currentRep} completata`);
            state.currentRep++;
            if (state.currentRep > exercise.reps) {
                handleSetCompletion();
                return;
            }
            state.currentRepPhaseIndex = 0;
        }
        playTick();
        startAnnouncePhase('action');
    }
    updateUI();
}

function showView(viewId) {
    for (const id in dom.views) {
        if (dom.views[id]) dom.views[id].classList.toggle('view--active', id === viewId);
    }
}

function renderTrainer() {
    const exercise = state.activeWorkout?.[state.currentExerciseIndex];
    if (!exercise) return;
    dom.trainer.name.textContent = exercise.name;
    dom.trainer.description.textContent = exercise.description;
    dom.trainer.counters.textContent = `Serie: ${state.currentSeries} / ${exercise.sets} | Rip: ${exercise.type === 'reps' ? `${state.currentRep} / ${exercise.reps}` : '-'}`;
    dom.trainer.mainActionBtn.style.display = 'inline-block';
    dom.trainer.display.classList.remove('is-flashing');
    dom.trainer.mainActionBtn.disabled = false;
    switch (state.trainerStatus) {
        case 'ready':
            dom.trainer.display.textContent = `Serie ${state.currentSeries}`;
            dom.trainer.mainActionBtn.textContent = 'INIZIA';
            break;
        case 'announcing':
            dom.trainer.display.classList.add('is-flashing');
            let nextActionText = '';
            if (state.nextTrainerStatus === 'preparing') nextActionText = 'PREPARATI';
            else if (state.nextTrainerStatus === 'rest') nextActionText = 'RECUPERO';
            else if (state.nextTrainerStatus === 'action') {
                if (exercise.type === 'reps') nextActionText = REP_PHASES[state.currentRepPhaseIndex].toUpperCase();
                else nextActionText = 'INIZIA';
            }
            dom.trainer.display.textContent = nextActionText;
            dom.trainer.mainActionBtn.style.display = 'none';
            break;
        case 'preparing':
            dom.trainer.display.textContent = state.countdownValue;
            dom.trainer.mainActionBtn.style.display = 'none';
            break;
        case 'action':
            dom.trainer.mainActionBtn.textContent = 'PAUSA';
            if (exercise.type === 'reps') {
                const phaseName = REP_PHASES[state.currentRepPhaseIndex].toUpperCase();
                dom.trainer.display.textContent = `${phaseName} (${state.countdownValue}s)`;
                dom.trainer.mainActionBtn.style.display = 'none';
            } else {
                dom.trainer.display.textContent = state.countdownValue;
            }
            break;
        case 'paused':
            dom.trainer.display.textContent = 'IN PAUSA';
            dom.trainer.mainActionBtn.textContent = 'RIPRENDI';
            break;
        case 'rest':
            dom.trainer.display.textContent = `RECUPERO (${state.countdownValue}s)`;
            dom.trainer.mainActionBtn.style.display = 'none';
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
        summary += `<li>✅ ${ex.name} (${ex.sets} x ${ex.reps ? ex.reps : `${ex.duration}s`})</li>`;
    });
    summary += `</ul>`;
    dom.debrief.summaryContainer.innerHTML = summary;
    let textReport = "Report Allenamento:\n";
    state.completedExercises.forEach(ex => {
        textReport += `- ${ex.name}: ${ex.sets} serie da ${ex.reps ? `${ex.reps} ripetizioni` : `${ex.duration} secondi`}.\n`;
    });
    dom.debrief.textArea.value = textReport;
}

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
        dayCell.dataset.date = dateString;
        if (day.toDateString() === new Date().toDateString()) dayCell.classList.add('today');
        const routine = state.workoutRoutines[dateString] || [];
        dayCell.innerHTML = `<div><div class="day-header">${day.toLocaleDateString('it-IT', { weekday: 'short' }).toUpperCase()}</div><div class="day-number">${day.getDate()}</div></div>${routine.length > 0 ? `<div><div class="workout-summary">${routine.length} esercizi</div><button class="start-btn-small">INIZIA</button></div>` : ''}`;
        dom.calendar.grid.appendChild(dayCell);
    }
}

function renderDailyWorkoutList() {
    const listEl = dom.modals.dailyWorkoutsList;
    if (!listEl) return;
    const routine = state.workoutRoutines[state.editingDate] || [];
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
    if (dom.views.trainer.classList.contains('view--active')) {
        renderTrainer();
    } else {
        renderCalendar();
    }
}

function handleTrainerAction() {
    logTrainerState(`Azione richiesta con stato: ${state.trainerStatus}`);
    if (state.trainerStatus === 'ready') {
        startAnnouncePhase('preparing');
    } else if (state.trainerStatus === 'action') {
        clearInterval(trainerInterval);
        state.trainerStatus = 'paused';
    } else if (state.trainerStatus === 'paused') {
        state.trainerStatus = 'action';
        const exercise = state.activeWorkout[state.currentExerciseIndex];
        if (exercise.type === 'reps') startTimer(repPhaseTick);
        else startTimer(trainerTick);
    }
    updateUI();
}

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

function addExerciseToRoutine(exerciseName) {
    const exerciseData = WORKOUTS.find(ex => ex.name === exerciseName);
    if (!exerciseData || !state.editingDate) return;
    if (!state.workoutRoutines[state.editingDate]) {
        state.workoutRoutines[state.editingDate] = [];
    }
    const newExercise = {};
    for (const key in exerciseData) {
        if (key.startsWith('default')) {
            newExercise[key.substring(7).toLowerCase()] = exerciseData[key];
        } else {
            newExercise[key] = exerciseData[key];
        }
    }
    state.workoutRoutines[state.editingDate].push(newExercise);
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
        clearTimeout(announceTimeout);
        logTrainerState("Workout terminato manualmente");
        state.trainerStatus = 'finished';
        updateUI();
    });
    dom.debrief.backToCalendarBtn?.addEventListener('click', () => { state.trainerStatus = 'idle'; showView('calendar'); updateUI(); });
    dom.debrief.copyBtn?.addEventListener('click', () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(dom.debrief.textArea.value).then(() => alert('Report copiato!'), () => alert('Copia fallita.'));
        }
    });
    dom.debrief.openChatBtn?.addEventListener('click', () => {
        window.open('https://gemini.google.com/app', '_blank');
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
    logTrainerState("Applicazione inizializzata.");
}

main();