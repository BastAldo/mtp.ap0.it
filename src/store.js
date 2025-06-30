/**
 * @file store.js
 *
 * Gestisce la persistenza dei dati dell'applicazione su localStorage.
 * È l'unico modulo autorizzato a interagire con lo storage del browser.
 */

const SCHEDULE_STORAGE_KEY = 'mtp.schedule';

/**
 * Recupera il programma degli allenamenti da localStorage.
 * @returns {object} L'oggetto del programma, o un oggetto vuoto se non esiste.
 */
export function getSchedule() {
    try {
        const rawData = localStorage.getItem(SCHEDULE_STORAGE_KEY);
        return rawData ? JSON.parse(rawData) : {};
    } catch (error) {
        console.error("Failed to read schedule from localStorage", error);
        return {};
    }
}

/**
 * Salva il programma degli allenamenti in localStorage.
 * @param {object} schedule L'oggetto del programma da salvare.
 */
export function saveSchedule(schedule) {
    try {
        const data = JSON.stringify(schedule);
        localStorage.setItem(SCHEDULE_STORAGE_KEY, data);
    } catch (error) {
        console.error("Failed to save schedule to localStorage", error);
    }
}

/**
 * Aggiunge un ID esercizio a una data specifica nel programma.
 * @param {string} dateKey La data in formato YYYY-MM-DD.
 * @param {string} exerciseId L'ID dell'esercizio da aggiungere.
 */
export function addExerciseToDate(dateKey, exerciseId) {
    const schedule = getSchedule();
    if (!schedule[dateKey]) {
        schedule[dateKey] = [];
    }
    // Evita duplicati
    if (!schedule[dateKey].includes(exerciseId)) {
        schedule[dateKey].push(exerciseId);
    }
    saveSchedule(schedule);
}

/**
 * Rimuove un ID esercizio da una data specifica nel programma.
 * @param {string} dateKey La data in formato YYYY-MM-DD.
 * @param {string} exerciseId L'ID dell'esercizio da rimuovere.
 */
export function removeExerciseFromDate(dateKey, exerciseId) {
    const schedule = getSchedule();
    if (schedule[dateKey]) {
        schedule[dateKey] = schedule[dateKey].filter(id => id !== exerciseId);
        // Se l'array diventa vuoto, rimuovi la chiave della data
        if (schedule[dateKey].length === 0) {
            delete schedule[dateKey];
        }
    }
    saveSchedule(schedule);
}
