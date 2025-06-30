import store from '../modules/store.js';

export function init(element) {
    // Gestione click per chiudere la modale
    element.addEventListener('click', (event) => {
        // Chiude se si clicca sull'overlay (l'elemento stesso)
        if (event.target === element) {
            store.dispatch({ type: 'CLOSE_MODAL' });
        }
    });

    function render() {
        const { isModalOpen, modalContext } = store.getState();

        if (isModalOpen) {
            element.classList.add('active');
            let content = '';
            // Renderizza il contenuto in base al contesto
            if (modalContext?.type === 'EDIT_WORKOUT') {
                content = `
                    <div class="modal-header">
                        <h3>Editor Workout - ${modalContext.date}</h3>
                        <button class="modal-close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>Contenuto dell'editor per il giorno ${modalContext.date} verrà qui.</p>
                    </div>
                `;
            }
            element.innerHTML = `<div class="modal-content">${content}</div>`;

            // Aggiunge l'event listener al pulsante di chiusura appena creato
            const closeButton = element.querySelector('.modal-close-btn');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    store.dispatch({ type: 'CLOSE_MODAL' });
                });
            }
        } else {
            element.classList.remove('active');
            element.innerHTML = ''; // Rimuove il contenuto quando la modale è chiusa
        }
    }

    store.subscribe(render);
    render();
}
