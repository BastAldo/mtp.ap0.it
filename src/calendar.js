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

// State
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
  const weekStart = new Date(date);
  // Set to Monday of the current week
  const dayOfWeek = date.getDay(); // Sunday = 0, Monday = 1
  const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  weekStart.setDate(diff);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  currentWeekRange.textContent = formatWeekRange(weekStart, weekEnd);

  calendarGrid.innerHTML = '';
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);

    const dayCell = document.createElement('div');
    const dateKey = formatDateKey(day);
    dayCell.className = 'day-cell';
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
      <button class="btn btn-secondary start-workout-btn" data-date="${dateKey}" ${exerciseCount === 0 ? 'disabled' : ''}>START</button>
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
        startTrainer(exercises);
      }
    } else {
      openDayModal(dateKey);
    }
  });

  renderCalendar(currentDate);
}
