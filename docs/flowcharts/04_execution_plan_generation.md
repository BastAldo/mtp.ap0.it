# Livello 3: Flusso di Generazione dell'ExecutionPlan (Regista)

Questo diagramma descrive l'algoritmo di alto livello che il "Regista" (backend) usa per trasformare la definizione di un allenamento in un `ExecutionPlan` sequenziale, pronto per essere eseguito dal "Player" (frontend).

```mermaid
graph TD
    subgraph Regista / planGenerator
        A(Start: Riceve Definizione Allenamento);
        B["Inizializza ExecutionPlan = []"];
        
        A --> B;
        B --> C{Loop: Per ogni 'item' nella Definizione};
        
        C --> D{item.type === 'EXERCISE' ?};
        
        D -- No (è un Riposo) --> F[Genera singolo Frame 'REST'];
        F --> G[Accoda Frame all'ExecutionPlan];
        
        D -- Sì --> E["Sub-Process: Genera Frame Esercizio(item)<br><i>(logica per serie, ripetizioni, fasi, etc.)</i>"];
        E --> H[Accoda i Frame restituiti<br>all'ExecutionPlan];
        
        G --> I{Ancora item?};
        H --> I;

        I -- Sì --> C;
        I -- No --> J(End: Restituisce ExecutionPlan);
    end
```