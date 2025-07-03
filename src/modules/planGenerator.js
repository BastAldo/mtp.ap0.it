// --- Modulo Generatore di Piani di Esecuzione per il Trainer ---

/**
 * Struttura di un "Oggetto-Passo" (Step Object) generato:
 * {
 * type: string,          // 'preparing', 'announcing', 'action', 'rest', 'finished'
 * duration: number,      // Durata del passo in millisecondi
 * headerTitle: string,   // Testo principale per l'header del trainer (es. nome esercizio)
 * mainText: string,      // Testo secondario per il centro del trainer (es. 'RIPOSO', 'UP', 'DOWN')
 * item?: object,         // Riferimento all'item originale del workout (se applicabile)
 * context?: object,      // Contesto specifico del passo (es. { currentSeries, totalSeries, ... })
 * }
 */

function unrollExerciseSeries(item, seriesIndex) {
    const steps = [];
    const totalSeries = item.series || 1;
    const totalReps = item.reps || 1;

    if (seriesIndex === 1) {
        steps.push({
            type: 'announcing',
            duration: 2000,
            headerTitle: 'Prossimo Esercizio',
            mainText: item.name,
            item,
        });
    }

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

export function generatePlan(workoutItems) {
    if (!workoutItems || workoutItems.length === 0) return [];

    const plan = [];

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
        } else {
            const totalSeries = item.series || 1;
            for (let i = 1; i <= totalSeries; i++) {
                plan.push(...unrollExerciseSeries(item, i));
            }
        }
    });

    plan.push({
        type: 'finished',
        duration: 0,
        headerTitle: 'Fine',
        mainText: 'Workout Completato!',
    });

    return plan;
}
