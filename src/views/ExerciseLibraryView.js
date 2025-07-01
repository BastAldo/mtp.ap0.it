import { getExercises } from '../modules/exerciseRepository.js';

export function render(context) {
    const exercises = getExercises();
    if (!exercises || exercises.length === 0) {
        return '<p>Nessun esercizio disponibile nella libreria.</p>';
    }

    const itemsHtml = exercises.map(exercise => `
        <li class="exercise-library-item">
            <span>${exercise.name}</span>
            <button class="add-to-workout-btn" data-exercise-id="${exercise.id}">Add</button>
        </li>
    `).join('');

    return `<ul class="exercise-library-list">${itemsHtml}</ul>`;
}
