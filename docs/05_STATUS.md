# Stato Attuale del Progetto
*Ultimo aggiornamento: 2025-07-03*

## Stato: Approvata Riprogettazione Architetturale Definitiva

### Contesto
Dopo un'analisi approfondita dei fallimenti della precedente macchina a stati del trainer, è emerso che qualsiasi approccio basato su calcoli dinamici a tempo di esecuzione introduceva una complessità eccessiva e difficile da governare.

### Strategia Adottata: Architettura a "Piano Pre-compilato"
È stato deciso di abbandonare l'approccio "interprete" in favore di un approccio "compilatore", considerato architetturalmente superiore e più robusto.

La strategia consiste in:
1.  **Generazione Upfront**: Prima che il workout inizi, una funzione dedicata (`planGenerator`) "compilerà" l'intera sequenza di esercizi, serie, ripetizioni, fasi `tempo` e riposi in un **singolo array sequenziale** di "oggetti-passo".
2.  **Oggetti-Passo Ricchi**: Ogni oggetto nell'array conterrà tutte le informazioni necessarie sia per la logica (es. `type`, `duration`) sia per la visualizzazione (es. `headerTitle`, `mainText`), rendendo i componenti della UI estremamente semplici.
3.  **Esecutore "Stupido"**: Lo store, durante l'allenamento, si limiterà a incrementare un indice per muoversi lungo l'array pre-compilato. Tutta la complessità logica a runtime viene eliminata.

### Stato Attuale
La documentazione è stata allineata a questa nuova architettura. Il progetto è **pronto per l'implementazione** di questo refactoring definitivo.
