/**
 * @file trainer.js
 *
 * Contiene la macchina a stati e tutta la logica di business
 * per una sessione di allenamento. È completamente disaccoppiato dal DOM.
 */
import * as ui from './ui.js';
import { EXERCISES } from './config.js';
import { playTick } from './utils.js';

let state = {};

function resetState() {
    if (state.intervalId) clearInterval(state.intervalId);
    state = {
        workoutPlan: [],
        currentExerciseIndex: 0,
        currentSeries: 1,
        currentState: 'idle', // idle, ready, announcing, preparing, action, paused, rest, finished
        pausedState: null, // Salva lo stato prima della pausa
        countdown: 0,
        countdownDuration: 0,
        intervalId: null,
        phase: '', // 'up', 'hold', 'down', 'rest', 'prepare'
        repCount: 0,
        progress: 1,
    };
}

function setState(newState, data = {}) {
    state.currentState = newState;
    // Esegui azioni all'ingresso del nuovo stato
    switch (newState) {
        case 'idle':
            resetState();
            break;
        case 'ready':
            state.currentExercise = state.workoutPlan[state.currentExerciseIndex];
            if (state.currentSeries === 1) {
                state.currentSeries = 1;
            }
            ui.updateTrainerUI(state);
            break;
        case 'announcing':
            state.phase = data.phase;
            ui.updateTrainerUI(state);
            playTick();
            setTimeout(() => setState(data.nextState, data.nextStateData), 750);
            break;
        case 'preparing':
            state.phase = 'prepare';
            runCountdown(3, 'action');
            break;
        case 'action':
            runActionPhase();
            break;
        case 'rest':
            state.phase = 'rest';
            runCountdown(state.currentExercise.rest, 'readyForNext');
            break;
        case 'paused':
            clearInterval(state.intervalId);
            ui.updateTrainerUI(state);
            break;
        case 'readyForNext':
            if (state.currentSeries < state.currentExercise.series) {
                state.currentSeries++;
                setState('announcing', { phase: 'ready', nextState: 'ready' });
            } else if (state.currentExerciseIndex < state.workoutPlan.length - 1) {
                state.currentExerciseIndex++;
                state.currentSeries = 1;
                setState('announcing', { phase: 'ready', nextState: 'ready' });
            } else {
                setState('finished');
            }
            break;
        case 'finished':
            // Per ora, torna al calendario. In futuro andrà al debriefing.
            alert("Allenamento completato!");
            ui.showView('calendar-view');
            resetState();
            break;
    }
}

function runCountdown(duration, nextState, nextStateData = {}) {
    state.countdown = duration;
    state.countdownDuration = duration;
    // Calcolo corretto per riempire, non svuotare
    state.progress = (state.countdownDuration - state.countdown) / state.countdownDuration;

    ui.updateTrainerUI(state);
    if (duration > 0) playTick();

    state.intervalId = setInterval(() => {
        state.countdown--;
        // Calcolo corretto per riempire, non svuotare
        state.progress = (state.countdownDuration - state.countdown) / state.countdownDuration;
        ui.updateTrainerUI(state);
        if (state.countdown > 0) playTick();

        if (state.countdown <= 0) {
            clearInterval(state.intervalId);
            setState(nextState, nextStateData);
        }
    }, 1000);
}

function runActionPhase() {
    const exercise = state.currentExercise;
    if (exercise.type === 'time') {
        state.phase = 'action';
        runCountdown(exercise.duration, 'rest');
    } else if (exercise.type === 'reps') {
        state.repCount = 0;
        runRep();
    }
}

function runRep() {
    const { reps } = state.currentExercise;
    if (state.repCount >= reps) {
        setState('rest');
        return;
    }
    state.repCount++;
    setState('announcing', { phase: 'up', nextState: 'action.rep.up' });
}

function runRepPhase(phase) {
    const { tempo } = state.currentExercise;
    state.phase = phase;
    const nextStates = { 'up': 'action.rep.hold', 'hold': 'action.rep.down', 'down': null };
    runCountdown(tempo[phase], 'action.rep.transition', { next: nextStates[phase] });
}

// Entry points dall'esterno
export function start(exerciseIds) {
    resetState();
    state.workoutPlan = exerciseIds.map(id => EXERCISES.find(e => e.id === id));
    if (state.workoutPlan.length > 0) {
        setState('ready');
    }
}

export function startSeries() {
    if (state.currentState !== 'ready') return;
    setState('announcing', { phase: 'prepare', nextState: 'preparing' });
}

export function pause() {
    if (!['action', 'rest', 'preparing'].includes(state.currentState) && !state.currentState.startsWith('action.rep')) return;
    state.pausedState = state.currentState; // Salva lo stato esatto
    setState('paused');
}

export function resume() {
    if (state.currentState !== 'paused') return;
    // Ripristina lo stato esatto che era stato messo in pausa
    const stateToResume = state.pausedState; 
    setState(stateToResume);
}

export function stop() {
    if (confirm("Sei sicuro di voler terminare l'allenamento?")) {
        setState('finished');
    }
}

// Mini-stati per la logica delle ripetizioni
function setRepState(newState, data) {
     switch(newState) {
          case 'action.rep.up':
          case 'action.rep.down':
          case 'action.rep.hold':
             runRepPhase(newState.split('.').pop());
             break;
          case 'action.rep.transition':
              if (data.next) {
                  setState('announcing', { phase: data.next.split('.').pop(), nextState: data.next });
              } else {
                  runRep(); // Prossima ripetizione
              }
              break;
     }
}

// Intercetta la chiamata a setState per gestire gli stati complessi
const originalSetState = setState;
setState = (newState, data = {}) => {
    if (newState.startsWith('action.rep')) {
        setRepState(newState, data);
    } else {
        originalSetState(newState, data);
    }
}
