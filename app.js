import { WORKOUTS } from './workouts.js';

// --- ELEMENTI DEL DOM ---
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
};

// --- STATO DELL'APPLICAZIONE ---
const state = {
    currentWeekOffset: 0,
    workoutRoutines: JSON.parse(localStorage.getItem('workoutRoutines')) || {},
};

// --- FUNZIONI DI LOGICA ---

function saveRoutines() {
    localStorage.setItem('workoutRoutines', JSON.stringify(state.workoutRoutines));
}

function goToPrevWeek() {
    state.currentWeekOffset--;
    updateUI();
}

function goToNextWeek() {
    state.currentWeekOffset++;
    updateUI();
}

// --- FUNZIONI DI RENDER ---

function showView(viewId) {
    for (const id in dom.views) {
        dom.views[id].classList.toggle('view--active', id === viewId);
    }
}

function renderCalendar() {
    const today = new Date();
    today.setDate(today.getDate() + state.currentWeekOffset * 7);
    
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
    const startOfWeek = new Date(today.setDate(diff));

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    dom.calendar.weekDisplay.textContent = 
        `${startOfWeek.toLocaleDateString('it-IT', {day: 'numeric', month: 'long'})} - ${endOfWeek.toLocaleDateString('it-IT', {day: 'numeric', month: 'long'})}`;

    dom.calendar.daysContainer.innerHTML = '';

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

function updateUI() {
    renderCalendar();
}

// --- INIZIALIZZAZIONE ---

function setupEventListeners() {
    dom.calendar.prevWeekBtn.addEventListener('click', goToPrevWeek);
    dom.calendar.nextWeekBtn.addEventListener('click', goToNextWeek);
}

function main() {
    setupEventListeners();
    showView('calendar');
    updateUI();
}

main();