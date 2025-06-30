# Application Architecture

This document outlines the high-level architecture for the "Mio Trainer Personale" SPA.

## 1. Core Principles

-   **Modularity:** The application is broken down into distinct, single-responsibility modules. This simplifies development, testing, and maintenance.
-   **State-Driven UI:** The user interface reacts to changes in the application's state, rather than being manipulated directly.

## 2. Directory Structure

-   `docs/`: Contains all project documentation.
-   `index.html`: The single HTML entry point for the SPA.
-   `src/`: Contains all application source code.
    -   `src/main.js`: The main application entry point, responsible for initialization and view management.
    -   `src/style.css`: The global stylesheet.
    -   `src/views/`: Each file in this directory manages the DOM and logic for a specific application view (e.g., `calendar.js`, `trainer.js`).
    -   `src/modules/`: Contains shared logic and helpers, such as:
        -   `storage.js`: A wrapper for all `localStorage` interactions.
        -   `ui.js`: Reusable UI component functions (e.g., creating modals).

## 3. View Management

The application uses a simple view manager controlled by `main.js`.
-   Only one view is active (`.view--active`) at any given time.
-   The `showView(viewId)` function handles switching between views by toggling CSS classes.

## 4. Data Persistence

All user data (scheduled workouts, progress) is persisted in the browser's `localStorage`. The `storage.js` module provides a clean API (`saveWorkout`, `getWorkoutForDate`, etc.) to abstract the direct `JSON.stringify` and `JSON.parse` calls, ensuring data consistency.
