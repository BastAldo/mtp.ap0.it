// --- Centralized State Store (Single Source of Truth) ---

function createStore() {
    let state = {
        currentView: 'calendar', // 'calendar', 'trainer', 'debriefing'
        workouts: {},
        // Altri stati verranno aggiunti qui
    };

    const subscribers = new Set();

    function notify() {
        subscribers.forEach(callback => callback());
    }

    function dispatch(action) {
        // Le azioni sono oggetti con { type, payload }
        switch (action.type) {
            case 'CHANGE_VIEW':
                if (state.currentView !== action.payload) {
                    state = { ...state, currentView: action.payload };
                    console.log(`State changed: view is now "${action.payload}"`);
                    notify();
                }
                break;
            // Altri tipi di azione verranno gestiti qui
            default:
                console.warn(`Azione non riconosciuta: ${action.type}`);
        }
    }

    return {
        // Ritorna una copia dello stato per impedire modifiche dirette
        getState: () => ({ ...state }),
        // Aggiunge un listener
        subscribe: (callback) => {
            subscribers.add(callback);
            // Ritorna una funzione per annullare l'iscrizione
            return () => subscribers.delete(callback);
        },
        // Invia un'azione per modificare lo stato
        dispatch,
    };
}

const store = createStore();
export default store;
