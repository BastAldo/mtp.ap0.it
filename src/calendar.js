/**
 * @file calendar.js
 * Manages the state, rendering, and interactions of the calendar view.
 */
import * as storage from './storage.js';

// DOM Elements
const calendarGrid = document.getElementById('calendar-grid');
const currentMonthYear = document.getElementById('current-month-year');
const prevWeekBtn = document.getElementById('prev-week-btn');
const nextWeekBtn = document.getElementById('next-week-btn');

// State
let currentDate = new Date();

/**
 * Formats a Date object into a 'YYYY-MM-DD' string.
 * @param {Date} date The date to format.
 * @returns {string} The formatted date string.
 */
function formatDateKey(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Renders the calendar for the week of the given date.
 * @param {Date} date A date within the week to be rendered.
 */
function renderCalendar(date) {
  calendarGrid.innerHTML = '';
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay()); // Start of the week (Sunday)

  const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
  currentMonthYear.textContent = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);

    const dayCell = document.createElement('div');
    dayCell.className = 'day-cell';
    const dateKey = formatDateKey(day);
    dayCell.dataset.date = dateKey;

    const dayName = day.toLocaleDateString('it-IT', { weekday: 'long' });
    const dayNumber = day.getDate();

    const exercises = storage.getWorkoutsForDate(dateKey);
    const exerciseCount = exercises.length;

    let summaryText = 'Nessun esercizio';
    if (exerciseCount > 0) {
      summaryText = `${exerciseCount} ${exerciseCount > 1 ? 'esercizi' : 'esercizio'}`;
    }

    dayCell.innerHTML = `
      <div class="day-name">${dayName}</div>
      <div class="day-number">${dayNumber}</div>
      <div class="day-summary">${summaryText}</div>
      <button class="btn btn-secondary start-workout-btn" ${exerciseCount === 0 ? 'disabled' : ''}>START</button>
    `;

    calendarGrid.appendChild(dayCell);
  }
}

/**
 * Initializes the calendar, sets up event listeners, and performs the initial render.
 */
export function initCalendar() {
  prevWeekBtn.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() - 7);
    renderCalendar(currentDate);
  });

  nextWeekBtn.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() + 7);
    renderCalendar(currentDate);
  });

  renderCalendar(currentDate);
  console.log('Calendar module initialized.');
}
