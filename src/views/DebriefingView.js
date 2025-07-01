import store from '../modules/store.js';

function render() {
    // In a future step, we'll get the completed workout from the store
    // and generate a real summary.
    const summaryHtml = `
        <h2>Workout Completato!</h2>
        <p>Qui verrà mostrato il riepilogo dell'allenamento.</p>
    `;

    const actionsHtml = `
        <div class="debriefing-actions">
            <button class="copy-btn">Copia per il Coach</button>
            <button class="return-btn">Torna al Calendario</button>
        </div>
    `;

    return `
        <div class="debriefing-container">
            ${summaryHtml}
            ${actionsHtml}
        </div>
    `;
}

export function init(element) {
    element.addEventListener('click', (event) => {
        if (event.target.closest('.return-btn')) {
            store.dispatch({ type: 'CHANGE_VIEW', payload: 'calendar' });
        }
        if (event.target.closest('.copy-btn')) {
            // Logic for copying to clipboard will be added later
            alert('Funzione di copia non ancora implementata.');
        }
    });

    // We don't need to subscribe to the store for this basic version,
    // but we will in the future to render the workout data.
    element.innerHTML = render();
}
