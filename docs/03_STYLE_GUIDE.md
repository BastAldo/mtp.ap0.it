# UI Design and Visual System

This document describes the UI, color palette, and visual language of the "Mio Trainer Personale" application.

## 1. General Philosophy

The UI has a **dark theme**, is minimal and functional, prioritizing clarity.

## 2. Color Palette

* `--bg-color: #1a1a1d`
* `--card-color: #2c2c34`
* `--primary-color: #9575cd`
* `--secondary-color: #4db6ac`
* `--text-color: #f4f4f9`
* ...and others

## 3. Layout and Structure

* **Main Container (`#app-container`):** Centered container with a max-width.
* **Views (`.view`):** Class-based system for showing/hiding main sections.
* **Grids and Flexbox:** Used for robust and responsive layouts.

## 4. Key Components and Effects

(Sections for Cards, Buttons, Modals, etc.)

## 5. Responsive Design

-   **Principle:** The application MUST follow a **mobile-first** design approach. Styles should be written for mobile screens by default, and then expanded for larger screens using media queries.
-   **Primary Breakpoint:** A primary breakpoint at `768px` should be used to distinguish between "mobile" and "desktop" layouts.
    ```css
    /* Mobile styles first */
    .container {
        padding: 1rem;
    }

    /* Tablet/Desktop overrides */
    @media (min-width: 768px) {
        .container {
            padding: 2rem;
        }
    }
    ```
-   **Flexibility:** Layouts should be fluid and adapt to screen sizes rather than targeting specific device widths.
