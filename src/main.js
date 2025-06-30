/**
 * Main application entry point.
 * Handles view management and app initialization.
 */

/**
 * Hides all views and shows the one with the specified ID.
 * @param {string} viewId The ID of the view to show (e.g., 'view-calendar').
 */
function showView(viewId) {
    // Hide all elements with the .view class
    const views = document.querySelectorAll('.view');
    views.forEach(view => {
        view.classList.remove('view--active');
    });

    // Show the requested view
    const activeView = document.getElementById(viewId);
    if (activeView) {
        activeView.classList.add('view--active');
    } else {
        console.error(`View with ID "${viewId}" not found.`);
    }
}

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('Mio Trainer Personale is initializing...');
    // Set the default view to the calendar
    showView('view-calendar');
});
