alert("VERSIONE NUOVA CARICATA!!!");
import { WORKOUTS } from './workouts.js';

document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // 1. STATE & COSTANTI
    // =================================================================
    let currentWeekOffset = 0;
    let workoutRoutines = JSON.parse(localStorage.getItem('workoutRoutines')) || {};
    let workoutHistory = JSON.parse(localStorage.getItem('workoutHistory')) || [];
    let currentRoutine = [];
    let currentExerciseIndex = 0;
    let timerInterval = null;
    let audioContext;
    const DELAY_BEFORE_ACTION = 800; // ms

    // =================================================================
    // 2. DOM ELEMENT CACHE
    // =================================================================
    const views = {
        calendar: document.getElementById('calendar-view'),
        trainer: document.getElementById('trainer-view'),
        debriefing: document.getElementById('debriefing-view'),
    };
    const weekDisplay = document.getElementById('week-display');
    const calendarGrid = document.getElementById('calendar-grid');
    const prevWeekBtn = document.getElementById('prev-week-btn');
    const nextWeekBtn = document.getElementById('next-week-btn');
    // ... (altri elementi modale se necessario)

    const trainerElements = {
        name: document.getElementById('trainer-exercise-name'),
        repCount: document.getElementById('trainer-rep-count'),
        setCount: document.getElementById('trainer-set-count'),
        currentAction: document.getElementById('trainer-current-action'),
        mainTimer: document.getElementById('trainer-main-timer'),
        description: document.getElementById('trainer-exercise-desc'),
        controls: {
            start: document.getElementById('start-exercise-btn'),
            nextSet: document.getElementById('next-set-btn'),
            nextExercise: document.getElementById('next-exercise-btn'),
            endWorkout: document.getElementById('end-workout-btn'),
        }
    };
    
    // =================================================================
    // 3. FUNZIONI
    // =================================================================

    function getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    function playTick() {
        if (!audioContext) return;
        // ... (la logica audio rimane invariata)
    }
    
    function showView(viewName) {
        Object.values(views).forEach(view => view.style.display = 'none');
        if (views[viewName]) {
            views[viewName].style.display = 'block';
        }
    }
    
    function renderCalendar() {
        // ... (la logica del calendario rimane invariata)
        calendarGrid.innerHTML = '';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfWeek = getStartOfWeek(new Date());
        startOfWeek.setDate(startOfWeek.getDate() + currentWeekOffset * 7);

        const formatter = new Intl.DateTimeFormat('it-IT', { month: 'long', day: 'numeric' });
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        weekDisplay.textContent = `${formatter.format(startOfWeek)} - ${formatter.format(endOfWeek)}`;

        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(day.getDate() + i);
            const dateString = day.toISOString().split('T')[0];

            const dayCell = document.createElement('div');
            dayCell.className = 'day-cell';
            if (day.toDateString() === today.toDateString()) {
                dayCell.classList.add('today');
            }

            const dayName = day.toLocaleDateString('it-IT', { weekday: 'long' });
            const dayNumber = day.getDate();
            dayCell.innerHTML = `<div class="day-name">${dayName}</div><div class="day-number">${dayNumber}</div>`;
            
            const routine = workoutRoutines[dateString];
            if (routine && routine.length > 0) {
                const summary = document.createElement('div');
                summary.className = 'workout-summary';
                summary.textContent = `${routine.length} esercizi`;
                dayCell.appendChild(summary);

                const startBtn = document.createElement('button');
                startBtn.className = 'btn btn-small';
                startBtn.textContent = 'INIZIA';
                startBtn.onclick = (e) => {
                    e.stopPropagation();
                    startWorkout(routine);
                };
                dayCell.appendChild(startBtn);
            }

            dayCell.onclick = () => alert(`Editor per ${dateString} non implementato.`); // Placeholder
            calendarGrid.appendChild(dayCell);
        }
    }
    
    function updateTrainerUI(exercise, stage) {
        // ... (la logica di update UI rimane invariata)
        const { controls } = trainerElements;
        
        if (stage === 'initial') {
            exercise.currentRep = 1;
            trainerElements.name.textContent = exercise.name;
            trainerElements.description.textContent = exercise.description;
            controls.start.style.display = 'inline-block';
            controls.nextSet.style.display = 'none';
            controls.nextExercise.style.display = 'none';
            controls.endWorkout.style.display = 'none';
            trainerElements.currentAction.textContent = 'PREPARATI';
            trainerElements.mainTimer.textContent = '--';
        }

        trainerElements.setCount.textContent = `Serie: ${exercise.currentSet} / ${exercise.sets}`;
        if (exercise.type === 'ripetizioni') {
            trainerElements.repCount.textContent = `Rip: ${exercise.currentRep} / ${exercise.reps}`;
            trainerElements.repCount.style.display = 'inline-block';
        } else {
            trainerElements.repCount.style.display = 'none';
        }
    }

    function logWorkout(exercise) {
        // ... (logica invariata)
    }

    function endWorkout() {
        showView('debriefing'); // Mostra la vista di debriefing
    }
    
    function endOfSet(exercise) {
        // ... (logica invariata)
        if (exercise.currentSet < exercise.sets) {
            trainerElements.controls.start.style.display = 'none';
            trainerElements.controls.nextSet.style.display = 'inline-block';
            trainerElements.currentAction.textContent = 'RECUPERO';
            trainerElements.mainTimer.textContent = '⏸️';
        } else {
            const isLastExercise = currentExerciseIndex === currentRoutine.length - 1;
            trainerElements.controls.nextExercise.style.display = isLastExercise ? 'none' : 'inline-block';
            trainerElements.controls.endWorkout.style.display = isLastExercise ? 'inline-block' : 'none';
            trainerElements.controls.start.style.display = 'none';
            trainerElements.controls.nextSet.style.display = 'none';
            trainerElements.currentAction.textContent = 'COMPLETATO';
            trainerElements.mainTimer.textContent = '✅';
            logWorkout(exercise);
        }
    }
    
    function playPhase(name, duration, onComplete) {
        // ... (logica invariata)
        trainerElements.currentAction.textContent = name;
        trainerElements.currentAction.classList.add('is-flashing');
        trainerElements.mainTimer.textContent = '';
        playTick();

        setTimeout(() => {
            trainerElements.currentAction.classList.remove('is-flashing');
            let timeLeft = duration;
            trainerElements.mainTimer.textContent = Math.floor(timeLeft);

            timerInterval = setInterval(() => {
                timeLeft -= 0.1;
                const newIntTime = Math.floor(timeLeft);
                if (newIntTime < parseInt(trainerElements.mainTimer.textContent)) {
                    trainerElements.mainTimer.textContent = newIntTime > 0 ? newIntTime : 0;
                }
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                    onComplete();
                }
            }, 100);
        }, DELAY_BEFORE_ACTION);
    }
    
    function runTimedPhase(exercise) {
        playPhase("TENUTA", exercise.duration, () => endOfSet(exercise));
    }

    function runRepetitionPhase(exercise, phaseIndex) {
        // ... (logica invariata)
        const phases = ['salita', 'tenuta_s', 'discesa', 'tenuta_g'];
        if (phaseIndex >= phases.length) {
            if (exercise.currentRep < exercise.reps) {
                exercise.currentRep++;
                updateTrainerUI(exercise, 'rep_change');
                runRepetitionPhase(exercise, 0);
            } else {
                endOfSet(exercise);
            }
            return;
        }
        const phaseName = phases[phaseIndex];
        const duration = exercise[phaseName];
        if (duration > 0) {
            playPhase(phaseName.toUpperCase(), duration, () => runRepetitionPhase(exercise, phaseIndex + 1));
        } else {
            runRepetitionPhase(exercise, phaseIndex + 1);
        }
    }

    function runExercisePhase(exercise) {
        if (exercise.type === 'ripetizioni') {
            runRepetitionPhase(exercise, 0);
        } else if (exercise.type === 'tempo') {
            runTimedPhase(exercise);
        }
    }

    function runCurrentExercise() {
        if (currentExerciseIndex >= currentRoutine.length) {
            endWorkout();
            return;
        }
        const exercise = currentRoutine[currentExerciseIndex];
        exercise.currentSet = 1;
        updateTrainerUI(exercise, 'initial');
    }
    
    function startWorkout(routine) {
        currentRoutine = JSON.parse(JSON.stringify(routine));
        currentExerciseIndex = 0;
        showView('trainer');
        runCurrentExercise();
    }

    function setupEventListeners() {
        prevWeekBtn.addEventListener('click', () => {
            currentWeekOffset--;
            renderCalendar();
        });
        nextWeekBtn.addEventListener('click', () => {
            currentWeekOffset++;
            renderCalendar();
        });
        trainerElements.controls.start.addEventListener('click', () => {
            const exercise = currentRoutine[currentExerciseIndex];
            trainerElements.controls.start.style.display = 'none';
            runExercisePhase(exercise);
        });
        trainerElements.controls.nextSet.addEventListener('click', () => {
            const exercise = currentRoutine[currentExerciseIndex];
            exercise.currentSet++;
            exercise.currentRep = 1;
            updateTrainerUI(exercise, 'set_change');
            trainerElements.controls.nextSet.style.display = 'none';
            runExercisePhase(exercise);
        });
        trainerElements.controls.nextExercise.addEventListener('click', () => {
            currentExerciseIndex++;
            runCurrentExercise();
        });
        trainerElements.controls.endWorkout.addEventListener('click', endWorkout);
    }
    
    // =================================================================
    // 4. FUNZIONE DI INIZIALIZZAZIONE
    // =================================================================
    function init() {
        setupEventListeners();
        renderCalendar();
        showView('calendar');
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API is not supported in this browser.');
        }
    }

    // =================================================================
    // 5. ESECUZIONE
    // =================================================================
    init();
});
