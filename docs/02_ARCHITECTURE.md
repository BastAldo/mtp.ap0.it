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
    -   `src/modules/`: Contains shared logic and helpers.

## 3. View Management

The application uses a simple view manager controlled by `main.js`. Only one view is active (`.view--active`) at any given time.

## 4. Data Persistence

All user data (scheduled workouts, progress) is persisted in the browser's `localStorage`. The `storage.js` module provides a clean API to abstract direct `localStorage` interactions.

The data structure for a daily workout is an array of "workout items". Each item is an object with a `type` key to distinguish between different kinds of items:
-   `{ type: 'exercise', id: 'squat', ... }`
-   `{ type: 'rest', duration: 60, ... }`

This flexible structure allows for complex workout routines to be composed easily by the user.

## 5. Architectural Decision Records (ADRs)

This section records important architectural decisions made during the project's lifecycle.

### ADR 001: No Native Pop-ups

-   **Status**: Accepted
-   **Context**: The application needs to present users with dialogs, confirmations, and prompts (e.g., editing a value, confirming deletion). Using native browser pop-ups (`alert()`, `prompt()`, `confirm()`) creates an inconsistent user experience across different browsers and operating systems, and does not align with the application's visual style.
-   **Decision**: All forms of pop-up dialogs MUST be implemented as "pop-ins" or modals rendered within the application's own DOM. This ensures complete control over styling and a consistent user experience. The modal system defined in `docs/03_STYLE_GUIDE.md` should be used as the basis for these components.
-   **Consequences**: Developers must not use native pop-up functions. All interactions requiring a dialog must be implemented using the in-page modal system.
