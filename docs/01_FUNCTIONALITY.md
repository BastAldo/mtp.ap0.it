# App Functionality Specification

This document outlines the core features and operational logic of the "Mio Trainer Personale" web application.

## 1. Core Concept

The application is a single-page app (SPA) designed for users to schedule, execute, and track workouts. It features a persistent header for consistent branding. All user data is persisted locally in the browser's `localStorage`. All user interactions, such as confirmations and notifications, are handled through custom, non-native UI elements.

## 2. Main Views

The application operates using three primary, mutually exclusive views: `Calendar`, `Trainer`, and `Debriefing`.

### 2.1. Calendar View
-   **Function:** The main dashboard and default view of the application.
-   **Display:** It presents a weekly grid layout.
-   **Navigation:** Users can navigate to the previous or next week.
-   **Day Cells:** Each cell represents a day and displays a summary of the number of exercises scheduled for that day. A "START" button is enabled if one or more exercises are scheduled.
-   **Interaction:** Clicking a day cell (but not the "START" button) opens the Workout Editor modal for that specific date.

### 2.2. Workout Editor (Modal System)
The editor is a modal system for managing a day's workout routine.
-   **Daily Workout Modal:** Displays a list of items (exercises or rests) that can be reordered via drag-and-drop.
-   **Exercise Library Modal:** Allows adding exercises from a predefined library.
-   **Confirmation Modal**: A custom modal is used to confirm critical actions, such as terminating a workout.

### 2.3. Interactive Trainer View
-   **Function:** An interactive, state-driven interface that guides the user through a scheduled workout in real-time.
-   **Core Logic**: The trainer's flow is determined by a **pre-compiled execution plan** generated by `planGenerator.js`. The `store.js` module acts as a simple "runner" that steps through this plan.
-   **Controls:** Includes a main button for flow control (start/pause/resume) and a secondary button to terminate the workout.

#### Execution Flow
1.  **Ready (`ready`):** The initial state before the workout begins.
2.  **Preparing (`preparing`):** A 3-second countdown that runs once at the very beginning.
3.  **Announcing (`announcing-phase`):** A brief (0.75s) state that flashes the name of the upcoming exercise or phase.
4.  **Action/Rest (`running`):** The main state where timers for exercises and rests are active.
5.  **Paused (`paused`):** The user can pause the workout at any time.
6.  **Finished (`finished`):** The state after all items in the plan are completed or the workout is terminated.

### 2.4. Debriefing View
-   **Activation:** Appears automatically when a workout is finished or terminated.
-   **Content:** Displays a summary of the completed workout plan.
-   **Actions:**
    - **"Copy for Coach"**: Copies a formatted text summary to the clipboard.
    - **"Return to Calendar"**: Navigates back to the main calendar view.
