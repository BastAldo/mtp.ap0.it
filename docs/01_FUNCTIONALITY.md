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

```plaintext
+-------------------------------------------------------------------------+
|  <- PREV WEEK         WEEK OF 2025-06-30         NEXT WEEK ->            |
+-------------------------------------------------------------------------+
| MONDAY 30      | TUESDAY 01     | WEDNESDAY 02   | THURSDAY 03    | ...  |
|----------------|----------------|----------------|----------------|------|
| 3 Exercises    | 0 Exercises    | 2 Exercises    | (No Workout)   |      |
|                |                |                |                |      |
| [   START   ]  |                | [   START   ]  |                |      |
+-------------------------------------------------------------------------+
```

### 2.2. Workout Editor (Modal System)

The editor is a modal system for managing a day's workout routine. It allows for the composition of exercises and configurable rest periods.

-   **Daily Workout Modal:**
    -   Triggered by clicking a day cell.
    -   Displays a list of items (exercises or rests) currently scheduled for the selected date.
    -   Allows **removal** of any item from the list.
    -   For "Rest" items, the duration is **editable inline**.
    -   Contains an "Add Exercise" button to open the Exercise Library modal and an "Add Rest" button to insert a new rest period.
-   **Exercise Library Modal:**
    -   Triggered by the "Add Exercise" button.
    -   Displays a complete list of all available exercises.

```plaintext
// Stage 1: Daily Workout Modal with an editable Rest item.
+------------------------------------------+
| WORKOUT - MONDAY 30                      |
|------------------------------------------|
| - Squat (3x10)                 [Remove]  |
| - Rest: [ 60 ] seconds         [Remove]  |
| - Push-ups (3x12)              [Remove]  |
|                                          |
|           [Add Exercise] [Add Rest]      |
+------------------------------------------+

// Stage 2: User clicks [Add Exercise] to open the library.
// Clicking [Add Rest] directly adds a new rest item to the list above.
+----------------------------------+
| EXERCISE LIBRARY                 |
|----------------------------------|
| - Bench Press          [Add]     |
| - Deadlift             [Add]     |
| ... (scrollable) ...             |
|                        [Close]   |
+----------------------------------+
```

### 2.3. Interactive Trainer View

-   **Function:** An interactive, state-driven interface that guides the user through a scheduled workout in real-time. It features a large SVG Progress Ring for at-a-glance timer feedback. The phase name (e.g., UP, HOLD) and timer are displayed inside the ring. The exercise description is shown below it.
-   **Activation:** Triggered by clicking the "START" button on a day cell in the calendar.

```plaintext
// State: Action (Reps-based, 50% through "DOWN" phase)
+-----------------------------------------+
|  ** SQUAT ** |
|  SERIES 1 / 3   |   REP 1 / 10          |
|-----------------------------------------|
|                                         |
|      /```\       DOWN                   |
|     | 50% |      1s                     |
|      \___/                              |
|                                         |
|-----------------------------------------|
|  Lower your body with control.          |
|  [           PAUSE           ]          |
+-----------------------------------------+
```

#### Trainer State Machine & Flow
The trainer operates as a state machine. The primary user flow is as follows:

1.  **Ready (`ready`):** The trainer displays the current exercise and series number. Awaits user input to begin.
2.  **Announcing (`announcing`):** Before every new action phase, this 0.75-second state is activated. It displays the name of the upcoming phase (e.g., "UP", "REST") with a flashing visual effect and an audio tick to alert the user. It then automatically transitions to the announced phase.
3.  **Preparing (`preparing`):** A 3-second countdown to prepare the user for the first series of an exercise.
4.  **Action (`action`):** The core execution phase.
    -   For **`reps`**-based exercises, the trainer automatically cycles through timed phases (e.g., `up`, `hold`, `down`). Each phase is preceded by the `announcing` state.
    -   For **`time`**-based exercises, a single countdown for the specified `duration` is run.
5.  **Paused (`paused`):** The user can pause the workout at any time.
6.  **Rest (`rest`):** This state is triggered when a "Rest" item is encountered in the workout list. It runs a countdown for the user-defined duration.
7.  **Advancement:** After any state completes, the system proceeds to the next item in the workout list.
8.  **Finished (`finished`):** Once all items in the routine are complete, the trainer automatically transitions to the Debriefing View.

### 2.4. Debriefing View

-   **Activation:** Appears automatically when a workout is completed or manually terminated.
-   **Content:** Displays a summary of all exercises completed.
-   **Actions:** "Copy for Coach" and "Return to Calendar".

```plaintext
+-----------------------------------------+
|  WORKOUT COMPLETED!                     |
|-----------------------------------------|
|  Summary:                               |
|   - Squat: 3 series completed           |
|   - Push-ups: 3 series completed        |
|                                         |
|  [ Copy for Coach ] [Return to Calendar] |
+-----------------------------------------+
```
