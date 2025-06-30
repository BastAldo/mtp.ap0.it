import store from './modules/store.js';

// Cache delle viste per performance
const views = {
    calendar: document.getElementById('calendar-view'),
    trainer: document.getElementById('trainer-view'),
    debriefing: document.getElementById('debriefing-view'),
};

let currentActiveView = null;

function render() {
    const state = store.getState();
    const activeViewId = state.currentView;

    // Se la vista attiva è già quella giusta, non fare nulla
    if (currentActiveView === views[activeViewId]) {
        return;
    }

    // Nascondi la vista precedentemente attiva
    if (currentActiveView) {
        currentActiveView.classList.remove('view--active');
    }

    // Mostra la nuova vista attiva
    const newActiveView = views[activeViewId];
    if (newActiveView) {
        newActiveView.classList.add('view--active');
        currentActiveView = newActiveView;
    } else {
        console.error(`View "${activeViewId}" non trovata.`);
        currentActiveView = null;
    }
}

// Sottoscrivi la funzione di rendering ai cambiamenti dello store
store.subscribe(render);

// Renderizza lo stato iniziale all'avvio
render();

console.log('App "Mio Trainer Personale" inizializzata.');
