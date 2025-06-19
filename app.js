import { EXERCISE_LIBRARY } from './workouts.js';

// STATO GLOBALE
let state = {
    currentDate: new Date(),
    dailyRoutines: {},
    history: [],
    currentEditingDate: null,
};
let trainerState = {};
let trainerInterval, tickerInterval;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let debriefData = null;

// FUNZIONI DI UTILITÀ E STORAGE
const utils = {
    generateId: () => `w_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    toISODateString: (d) => { const y=d.getFullYear(),m=(d.getMonth()+1).toString().padStart(2,'0'),a=d.getDate().toString().padStart(2,'0'); return `${y}-${m}-${a}`; },
    formatDate: (d) => d.toLocaleDateString('it-IT',{day:'2-digit',month:'2-digit',year:'numeric'}),
    getWeekStart: (d) => { const D=new Date(d);D.setHours(0,0,0,0);const day=D.getDay(),diff=D.getDate()-day+(day===0?-6:1);return new Date(D.setDate(diff)); },
    getRoutineForDate: (date) => state.dailyRoutines[utils.toISODateString(date)],
    switchView: (viewId) => { document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden')); document.getElementById(viewId).classList.remove('hidden'); }
};

const storage = {
    load() {
        const routines = localStorage.getItem('workoutRoutines');
        const history = localStorage.getItem('workoutHistory');
        state.dailyRoutines = routines ? JSON.parse(routines) : {};
        state.history = history ? JSON.parse(history) : [];
    },
    saveRoutines() { localStorage.setItem('workoutRoutines', JSON.stringify(state.dailyRoutines)); },
    saveHistory() { localStorage.setItem('workoutHistory', JSON.stringify(state.history)); }
};

// FUNZIONI CALENDARIO
function renderCalendar() {
    const date = state.currentDate;
    const weekStart = utils.getWeekStart(date);
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
    document.getElementById('week-display').textContent = `${utils.formatDate(weekStart)} - ${utils.formatDate(weekEnd)}`;
    const grid = document.getElementById('week-grid'); grid.innerHTML = '';
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(weekStart); dayDate.setDate(weekStart.getDate() + i);
        const dayCell = document.createElement('div');
        dayCell.className = 'day-cell';
        dayCell.onclick = () => openEditor(dayDate);
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = `${dayDate.toLocaleDateString('it-IT', {weekday: 'short'})} ${dayDate.getDate()}`;
        dayCell.appendChild(dayHeader);
        const routine = utils.getRoutineForDate(dayDate);
        if (routine && routine.length > 0) {
            routine.forEach(workout => {
                const libraryItem = EXERCISE_LIBRARY.find(ex => ex.id === workout.exerciseId);
                if (!libraryItem) return;
                const summary = document.createElement('div');
                summary.className = 'workout-summary';
                summary.innerHTML = `<div class="title">${libraryItem.name}</div>`;
                dayCell.appendChild(summary);
            });
            const startBtn = document.createElement('button');
            startBtn.className = 'start-btn-small';
            startBtn.textContent = 'INIZIA ROUTINE';
            startBtn.onclick = (e) => { e.stopPropagation(); window.startTrainer(dayDate); };
            dayCell.appendChild(startBtn);
        }
        grid.appendChild(dayCell);
    }
}

function changeWeek(offset) {
    state.currentDate.setDate(state.currentDate.getDate() + (7 * offset));
    renderCalendar();
}

// FUNZIONI EDITOR
function openEditor(date) {
    state.currentEditingDate = date;
    document.getElementById('editor-modal').classList.remove('hidden');
    renderDailyList();
}

function closeEditor() {
    document.getElementById('editor-modal').classList.add('hidden');
}

function renderDailyList() {
    const dateString = utils.toISODateString(state.currentEditingDate);
    const routine = state.dailyRoutines[dateString] || [];
    const listEl = document.getElementById('daily-workouts-list');
    listEl.innerHTML = '';
    if (routine.length === 0) { listEl.innerHTML = '<p>Nessun esercizio per oggi.</p>'; return; }
    routine.forEach((workout, index) => {
        const libraryItem = EXERCISE_LIBRARY.find(ex => ex.id === workout.exerciseId);
        const itemEl = document.createElement('div');
        itemEl.className = 'workout-item';
        const details = libraryItem.type === 'reps' ? `${workout.reps} reps` : `${workout.duration}s`;
        itemEl.innerHTML = `<div class="workout-item-details"><strong>${libraryItem.name}</strong><br><span>${workout.sets}x${details}</span></div><div class="workout-item-actions"><button onclick="window.removeExercise(${index})">🗑️</button></div>`;
        listEl.appendChild(itemEl);
    });
}

function removeExercise(index) {
    const dateString = utils.toISODateString(state.currentEditingDate);
    if (state.dailyRoutines[dateString]) {
        state.dailyRoutines[dateString].splice(index, 1);
        if (state.dailyRoutines[dateString].length === 0) delete state.dailyRoutines[dateString];
        storage.saveRoutines();
        renderDailyList();
        renderCalendar();
    }
}

function openExerciseSelector() {
    const listEl = document.getElementById('exercise-library-list'); listEl.innerHTML = '';
    EXERCISE_LIBRARY.forEach(ex => {
        const itemEl = document.createElement('div');
        itemEl.className = 'library-item';
        itemEl.innerHTML = `<strong>${ex.name}</strong><p style="margin:5px 0 0; font-size:0.9em;">${ex.description}</p>`;
        itemEl.onclick = () => addExercise(ex.id);
        listEl.appendChild(itemEl);
    });
    document.getElementById('exercise-selector-modal').classList.remove('hidden');
}

function closeExerciseSelector() {
    document.getElementById('exercise-selector-modal').classList.add('hidden');
}

function addExercise(exerciseId) {
    const dateString = utils.toISODateString(state.currentEditingDate);
    if (!state.dailyRoutines[dateString]) state.dailyRoutines[dateString] = [];
    const libraryItem = EXERCISE_LIBRARY.find(ex => ex.id === exerciseId);
    const newWorkout = {
        instanceId: utils.generateId(), exerciseId: libraryItem.id, sets: libraryItem.defaultSets,
        reps: libraryItem.defaultReps, duration: libraryItem.defaultDuration, tempo: libraryItem.defaultTempo,
    };
    state.dailyRoutines[dateString].push(newWorkout);
    storage.saveRoutines();
    renderDailyList();
    renderCalendar();
    closeExerciseSelector();
}

// FUNZIONI TRAINER
function startTrainer(date) {
    const routine = utils.getRoutineForDate(date);
    if (!routine || routine.length === 0) { alert('Nessuna routine per oggi!'); return; }
    trainerState = { routine: routine, currentExerciseIndex: 0, phase: 'ready_to_start' };
    setupNextExercise();
}

function setupNextExercise() {
    const workoutData = trainerState.routine[trainerState.currentExerciseIndex];
    const libraryItem = EXERCISE_LIBRARY.find(ex => ex.id === workoutData.exerciseId);
    trainerState.workout = { ...libraryItem, ...workoutData };
    trainerState = { ...trainerState, currentSet: 1, currentRep: 1, currentLeg: 'Destra', timeLeft: 0, nextPhaseName: '' };
    utils.switchView('trainer-view');
    document.getElementById('trainer-title').textContent = trainerState.workout.name;
    document.getElementById('trainer-description').textContent = trainerState.workout.description;
    document.getElementById('trainer-instruction').textContent = "Pronto?";
    document.getElementById('trainer-timer').textContent = "0.0";
    updateTrainerUI();
}

function beginWorkout() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    prepareFor(trainerState.workout.type === 'reps' ? 'up' : 'work');
    trainerInterval = setInterval(trainerLoop, 100);
}

function trainerLoop() {
    if (!['up_running','hold_running','down_running','work_running','prepare','leg_change'].includes(trainerState.phase)) return;
    trainerState.timeLeft -= 0.1;
    document.getElementById('trainer-timer').textContent = trainerState.timeLeft.toFixed(1);
    if (trainerState.timeLeft <= 0) nextTrainerPhase();
}

function nextTrainerPhase() {
    clearInterval(tickerInterval);
    const w = trainerState.workout;
    const instructionEl = document.getElementById('trainer-instruction');
    const legText = (w.unilateral && w.type ==='reps') ? `(${trainerState.currentLeg.substring(0,2)})` : '';
    if (trainerState.phase === 'prepare') { trainerState.phase = trainerState.nextPhaseName; trainerState.nextPhaseName = ''; }
    switch(trainerState.phase) {
        case 'up': instructionEl.textContent = `SALI ${legText}`; trainerState.timeLeft = w.tempo.up; beep(880); trainerState.phase = 'up_running'; break;
        case 'up_running': prepareFor('hold'); break;
        case 'hold': instructionEl.textContent = "PAUSA"; trainerState.timeLeft = w.tempo.hold; beep(1046); trainerState.phase = 'hold_running'; break;
        case 'hold_running': prepareFor('down'); break;
        case 'down': instructionEl.textContent = "SCENDI"; trainerState.timeLeft = w.tempo.down; beep(440); trainerState.phase = 'down_running'; break;
        case 'down_running':
            if (trainerState.currentRep < w.reps) { trainerState.currentRep++; prepareFor('up'); } 
            else {
                if (w.unilateral && trainerState.currentLeg === 'Destra') { trainerState.currentLeg = 'Sinistra'; trainerState.currentRep = 1; trainerState.phase = 'leg_change'; trainerState.timeLeft = 5; instructionEl.textContent = "CAMBIO GAMBA"; beep(300); } 
                else { (trainerState.currentSet < w.sets) ? (trainerState.phase = 'waiting', instructionEl.textContent = `Serie ${trainerState.currentSet} completata!`, beep(261, 300)) : finishExercise(); }
            }
            break;
        case 'leg_change': prepareFor('up'); break;
        case 'work': instructionEl.textContent = "MANTIENI"; trainerState.timeLeft = w.duration; beep(880); trainerState.phase = 'work_running'; break;
        case 'work_running': (trainerState.currentSet < w.sets) ? (trainerState.phase = 'waiting', instructionEl.textContent = `Serie ${trainerState.currentSet} completata!`, beep(261, 300)) : finishExercise(); break;
    }
    updateTrainerUI();
}

function prepareFor(nextPhaseName) {
    trainerState.phase = 'prepare'; trainerState.nextPhaseName = nextPhaseName; trainerState.timeLeft = 0.8;
    const w = trainerState.workout;
    const legText = (w.unilateral && w.type === 'reps') ? `(${trainerState.currentLeg.substring(0,2)})` : '';
    const instructionMap = { 'up': `SALI ${legText}`, 'hold': 'PAUSA', 'down': 'SCENDI', 'work': 'MANTIENI' };
    document.getElementById('trainer-instruction').textContent = instructionMap[nextPhaseName] || '...';
    tickerInterval = setInterval(() => beep(1318, 50, 0.2), 200);
}

function startNextSet() {
    trainerState.currentSet++; trainerState.currentRep = 1; trainerState.currentLeg = 'Destra';
    prepareFor(trainerState.workout.type === 'reps' ? 'up' : 'work');
}

function finishExercise() {
    clearInterval(trainerInterval); clearInterval(tickerInterval);
    const summaryData = { date: utils.toISODateString(new Date()), title: trainerState.workout.name, sets: trainerState.workout.sets, reps: trainerState.workout.reps, duration: trainerState.workout.duration, type: trainerState.workout.type };
    addHistory(summaryData);
    const hasNext = trainerState.currentExerciseIndex < trainerState.routine.length - 1;
    showDebrief(summaryData, hasNext);
}

function goToNextExercise() {
    trainerState.currentExerciseIndex++;
    setupNextExercise();
}

function resetTrainer() {
    clearInterval(trainerInterval); clearInterval(tickerInterval);
    trainerInterval = null; tickerInterval = null;
    utils.switchView('calendar-view');
}

function updateTrainerUI() {
    const w = trainerState.workout;
    document.getElementById('rep-counter').textContent = w.type === 'reps' ? `Ripetizione: ${trainerState.currentRep} / ${w.reps}` : '';
    document.getElementById('set-counter').textContent = `Serie: ${trainerState.currentSet} / ${w.sets}`;
    const controls = document.getElementById('trainer-controls');
    const instructionEl = document.getElementById('trainer-instruction');
    const phase = trainerState.phase;
    instructionEl.classList.toggle('flashing', phase === 'prepare');
    if(phase === 'prepare' || phase === 'leg_change') { instructionEl.textContent = phase === 'leg_change' ? 'CAMBIO GAMBA' : '...'; }
    if (phase === 'ready_to_start') { controls.innerHTML = `<button class="btn btn-secondary" onclick="window.beginWorkout()">AVVIA</button><button class="btn btn-grey" onclick="window.resetTrainer()">Indietro</button>`; }
    else if (phase === 'waiting') { controls.innerHTML = `<button class="btn btn-secondary" onclick="window.startNextSet()">INIZIA SERIE ${trainerState.currentSet + 1}</button><button class="btn btn-danger" onclick="window.resetTrainer()">TERMINA</button>`; }
    else if (phase !== 'finished') { controls.innerHTML = `<button class="btn btn-danger" onclick="window.resetTrainer()">INTERROMPI</button>`; } 
    else { controls.innerHTML = ''; }
}

function beep(freq=523, duration=100, vol=0.3) {
    if (!audioCtx) return;
    try { if (audioCtx.state === 'suspended') audioCtx.resume(); const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);g.gain.value=vol;o.frequency.value=freq;o.type="sine";o.start(audioCtx.currentTime);o.stop(audioCtx.currentTime+duration/1000); } catch (e) { console.error("Audio playback failed:", e); }
}

function addHistory(summaryData) { state.history.push(summaryData); storage.saveHistory(); }

function showHistory() {
    const list = document.getElementById('history-list'); list.innerHTML = '';
    if (state.history.length === 0) { list.innerHTML = '<li>Nessun allenamento completato.</li>'; }
    else { [...state.history].reverse().forEach(h => { const i = document.createElement('li'); i.innerHTML = `<strong>${utils.formatDate(new Date(h.date.replace(/-/g,'/')))}</strong><br>${h.title} - ${h.sets}x${h.type === 'reps' ? h.reps + ' reps' : h.duration + 's'}`; list.appendChild(i); }); }
    document.getElementById('history-modal').classList.remove('hidden');
}

function closeHistory() { document.getElementById('history-modal').classList.add('hidden'); }

function showDebrief(summaryData, hasNext) {
    debriefData = summaryData;
    utils.switchView('debriefing-view');
    document.getElementById('summary-content').innerHTML = `Esercizio <strong>${summaryData.title}</strong> completato!<br>Hai fatto <strong>${summaryData.sets}</strong> serie.`;
    const actions = document.getElementById('summary-actions');
    actions.innerHTML = ``;
    const copyBtn = document.createElement('button'); copyBtn.className = 'btn btn-primary'; copyBtn.textContent = 'Copia Riepilogo'; copyBtn.onclick = copyDebrief; actions.appendChild(copyBtn);
    const chatBtn = document.createElement('button'); chatBtn.className = 'btn btn-secondary'; chatBtn.textContent = 'Apri Chat Allenatore'; chatBtn.onclick = openChat; actions.appendChild(chatBtn);
    if (hasNext) { const nextBtn = document.createElement('button'); nextBtn.className = 'btn btn-success'; nextBtn.textContent = 'Passa al Prossimo Esercizio'; nextBtn.onclick = goToNextExercise; actions.appendChild(nextBtn); }
    const backBtn = document.createElement('button'); backBtn.className = 'btn btn-grey'; backBtn.textContent = 'Torna al Calendario'; backBtn.onclick = resetTrainer; actions.appendChild(backBtn);
}

function copyDebrief() {
    if (!debriefData) return;
    const w = debriefData;
    const details = w.type === 'reps' ? `${w.reps} ripetizioni` : `${w.duration} secondi`;
    const text = `--- Riepilogo Allenamento ---\nData: ${utils.formatDate(new Date(w.date.replace(/-/g,'/')))}\nEsercizio: ${w.title}\nCompletato: ${w.sets} serie x ${details}\n\n`;
    navigator.clipboard.writeText(text).then(() => alert('Riepilogo copiato!'), () => alert('Errore nella copia.'));
}

function openChat() { window.open('https://gemini.google.com/gem/3ddd32ed1a1a/644b02d78c11a9ed', '_blank'); }

// ===================================================================================
// Rendi le funzioni accessibili globalmente per gli onclick
// ===================================================================================
window.openEditor = openEditor;
window.startTrainer = startTrainer;
window.removeExercise = removeExercise;
window.addExercise = addExercise;
window.beginWorkout = beginWorkout;
window.resetTrainer = resetTrainer;
window.startNextSet = startNextSet;
window.goToNextExercise = goToNextExercise;

// INIZIALIZZAZIONE DELL'APP
document.addEventListener('DOMContentLoaded', init);
