# Application Architecture

This document outlines the high-level architecture for the "Mio Trainer Personale" SPA.

## 1. Core Principles

-   **Modularity:** The application is broken down into distinct, single-responsibility modules.
-   **State-Driven UI:** The user interface reacts to changes in the application's state.

## 2. Directory Structure

-   `docs/`: Contains all project documentation.
-   `index.html`: The single HTML entry point.
-   `src/`: Contains all application source code.
    -   `src/modules/`: Contains core logic modules (store, repository, etc.).
    -   `src/views/`: Contains UI rendering logic for major components.
    -   `src/data/`: Contains static data sources.

## 3. View Management

The application uses a simple view manager controlled by `main.js`. Only one view is active (`.view--active`) at any given time. This is driven by the state in the central store.

## 4. Data Persistence

All user data is persisted in `localStorage`. The `storage.js` module provides a clean API for this.

### 4.1. Data Schemas and Validation
To ensure data integrity, all data read from `localStorage` MUST be validated against a defined schema before being used by the application. This prevents errors from corrupted or outdated data structures.

- **Daily Workout Schema:** An array of "workout item" objects.
  - `item`: `{ id: string, type: 'exercise' | 'rest', ...rest }`
- **Exercise Schema:** An object defining an exercise's properties.
  - `exercise`: `{ id: string, name: string, tempo: object, ...rest }`

## 5. State Management

The application MUST use a centralized state store (`src/modules/store.js`) as the Single Source of Truth (SSoT) for all application state.
-   **State:** A single, read-only JavaScript object containing all shared application data.
-   **Actions:** State can only be modified by dispatching predefined, synchronous "actions".
-   **Subscriptions:** UI modules can "subscribe" to the store. When the state is updated, subscribers are notified to re-render.
-   **Trainer State Model**: The trainer's state is managed via a pre-compiled execution plan. The `trainerContext` holds `executionPlan` (an array of step objects) and `currentStepIndex`.

## 6. Architectural Decision Records (ADRs)

### ADR 001: No Native Pop-ups
-   **Status**: Accepted
-   **Decision**: All forms of pop-up dialogs MUST be implemented as "pop-ins" or modals rendered within the application's own DOM.

### ADR 002: Exercise Repository Pattern
-   **Status**: Accepted
-   **Context**: The application needs a way to list available exercises for the user to add to a workout.
-   **Decision**: We will introduce an "Exercise Repository" module. This module will abstract the source of exercise data.
-   **Consequences**: The UI is decoupled from the data source, increasing maintainability.

### ADR 003: Architettura a Piano di Esecuzione Pre-compilato per il Trainer
-   **Status**: Accettato
-   **Contesto**: I precedenti tentativi di creare una macchina a stati dinamica per il trainer si sono rivelati fragili, complessi e difficili da mantenere, portando a loop e bug logici.
-   **Decisione**: Si adotta un'architettura a "piano pre-compilato". Prima dell'inizio di un workout, una funzione "generatrice" (`planGenerator.js`) "srotola" l'intero allenamento (con serie, ripetizioni, fasi di tempo e riposi) in un unico array sequenziale di "oggetti-passo". Ogni oggetto contiene tutte le informazioni necessarie sia per la logica (tipo, durata) sia per la visualizzazione (testi formattati). Lo store, durante l'esecuzione, si limita a incrementare un indice (`currentStepIndex`) per puntare al passo successivo in questo array.
-   **Conseguenze**:
    -   **Semplicità Massima a Runtime**: La logica di avanzamento diventa banale (`index++`), eliminando quasi del tutto la possibilità di bug durante l'esecuzione.
    -   **Complessità Isolata**: Tutta la logica complessa è confinata nella funzione generatrice, che è pura, più facile da ragionare e testare in modo isolato.
    -   **Robustezza e Debuggability**: L'intero flusso del workout può essere ispezionato e validato prima ancora che l'allenamento inizi, rendendo il debug estremamente più semplice.
