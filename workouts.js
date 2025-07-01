commit_message: "feat(trainer): Unifica esercizi, refactoring animazione con requestAnimationFrame"
rationale: |
  Questo commit introduce un importante refactoring sia a livello di design che di implementazione tecnica, risolvendo bug e migliorando drasticamente l'esperienza utente.

  1.  **Modello Dati Unificato**: Gli esercizi a tempo e a ripetizioni ora condividono lo stesso modello e supportano entrambi le serie. Questo rende l'applicazione più potente, logica e allineata alle aspettative dell'utente (es. 3 serie di Plank). Il bug 'undefinedxundefined' è stato risolto correggendo la logica di aggiunta nello store per rispettare il 'type' dell'esercizio.
  2.  **Refactoring Animazione con `requestAnimationFrame`**: Tutte le animazioni basate su `setInterval` sono state sostituite con `requestAnimationFrame`. Questo risolve i problemi di fluidità (scattosità) e di completamento visivo dell'anello, sincronizzando l'animazione con il refresh rate del display per un'esperienza ottimale e più efficiente.
patches:
  - file: src/data/_staticExercises.js
    content: |
      // --- Libreria Statica degli Esercizi ---
      // Questa è una delle fonti dati per l'ExerciseRepository.

      export const staticExercises = [
        { id: 'test-exercise', name: 'Esercizio di Test (Reps)', series: 2, reps: 2, tempo: { up: 1, hold: 1, down: 1 }, defaultRest: 3 },
        { id: 'test-time-exercise', name: 'Esercizio di Test (Tempo)', type: 'time', series: 2, duration: 5, defaultRest: 3 },
        { id: 'bench-press', name: 'Bench Press', series: 3, reps: 8, defaultRest: 90 },
        { id: 'deadlift', name: 'Deadlift', series: 3, reps: 5, defaultRest: 120 },
        { id: 'squat', name: 'Squat', series: 3, reps: 10, defaultRest: 90 },
        { id: 'overhead-press', name: 'Overhead Press', series: 4, reps: 8, defaultRest: 75 },
        { id: 'pull-ups', name: 'Pull-ups', series: 3, reps: 'max', defaultRest: 60 },
        { id: 'push-ups', name: 'Push-ups', series: 3, reps: 12, defaultRest: 60 },
        { id: 'dips', name: 'Dips', series: 3, reps: 10, defaultRest: 60 },
        { id: 'plank', name: 'Plank', type: 'time', series: 3, duration: 60, defaultRest: 45 },
      ];
  - file: src/modules/_mockData.js
    content: |
      // --- Dati di Sviluppo Fittizi ---
      // Questi dati vengono usati per popolare localStorage al primo avvio.

      const MOCK_DATE_KEY = 'workout-2025-07-01';

      export const mockWorkouts = {
        [MOCK_DATE_KEY]: [
          {
            id: 'test-ex-reps',
            type: 'exercise',
            exerciseId: 'test-exercise',
            name: 'Esercizio di Test (Reps)',
            series: 2,
            reps: 2,
            tempo: { up: 1, hold: 1, down: 1 }
          },
          {
            id: 'test-rest',
            type: 'rest',
            duration: 3
          },
          {
            id: 'test-ex-time',
            type: 'exercise',
            exerciseId: 'test-time-exercise',
            name: 'Esercizio di Test (Tempo)',
            series: 2,
            type: 'time',
            duration: 5
          }
        ]
      };
  - file: src/modules/store.js
    content: |
      import { saveToStorage } from './storage.js';
      import { getExerciseById } from './exerciseRepository.js';

      const WORKOUTS_STORAGE_KEY = 'workouts';

      const cloneWorkouts = (workouts) => JSON.parse(JSON.stringify(workouts));

      function createStore() {
        let state = {
          currentView: 'calendar',
          focusedDate: new Date(),
          workouts: {},
          isModalOpen: false,
          modalContext: null,
          activeWorkout: null,
          trainerState: 'idle',
          trainerContext: {},
        };

        const subscribers = new Set();
        function notify() { subscribers.forEach(callback => callback()); }

        function dispatch(action) {
          const oldState = state;
          switch (action.type) {
            case 'CHANGE_VIEW': state = { ...state, currentView: action.payload }; break;
            case 'PREV_WEEK': { const d=new Date(state.focusedDate); d.setDate(d.getDate()-7); state={...state, focusedDate:d}; break; }
            case 'NEXT_WEEK': { const d=new Date(state.focusedDate); d.setDate(d.getDate()+7); state={...state, focusedDate:d}; break; }
            case 'SET_WORKOUTS': state = { ...state, workouts: action.payload }; break;
            case 'OPEN_MODAL': state = { ...state, isModalOpen: true, modalContext: action.payload }; break;
            case 'CLOSE_MODAL': state = { ...state, isModalOpen: false, modalContext: null }; break;
            case 'ADD_EXERCISE_ITEM': {
                const { date, exerciseId } = action.payload;
                const dateKey = `workout-${date}`;
                const exercise = getExerciseById(exerciseId);
                if (!exercise) break;

                const newItem = {
                    ...exercise, // Preserva il tipo e tutte le altre proprietà
                    id: `item-${Date.now()}`,
                    exerciseId: exercise.id,
                };

                const newWorkouts = cloneWorkouts(state.workouts);
                const dayWorkout = newWorkouts[dateKey] || [];
                dayWorkout.push(newItem);
                newWorkouts[dateKey] = dayWorkout;
                state = { ...state, workouts: newWorkouts, modalContext: { type: 'EDIT_WORKOUT', date } };
                break;
            }
            case 'ADD_REST_ITEM': {
                const { date } = action.payload;
                const dateKey = `workout-${date}`;
                const newItem = { id: `item-${Date.now()}`, type: 'rest', duration: 60 };
                const newWorkouts = cloneWorkouts(state.workouts);
                const dayWorkout = newWorkouts[dateKey] || [];
                dayWorkout.push(newItem);
                newWorkouts[dateKey] = dayWorkout;
                state = { ...state, workouts: newWorkouts };
                break;
            }
            case 'REMOVE_WORKOUT_ITEM': {
                const { date, itemId } = action.payload;
                const dateKey = `workout-${date}`;
                const newWorkouts = cloneWorkouts(state.workouts);
                newWorkouts[dateKey] = (newWorkouts[dateKey] || []).filter(item => item.id !== itemId);
                state = { ...state, workouts: newWorkouts };
                break;
            }
            case 'UPDATE_REST_DURATION': {
                const { date, itemId, newDuration } = action.payload;
                const dateKey = `workout-${date}`;
                const newWorkouts = cloneWorkouts(state.workouts);
                const dayWorkout = newWorkouts[dateKey] || [];
                const item = dayWorkout.find(item => item.id === itemId);
                if (item && item.type === 'rest') {
                    item.duration = newDuration;
                    newWorkouts[dateKey] = dayWorkout;
                    state = { ...state, workouts: newWorkouts };
                }
                break;
            }
            case 'START_WORKOUT': {
              const { date } = action.payload;
              const dateKey = `workout-${date}`;
              const workoutItems = state.workouts[dateKey];
              if (!workoutItems || workoutItems.length === 0) break;
              state = { ...state, currentView: 'trainer', activeWorkout: { date, items: workoutItems }, trainerState: 'ready', trainerContext: { itemIndex: 0, currentSeries: 1, currentRep: 1 } };
              break;
            }
            case 'SET_TRAINER_STATE': {
              state = { ...state, trainerState: action.payload };
              break;
            }
            case 'UPDATE_TRAINER_CONTEXT': {
              state = { ...state, trainerContext: { ...state.trainerContext, ...action.payload }};
              break;
            }
            case 'ADVANCE_TRAINER_LOGIC': {
              const { activeWorkout, trainerContext } = state;
              const currentItem = activeWorkout.items[trainerContext.itemIndex];
              const isTimeBased = currentItem.type === 'time';
              const maxSeries = currentItem.series || 1;
              const maxReps = currentItem.reps || 1;

              let nextContext = { ...trainerContext };
              let nextState = state.trainerState;

              const advanceToNextItem = () => {
                if (trainerContext.itemIndex < activeWorkout.items.length - 1) {
                  nextContext.itemIndex++;
                  const nextItem = activeWorkout.items[nextContext.itemIndex];
                  nextContext.currentSeries = 1;
                  nextContext.currentRep = 1;
                  nextState = nextItem.type === 'rest' ? 'rest' : 'preparing';
                  if (nextItem.type === 'rest') nextContext.restDuration = nextItem.duration;
                } else {
                  nextState = 'finished';
                }
              };

              if (isTimeBased) { // Logica per esercizi a tempo (ora con serie)
                  if (nextContext.currentSeries < maxSeries) {
                      nextContext.currentSeries++;
                      nextState = 'rest';
                      nextContext.restDuration = getExerciseById(currentItem.exerciseId)?.defaultRest || 60;
                  } else {
                      advanceToNextItem();
                  }
              } else { // Logica per esercizi a ripetizioni
                  if (nextContext.currentRep < maxReps) {
                      nextContext.currentRep++;
                      nextState = 'preparing';
                  } else if (nextContext.currentSeries < maxSeries) {
                      nextContext.currentSeries++;
                      nextContext.currentRep = 1;
                      nextState = 'rest';
                      nextContext.restDuration = getExerciseById(currentItem.exerciseId)?.defaultRest || 60;
                  } else {
                      advanceToNextItem();
                  }
              }

              state = { ...state, trainerState: nextState, trainerContext: nextContext };
              break;
            }
            default: console.warn(`Azione non riconosciuta: ${action.type}`); return;
          }
          if (state !== oldState) {
            console.log(`Action: ${action.type}`, action.payload);
            if (state.workouts !== oldState.workouts) saveToStorage(WORKOUTS_STORAGE_KEY, state.workouts);
            notify();
          }
        }
        return {
          getState: () => ({ ...state }),
          subscribe: (callback) => { subscribers.add(callback); return () => subscribers.delete(callback); },
          dispatch,
        };
      }
      const store = createStore();
      export default store;
  - file: src/views/TrainerView.js
    content: |
      import store from '../modules/store.js';

      let animationFrameId = null;

      function advanceTrainer() {
        store.dispatch({ type: 'ADVANCE_TRAINER_LOGIC' });
      }

      const PhasedExerciseRunner = {
          start(element) {
              this.element = element;
              store.dispatch({ type: 'UPDATE_TRAINER_CONTEXT', payload: { currentPhaseIndex: 0 } });
              this.runNextPhase();
          },
          runNextPhase() {
              const { activeWorkout, trainerContext } = store.getState();
              const currentExercise = activeWorkout.items[trainerContext.itemIndex];
              if (currentExercise.type === 'time') {
                  store.dispatch({ type: 'SET_TRAINER_STATE', payload: 'action' });
                  return;
              }
              const tempo = currentExercise.tempo || { up: 1, hold: 1, down: 2 };
              const phases = Object.keys(tempo);
              const currentPhaseIndex = trainerContext.currentPhaseIndex;
              if (currentPhaseIndex >= phases.length) {
                  advanceTrainer();
                  return;
              }
              const phaseName = phases[currentPhaseIndex];
              store.dispatch({ type: 'UPDATE_TRAINER_CONTEXT', payload: { currentPhase: phaseName } });
              store.dispatch({ type: 'SET_TRAINER_STATE', payload: 'announcing' });
          },
          execute() {
              const { activeWorkout, trainerContext } = store.getState();
              const currentItem = activeWorkout.items[trainerContext.itemIndex];
              let duration;
              if (currentItem.type === 'time') {
                  duration = (currentItem.duration || 10) * 1000;
              } else {
                  const tempo = currentItem.tempo || { up: 1, hold: 1, down: 2 };
                  duration = (tempo[trainerContext.currentPhase] || 1) * 1000;
              }
              this.element.dispatchEvent(new CustomEvent('animateRing', { detail: { duration, onComplete: currentItem.type === 'time' ? advanceTrainer : () => this.runNextPhaseAfterAction(trainerContext) } }));
          },
          runNextPhaseAfterAction(prevContext) {
            store.dispatch({ type: 'UPDATE_TRAINER_CONTEXT', payload: { currentPhaseIndex: prevContext.currentPhaseIndex + 1 } });
            this.runNextPhase();
          }
      };

      export function init(element) {
          element.addEventListener('click', (event) => {
              const mainButton = event.target.closest('.trainer-main-btn');
              if (mainButton) {
                  const currentState = store.getState().trainerState;
                  if (currentState === 'ready') store.dispatch({ type: 'SET_TRAINER_STATE', payload: 'preparing' });
              }
          });

          element.addEventListener('animateRing', ({ detail }) => {
              const ringEl = element.querySelector('.progress-ring__foreground');
              const timerEl = element.querySelector('.progress-ring__timer');
              if (!ringEl || !timerEl) return;
              const circumference = 2 * Math.PI * ringEl.r.baseVal.value;
              let startTime = null;

              const animationStep = (timestamp) => {
                  if (!startTime) startTime = timestamp;
                  const elapsed = timestamp - startTime;
                  const progress = Math.min(1, elapsed / detail.duration);
                  ringEl.style.strokeDashoffset = circumference * (1 - progress);
                  timerEl.textContent = Math.ceil((detail.duration - elapsed) / 1000);

                  if (elapsed < detail.duration) {
                      animationFrameId = requestAnimationFrame(animationStep);
                  } else {
                      ringEl.style.strokeDashoffset = 0;
                      timerEl.textContent = 0;
                      if (detail.onComplete) detail.onComplete();
                  }
              };
              animationFrameId = requestAnimationFrame(animationStep);
          });

          function runStateLogic() {
              if (animationFrameId) cancelAnimationFrame(animationFrameId);
              const { trainerState, trainerContext } = store.getState();
              if (trainerState === 'preparing') {
                  element.dispatchEvent(new CustomEvent('animateRing', { detail: { duration: 3000, onComplete: () => PhasedExerciseRunner.start(element) } }));
              } else if (trainerState === 'announcing') {
                  setTimeout(() => store.dispatch({ type: 'SET_TRAINER_STATE', payload: 'action' }), 750);
              } else if (trainerState === 'action') {
                  PhasedExerciseRunner.execute();
              } else if (trainerState === 'rest') {
                  element.dispatchEvent(new CustomEvent('animateRing', { detail: { duration: (trainerContext.restDuration || 60) * 1000, onComplete: advanceTrainer } }));
              }
          }

          function render() {
              const { activeWorkout, trainerState, trainerContext } = store.getState();
              if (!activeWorkout) { element.innerHTML = '<h2>Nessun workout attivo.</h2>'; return; }
              const currentItem = activeWorkout.items[trainerContext.itemIndex];
              const radius = 90;
              const circumference = 2 * Math.PI * radius;
              let phaseText = '', instructionText = '', buttonText = '', timerText = '', phaseClass = '';
              let ringOffset = circumference;
              const isTimeBasedExercise = currentItem.type === 'time';
              switch (trainerState) {
                  case 'ready':
                      phaseText = 'PRONTO'; instructionText = `Premi INIZIA per cominciare`; buttonText = 'INIZIA';
                      break;
                  case 'preparing':
                      phaseText = 'PREPARATI'; instructionText = 'Inizia il movimento...'; buttonText = 'PAUSA'; timerText = '3';
                      break;
                  case 'rest':
                      phaseText = 'RIPOSO'; instructionText = 'Recupera'; buttonText = 'PAUSA'; timerText = trainerContext.restDuration || 60;
                      break;
                  case 'announcing':
                      phaseText = trainerContext.currentPhase?.toUpperCase() || '';
                      instructionText = `Prossima fase: ${phaseText}`; buttonText = 'PAUSA';
                      phaseClass = 'is-flashing';
                      break;
                  case 'action':
                      phaseText = isTimeBasedExercise ? 'ESEGUI' : (trainerContext.currentPhase?.toUpperCase() || '');
                      instructionText = 'Esegui il movimento'; buttonText = 'PAUSA';
                      break;
                  case 'finished':
                      phaseText = 'FINE'; instructionText = 'Workout completato!'; buttonText = 'DEBRIEFING';
                      break;
                  default: phaseText = 'IDLE'; instructionText = 'Stato non riconosciuto'; buttonText = 'RESET';
              }
              const headerTitle = currentItem.name;
              const seriesText = `SERIE ${trainerContext.currentSeries} / ${currentItem.series || 1}`;
              const repsText = !isTimeBasedExercise ? `REP ${trainerContext.currentRep} / ${currentItem.reps || 1}` : '';
              element.innerHTML = `
                  <div class="trainer-container">
                      <header class="trainer-header">
                          <h2>${headerTitle}</h2>
                          <p>${seriesText} ${repsText ? `| ${repsText}` : ''}</p>
                      </header>
                      <div class="progress-ring">
                          <svg>
                              <circle class="progress-ring__background" stroke-width="10" r="${radius}" cx="50%" cy="50%"></circle>
                              <circle class="progress-ring__foreground" style="stroke-dashoffset: ${ringOffset};" stroke-width="10" r="${radius}" cx="50%" cy="50%" stroke-dasharray="${circumference}"></circle>
                          </svg>
                          <div class="progress-ring__text">
                              <div class="progress-ring__phase ${phaseClass}">${phaseText}</div>
                              <div class="progress-ring__timer">${timerText}</div>
                          </div>
                      </div>
                      <footer class="trainer-footer">
                          <p class="trainer-instruction">${instructionText}</p>
                          <div class="trainer-controls">
                              <button class="trainer-main-btn">${buttonText}</button>
                          </div>
                      </footer>
                  </div>
              `;
              runStateLogic();
          }
          store.subscribe(render);
          render();
      }
commands: []