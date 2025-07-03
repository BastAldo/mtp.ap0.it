function createActionSteps(item, seriesIndex) {
    const steps = [];
    const totalSeries = item.series || 1;
    const baseContext = { currentSeries: seriesIndex, totalSeries, item };

    if (item.type === 'time') {
        steps.push({ type: 'announcing-phase', duration: 750, headerTitle: item.name, mainText: `Esegui`, context: baseContext, item });
        steps.push({ type: 'action', duration: (item.duration || 10) * 1000, headerTitle: item.name, mainText: `RUN`, context: baseContext, item });
    } else {
        const totalReps = item.reps || 1;
        const tempoPhases = Object.keys(item.tempo || { exec: 1 });
        for (let repIndex = 1; repIndex <= totalReps; repIndex++) {
            const repContext = { ...baseContext, currentRep: repIndex, totalReps };
            tempoPhases.forEach(phase => {
                const phaseContext = { ...repContext, phase };
                // Inserisce un annuncio PRIMA di ogni fase di azione
                steps.push({ type: 'announcing-phase', duration: 750, headerTitle: item.name, mainText: phase.toUpperCase(), context: phaseContext, item });
                steps.push({ type: 'action', duration: (item.tempo[phase] || 1) * 1000, headerTitle: item.name, mainText: phase.toUpperCase(), context: phaseContext, item });
            });
        }
    }
    return steps;
}

export function generatePlan(workoutItems) {
    if (!workoutItems || workoutItems.length === 0) return [];

    let plan = [{ type: 'preparing', duration: 3000, headerTitle: 'Preparati', mainText: 'Si comincia...' }];

    workoutItems.forEach((item, index) => {
        if (item.type === 'rest') {
            plan.push({ type: 'rest', duration: item.duration * 1000, headerTitle: 'Riposo', mainText: `Prossimo: ${workoutItems[index + 1]?.name || 'Fine'}`, item });
        } else {
            plan.push(...createActionSteps(item, index + 1));
        }
    });

    plan.push({ type: 'finished', duration: 0, headerTitle: 'Fine', mainText: 'Workout Completato!' });
    return plan;
}
