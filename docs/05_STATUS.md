# Stato Attuale del Progetto
*Ultimo aggiornamento: 2025-07-02*

## Stato Critico: Due Bug Bloccano il Trainer

### Problemi Attuali
Durante i test sono stati identificati **due bug critici** che rendono il Trainer instabile e inutilizzabile. Qualsiasi sviluppo è bloccato finché non verranno risolti.

1.  **Bug #1: Loop Infinito su Pausa/Riprendi**
    -   **Scenario**: Eseguendo la sequenza `Inizia` -> `Pausa` -> `Riprendi`.
    -   **Comportamento**: L'applicazione va in crash a causa di un errore `Maximum call stack size exceeded`.
    -   **Causa**: Esiste un loop ricorsivo nel file `src/views/TrainerView.js`, dove la funzione di rendering (`render`) e quella che gestisce i timer (`runStateBasedTimer`) si richiamano a vicenda all'infinito.

2.  **Bug #2: Il Modale "Termina" non Mette in Pausa**
    -   **Scenario**: Durante un allenamento attivo (es. `preparing` o `action`), si clicca sul pulsante "Termina".
    -   **Comportamento**: Appare correttamente il modale di conferma, ma il timer dell'esercizio continua a scorrere in background.
    -   **Causa**: L'azione che apre il modale non invia contestualmente l'azione per mettere in pausa lo stato del trainer.

### Prossimo Step Obbligatorio
Il prossimo, inderogabile passo è risolvere entrambi i bug sopra elencati. La soluzione richiederà una ristrutturazione mirata della logica di gestione degli eventi e dei timer all'interno di `TrainerView.js`.
