# Livello 1: Flusso Funzionale Generale

Questo diagramma illustra una mappa completa ma generica di tutte le funzionalità principali dell'applicazione e dei percorsi che l'utente può intraprendere.

```mermaid
graph TD
    A[Avvio App] --> B(Vista Calendario);

    subgraph Flusso di Gestione
        B --> |Clicca su giorno vuoto o Modifica| C(Editor Allenamento);
        C --> |Salva modifiche| B;
    end

    subgraph Flusso di Esecuzione
        B --> |Clicca Avvia Allenamento| D(Player);
        D --> |Fine Allenamento| E(Riepilogo);
        E --> |Chiudi| B;
    end
```