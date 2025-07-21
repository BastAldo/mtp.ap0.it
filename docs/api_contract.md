# Contratto API: ExecutionPlan

Il `ExecutionPlan` è il contratto dati fondamentale tra backend e frontend. È una **lista di "frame"** che il backend pre-compila e il frontend esegue.

## Struttura del Frame
Ogni frame nell'array `ExecutionPlan` è un oggetto che descrive un singolo, atomico passo dell'allenamento.

### Descrizione dei Tipi di Frame (`type`)

- **`INFO`**: Un frame puramente informativo e contestuale. Dura tipicamente alcuni secondi (es. 3s) e viene usato per comunicazioni come "SQUAT - SERIE 1/2" o "PROSSIMO ESERCIZIO...". Non ha un impatto diretto sull'azione imminente.

- **`ANNOUNCE`**: **Un "primer" neurologico**. Questo è un frame visivo brevissimo (es. 0.7s) il cui unico scopo è preparare il cervello dell'utente al movimento *immediatamente successivo*. Mostra la stessa etichetta del frame `ACTION` che lo segue (es. "SU", "GIÙ", "TENUTA") per ridurre il carico cognitivo e il tempo di reazione. **Non è una notifica generica**.

- **`ACTION`**: L'esecuzione di una fase specifica di un movimento. Ha una durata definita e una `label` che descrive l'azione (es. "SU", "GIÙ").

- **`REST`**: Un periodo di riposo tra serie o esercizi.

### Struttura Oggetto Frame

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