# Application Architecture

This document outlines the high-level architecture for the "Mio Trainer Personale" SPA.

## 1. Core Principles

-   **Modularity:** The application is broken down into distinct, single-responsibility modules.
-   **State-Driven UI:** The user interface reacts to changes in the application's state.

## 2. Directory Structure

-   `docs/`: Contains all project documentation.
-   `index.html`: The single HTML entry point.
-   `src/`: Contains all application source code.
    -   `src/modules/store.js`: The centralized application state store.
    -   ... and other modules.

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
-   **State:** A single, read-only JavaScript object containing all shared application data (e.g., `currentView`, `workouts`, `trainerState`).
-   **Actions:** State can only be modified by dispatching predefined, synchronous "actions" (functions within the store). These actions are the only place where state mutations can occur.
-   **Subscriptions:** UI modules can "subscribe" to the store. Whenever the state is updated via an action, all subscribers are notified so they can re-render themselves with the new data. This creates a predictable, one-way data flow.

## 6. Architectural Decision Records (ADRs)

### ADR 001: No Native Pop-ups
-   **Status**: Accepted
-   **Decision**: All forms of pop-up dialogs MUST be implemented as "pop-ins" or modals rendered within the application's own DOM.
