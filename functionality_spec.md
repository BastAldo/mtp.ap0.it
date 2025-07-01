# App Functionality Specification

This document outlines the core features and operational logic of the "Mio Trainer Personale" web application.

## 1. Core Concept

The application is a single-page app (SPA) designed for users to schedule, execute, and track workouts. It features a persistent header for consistent branding. All user data is persisted locally in the browser's `localStorage`. All user interactions, such as confirmations and notifications, are handled through custom, non-native UI elements.

## 2. Main Views

The application operates using three primary, mutually exclusive views: `Calendar`, `Trainer`, and `Debriefing`.

### 2.1. Calendar View
- **Function:** The main dashboard and default view of the application.
- **Display:** It presents a weekly grid layout.
- **Interaction:** Opens the Workout Editor modal.

### 2.2. Workout Editor (Modal System)
The editor is a multi-stage modal system.
- **Daily Workout Modal:**
    - Displays a list of exercises.
    - Items in this list feature a **visual handle** and can be reordered via drag-and-drop.
- **Exercise Library Modal:**
    - Allows adding exercises to the routine.
- **Confirmation Modal**: A custom modal is used to confirm critical actions, such as terminating a workout.

### 2.3. Interactive Trainer View
- **Function:** An interactive, state-driven interface that guides the user through a scheduled workout.
- **Controls:** Includes a main button for flow control and a secondary button to **terminate** the workout, which opens a confirmation modal.

#### Trainer State Machine & Flow
The trainer operates as a state machine with the following states: `ready`, `preparing`, `announcing`, `action`, `rest`, `paused`, `finished`.

### 2.4. Debriefing View
- **Activation:** Appears automatically when a workout is completed or manually terminated.
- **Content:**
    - **Summary:** Displays a visually styled list representing the entire workout plan.
    - **Text Report:** Generates a pre-formatted, multi-line string summarizing the workout.
- **Actions:**
    - **Copy for Coach:** Copies the text report and shows a temporary, non-blocking notification ("toast") on success.
    - **Return to Calendar:** Switches the view back to the main Calendar.
