# Guida al Workflow e allo Script `patcher.py`

Questa guida descrive il corretto utilizzo dello script `patcher.py`, lo strumento standard per applicare modifiche al progetto in modo controllato e documentato.

## Principio di Funzionamento

Lo script `patcher.py` è progettato per essere semplice e robusto. Il suo unico compito è leggere un file `patch.yaml` e **sovrascrivere completamente** i file specificati con il nuovo contenuto fornito.

**Importante**: Lo script non esegue operazioni complesse come l'inserimento di righe o la sostituzione parziale di blocchi di testo. L'intera logica di modifica risiede nella preparazione del nuovo contenuto completo del file.

## Struttura del `patch.yaml`

Il file `patch.yaml` deve avere la seguente struttura:

```yaml
commit_message: "Un messaggio di commit chiaro e conciso"
rationale: |
  Una giustificazione dettagliata delle modifiche, che spiega
  il perché e il come dell'intervento.
patches:
  - file: "percorso/al/primo/file.md"
    content: |
      TUTTO il nuovo contenuto
      del primo file va qui.
      Questo sovrascriverà completamente il file esistente.
  - file: "src/nuovo_modulo.rs"
    content: |
      Contenuto completo di un file
      che deve essere creato.
```

### Sezione `patches`
- È una lista di oggetti.
- Ogni oggetto deve contenere due chiavi: `file` e `content`.
- `file`: Il percorso relativo del file da creare o sovrascrivere.
- `content`: L'intero contenuto che il file dovrà avere dopo l'applicazione della patch.

### Cosa NON Fare: Esempio di Errore Comune

La seguente sintassi **NON è valida** e verrà ignorata dallo script, portando a risultati inattesi:

```yaml
# ESEMPIO SCORRETTO - NON USARE QUESTO FORMATO
patches:
  - file: "src/main.rs"
    actions: # La chiave "actions" non esiste
      - type: "ADD_AFTER"
        line: 25
        content: "Questo non funzionerà"
```
