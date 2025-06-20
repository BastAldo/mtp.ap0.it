/**
 * @file calendar.js
 * Manages the state, rendering, and interactions of the calendar view.
 */
import * as storage from './storage.js';
import { openDayModal } from './modal.js';
import { startTrainer } from './trainer.js';

// DOM Elements
const calendarGrid = document.getElementById('calendar-grid');
const currentWeekRange = document.getElementById('current-week-range');
const prevWeekBtn = document.getElementById('prev-week-btn');
const nextWeekBtn = document.getElementById('next-week-btn');

let currentDate = new Date();

function formatDateKey(date) {
  return date.toISOString().split('T')[0];
}

function formatWeekRange(start, end) {
  const startDay = start.getDate();
  const startMonth = start.toLocaleDateString('it-IT', { month: 'long' });
  const endDay = end.getDate();
  const endMonth = end.toLocaleDateString('it-IT', { month: 'long' });
  const year = start.getFullYear();

  if (startMonth === endMonth) {
    return `${startDay} - ${endDay} ${startMonth} ${year}`;
  } else {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
  }
}

export function renderCalendar(date = currentDate) {
  const dateForWeek = new Date(date);
  const dayOfWeek = dateForWeek.getDay();
  const offsetToMonday = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;
  dateForWeek.setDate(dateForWeek.getDate() - offsetToMonday);
  
  const weekStart = new Date(dateForWeek);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  currentWeekRange.textContent = formatWeekRange(weekStart, weekEnd);
  const history = storage.getHistory();

  calendarGrid.innerHTML = '';
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    const dateKey = formatDateKey(day);

    const dayCell = document.createElement('div');
    dayCell.className = 'day-cell';
    dayCell.dataset.date = dateKey;

    const dayName = day.toLocaleDateString('it-IT', { weekday: 'long' });
    const dayNumber = day.getDate();

    const scheduledExercises = storage.getWorkoutsForDate(dateKey);
    const hasHistory = history[dateKey] && history[dateKey].length > 0;
    
    let summaryText = 'Nessun esercizio';
    if (scheduledExercises.length > 0) {
      summaryText = `${scheduledExercises.length} ${scheduledExercises.length > 1 ? 'esercizi' : 'esercizio'}`;
    }
    
    let historyIndicator = '';
    if(hasHistory) {
      summaryText = 'Completato';
      historyIndicator = `<div class="day-history-indicator">✓</div>`;
    }

    dayCell.innerHTML = `
      <div class="day-name">${dayName}</div>
      <div class="day-number">${dayNumber} ${historyIndicator}</div>
      <div class="day-summary">${summaryText}</div>
      <button class="btn btn-secondary start-workout-btn" data-date="${dateKey}" ${scheduledExercises.length === 0 ? 'disabled' : ''}>START</button>
    `;

    calendarGrid.appendChild(dayCell);
  }
}

export function initCalendar() {
  prevWeekBtn.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() - 7);
    renderCalendar(currentDate);
  });

  nextWeekBtn.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() + 7);
    renderCalendar(currentDate);
  });

  calendarGrid.addEventListener('click', (event) => {
    const target = event.target;
    const dayCell = target.closest('.day-cell');
    if (!dayCell) return;

    const dateKey = dayCell.dataset.date;
    if (target.matches('.start-workout-btn')) {
      const exercises = storage.getWorkoutsForDate(dateKey);
      if (exercises.length > 0) {
        startTrainer(exercises, dateKey);
      }
    } else {
      openDayModal(dateKey);
    }
  });

  renderCalendar(currentDate);
}
