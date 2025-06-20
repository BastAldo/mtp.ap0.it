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

function getExerciseDetails(exercise) {
  if (!exercise) return '';
  if (exercise.type === 'reps') {
    return `(${exercise.series} × ${exercise.reps} rip., Tempo: ${exercise.tempo.up}-${exercise.tempo.hold}-${exercise.tempo.down})`;
  }
  return `(${exercise.series} × ${exercise.duration}s)`;
}

function generateTextReport(result) {
    let report = `Report Allenamento del ${new Date().toLocaleDateString('it-IT')}:\n`;
    if (result.wasTerminated) {
        report += "(Allenamento interrotto manualmente)\n\n";
    } else {
        report += "(Allenamento completato)\n\n";
    }

    result.workout.forEach((exercise, index) => {
        if (index > result.currentExerciseIndex) return;

        const details = getExerciseDetails(exercise);
        report += `* ${exercise.name} ${details}:\n`;

        if (index < result.currentExerciseIndex) {
            report += `  - Completato (${exercise.series} / ${exercise.series} serie)\n`;
        } else {
            const seriesText = `  - Arrivato a ${result.currentSeries} / ${exercise.series} serie`;
            const repText = exercise.type === 'reps' && result.currentRep > 0 ? `, ${result.currentRep} rip.` : '';
            report += `${seriesText}${repText}\n`;
        }
    });

    return report;
}

export function showDebriefing(result) {
    summaryList.innerHTML = '';
    result.workout.forEach((exercise, index) => {
        if (index > result.currentExerciseIndex) return;
        
        const li = document.createElement('li');
        li.className = 'modal-list-item';
        const details = getExerciseDetails(exercise);

        let status = '';
        if (index < result.currentExerciseIndex) {
            status = `${exercise.series} / ${exercise.series} serie`;
        } else {
            status = `Serie ${result.currentSeries}, Rip. ${result.currentRep}`;
        }

        li.innerHTML = `
          <span class="debrief-exercise-name">${exercise.name} <small>${details}</small></span>
          <span class="debrief-status">${status}</span>
        `;
        summaryList.appendChild(li);
    });

    reportTextArea.value = generateTextReport(result);
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
