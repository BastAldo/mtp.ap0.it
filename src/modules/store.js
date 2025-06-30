// --- Centralized State Store (Single Source of Truth) ---

function createStore() {
    let state = {
        currentView: 'calendar', // 'calendar', 'trainer', 'debriefing'
        focusedDate: new Date(), // Traccia la data per la navigazione del calendario
        workouts: {},
    };

    const subscribers = new Set();

    function notify() {
        subscribers.forEach(callback => callback());
    }

    function dispatch(action) {
        const oldState = state;
        switch (action.type) {
            case 'CHANGE_VIEW':
                if (state.currentView !== action.payload) {
                    state = { ...state, currentView: action.payload };
                }
                break;

            case 'PREV_WEEK': {
                const newDate = new Date(state.focusedDate);
                newDate.setDate(newDate.getDate() - 7);
                state = { ...state, focusedDate: newDate };
                break;
            }

            case 'NEXT_WEEK': {
                const newDate = new Date(state.focusedDate);
                newDate.setDate(newDate.getDate() + 7);
                state = { ...state, focusedDate: newDate };
                break;
            }

            default:
                console.warn(`Azione non riconosciuta: ${action.type}`);
                return; // Nessuna notifica se l'azione non è valida
        }
        // Notifica solo se lo stato è effettivamente cambiato
        if (state !== oldState) {
            console.log(`Action: ${action.type}`, state);
            notify();
        }
    }

    return {
        getState: () => ({ ...state }),
        subscribe: (callback) => {
            subscribers.add(callback);
            return () => subscribers.delete(callback);
        },
        dispatch,
    };
}

const store = createStore();
export default store;
