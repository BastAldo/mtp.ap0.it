# App Functionality Specification

This document outlines the core features and operational logic of the "Mio Trainer Personale" web application.

## 1. Core Concept

The application is a single-page app (SPA) designed for users to schedule, execute, and track workouts. All user data is persisted locally in the browser's `localStorage`.

## 2. Main Views

The application operates using three primary, mutually exclusive views: `Calendar`, `Trainer`, and `Debriefing`.

### 2.1. Calendar View

-   **Function:** The main dashboard and default view of the application.
-   **Display:** It presents a weekly grid layout.
-   **Navigation:** Users can navigate to the previous or next week.
-   **Day Cells:** Each cell represents a day and displays a summary of the number of exercises scheduled for that day. A "START" button is enabled if one or more exercises are scheduled.
-   **Interaction:** Clicking a day cell (but not the "START" button) opens the Workout Editor modal for that specific date.

### 2.2. Workout Editor (Modal System)

The editor is a modal system for managing a day's workout routine. It allows for the composition of exercises and configurable rest periods.

-   **Daily Workout Modal:**
    -   Triggered by clicking a day cell.
    -   Displays a list of items (exercises or rests) currently scheduled for the selected date.
-   **Exercise Library Modal:**
    -   Triggered by the "Add Exercise" button.
    -   Displays a list of all **available exercises** from the application's library.

### 2.3. Interactive Trainer View

-   **Function:** An interactive, state-driven interface that guides the user through a scheduled workout in real-time.
-   **Activation:** Triggered by clicking the "START" button on a day cell in the calendar.

#### Trainer State Machine & Flow
The trainer operates as a state machine. The primary user flow is as follows:

1.  **Ready (`ready`):** The initial state. The trainer displays the first exercise and awaits user input.
2.  **Preparing (`preparing`):** A 3-second countdown that runs **only once** at the very beginning of the workout.
3.  **Announcing (`announcing`):** A 0.75-second state that displays the name of the upcoming phase (e.g., "UP", "REST") to alert the user.
4.  **Action (`action`):** The core execution phase where the user performs the movement for a timed duration.
5.  **Rest (`rest`):** A timed countdown for rest. This state is **only** activated when the trainer encounters a user-defined rest block in the workout sequence. There are no automatic rests between series or exercises.
6.  **Paused (`paused`):** The user can pause the workout at any time during `preparing`, `announcing`, `action`, or `rest`.
7.  **Advancement Logic:**
    - After an `action` phase, the logic checks for more phases, repetitions, or series within the same exercise.
    - Once an entire exercise item is complete (all series and reps), the trainer immediately advances to the next item in the workout list.
    - If the next item is an exercise, it begins the `announcing` phase for it.
    - If the next item is a rest block, it enters the `rest` state.
8.  **Finished (`finished`):** Once all items in the routine are complete, the trainer automatically transitions to the Debriefing View.

### 2.4. Debriefing View

-   **Activation:** Appears automatically when a workout is completed.
-   **Content:** Displays a summary of all exercises completed.
-   **Actions:** "Copy for Coach" and "Return to Calendar".
