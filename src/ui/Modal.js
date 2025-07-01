import store from '../modules/store.js';
import { render as renderWorkoutEditor } from '../views/WorkoutEditorView.js';

export function init(element) {
    element.addEventListener('click', (event) => {
        if (event.target === element) {
            store.dispatch({ type: 'CLOSE_MODAL' });
            return;
        }
        const removeButton = event.target.closest('.remove-item-btn');
        if (removeButton) {
            const { itemId } = removeButton.dataset;
            const { date } = store.getState().modalContext;
            if (itemId && date) {
                store.dispatch({ type: 'REMOVE_WORKOUT_ITEM', payload: { date, itemId } });
            }
        }
    });

    // Gestione per l'input inline
    element.addEventListener('change', (event) => {
        const restInput = event.target.closest('.rest-duration-input');
        if (restInput) {
            const { itemId } = restInput.dataset;
            const { date } = store.getState().modalContext;
            const newDuration = parseInt(restInput.value, 10);
            if (itemId && date && !isNaN(newDuration)) {
                store.dispatch({ type: 'UPDATE_REST_DURATION', payload: { date, itemId, newDuration } });
            }
        }
    });

    function render() {
        const { isModalOpen, modalContext } = store.getState();
        if (isModalOpen) {
            element.classList.add('active');
            let headerContent = '', bodyContent = '';
            switch (modalContext?.type) {
                case 'EDIT_WORKOUT':
                    headerContent = `<h3>Editor Workout - ${modalContext.date}</h3>`;
                    bodyContent = renderWorkoutEditor(modalContext);
                    break;
                default:
                    headerContent = '<h3>Attenzione</h3>';
                    bodyContent = '<p>Contenuto della modale non specificato.</p>';
            }
            element.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">${headerContent}<button class="modal-close-btn">&times;</button></div>
                    <div class="modal-body">${bodyContent}</div>
                </div>
            `;
            const closeButton = element.querySelector('.modal-close-btn');
            if (closeButton) {
                closeButton.addEventListener('click', () => { store.dispatch({ type: 'CLOSE_MODAL' }); });
            }
        } else {
            element.classList.remove('active');
            element.innerHTML = '';
        }
    }
    store.subscribe(render);
    render();
}
