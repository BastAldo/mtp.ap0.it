function createActionSteps(item, seriesIndex) {
  const steps = [];
  const totalSeries = item.series || 1;
  const context = { currentSeries: seriesIndex, totalSeries, item };

  // Annuncio dell'esercizio
  steps.push({
    type: 'announcing-phase',
    duration: 750,
    headerTitle: item.name,
    mainText: `Serie ${seriesIndex}/${totalSeries}`,
    context,
    item
  });

  if (item.type === 'time') {
    steps.push({ type: 'action', duration: (item.duration || 10) * 1000, headerTitle: item.name, mainText: `Esegui`, context, item });
  } else {
    const totalReps = item.reps || 1;
    const tempoPhases = Object.keys(item.tempo || { exec: 1 });
    for (let repIndex = 1; repIndex <= totalReps; repIndex++) {
      tempoPhases.forEach(phase => {
        steps.push({ type: 'action', duration: (item.tempo[phase] || 1) * 1000, headerTitle: item.name, mainText: phase.toUpperCase(), context: { ...context, currentRep: repIndex, totalReps, phase }, item });
      });
    }
  }
  return steps;
}

export function generatePlan(workoutItems) {
  if (!workoutItems || workoutItems.length === 0) return [];

  let plan = [
    { type: 'preparing', duration: 3000, headerTitle: 'Preparati', mainText: 'Si comincia...' }
  ];

  workoutItems.forEach((item, index) => {
    if (item.type === 'rest') {
      plan.push({
        type: 'rest',
        duration: item.duration * 1000,
        headerTitle: 'Riposo',
        mainText: `Prossimo: ${workoutItems[index + 1]?.name || 'Fine'}`,
        item
      });
    } else {
      const totalSeries = item.series || 1;
      for (let i = 1; i <= totalSeries; i++) {
        plan.push(...createActionSteps(item, i));
      }
    }
  });

  plan.push({ type: 'finished', duration: 0, headerTitle: 'Fine', mainText: 'Workout Completato!' });
  return plan;
}
