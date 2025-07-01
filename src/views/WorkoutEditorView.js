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
        switch (item.type) {
            case 'exercise':
                infoContent = `<span class="item-name">${item.name}</span>`;
                detailsContent = `<span class="item-details">${item.series || 1}x${item.reps}</span>`;
                break;
            case 'time':
                infoContent = `<span class="item-name">${item.name}</span>`;
                detailsContent = `<span class="item-details">${item.series || 1}x${item.duration}s</span>`;
                break;
            case 'rest':
                infoContent = `<span class="item-name">Riposo</span>`;
                detailsContent = `<input type="number" class="rest-duration-input" value="${item.duration}" data-item-id="${item.id}" /> s`;
                break;
        }
        return `
            <li class="workout-item workout-item--${item.type}" draggable="true" data-item-id="${item.id}">
                <div class="item-info">${infoContent}${detailsContent}</div>
                <button class="remove-item-btn" data-item-id="${item.id}" title="Rimuovi item">&times;</button>
            </li>`;
    }).join('');

    return `<div class="workout-editor-content"><ul class="workout-item-list">${itemsHtml}</ul></div>`;
}
