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
    const debriefingSummary = document.getElementById('debriefing-summary');
    const returnToCalendarBtn = document.getElementById('return-to-calendar-btn');


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
    
    function showView(viewName) {
        Object.values(views).forEach(view => view.style.display = 'none');
        if (views[viewName]) {
            views[viewName].style.display = 'block';
        }
    }
    
    function renderCalendar() {
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
            // Qui andrebbe la logica per aprire il modale editor
            dayCell.onclick = () => console.log(`Editor per ${dateString} da implementare.`);
            calendarGrid.appendChild(dayCell);
        }
    }
    
    function updateTrainerUI(exercise, stage) {
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
        const historyEntry = {
            date: new Date().toISOString(),
            exercise: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps || null,
            duration: exercise.duration || null
        };
        workoutHistory.push(historyEntry);
        localStorage.setItem('workoutHistory', JSON.stringify(workoutHistory));
    }

    function generateDebrief() {
        // Questa funzione genera il testo di riepilogo per l'ultimo allenamento
        let report = "Riepilogo Allenamento:\n\n";
        currentRoutine.forEach(ex => {
            report += `- ${ex.name}: ${ex.sets} serie`;
            if (ex.reps) report += ` x ${ex.reps} ripetizioni`;
            if (ex.duration) report += ` per ${ex.duration} secondi`;
            report += ".\n";
        });
        debriefingSummary.textContent = report;
    }

    function endWorkout() {
        generateDebrief();
        showView('debriefing');
    }
    
    function endOfSet(exercise) {
        logWorkout(exercise);
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
        }
    }
    
    function playPhase(name, duration, onComplete) {
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
        prevWeekBtn.addEventListener('click', () => { currentWeekOffset--; renderCalendar(); });
        nextWeekBtn.addEventListener('click', () => { currentWeekOffset++; renderCalendar(); });
        returnToCalendarBtn.addEventListener('click', () => showView('calendar'));

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