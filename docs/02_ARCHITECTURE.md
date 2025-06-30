# Architecture Decision Records (ADR)

Questo documento è il nostro "diario tecnico". Registra le decisioni architetturali importanti prese durante lo sviluppo del progetto.

## Cos'è un ADR?

Un ADR è un breve documento di testo che descrive una scelta architetturale. Ogni ADR ha un formato standard per spiegare il contesto della decisione, la decisione stessa e le sue conseguenze.

Lo scopo è avere una cronologia chiara del *perché* il software è costruito in un certo modo. Questo aiuta i futuri sviluppatori (o future istanze dell'AI) a comprendere le scelte passate.

Un ADR, una volta scritto, è immutabile. Se una decisione cambia, non si modifica il vecchio ADR, ma se ne scrive uno nuovo che "supera" quello precedente.

## Formato ADR

* **Titolo**: Un breve riassunto della decisione.
* **Contesto**: Il problema o la situazione che richiede una decisione.
* **Decisione**: La scelta tecnica che è stata fatta.
* **Conseguenze**: I risultati (positivi e negativi) di questa decisione.

---

### ADR-001: Adozione di una Struttura di Documentazione Formale

* **Contesto**: Il progetto stava evolvendo rapidamente, con nuove richieste funzionali (es. esercizi a reps) e di design che non erano catturate in modo strutturato. I file di specifiche iniziali erano diventati insufficienti. C'era il rischio di disallineamento e di dover "reinventare la ruota".
* **Decisione**: Abbiamo deciso di creare una cartella `/docs` per contenere la documentazione ufficiale del progetto, suddivisa in tre file principali: `01_FUNCTIONALITY.md` (per specifiche e mockup), `02_ARCHITECTURE.md` (per gli ADR), e `03_STYLE_GUIDE.md` (per le regole di design).
* **Conseguenze**:
    * **Positivo**: Abbiamo ora una singola fonte di verità per il progetto, migliorando la chiarezza e l'allineamento.
    * **Positivo**: Sarà più facile per chiunque (umano o AI) comprendere lo stato e la storia del progetto.
    * **Negativo/Sforzo**: Richiede uno sforzo disciplinato per mantenere la documentazione aggiornata man mano che il progetto evolve.
