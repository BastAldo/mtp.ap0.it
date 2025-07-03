# Application Architecture

This document outlines the high-level architecture for the "Mio Trainer Personale" SPA.

## 1. Core Principles
-   **Modularity:** The application is broken down into distinct, single-responsibility modules.
-   **State-Driven UI:** The user interface is a function of the application's state.

## 2. State Management: Centralized Store
The application uses a centralized state store (`src/modules/store.js`) as the Single Source of Truth (SSoT).
-   **State:** A single, read-only JavaScript object.
-   **Actions:** State is modified by dispatching predefined "actions".
-   **Subscriptions:** UI modules subscribe to the store to re-render on state changes.

## 3. Core Architectural Pattern: Pre-compiled Execution Plan
To ensure robustness and eliminate complex runtime logic, the Trainer view operates on a "pre-compiled plan" architecture.
-   **Status**: Accepted & Implemented
-   **Context**: Dynamic state machines for workouts are prone to bugs.
-   **Decision**: Before a workout starts, `planGenerator.js` creates a complete, sequential array of "step objects". Each step object contains all necessary data for its execution and rendering (`type`, `duration`, `headerTitle`, `mainText`, etc.).
-   **Execution**: The `store.js` module acts as a simple "runner". During the workout, it just increments an index (`currentStepIndex`) to move to the next step in the pre-compiled array. All complex logic is handled upfront by the generator, not at runtime.
-   **Benefits**: This approach makes the runtime logic extremely simple, predictable, and easy to debug. The entire workout flow can be inspected before it even starts.

## 4. Directory Structure
-   `docs/`: Project documentation.
-   `src/`: Application source code.
    -   `modules/`: Core logic (store, plan generator, etc.).
    -   `views/`: UI rendering and event handling for major components.
    -   `data/`: Static data sources (e.g., exercise library).

## 5. Data Persistence
All workout data is persisted in `localStorage` via the `storage.js` module.
