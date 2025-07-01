commit_message: "fix(ui): Corregge rendering esercizi a tempo nell'editor"
rationale: |
  Questo commit risolve un bug di visualizzazione nell'editor di workout che causava la comparsa di una riga vuota.

  Il file `WorkoutEditorView.js` non aveva una logica per renderizzare gli esercizi di `type: 'time'`. Di conseguenza, quando un esercizio a tempo era presente nel workout, veniva mostrato come una riga vuota.

  È stata aggiunta la condizione mancante per gestire questo tipo di esercizio, mostrando correttamente il nome, le serie e la durata. Questo risolve il bug della riga vuota e rende visibile l'esercizio a tempo che era già presente nei dati di default.
patches:
  - file: src/views/WorkoutEditorView.js
    content: |
      import store from '../modules/store.js';

      export function render(context) {
          const { workouts } = store.getState();
          const dateKey = `workout-${context.date}`;
          const workoutItems = workouts[dateKey];

          if (!workoutItems || workoutItems.length === 0) {
              return '<div class="workout-editor-content"><p>Nessun allenamento programmato per questo giorno.</p></div>';
          }

          const itemsHtml = workoutItems.map(item => {
              let infoContent = '', detailsContent = '';
              if (item.type === 'exercise') {
                  infoContent = `<span class="item-name">${item.name}</span>`;
                  detailsContent = `<span class="item-details">${item.series}x${item.reps}</span>`;
              } else if (item.type === 'time') {
                  infoContent = `<span class="item-name">${item.name}</span>`;
                  detailsContent = `<span class="item-details">${item.series || 1}x${item.duration}s</span>`;
              } else if (item.type === 'rest') {
                  infoContent = `<span class="item-name">Riposo</span>`;
                  detailsContent = `<input type="number" class="rest-duration-input" value="${item.duration}" data-item-id="${item.id}" /> s`;
              }
              return `
                  <li class="workout-item workout-item--${item.type}">
                      <div class="item-info">${infoContent}${detailsContent}</div>
                      <button class="remove-item-btn" data-item-id="${item.id}" title="Rimuovi item">&times;</button>
                  </li>`;
          }).join('');

          return `<div class="workout-editor-content"><ul class="workout-item-list">${itemsHtml}</ul></div>`;
      }
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
            type: 'time', // Corretto per chiarezza, anche se l'ultimo vinceva.
            exerciseId: 'test-time-exercise',
            name: 'Esercizio di Test (Tempo)',
            series: 2,
            duration: 5
          }
        ]
      };
commands: []