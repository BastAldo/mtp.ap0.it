import store from '../modules/store.js';
import { render as renderWorkoutEditor } from '../views/WorkoutEditorView.js';
import { render as renderExerciseLibrary } from '../views/ExerciseLibraryView.js';

export function init(element) {
    let previousItemCount = 0;
    let draggedItemId = null;

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
        const confirmBtn = event.target.closest('.btn-confirm');
        if(confirmBtn) { store.dispatch({type: 'TERMINATE_WORKOUT'}); store.dispatch({type: 'CLOSE_MODAL'}); return; }
        const cancelBtn = event.target.closest('.btn-cancel');
        if(cancelBtn) { store.dispatch({type: 'CLOSE_MODAL'}); return; }
    });

    element.addEventListener('change', (event) => {
        const restInput = event.target.closest('.rest-duration-input');
        if (restInput) { const { itemId } = restInput.dataset; const { date } = store.getState().modalContext; const newDuration = parseInt(restInput.value, 10); if (itemId && date && !isNaN(newDuration)) { store.dispatch({ type: 'UPDATE_REST_DURATION', payload: { date, itemId, newDuration } }); } }
    });

    // Drag and Drop listeners
    element.addEventListener('dragstart', (event) => {
        const target = event.target.closest('.workout-item');
        if (!target) return;
        draggedItemId = target.dataset.itemId;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', draggedItemId);
        setTimeout(() => target.classList.add('dragging'), 0);
    });

    element.addEventListener('dragend', (event) => {
        draggedItemId = null;
        const draggingElement = element.querySelector('.workout-item.dragging');
        if (draggingElement) draggingElement.classList.remove('dragging');
    });

    element.addEventListener('dragover', (event) => {
        event.preventDefault();
        const target = event.target.closest('.workout-item');
        if (target && target.dataset.itemId !== draggedItemId) {
            const currentlyActive = element.querySelector('.drag-over-target');
            if (currentlyActive) currentlyActive.classList.remove('drag-over-target');
            target.classList.add('drag-over-target');
        }
    });

    element.addEventListener('dragleave', (event) => {
        const target = event.target.closest('.drag-over-target');
        if(target) target.classList.remove('drag-over-target');
    });

    element.addEventListener('drop', (event) => {
        event.preventDefault();
        const target = event.target.closest('.workout-item');
        const currentlyActive = element.querySelector('.drag-over-target');
        if (currentlyActive) currentlyActive.classList.remove('drag-over-target');

        const targetItemId = target ? target.dataset.itemId : null;

        if (draggedItemId && targetItemId && draggedItemId !== targetItemId) {
            const { date } = store.getState().modalContext;
            store.dispatch({
                type: 'REORDER_WORKOUT_ITEMS',
                payload: { date, draggedItemId, targetItemId }
            });
        }
    });

    function render() {
        const { isModalOpen, modalContext, workouts } = store.getState();
        if (isModalOpen) {
            const dateKey = modalContext.date ? `workout-${modalContext.date}` : null;
            const currentItemCount = dateKey ? (workouts[dateKey]?.length || 0) : 0;

            element.classList.add('active');
            let headerContent = '', bodyContent = '', actionsContent = '';

            switch (modalContext?.type) {
                case 'EDIT_WORKOUT':
                    headerContent = `<h3>Editor Workout - ${modalContext.date}</h3>`;
                    bodyContent = renderWorkoutEditor(modalContext);
                    actionsContent = `<button class="add-exercise-btn">+ Add Exercise</button><button class="add-rest-btn">+ Aggiungi Riposo</button>`;
                    break;
                case 'CHOOSE_EXERCISE':
                    headerContent = `<h3>Libreria Esercizi</h3>`;
                    bodyContent = renderExerciseLibrary(modalContext);
                    break;
                case 'CONFIRM_TERMINATION':
                    headerContent = `<h3>Terminare l'allenamento?</h3>`;
                    bodyContent = `<p>Sei sicuro di voler terminare la sessione corrente? I progressi verranno salvati nel riepilogo.</p>`;
                    actionsContent = `<button class="btn-cancel">Annulla</button><button class="btn-confirm">Conferma</button>`;
                    break;
                default:
                    headerContent = '<h3>Attenzione</h3>';
                    bodyContent = '<p>Contenuto della modale non specificato.</p>';
            }
            element.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">${headerContent}<button class="modal-close-btn">&times;</button></div>
                    <div class="modal-body">${bodyContent}</div>
                    ${actionsContent ? `<footer class="modal-actions">${actionsContent}</footer>` : ''}
                </div>
            `;
            const closeButton = element.querySelector('.modal-close-btn');
            if (closeButton) { closeButton.addEventListener('click', () => { store.dispatch({ type: 'CLOSE_MODAL' }); }); }

            if (currentItemCount > previousItemCount) {
                const modalBody = element.querySelector('.modal-body');
                if (modalBody) { modalBody.scrollTop = modalBody.scrollHeight; }
            }
            previousItemCount = currentItemCount;

        } else {
            element.classList.remove('active');
            element.innerHTML = '';
            previousItemCount = 0;
        }
    }
    store.subscribe(render);
    render();
}
