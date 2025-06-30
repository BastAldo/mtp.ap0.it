# UI Design and Visual System

This document describes the user interface, color palette, and visual language of the "Mio Trainer Personale" application.

## 1. General Philosophy

The UI is designed with a **dark theme** to be easy on the eyes, especially in low-light environments. The aesthetic is minimal and functional, prioritizing clarity and readability of information during a workout.

## 2. Color Palette

The entire UI is based on a set of CSS variables for consistency.

* `--bg-color: #1a1a1d`: The main background color of the application.
* `--card-color: #2c2c34`: The background color for all interactive cards, such as day cells and list items.
* `--primary-color: #9575cd`: The primary accent color, used for key interactive elements and titles. A shade of purple.
* `--secondary-color: #4db6ac`: The secondary accent color, used for "positive" or "start" actions, like the start buttons and progress indicators. A shade of teal.
* `--text-color: #f4f4f9`: The primary color for all standard text.
* `--text-secondary: #b3b3b3`: A dimmer text color for supplementary information and labels.
* `--danger-color: #ef5350`: Used for "danger" or "delete" actions.
* `--success-color: #66bb6a`: Used for "success" or "completion" states.

## 3. Layout and Structure

* **Main Container (`#app-container`):** All content is wrapped in a centered container with a maximum width to ensure readability on large screens.
* **Views (`.view`):** The application's main sections (`calendar`, `trainer`, `debriefing`) are managed by a class-based system. An element with the `.view` class is hidden (`display: none`), while adding the `.view--active` class makes it visible.
* **Grids and Flexbox:** The layout heavily relies on CSS Grid (for the weekly calendar) and Flexbox (for component alignment) to be responsive and robust.

## 4. Key Components and Effects

### 4.1. Cards
* **Appearance:** Used for day cells (`.day-cell`) and list items in modals. They have a `background-color` of `--card-color` and `border-radius: 8px`.
* **Interaction:** On hover, a card lifts slightly (`transform: translateY(-3px)`) and a `--primary-color` accent appears on its left border, providing clear visual feedback.

### 4.2. Buttons
* **Base Style (`.btn`):** A standardized button with rounded corners, bold font weight, and a subtle scaling effect on hover.
* **Variations:** Color variations (`.btn-primary`, `.btn-secondary`, `.btn-danger`, etc.) are used to signify the button's purpose.
* **State:** Disabled buttons have reduced opacity and a `not-allowed` cursor.

### 4.3. Modals
* **Overlay (`.modal-overlay`):** A semi-transparent black overlay covers the entire viewport when a modal is active.
* **Content Box (`.modal-content`):** A centered card with rounded corners contains the modal's content. It has a max-height and allows for vertical scrolling if the content overflows.

### 4.4. Trainer Progress Ring
* **Concept:** The central element of the Trainer view is a large circular progress ring, implemented with SVG. It provides immediate, graphical feedback on time-based activities.
* **Structure:** The component consists of two concentric circles: a background "track" and a foreground "bar" that animates.
* **Animation:** The ring **fills up** (from 0% to 100%) clockwise to indicate elapsed time during a countdown.
* **Content Layout:** Inside the ring, information is displayed with a clear hierarchy:
    * **Top (Large Text):** The primary countdown number (e.g., "30").
    * **Bottom (Small Text):** The label for the current phase (e.g., "REST", "UP").

### 4.5. Visual & Auditory Feedback
* **Flashing Animation (`.is-flashing`):** A key visual cue used in the Trainer's "Announce Phase". It uses a CSS `@keyframes` animation to alternate an element's opacity. It is used on the large text label that temporarily replaces the countdown numbers to announce the next phase.
* **Audio Tick:** A high-frequency sine wave sound (`playTick()`) is generated via the Web Audio API. It plays in sync with countdown timers to provide non-visual, rhythmic feedback.
