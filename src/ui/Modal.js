import store from '../modules/store.js';
import { render as renderWorkoutEditor } from '../views/WorkoutEditorView.js';
import { render as renderExerciseLibrary } from '../views/ExerciseLibraryView.js';

export function init(element) {
    let previousItemCount = 0;

    element.addEventListener('click', (event) => { /* ... (invariato) ... */ });
    element.addEventListener('change', (event) => { /* ... (invariato) ... */ });
    // ... (resto del codice invariato) ...
    element.addEventListener('click', (event) => {
        if (event.target === element) { store.dispatch({ type: 'CLOSE_MODAL' }); return; }
        const removeBtn = event.target.closest('.remove-item-btn');
        if (removeBtn) { const { itemId } = removeBtn.dataset; const { date } = store.getState().modalContext; store.dispatch({ type: 'REMOVE_WORKOUT_ITEM', payload: { date, itemId } }); return; }
        const addRestBtn = event.target.closest('.add-rest-btn');
        if (addRestBtn) { const { date } = store.getState().modalContext; store.dispatch({ type: 'ADD_REST_ITEM', payload: { date } }); return; }
        const addExerciseBtn = event.target.closest('.add-exercise-btn');
        if (addExerciseBtn) { const { date } = store.getState().modalContext; store.dispatch({ type: 'OPEN_MODAL', payload: { type: 'CHOOSE_EXERCISE', date } }); return; }
        const addToWorkoutBtn = event.target.closest('.add-to-workout-btn');
        if (addToWorkoutBtn) { const { exerciseId } = addToWorkoutBtn.dataset; const { date } = store.getState().modalContext; store.dispatch({ type: 'ADD_EXERCISE_ITEM', payload: { date, exerciseId } }); return; }
    });
    element.addEventListener('change', (event) => {
        const restInput = event.target.closest('.rest-duration-input');
        if (restInput) { const { itemId } = restInput.dataset; const { date } = store.getState().modalContext; const newDuration = parseInt(restInput.value, 10); if (itemId && date && !isNaN(newDuration)) { store.dispatch({ type: 'UPDATE_REST_DURATION', payload: { date, itemId, newDuration } }); } }
    });

    function render() {
        const { isModalOpen, modalContext, workouts } = store.getState();
        if (isModalOpen) {
            const dateKey = `workout-${modalContext.date}`;
            const currentItemCount = workouts[dateKey]?.length || 0;

            element.classList.add('active');
            let headerContent = '', bodyContent = '';
            switch (modalContext?.type) {
                case 'EDIT_WORKOUT':
                    headerContent = `<h3>Editor Workout - ${modalContext.date}</h3>`;
                    bodyContent = renderWorkoutEditor(modalContext);
                    break;
                case 'CHOOSE_EXERCISE':
                    headerContent = `<h3>Libreria Esercizi</h3>`;
                    bodyContent = renderExerciseLibrary(modalContext);
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
            if (closeButton) { closeButton.addEventListener('click', () => { store.dispatch({ type: 'CLOSE_MODAL' }); }); }

            // Logica di auto-scroll
            if (currentItemCount > previousItemCount) {
                const modalBody = element.querySelector('.modal-body');
                if (modalBody) {
                    modalBody.scrollTop = modalBody.scrollHeight;
                }
            }
            previousItemCount = currentItemCount;

        } else {
            element.classList.remove('active');
            element.innerHTML = '';
            previousItemCount = 0; // Resetta il conteggio quando la modale si chiude
        }
    }
    store.subscribe(render);
    render();
}
