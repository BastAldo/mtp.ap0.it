import store from '../modules/store.js';

// --- UTILITIES ---
/**
 * Calcola la data del lunedì della stessa settimana di una data data.
 * @param {Date} date - La data di riferimento.
 * @returns {Date} La data del lunedì.
 */
function getWeekStartDate(date) {
    const d = new Date(date);
    const day = d.getDay(); // Domenica = 0, Lunedì = 1, ...
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adegua per la domenica
    return new Date(d.setDate(diff));
}

/**
 * Formatta una data nel formato "DD MMMM". Es: "30 Giugno"
 * @param {Date} date
 * @returns {string}
 */
function formatShortDate(date) {
  return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
}


// --- MODULE ---
export function init(element) {
    // Creazione della struttura interna della vista
    element.innerHTML = `
        <header class="calendar-header">
            <button id="prev-week-btn">&lt; Prev</button>
            <h2 id="week-title"></h2>
            <button id="next-week-btn">Next &gt;</button>
        </header>
        <div class="calendar-grid" id="calendar-grid-container"></div>
    `;

    // Cache degli elementi del DOM
    const prevBtn = element.querySelector('#prev-week-btn');
    const nextBtn = element.querySelector('#next-week-btn');
    const weekTitle = element.querySelector('#week-title');
    const gridContainer = element.querySelector('#calendar-grid-container');

    // Aggiunta Event Listeners
    prevBtn.addEventListener('click', () => store.dispatch({ type: 'PREV_WEEK' }));
    nextBtn.addEventListener('click', () => store.dispatch({ type: 'NEXT_WEEK' }));

    // Funzione di rendering principale
    function render() {
        const { focusedDate } = store.getState();
        const weekStart = getWeekStartDate(focusedDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        weekTitle.textContent = `${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`;
        gridContainer.innerHTML = ''; // Pulisce la griglia prima di ridisegnare

        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(weekStart);
            dayDate.setDate(dayDate.getDate() + i);

            const dayCell = document.createElement('div');
            dayCell.className = 'day-cell';
            dayCell.innerHTML = `
                <div class="day-cell__header">
                    <span>${dayDate.toLocaleDateString('it-IT', { weekday: 'long' })}</span>
                    <span>${dayDate.getDate()}</span>
                </div>
                <div class="day-cell__body">
                    </div>
            `;
            gridContainer.appendChild(dayCell);
        }
    }

    // Sottoscrizione allo store e rendering iniziale
    store.subscribe(render);
    render();
}
