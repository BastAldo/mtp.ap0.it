# App Functionality Specification

This document outlines the core features and operational logic of the "Mio Trainer Personale" web application.

## 1. Core Concept

The application is a single-page app (SPA) designed for users to schedule, execute, and track workouts. All user data is persisted locally in the browser's `localStorage`.

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
    - Allows **removal** of any exercise from the list.
    - Contains an "Add Exercise" button to open the Exercise Library modal.
- **Exercise Library Modal:**
    - Triggered by the "Add Exercise" button.
    - Displays a complete list of all available exercises defined in the app's configuration.
    - Allows **selection** of an exercise to add to the current day's routine.

### 2.3. Interactive Trainer View
- **Function:** An interactive, state-driven interface that guides the user through a scheduled workout in real-time.
- **Activation:** Triggered by clicking the "START" button on a day cell in the calendar.

#### Trainer State Machine & Flow
The trainer operates as a state machine. Each exercise consists of a number of **series**. The primary user flow is as follows:

1.  **Ready (`ready`):** The trainer displays the current exercise and series number. It shows "READY" inside the progress ring. It awaits user input to begin.
2.  **Announcing (`announcing`):** Before every new phase, this 0.75-second state is activated. The progress ring is shown as empty. The content inside the ring is replaced by a large, flashing text label announcing the upcoming phase (e.g., "PREPARE", "UP", "REST"). An audio tick alerts the user.
3.  **Preparing (`preparing`):** A 3-second countdown to prepare the user for the first series of an exercise. The progress ring fills up, and the countdown is displayed inside.
4.  **Action (`action`):** The core execution phase. The progress ring animates for the duration of the phase, with the countdown and phase label shown inside.
    - For **`reps`**-based exercises, the trainer automatically cycles through timed phases as defined by the exercise's `tempo` object (e.g., `up`, `hold`, `down`), each with its own countdown and progress ring animation.
    - For **`time`**-based exercises, a single countdown for the specified `duration` is run.
5.  **Paused (`paused`):** The user can pause the workout at any time during a countdown state. The timer and the progress ring animation stop. The user must click "RESUME" to continue.
6.  **Rest (`rest`):** After a set is completed, the trainer enters a rest period. A countdown for the specified `rest` duration is shown, and the progress ring animates accordingly.
7.  **Advancement:** After a rest period, the system automatically determines whether to proceed to the next series of the same exercise or to the next exercise in the routine, starting again from the `Ready` (or `Announcing`) state.
8.  **Finished (`finished`):** Once all exercises and series are complete, the trainer automatically transitions to the Debriefing View.

### 2.4. Debriefing View
- **Activation:** Appears automatically when a workout is completed or manually terminated.
- **Content:**
    - **Summary:** Displays a list of all exercises completed during the session.
    - **Text Report:** Generates a pre-formatted, multi-line string summarizing the workout, ready for sharing.
- **Actions:**
    - **Copy for Coach:** Copies the text report to the user's clipboard.
    - **Return to Calendar:** Switches the view back to the main Calendar.
