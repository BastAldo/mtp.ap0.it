import { WORKOUTS } from './workouts.js';

// --- ELEMENTI DEL DOM ---
// Raggruppiamo tutti gli accessi al DOM in un unico posto per chiarezza.
const dom = {
    views: {
        calendar: document.getElementById('calendar-view'),
        trainer: document.getElementById('trainer-view'),
        debriefing: document.getElementById('debriefing-view'),
    },
    calendar: {
        weekDisplay: document.getElementById('week-display'),
        daysContainer: document.getElementById('calendar-days'),
        prevWeekBtn: document.getElementById('prev-week-btn'),
        nextWeekBtn: document.getElementById('next-week-btn'),
    },
    // Aggiungi qui altri elementi del DOM quando serviranno (trainer, debriefing, etc.)
};

// --- STATO DELL'APPLICAZIONE ---
// Tutta la logica e i dati variabili sono contenuti in questo singolo oggetto.
// È l'unica "fonte di verità".
const state = {
    currentWeekOffset: 0,
    // Carica le routine salvate o usa un oggetto vuoto se non esiste nulla.
    workoutRoutines: JSON.parse(localStorage.getItem('workoutRoutines')) || {},
};

// --- FUNZIONI DI LOGICA (Manipolano solo lo Stato) ---

/** Salva lo stato delle routine nel localStorage. */
function saveRoutines() {
    localStorage.setItem('workoutRoutines', JSON.stringify(state.workoutRoutines));
}

/** Sposta il calendario alla settimana precedente. */
function goToPrevWeek() {
    state.currentWeekOffset--;
    updateUI(); // Dopo ogni modifica di stato, aggiorniamo l'interfaccia.
}

/** Sposta il calendario alla settimana successiva. */
function goToNextWeek() {
    state.currentWeekOffset++;
    updateUI();
}

// --- FUNZIONI DI RENDER (Leggono lo Stato e aggiornano il DOM) ---

/** Mostra una vista specifica e nasconde le altre. */
function showView(viewId) {
    // Itera su tutte le viste nell'oggetto dom
    for (const id in dom.views) {
        // Aggiunge o rimuove la classe 'view--active'
        dom.views[id].classList.toggle('view--active', id === viewId);
    }
}

/** Disegna l'intero calendario a schermo. */
function renderCalendar() {
    const today = new Date();
    today.setDate(today.getDate() + state.currentWeekOffset * 7);
    
    // Imposta l'inizio della settimana a Lunedì
    const dayOfWeek = today.getDay(); // 0 (Dom) - 6 (Sab)
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // se Dom, vai a Lunedì scorso
    const startOfWeek = new Date(today.setDate(diff));

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    dom.calendar.weekDisplay.textContent = 
        `${startOfWeek.toLocaleDateString('it-IT', {day: 'numeric', month: 'long'})} - ${endOfWeek.toLocaleDateString('it-IT', {day: 'numeric', month: 'long'})}`;

    dom.calendar.daysContainer.innerHTML = ''; // Svuota il contenitore prima di ridisegnare.

    const dayNames = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);

        const dateString = date.toISOString().split('T')[0];
        const routinesForDay = state.workoutRoutines[dateString] || [];

        const dayCell = document.createElement('div');
        dayCell.className = 'day-cell';
        dayCell.innerHTML = `
            <div class="day-name">${dayNames[i]}</div>
            <div class="day-number">${date.getDate()}</div>
            <div class="workout-summary">${routinesForDay.length} esercizi</div>
            <button class="start-workout-btn" ${routinesForDay.length === 0 ? 'disabled' : ''}>INIZIA</button>
        `;
        dom.calendar.daysContainer.appendChild(dayCell);
    }
}

/** La funzione principale che ridisegna l'intera interfaccia. */
function updateUI() {
    renderCalendar();
    // In futuro, qui verranno chiamate anche le altre funzioni di render
    // come renderTrainer(), renderDebriefing(), etc.
}

// --- IMPOSTAZIONE EVENTI E INIZIALIZZAZIONE ---

/** Imposta tutti gli event listener dell'applicazione. */
function setupEventListeners() {
    dom.calendar.prevWeekBtn.addEventListener('click', goToPrevWeek);
    dom.calendar.nextWeekBtn.addEventListener('click', goToNextWeek);
}

/** Funzione di avvio dell'applicazione. */
function main() {
    setupEventListeners();
    showView('calendar'); // Mostra la vista iniziale
    updateUI(); // Disegna l'interfaccia per la prima volta
}

// Avvia l'applicazione. Non serve più DOMContentLoaded.
main();