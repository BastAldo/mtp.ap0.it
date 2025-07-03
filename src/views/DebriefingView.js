import store from '../modules/store.js';

function generateSummaryHtml(completedWorkout) {
    if (!completedWorkout || !completedWorkout.items) {
        return '<p>Nessun dato di allenamento disponibile.</p>';
    }

    const title = completedWorkout.completed
        ? '<h2>Workout Completato!</h2>'
        : '<h2>Workout Interrotto</h2>';

    const termPoint = completedWorkout.terminationPoint;

    const itemsHtml = completedWorkout.items.map((item, index) => {
        let itemClass = 'debrief-item';
        let statusText = '';
        let animationDelay = `style="animation-delay: ${index * 50}ms;"`;

        if (completedWorkout.completed) {
            itemClass += ' debrief-item--completed';
        } else if (termPoint) {
            if (index < termPoint.itemIndex) {
                itemClass += ' debrief-item--completed';
            } else if (index === termPoint.itemIndex) {
                itemClass += ' debrief-item--terminated';
                statusText = `(interrotto alla serie ${termPoint.currentSeries})`;
            } else {
                itemClass += ' debrief-item--skipped';
                animationDelay = '';
            }
        }

        let mainText = '';
        if (item.type === 'rest') {
            mainText = `Riposo: ${item.duration}s`;
        } else {
            const series = item.series || 1;
            const reps = item.reps ? `${item.reps} reps` : `${item.duration}s`;
            mainText = `${item.name}: ${series}x${reps} ${statusText}`;
        }

        return `<li class="${itemClass}" ${animationDelay}>${mainText}</li>`;
    }).join('');

    return `${title}<ul class="debrief-list">${itemsHtml}</ul>`;
}

function generateTextForCoach(completedWorkout) {
    if (!completedWorkout || !completedWorkout.items) return 'Nessun dato disponibile.';
    const date = new Date(completedWorkout.date).toLocaleDateString('it-IT');
    const status = completedWorkout.completed ? 'Completato' : 'Interrotto';
    let report = `Report Allenamento - ${date} (${status})\n====================\n\n`;

    const termPoint = completedWorkout.terminationPoint;

    completedWorkout.items.forEach((item, index) => {
        let statusTag = '[✓]';
        if (!completedWorkout.completed && termPoint) {
            if (index < termPoint.itemIndex) statusTag = '[✓]';
            else if (index === termPoint.itemIndex) statusTag = '[✗]';
            else statusTag = '[-]';
        }

        if (item.type === 'rest') {
            report += `${statusTag} Riposo: ${item.duration}s\n`;
        } else {
            const series = item.series || 1;
            const reps = item.reps ? `${item.reps} reps` : `${item.duration}s`;
            let terminationInfo = '';
            if (statusTag === '[✗]') {
                terminationInfo = ` (interrotto alla serie ${termPoint.currentSeries}/${series})`;
            }
            report += `${statusTag} ${item.name}: ${series}x${reps}${terminationInfo}\n`;
        }
    });
    return report;
}

function render(element) {
    const { trainer } = store.getState();
    if (!trainer || !trainer.completedWorkout) {
        element.innerHTML = '<h2>Caricamento riepilogo...</h2>';
        return;
    }

    const { completedWorkout } = trainer;
    const summaryHtml = generateSummaryHtml(completedWorkout);
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
            const { completedWorkout } = store.getState().trainer;
            if (!completedWorkout) return;
            const textToCopy = generateTextForCoach(completedWorkout);
            navigator.clipboard.writeText(textToCopy).then(() => {
                store.dispatch({ type: 'SHOW_NOTICE', payload: { message: 'Riepilogo copiato!' } });
            }).catch(err => {
                console.error('Errore nella copia:', err);
                store.dispatch({ type: 'SHOW_NOTICE', payload: { message: 'Errore nella copia' } });
            });
        }
    });

    store.subscribe(() => {
        if(element.classList.contains('view--active')) {
            render(element);
        }
    });
    element.innerHTML = '';
}