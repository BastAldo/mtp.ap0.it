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

The editor is a modal system for managing a day's workout routine. It allows for the composition of exercises and configurable rest periods.

-   **Daily Workout Modal:**
    -   Triggered by clicking a day cell.
    -   Displays a list of items (exercises or rests) currently scheduled for the selected date.
    -   Items in this list feature a **visual handle** and can be reordered via drag-and-drop.
-   **Exercise Library Modal:**
    -   Triggered by the "Add Exercise" button.
    -   Displays a list of all **available exercises** from the application's library.
-   **Confirmation Modal**: A custom modal is used to confirm critical actions, such as terminating a workout.

### 2.3. Interactive Trainer View

-   **Function:** An interactive, state-driven interface that guides the user through a scheduled workout in real-time.
-   **Activation:** Triggered by clicking the "START" button on a day cell in the calendar.
-   **Controls:** Includes a main button for starting/pausing/resuming and a secondary button to **terminate** the workout at any time (which opens a confirmation modal).

#### Trainer State Machine & Flow
The trainer operates as a state machine. The primary user flow is as follows:

1.  **Ready (`ready`):** The initial state.
2.  **Preparing (`preparing`):** A 3-second countdown that runs once.
3.  **Announcing (`announcing`):** A 0.75-second state to alert the user of the next phase.
4.  **Action (`action`):** The core execution phase.
5.  **Rest (`rest`):** A timed countdown for user-defined rest blocks.
6.  **Paused (`paused`):** The user can pause the workout at any time.
7.  **Advancement Logic:** The trainer advances through phases, reps, and series automatically.
8.  **Finished (`finished`):** After all items are complete, the main button transitions to "DEBRIEFING".
9.  **Terminated (`terminate`):** If the user confirms termination via the modal, the workout stops.

### 2.4. Debriefing View

-   **Activation:** Appears after a workout is finished or terminated.
-   **Content:** Displays a visually styled list representing the entire workout plan.
-   **Actions:**
    - **"Copy for Coach"**: Copies a summary to the clipboard and shows a temporary, non-blocking notification ("toast") on success.
    - **"Return to Calendar"**: Navigates back to the main calendar view.
