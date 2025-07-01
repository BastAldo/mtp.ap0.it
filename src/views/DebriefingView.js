import store from '../modules/store.js';

function generateSummary(completedWorkout) {
    if (!completedWorkout) return '<p>Nessun dato di allenamento disponibile.</p>';

    const title = completedWorkout.completed
        ? '<h2>Workout Completato!</h2>'
        : '<h2>Workout Interrotto</h2>';

    const itemsHtml = completedWorkout.items.map((item, index) => {
        if (item.type === 'rest') {
            return `<li>Riposo: ${item.duration}s</li>`;
        }
        const series = item.series || 1;
        const reps = item.reps ? `${item.reps} reps` : `${item.duration}s`;
        let status = '';
        if (!completedWorkout.completed && index === completedWorkout.items.length - 1) {
            const point = completedWorkout.terminationPoint;
            status = ` (interrotto a serie ${point.currentSeries}/${series})`;
        }
        return `<li>${item.name}: ${series} x ${reps}${status}</li>`;
    }).join('');

    return `${title}<ul>${itemsHtml}</ul>`;
}

function generateTextForCoach(completedWorkout) {
    if (!completedWorkout) return 'Nessun dato disponibile.';
    const date = new Date(completedWorkout.date).toLocaleDateString('it-IT');
    const status = completedWorkout.completed ? 'Completato' : 'Interrotto';
    let report = `Report Allenamento - ${date} (${status})\n\n`;

    completedWorkout.items.forEach((item, index) => {
        if (item.type === 'rest') {
            report += `- Riposo: ${item.duration}s\n`;
        } else {
            const series = item.series || 1;
            const reps = item.reps ? `${item.reps} reps` : `${item.duration}s`;
            let terminationInfo = '';
            if (!completedWorkout.completed && index === completedWorkout.items.length - 1) {
                const point = completedWorkout.terminationPoint;
                terminationInfo = ` (interrotto a serie ${point.currentSeries}/${series})`;
            }
            report += `- ${item.name}: ${series} x ${reps}${terminationInfo}\n`;
        }
    });
    return report;
}

function render(element) {
    const { completedWorkout } = store.getState();
    const summaryHtml = generateSummary(completedWorkout);
    const actionsHtml = `
        <div class="debriefing-actions">
            <button class="copy-btn">Copia per il Coach</button>
            <button class="return-btn">Torna al Calendario</button>
        </div>
    `;
    element.innerHTML = `
        <div class="debriefing-container">
            ${summaryHtml}
            ${actionsHtml}
        </div>
    `;
}

export function init(element) {
    element.addEventListener('click', (event) => {
        if (event.target.closest('.return-btn')) {
            store.dispatch({ type: 'CHANGE_VIEW', payload: 'calendar' });
        }
        if (event.target.closest('.copy-btn')) {
            const { completedWorkout } = store.getState();
            const textToCopy = generateTextForCoach(completedWorkout);
            navigator.clipboard.writeText(textToCopy).then(() => {
                alert('Riepilogo copiato negli appunti!');
            }).catch(err => {
                console.error('Errore nella copia:', err);
                alert('Impossibile copiare il testo.');
            });
        }
    });

    store.subscribe(() => render(element));
    render(element);
}
