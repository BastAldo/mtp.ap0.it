# Specifiche Funzionali

## 1. Obiettivo dell'Applicazione

Creare un'applicazione web per la gestione di sessioni di allenamento personalizzate. L'utente può selezionare una serie di esercizi e avviare un trainer che lo guida attraverso set, tempi di lavoro e tempi di riposo.

## 2. Concetti Chiave

### Tipi di Esercizi

L'applicazione deve supportare due tipi di esercizi:

1.  **A Tempo (`type: 'time'`)**:
    - L'utente esegue l'esercizio per una durata predefinita (`defaultDuration`).
    - Il trainer mostra un timer con un conto alla rovescia.
    - Al termine del tempo, il trainer passa automaticamente al riposo o al set successivo.

2.  **A Ripetizioni (`type: 'reps'`)**:
    - L'utente esegue un numero predefinito di ripetizioni (`defaultReps`).
    - Il trainer mostra il numero di ripetizioni da completare. Non c'è un timer durante il set.
    - L'utente deve segnalare manualmente il completamento del set cliccando su un apposito pulsante ("Set Completato").
    - Una volta premuto il pulsante, parte il timer per il riposo (`defaultRest`).

## 3. Mockup ASCII delle Viste

### Vista 1: Configurazione

L'utente seleziona gli esercizi per la sessione.

```
+-----------------------------------------+
|         Workout Configurator            |
+-----------------------------------------+
|                                         |
|  [x] Push-up                            |
|  [ ] Squat a Corpo Libero               |
|  [x] Plank                              |
|  [x] Calf Raises (1 Gamba)              |
|                                         |
|                                         |
+-----------------------------------------+
|         [ Start Training ]              |
+-----------------------------------------+
```

### Vista 2: Trainer (Esercizio a Tempo)

Durante un esercizio misurato in secondi.

```
+-----------------------------------------+
|  Plank                        Series 1/3|
+-----------------------------------------+
|                                         |
|                   47                    |
|                  Work!                  |
|                                         |
+-----------------------------------------+
|              [ Pause ]                  |
+-----------------------------------------+
```

### Vista 3: Trainer (Esercizio a Ripetizioni)

Durante un esercizio misurato in ripetizioni. Notare il pulsante diverso.

```
+-----------------------------------------+
|  Squat a Corpo Libero         Series 1/3|
+-----------------------------------------+
|                                         |
|                15 Reps                  |
|                  Work!                  |
|                                         |
+-----------------------------------------+
|         [ Set Completato ]              |
+-----------------------------------------+
```

### Vista 4: Trainer (Fase di Riposo)

Durante il timer di riposo, tra un set e l'altro.

```
+-----------------------------------------+
|  Squat a Corpo Libero         Series 2/3|
+-----------------------------------------+
|                                         |
|                   51                    |
|                   Rest                  |
|                                         |
+-----------------------------------------+
|              [ Pause ]                  |
+-----------------------------------------+
```
