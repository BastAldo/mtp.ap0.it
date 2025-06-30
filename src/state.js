/**
 * @file state.js
 *
 * Contiene lo stato volatile dell'applicazione.
 * Questo oggetto rappresenta la "singola fonte di verità" per i dati dinamici.
 */

export const state = {
    /**
     * La data usata come riferimento per la visualizzazione corrente.
     * Per il calendario, definisce la settimana da mostrare.
     * @type {Date}
     */
    currentDate: new Date(),

    /**
     * La chiave della data (YYYY-MM-DD) attualmente selezionata per la modifica.
     * @type {string | null}
     */
    selectedDateKey: null,
};
