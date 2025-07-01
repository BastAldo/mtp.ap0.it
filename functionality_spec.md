# App Functionality Specification

This document outlines the core features and operational logic of the "Mio Trainer Personale" web application.

## 1. Core Concept

The application is a single-page app (SPA) designed for users to schedule, execute, and track workouts. It features a persistent header for consistent branding. All user data is persisted locally in the browser's `localStorage`.

## 2. Main Views

The application operates using three primary, mutually exclusive views: `Calendar`, `Trainer`, and `Debriefing`.

### 2.1. Calendar View
- **Function:** The main dashboard and default view of the application.
- **Display:** It presents a weekly grid layout.
- **Navigation:** Users can navigate to the previous or next week.
- **Day Cells:** Each cell represents a day and displays a summary of the number of exercises scheduled for that day. A "START" button is enabled if one or more exercises are scheduled.
- **Interaction:** Clicking a day cell (but not the "START" button) opens the Workout Editor modal for that specific date.

### 2.2. Workout Editor (Modal System)
The editor is a two-stage modal system for managing a day's workout routine.
- **Daily Workout Modal:**
    - Triggered by clicking a day cell.
    - Displays a list of exercises currently scheduled for the selected date.
    - **Items in this list feature a visual handle and can be reordered via drag-and-drop.**
    - Allows **removal** of any exercise from the list.
    - Contains an "Add Exercise" button to open the Exercise Library modal.
- **Exercise Library Modal:**
    - Triggered by the "Add Exercise" button.
    - Displays a complete list of all available exercises defined in the app's configuration.
    - Allows **selection** of an exercise to add to the current day's routine.

### 2.3. Interactive Trainer View
- **Function:** An interactive, state-driven interface that guides the user through a scheduled workout in real-time.
- **Activation:** Triggered by clicking the "START" button on a day cell in the calendar.
- **Controls:** Includes a main button for flow control (start/pause) and a secondary button to **terminate** the workout.

#### Trainer State Machine & Flow
The trainer operates as a state machine. Each exercise consists of a number of **series**. The primary user flow is as follows:

1.  **Ready (`ready`):** The trainer displays the current exercise and series number. It shows "READY" inside the progress ring. It awaits user input to begin.
2.  **Preparing (`preparing`):** A 3-second countdown to prepare the user. The logic correctly handles if the first item is a `rest` block.
3.  **Announcing (`announcing`):** A 0.75-second state that is activated before every new phase.
4.  **Action (`action`):** The core execution phase for a timed duration.
5.  **Paused (`paused`):** The user can pause the workout at any time during a countdown state.
6.  **Rest (`rest`):** This state is **only** activated when the trainer encounters a user-defined rest block in the workout sequence.
7.  **Advancement:** After completing an item, the system automatically proceeds to the next item in the workout list.
8.  **Finished (`finished`):** Once all items are complete, the trainer automatically transitions to the Debriefing View.
9.  **Terminated (`terminate`):** If the user clicks the "Termina" button, the workout is immediately stopped, and the app transitions to the Debriefing View with a partial summary.

### 2.4. Debriefing View
- **Activation:** Appears automatically when a workout is completed or manually terminated.
- **Content:**
    - **Summary:** Displays a visually styled list representing the entire workout plan. **Completed** items are marked. The **point of termination** is clearly highlighted. **Skipped** items are visually distinct.
    - **Text Report:** Generates a pre-formatted, multi-line string summarizing the workout.
- **Actions:**
    - **Copy for Coach:** Copies the text report to the user's clipboard.
    - **Return to Calendar:** Switches the view back to the main Calendar.
