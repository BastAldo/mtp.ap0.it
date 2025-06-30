// --- Centralized State Store (Single Source of Truth) ---

function createStore() {
    let state = {
        currentView: 'calendar',
        focusedDate: new Date(),
        workouts: {}, // Qui verranno memorizzati tutti gli allenamenti caricati
    };

    const subscribers = new Set();

    function notify() {
        subscribers.forEach(callback => callback());
    }

    function dispatch(action) {
        const oldState = state;
        switch (action.type) {
            case 'CHANGE_VIEW':
                state = { ...state, currentView: action.payload };
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

            case 'SET_WORKOUTS':
                state = { ...state, workouts: action.payload };
                break;

            default:
                console.warn(`Azione non riconosciuta: ${action.type}`);
                return;
        }

        if (state !== oldState) {
            console.log(`Action: ${action.type}`, action.payload);
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
