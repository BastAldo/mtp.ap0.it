// --- Modulo di Persistenza Dati per localStorage ---

/**
 * Carica i dati dal localStorage e li valida.
 * @param {string} key La chiave da cui caricare.
 * @returns {object | null} I dati validati o null se non validi/presenti.
 */
export function loadFromStorage(key) {
  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return null;
    }
    // Futuro: Aggiungere qui la validazione dello schema.
    return JSON.parse(serializedData);
  } catch (error) {
    console.error(`Errore nel caricare dati da localStorage per la chiave "${key}":`, error);
    return null;
  }
}

/**
 * Salva i dati nel localStorage.
 * @param {string} key La chiave con cui salvare.
 * @param {object} data I dati da salvare.
 */
export function saveToStorage(key, data) {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
  } catch (error) {
    console.error(`Errore nel salvare dati in localStorage per la chiave "${key}":`, error);
  }
}
