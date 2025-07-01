# Stato Attuale del Progetto
*Ultimo aggiornamento: 2025-07-01*

## Focus Corrente: Risoluzione Bug Critico nel Trainer

### Problema Attuale
È stato identificato un **bug critico** nel flusso di stati del Trainer. La logica di avanzamento, specialmente dopo i periodi di riposo, causa un loop e una progressione errata delle serie/ripetizioni.

La causa principale è una scorretta distribuzione delle responsabilità tra `TrainerView.js` (la View) e `store.js` (lo Store), che porta a chiamate di azioni multiple e a race condition. Il sistema è attualmente **instabile**.

### Prossimo Step Obbligatorio: Refactoring Architetturale
Per ripristinare la stabilità, è necessario un refactoring che centralizzi tutta la logica di avanzamento del trainer. Il piano d'azione è il seguente:

1.  **Semplificare la View (`TrainerView.js`)**:
    * La View deve diventare un componente "stupido" che si limita a renderizzare lo stato.
    * Al termine di ogni timer (`preparing`, `announcing`, `action`, `rest`), la View deve dispatchare una **singola e unica azione**: `TIMER_COMPLETE`.

2.  **Centralizzare la Logica (`store.js`)**:
    * Creare un nuovo gestore per l'azione `TIMER_COMPLETE`.
    * Questo gestore diventerà il "cervello" del trainer e conterrà **tutta la logica decisionale** per determinare lo stato successivo in base allo stato corrente.

3.  **Verificare il Logger**:
    * Assicurarsi che il logger schematico implementato funzioni correttamente con la nuova logica centralizzata.

Questo intervento è prioritario e blocca ogni altro sviluppo sulla funzionalità del trainer.
