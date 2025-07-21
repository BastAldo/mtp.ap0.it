# Contratto API: ExecutionPlan

Il `ExecutionPlan` è il contratto dati fondamentale tra backend e frontend. È una **lista di "frame"** che il backend pre-compila e il frontend esegue.

## Struttura del Frame
Ogni frame nell'array `ExecutionPlan` è un oggetto con la seguente struttura essenziale:

```typescript
interface Frame {
  type: "ANNOUNCE" | "ACTION" | "REST" | "INFO";
  label: string; // Testo principale da visualizzare (es: "SU", "RIPOSO")
  durationSeconds: number; // Durata di visualizzazione del frame
  metadata?: { // Dati contestuali opzionali per la UI
    exerciseName?: string;
    seriesTotal?: number;
    seriesCurrent?: number;
    repsTotal?: number;
    repsCurrent?: number;
  }
}
```

## Esempio Pratico: 1 Serie di Squat
Questo esempio mostra come uno squat (2 ripetizioni) con fasi `up`(2s), `hold`(1s) e `down`(3s) viene scomposto dal "Regista" (backend) in una lista di frame per il "Player" (frontend).

```json
[
  { "type": "INFO", "label": "SQUAT - SERIE 1/2", "durationSeconds": 3, "metadata": {"seriesCurrent": 1, "seriesTotal": 2} },

  { "type": "ANNOUNCE", "label": "SU", "durationSeconds": 0.7, "metadata": {"repsCurrent": 1, "repsTotal": 2} },
  { "type": "ACTION", "label": "SU", "durationSeconds": 2, "metadata": {"repsCurrent": 1, "repsTotal": 2} },
  { "type": "ANNOUNCE", "label": "TENUTA", "durationSeconds": 0.7, "metadata": {"repsCurrent": 1, "repsTotal": 2} },
  { "type": "ACTION", "label": "TENUTA", "durationSeconds": 1, "metadata": {"repsCurrent": 1, "repsTotal": 2} },
  { "type": "ANNOUNCE", "label": "GIÙ", "durationSeconds": 0.7, "metadata": {"repsCurrent": 1, "repsTotal": 2} },
  { "type": "ACTION", "label": "GIÙ", "durationSeconds": 3, "metadata": {"repsCurrent": 1, "repsTotal": 2} },

  { "type": "ANNOUNCE", "label": "SU", "durationSeconds": 0.7, "metadata": {"repsCurrent": 2, "repsTotal": 2} },
  { "type": "ACTION", "label": "SU", "durationSeconds": 2, "metadata": {"repsCurrent": 2, "repsTotal": 2} },
  { "type": "ANNOUNCE", "label": "TENUTA", "durationSeconds": 0.7, "metadata": {"repsCurrent": 2, "repsTotal": 2} },
  { "type": "ACTION", "label": "TENUTA", "durationSeconds": 1, "metadata": {"repsCurrent": 2, "repsTotal": 2} },
  { "type": "ANNOUNCE", "label": "GIÙ", "durationSeconds": 0.7, "metadata": {"repsCurrent": 2, "repsTotal": 2} },
  { "type": "ACTION", "label": "GIÙ", "durationSeconds": 3, "metadata": {"repsCurrent": 2, "repsTotal": 2} },

  { "type": "REST", "label": "RIPOSO", "durationSeconds": 90 },

  { "type": "INFO", "label": "PROSSIMO ESERCIZIO...", "durationSeconds": 3 }
]
```