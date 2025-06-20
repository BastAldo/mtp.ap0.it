/**
 * @file debriefing.js
 * Handles the display and logic of the post-workout debriefing screen.
 */
import { showView } from './ui.js';
import { renderCalendar } from './calendar.js';

const summaryList = document.getElementById('debriefing-summary');
const reportTextArea = document.getElementById('debriefing-text-report');
const copyBtn = document.getElementById('copy-report-btn');
const returnBtn = document.getElementById('return-to-calendar-btn');

function generateTextReport(workout, lastSeries, terminated) {
    let report = `Report Allenamento del ${new Date().toLocaleDateString('it-IT')}:\n`;
    if (terminated) {
        report += "(Allenamento interrotto manualmente)\n\n";
    } else {
        report += "(Allenamento completato)\n\n";
    }

    workout.forEach((exercise, index) => {
        const seriesCompleted = index < workout.length - 1 ? exercise.series : lastSeries;
        report += `* ${exercise.name}: ${seriesCompleted} serie completate.\n`;
    });

    return report;
}

export function showDebriefing(workout, lastSeries, terminated = false) {
    summaryList.innerHTML = '';
    workout.forEach((exercise, index) => {
        const seriesCompleted = index < workout.length - 1 ? exercise.series : lastSeries;
        const li = document.createElement('li');
        li.className = 'modal-list-item';
        li.textContent = `${exercise.name} (${seriesCompleted} / ${exercise.series} serie)`;
        summaryList.appendChild(li);
    });

    reportTextArea.value = generateTextReport(workout, lastSeries, terminated);
    showView('debriefing');
}

export function initDebriefing() {
    returnBtn.addEventListener('click', () => {
        showView('calendar');
        renderCalendar();
    });

    copyBtn.addEventListener('click', () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(reportTextArea.value).then(() => {
                copyBtn.textContent = 'Copiato!';
                setTimeout(() => (copyBtn.textContent = 'Copia Report'), 2000);
            });
        }
    });
}
