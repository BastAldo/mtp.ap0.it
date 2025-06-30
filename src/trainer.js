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
        countdown: 0,
        intervalId: null,
        phase: '', // 'up', 'hold', 'down', 'rest', 'prepare'
        repCount: 0,
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
            state.currentSeries = 1;
            ui.updateTrainerUI(state);
            break;
        case 'announcing':
            state.phase = data.phase;
            ui.updateTrainerUI(state);
            playTick();
            setTimeout(() => setState(data.nextState, data.nextStateData), 750);
            break;
        case 'preparing':
            runCountdown(3, 'action');
            break;
        case 'action':
            runActionPhase();
            break;
        case 'rest':
            runCountdown(state.currentExercise.rest, 'readyForNext');
            break;
        case 'paused':
            clearInterval(state.intervalId);
            ui.updateTrainerUI(state);
            break;
        case 'readyForNext':
            if (state.currentSeries < state.currentExercise.series) {
                state.currentSeries++;
                setState('ready');
            } else if (state.currentExerciseIndex < state.workoutPlan.length - 1) {
                state.currentExerciseIndex++;
                setState('ready');
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
    ui.updateTrainerUI(state);
    playTick();

    state.intervalId = setInterval(() => {
        state.countdown--;
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
        runCountdown(exercise.duration, 'rest');
    } else if (exercise.type === 'reps') {
        state.repCount = 0;
        runRep();
    }
}

function runRep() {
    const { tempo, reps } = state.currentExercise;
    if (state.repCount >= reps) {
        setState('rest');
        return;
    }
    state.repCount++;
    
    // Ciclo UP -> HOLD -> DOWN
    setState('announcing', { phase: 'up', nextState: 'action.rep.up', nextStateData: { duration: tempo.up } });
}

function runRepPhase(phase) {
    const { tempo } = state.currentExercise;
    const nextPhases = { 'up': 'hold', 'hold': 'down', 'down': null };
    
    if (phase === 'up') runCountdown(tempo.up, 'action.rep.transition', { next: 'hold' });
    if (phase === 'hold') runCountdown(tempo.hold, 'action.rep.transition', { next: 'down' });
    if (phase === 'down') runCountdown(tempo.down, 'action.rep.transition', { next: null });
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
    if (state.currentState !== 'action' && state.currentState !== 'rest' && state.currentState !== 'preparing') return;
    setState('paused');
}

export function resume() {
    if (state.currentState !== 'paused') return;
    const originalState = state.phase === 'rest' ? 'rest' : 'action';
    runCountdown(state.countdown, originalState === 'rest' ? 'readyForNext' : 'action');
}

export function stop() {
    // In futuro andrà al debriefing
    if (confirm("Sei sicuro di voler terminare l'allenamento?")) {
        setState('finished');
    }
}

// Mini-stati per la logica delle ripetizioni
function setRepState(newState, data) {
     switch(newState) {
         case 'action.rep.up':
             runRepPhase('up');
             break;
         case 'action.rep.down':
             runRepPhase('down');
             break;
         case 'action.rep.hold':
             runRepPhase('hold');
             break;
          case 'action.rep.transition':
              const nextPhase = data.next;
              if(nextPhase) {
                  setState('announcing', { phase: nextPhase, nextState: `action.rep.${nextPhase}` });
              } else {
                  runRep(); // Prossima ripetizione
              }
              break;
     }
}

// Intercetta la chiamata a setState per gestire gli stati complessi
const originalSetState = setState;
setState = (newState, data) => {
    if (newState.startsWith('action.rep')) {
        setRepState(newState, data);
    } else {
        originalSetState(newState, data);
    }
}
