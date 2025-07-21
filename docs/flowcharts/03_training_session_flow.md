# Livello 2: Flusso di Esecuzione dell'Allenamento (Player)

Questo diagramma dettaglia le operazioni all'interno del Player durante una sessione di allenamento attiva.

```mermaid
graph TD
    A[Start: Utente clicca 'Avvia Allenamento'] --> B[Richiesta ExecutionPlan al Backend];
    
    subgraph Player Loop
        B --> C[Carica ExecutionPlan e Inizializza Indice a 0];
        C --> D{Leggi Frame[Indice]};
        D --> E{Render UI in base a 'frame.type'<br>Mostra 'frame.label' e 'metadata'};
        E --> F[Avvia Timer con 'frame.durationSeconds'];
        F --> G{Timer Finito?};
        G -- No --> F;
        G -- Sì --> H{Incrementa Indice};
        H --> I{Fine della lista?};
        I -- No --> D;
    end
    
    I -- Sì --> J[Transizione a Vista Riepilogo];
```