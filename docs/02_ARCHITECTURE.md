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

### 4.2. Workout Item Structure
The data structure for a daily workout is an array of "workout items". Each item is an object with a `type` key:
-   `{ type: 'exercise', id: 'squat', ... }`
-   `{ type: 'rest', duration: 60, ... }`

## 5. State Management

The application MUST use a centralized state store (`src/modules/store.js`) as the Single Source of Truth (SSoT) for all application state.
-   **State:** A single, read-only JavaScript object containing all shared application data.
-   **Actions:** State can only be modified by dispatching predefined, synchronous "actions".
-   **Subscriptions:** UI modules can "subscribe" to the store. When the state is updated, subscribers are notified to re-render.

## 6. Architectural Decision Records (ADRs)

### ADR 001: No Native Pop-ups
-   **Status**: Accepted
-   **Decision**: All forms of pop-up dialogs MUST be implemented as "pop-ins" or modals rendered within the application's own DOM.

### ADR 002: Exercise Repository Pattern
-   **Status**: Accepted
-   **Context**: The application needs a way to list available exercises for the user to add to a workout.
-   **Decision**: We will introduce an "Exercise Repository" module. This module will abstract the source of exercise data.
-   **Consequences**: The UI is decoupled from the data source, increasing maintainability.

### ADR 003: Centralizzazione della Logica di Flusso del Trainer
-   **Status**: Proposto
-   **Contesto**: Durante lo sviluppo, la logica di transizione di stato del trainer è stata distribuita in modo non ottimale tra la view (`TrainerView.js`) e lo store (`store.js`). Questo ha portato a bug critici, loop e race condition, rendendo il sistema instabile e difficile da debuggare.
-   **Decisione**: Si decide di refattorizzare il sistema per centralizzare il 100% della logica di flusso del trainer all'interno dello store. La view diventerà "stupida", limitandosi a renderizzare lo stato e a inviare un'unica azione generica (`TIMER_COMPLETE`) allo store al termine di ogni timer. Lo store, ricevendo questa azione, sarà l'unico responsabile di calcolare e impostare lo stato successivo.
-   **Conseguenze**: Aumento della stabilità e della prevedibilità. Aderenza stretta al principio del Single Source of Truth. Semplificazione del debugging e della manutenibilità futura.
