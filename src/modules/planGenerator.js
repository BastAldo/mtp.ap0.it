// --- Modulo Generatore di Piani di Esecuzione per il Trainer ---

/**
 * "Srotola" un esercizio in una sequenza di passi (annuncio, azione, riposo).
 * @param {object} item - L'item di esercizio dal workout.
 * @param {number} seriesIndex - L'indice della serie corrente (1-based).
 * @returns {array} - Un array di oggetti-passo per la serie.
 */
function unrollExerciseSeries(item, seriesIndex) {
    const steps = [];
    const totalSeries = item.series || 1;
    const totalReps = item.reps || 1;

    // 1. Annuncio Iniziale (solo per la prima serie di un esercizio)
    if (seriesIndex === 1) {
        steps.push({
            type: 'announcing',
            duration: 2000,
            headerTitle: 'Prossimo Esercizio',
            mainText: item.name,
            item,
        });
    }

    // 2. Passi di Azione (Repetizioni e Fasi Tempo)
    for (let repIndex = 1; repIndex <= totalReps; repIndex++) {
        if (item.type === 'time') {
            steps.push({
                type: 'action',
                duration: (item.duration || 10) * 1000,
                headerTitle: item.name,
                mainText: `Serie ${seriesIndex}/${totalSeries}`,
                item,
                context: { currentSeries: seriesIndex, totalSeries }
            });
        } else { // type 'exercise' con tempo
            const tempoPhases = Object.keys(item.tempo || { exec: 1 });
            tempoPhases.forEach(phase => {
                steps.push({
                    type: 'action',
                    duration: (item.tempo[phase] || 1) * 1000,
                    headerTitle: item.name,
                    mainText: phase.toUpperCase(),
                    item,
                    context: { currentSeries: seriesIndex, totalSeries, currentRep: repIndex, totalReps, phase }
                });
            });
        }
    }

    // 3. Riposo tra le serie (se non è l'ultima serie)
    if (seriesIndex < totalSeries) {
        steps.push({
            type: 'rest',
            duration: (item.defaultRest || 60) * 1000,
            headerTitle: 'Riposo',
            mainText: 'Recupera le forze',
            isSeriesRest: true,
            item,
        });
    }

    return steps;
}

/**
 * Compila un array di workout items in un piano di esecuzione sequenziale.
 * @param {array} workoutItems - L'array di esercizi e riposi.
 * @returns {array} - L'executionPlan completo.
 */
export function generatePlan(workoutItems) {
    if (!workoutItems || workoutItems.length === 0) return [];

    const plan = [];

    // Passo 0: Preparazione iniziale
    plan.push({
        type: 'preparing',
        duration: 3000,
        headerTitle: 'Preparati',
        mainText: 'Si comincia...',
    });

    workoutItems.forEach((item) => {
        if (item.type === 'rest') {
            plan.push({
                type: 'rest',
                duration: (item.duration || 60) * 1000,
                headerTitle: 'Riposo',
                mainText: 'Come da programma',
                isSeriesRest: false,
                item,
            });
        } else { // 'exercise' o 'time'
            const totalSeries = item.series || 1;
            for (let i = 1; i <= totalSeries; i++) {
                plan.push(...unrollExerciseSeries(item, i));
            }
        }
    });

    // Passo Finale: Completamento
    plan.push({
        type: 'finished',
        duration: 0,
        headerTitle: 'Fine',
        mainText: 'Workout Completato!',
    });

    return plan;
}
