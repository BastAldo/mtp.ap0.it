import store from '../modules/store.js';

/**
 * Renderizza il contenuto per la modale dell'editor di workout.
 * @param {object} context - Il contesto della modale, es. { type: 'EDIT_WORKOUT', date: 'YYYY-MM-DD' }
 * @returns {string} La stringa HTML per il corpo della modale.
 */
export function render(context) {
    const { workouts } = store.getState();
    const dateKey = `workout-${context.date}`;
    const workoutItems = workouts[dateKey];

    if (!workoutItems || workoutItems.length === 0) {
        return '<p>Nessun allenamento programmato per questo giorno.</p>';
    }

    const itemsHtml = workoutItems.map(item => {
        if (item.type === 'exercise') {
            return `
                <li class="workout-item workout-item--exercise">
                    <span class="item-name">${item.name}</span>
                    <span class="item-details">${item.series}x${item.reps}</span>
                </li>
            `;
        }
        if (item.type === 'rest') {
            return `
                <li class="workout-item workout-item--rest">
                    <span class="item-name">Riposo</span>
                    <span class="item-details">${item.duration}s</span>
                </li>
            `;
        }
        return '';
    }).join('');

    return `<ul class="workout-item-list">${itemsHtml}</ul>`;
}
