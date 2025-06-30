import store from '../modules/store.js';
import { render as renderWorkoutEditor } from '../views/WorkoutEditorView.js';

export function init(element) {
    element.addEventListener('click', (event) => {
        if (event.target === element) {
            store.dispatch({ type: 'CLOSE_MODAL' });
        }
    });

    function render() {
        const { isModalOpen, modalContext } = store.getState();

        if (isModalOpen) {
            element.classList.add('active');
            let headerContent = '';
            let bodyContent = '';

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
                    <div class="modal-header">
                        ${headerContent}
                        <button class="modal-close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${bodyContent}
                    </div>
                </div>
            `;

            const closeButton = element.querySelector('.modal-close-btn');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    store.dispatch({ type: 'CLOSE_MODAL' });
                });
            }
        } else {
            element.classList.remove('active');
            element.innerHTML = '';
        }
    }

    store.subscribe(render);
    render();
}
