import store from '../modules/store.js';

export function render(context) {
    const { workouts } = store.getState();
    const dateKey = `workout-${context.date}`;
    const workoutItems = workouts[dateKey];

    let listHtml = '<p>Nessun allenamento programmato per questo giorno.</p>';

    if (workoutItems && workoutItems.length > 0) {
        const itemsHtml = workoutItems.map(item => {
            let infoContent = '';
            let detailsContent = '';

            if (item.type === 'exercise') {
                infoContent = `<span class="item-name">${item.name}</span>`;
                detailsContent = `<span class="item-details">${item.series}x${item.reps}</span>`;
            } else if (item.type === 'rest') {
                infoContent = `<span class="item-name">Riposo</span>`;
                detailsContent = `<input type="number" class="rest-duration-input" value="${item.duration}" data-item-id="${item.id}" /> s`;
            }

            return `
                <li class="workout-item workout-item--${item.type}">
                    <div class="item-info">
                        ${infoContent}
                        ${detailsContent}
                    </div>
                    <button class="remove-item-btn" data-item-id="${item.id}" title="Rimuovi item">&times;</button>
                </li>
            `;
        }).join('');
        listHtml = `<ul class="workout-item-list">${itemsHtml}</ul>`;
    }

    return `
        <div class="workout-editor-content">
            ${listHtml}
        </div>
        <footer class="modal-actions">
            <button class="add-rest-btn">+ Aggiungi Riposo</button>
        </footer>
    `;
}
