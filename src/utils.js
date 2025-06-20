/**
 * @file utils.js
 * ---
 * Contains utility functions used across the application.
 * These are pure functions that don't depend on the application's state.
 */

/**
 * Generates an array of 7 Date objects for the week based on an offset from the current week.
 * @param {number} weekOffset - 0 for the current week, -1 for last week, 1 for next week, etc.
 * @returns {Array<Date>} An array of 7 Date objects, starting from Monday.
 */
export function getWeek(weekOffset = 0) {
  const today = new Date();
  const dayOfWeek = today.getDay(); // Sunday is 0, Monday is 1
  const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Calculate offset to get to Monday
  const mondayOfThisWeek = new Date(today.setDate(today.getDate() + offsetToMonday));

  const targetMonday = new Date(
    mondayOfThisWeek.setDate(mondayOfThisWeek.getDate() + weekOffset * 7)
  );

  const week = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(targetMonday);
    day.setDate(day.getDate() + i);
    week.push(day);
  }
  return week;
}

/**
 * Gets the Italian name of the day for a given Date object.
 * @param {Date} date - The date.
 * @returns {string} The full name of the day in Italian (e.g., "Lunedì").
 */
export function getDayName(date) {
  return date.toLocaleDateString('it-IT', { weekday: 'long' });
}

/**
 * Formats a Date object into a string.
 * @param {Date} date - The date to format.
 * @param {object} [options] - Optional formatting options for toLocaleDateString.
 * @returns {string} The formatted date string, defaulting to 'YYYY-MM-DD'.
 */
export function getFormattedDate(date, options) {
  if (options) {
    return date.toLocaleDateString('it-IT', options);
  }
  // ISO 8601 format (YYYY-MM-DD), but adjusted for local timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


/**
 * Web Audio API for sound feedback.
 */
let audioCtx;
function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

/**
 * Plays a short, high-frequency tick sound.
 */
export function playTick() {
    try {
        const context = getAudioContext();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, context.currentTime); // A5 note
        gainNode.gain.setValueAtTime(0.1, context.currentTime);

        oscillator.start(context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.1);
        oscillator.stop(context.currentTime + 0.1);
    } catch (e) {
        console.warn("Web Audio API is not supported in this browser or context.", e);
    }
}
