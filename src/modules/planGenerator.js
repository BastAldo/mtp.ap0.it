// --- Fabbriche di Passi (Step Factories) ---

function createPreparingStep() {
  return { type: 'preparing', duration: 3000, headerTitle: 'Preparati', mainText: 'Si comincia...' };
}

function createAnnouncingStep(item) {
  return { type: 'announcing', duration: 2000, headerTitle: 'Prossimo Esercizio', mainText: item.name, item };
}

function createActionSteps(item, seriesIndex) {
  const steps = [];
  const totalSeries = item.series || 1;
  const totalReps = item.reps || 1;
  const context = { currentSeries: seriesIndex, totalSeries, item };

  if (item.type === 'time') {
    steps.push({ type: 'action', duration: (item.duration || 10) * 1000, headerTitle: item.name, mainText: `Serie ${seriesIndex}/${totalSeries}`, context });
  } else {
    const tempoPhases = Object.keys(item.tempo || { exec: 1 });
    for (let repIndex = 1; repIndex <= totalReps; repIndex++) {
      tempoPhases.forEach(phase => {
        steps.push({ type: 'action', duration: (item.tempo[phase] || 1) * 1000, headerTitle: item.name, mainText: phase.toUpperCase(), context: { ...context, currentRep: repIndex, totalReps, phase } });
      });
    }
  }
  return steps;
}

function createSeriesRestStep(item) {
  return { type: 'rest', duration: (item.defaultRest || 60) * 1000, headerTitle: 'Riposo', mainText: 'Recupera le forze', isSeriesRest: true, item };
}

function createManualRestStep(item) {
  return { type: 'rest', duration: (item.duration || 60) * 1000, headerTitle: 'Riposo', mainText: 'Come da programma', isSeriesRest: false, item };
}

function createFinishedStep() {
  return { type: 'finished', duration: 0, headerTitle: 'Fine', mainText: 'Workout Completato!' };
}

// --- Compositore del Piano ---
export function generatePlan(workoutItems) {
  if (!workoutItems || workoutItems.length === 0) return [];

  const plan = [createPreparingStep()];

  workoutItems.forEach((item, index) => {
    if (item.type === 'rest') {
      plan.push(createManualRestStep(item));
    } else {
      if (index === 0 || workoutItems[index - 1].type === 'rest') {
        plan.push(createAnnouncingStep(item));
      }
      const totalSeries = item.series || 1;
      for (let i = 1; i <= totalSeries; i++) {
        plan.push(...createActionSteps(item, i));
        if (i < totalSeries) {
          plan.push(createSeriesRestStep(item));
        }
      }
    }
  });

  plan.push(createFinishedStep());
  return plan;
}
