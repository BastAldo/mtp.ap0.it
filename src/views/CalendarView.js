import store from '../modules/store.js';

// --- UTILITIES ---
function getWeekStartDate(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatShortDate(date) {
  return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
}

/**
 * Formatta una data in una stringa YYYY-MM-DD.
 * @param {Date} date
 * @returns {string}
 */
function toISODateString(date) {
    return date.getFullYear() + '-' +
           ('0' + (date.getMonth() + 1)).slice(-2) + '-' +
           ('0' + date.getDate()).slice(-2);
}

// --- MODULE ---
export function init(element) {
  element.innerHTML = `
    <header class="calendar-header">
      <button id="prev-week-btn">&lt; Prev</button>
      <h2 id="week-title"></h2>
      <button id="next-week-btn">Next &gt;</button>
    </header>
    <div class="calendar-grid" id="calendar-grid-container"></div>
  `;

  const prevBtn = element.querySelector('#prev-week-btn');
  const nextBtn = element.querySelector('#next-week-btn');
  const weekTitle = element.querySelector('#week-title');
  const gridContainer = element.querySelector('#calendar-grid-container');

  prevBtn.addEventListener('click', () => store.dispatch({ type: 'PREV_WEEK' }));
  nextBtn.addEventListener('click', () => store.dispatch({ type: 'NEXT_WEEK' }));

  function render() {
    const { focusedDate, workouts } = store.getState();
    const weekStart = getWeekStartDate(focusedDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    weekTitle.textContent = `${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`;
    gridContainer.innerHTML = '';

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(dayDate.getDate() + i);
      const dateKey = `workout-${toISODateString(dayDate)}`;
      const workoutForDay = workouts[dateKey];

      const dayCell = document.createElement('div');
      dayCell.className = 'day-cell';

      let bodyContent = '';
      if (workoutForDay && workoutForDay.length > 0) {
        const exerciseCount = workoutForDay.filter(item => item.type === 'exercise').length;
        bodyContent = `
          <div class="exercise-count">${exerciseCount} esercizi</div>
          <button class="start-btn">START</button>
        `;
      }

      dayCell.innerHTML = `
        <div class="day-cell__header">
          <span>${dayDate.toLocaleDateString('it-IT', { weekday: 'long' })}</span>
          <span>${dayDate.getDate()}</span>
        </div>
        <div class="day-cell__body">
          ${bodyContent}
        </div>
      `;
      gridContainer.appendChild(dayCell);
    }
  }
  store.subscribe(render);
  render();
}
