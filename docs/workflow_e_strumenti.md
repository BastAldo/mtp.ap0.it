# Guida al Workflow e allo script patcher.py

## Funzionamento di `patcher.py`
Lo script `patcher.py` è il nostro meccanismo per applicare modifiche. Legge un file `patch.yaml` e opera in due fasi.

### 1. Sezione `patches`
Questa è una lista di oggetti, ciascuno con una chiave `file` e una `content`. Per ogni oggetto:
- Lo script apre il file specificato in modalità scrittura (`'w'`).
- **Questo SOVRASCRIVE completamente il contenuto del file esistente o CREA il file se non esiste.** Non ci sono azioni complesse come `ADD` o `REPLACE` parziali.

### 2. Sezione `commands`
Questa è una lista di stringhe. Lo script **NON esegue** questi comandi. Li **mostra** all'utente come istruzioni da eseguire manualmente dopo l'applicazione del patch. È il metodo corretto per operazioni come l'eliminazione di file.

#### Esempio Corretto:
```yaml
patches:
  - file: "README.md"
    content: "Nuovo contenuto del README."
commands:
  - "echo 'Per completare, eliminare i file temporanei:'"
  - "rm -f *.tmp"
```
