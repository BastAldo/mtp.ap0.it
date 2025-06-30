import store from '../modules/store.js';

export function render(context) {
    const { workouts } = store.getState();
    const dateKey = `workout-${context.date}`;
    const workoutItems = workouts[dateKey];

    if (!workoutItems || workoutItems.length === 0) {
        return '<p>Nessun allenamento programmato per questo giorno.</p>';
    }

    const itemsHtml = workoutItems.map(item => {
        let content = '';
        if (item.type === 'exercise') {
            content = `
                <span class="item-name">${item.name}</span>
                <span class="item-details">${item.series}x${item.reps}</span>
            `;
        } else if (item.type === 'rest') {
            content = `
                <span class="item-name">Riposo</span>
                <span class="item-details">${item.duration}s</span>
            `;
        }
        return `
            <li class="workout-item workout-item--${item.type}">
                <div class="item-info">${content}</div>
                <button class="remove-item-btn" data-item-id="${item.id}" title="Rimuovi item">&times;</button>
            </li>
        `;
    }).join('');

    return `<ul class="workout-item-list">${itemsHtml}</ul>`;
}
