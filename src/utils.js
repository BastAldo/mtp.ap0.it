/**
 * @file utils.js
 *
 * Contiene funzioni di utilità pure e riutilizzabili.
 */

let audioCtx;
/**
 * Riproduce un breve suono di "tick" usando la Web Audio API.
 * Utile per dare feedback ritmico durante i countdown.
 */
export function playTick() {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser");
            return;
        }
    }
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Frequenza (A5)
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // Volume
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.05);
}

/**
 * Data una data, restituisce la data del lunedì della stessa settimana.
 * @param {Date} date La data di riferimento.
 * @returns {Date} La data del lunedì.
 */
export function getWeekStartDate(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0 (Dom) - 6 (Sab)
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // ajsut for Sunday
    return new Date(d.setDate(diff));
}

/**
 * Formatta un oggetto Date nel formato<x_bin_534>-MM-DD.
 * @param {Date} date La data da formattare.
 * @returns {string} La data formattata.
 */
export function formatDate(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

/**
 * Formatta un oggetto Date per la visualizzazione (es. "30 GIU").
 * @param {Date} date La data da formattare.
 * @returns {string} La data formattata per la UI.
 */
export function formatDateForDisplay(date) {
    const day = date.getDate();
    const month = date.toLocaleDateString('it-IT', { month: 'short' }).toUpperCase();
    return `${day} ${month}`;
}
