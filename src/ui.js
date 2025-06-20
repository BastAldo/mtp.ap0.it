/**
 * @file ui.js
 * Responsible for all direct DOM manipulations and user feedback (visual/audio).
 */

// --- Views ---
const calendarView = document.getElementById('calendar-view');
const trainerView = document.getElementById('trainer-view');
const debriefingView = document.getElementById('debriefing-view');
const views = { calendar: calendarView, trainer: trainerView, debriefing: debriefingView };

// --- Trainer View Elements ---
const trainerExerciseTitle = document.getElementById('trainer-exercise-title');
const trainerSeriesCounter = document.getElementById('trainer-series-counter');
const trainerMainText = document.getElementById('trainer-main-text');
const trainerDescription = document.getElementById('trainer-description');
const startSessionBtn = document.getElementById('start-session-btn');
const pauseResumeBtn = document.getElementById('pause-resume-btn');
const terminateBtn = document.getElementById('terminate-btn');

// --- Progress Ring Elements ---
const progressRingFg = document.getElementById('progress-ring-foreground');
const ringRadius = progressRingFg.r.baseVal.value;
const ringCircumference = 2 * Math.PI * ringRadius;
progressRingFg.style.strokeDasharray = `${ringCircumference} ${ringCircumference}`;

function updateProgressRing(percentage) {
  const offset = ringCircumference - (percentage / 100) * ringCircumference;
  progressRingFg.style.strokeDashoffset = offset;
}

export function showView(viewName) {
  Object.values(views).forEach(view => view.classList.remove('view--active'));
  if (views[viewName]) {
    views[viewName].classList.add('view--active');
  }
}

export function updateTrainerUI(state) {
  const { exercise, currentSeries, currentRep, phase, countdown, totalDuration, currentState } = state;

  trainerExerciseTitle.textContent = exercise ? exercise.name : 'Workout';
  
  // Update series and reps counter
  if (exercise) {
    let seriesText = `Serie ${currentSeries} / ${exercise.series}`;
    if (exercise.type === 'reps' && currentState === 'action') {
      seriesText += `  |  Rip. ${currentRep} / ${exercise.reps}`;
    }
    trainerSeriesCounter.textContent = seriesText;
  } else {
    trainerSeriesCounter.textContent = '';
  }

  // Update main display text and progress ring
  if (currentState === 'ready') {
    trainerMainText.textContent = "Pronto?";
    updateProgressRing(100);
  } else if (totalDuration > 0) {
    trainerMainText.innerHTML = `${phase}<br><small>${totalDuration}s</small>`;
    const elapsed = totalDuration - countdown;
    const progressPercentage = (elapsed / totalDuration) * 100;
    updateProgressRing(progressPercentage);
  } else {
      trainerMainText.textContent = phase;
      updateProgressRing(0);
  }
  
  // Update button visibility and state
  startSessionBtn.style.display = currentState === 'ready' ? 'block' : 'none';
  pauseResumeBtn.style.display = currentState !== 'ready' ? 'block' : 'none';
  terminateBtn.style.display = currentState !== 'ready' ? 'block' : 'none';

  pauseResumeBtn.disabled = !(currentState === 'action' || currentState === 'paused');
  if (currentState === 'paused') {
      pauseResumeBtn.textContent = 'Riprendi';
  } else {
      pauseResumeBtn.textContent = 'Pausa';
  }
}

export function initTrainerControls(handlers) {
    startSessionBtn.addEventListener('click', () => handlers.onConfirmStart());
    pauseResumeBtn.addEventListener('click', () => handlers.onPauseResume());
    terminateBtn.addEventListener('click', () => handlers.onTerminate());
}

let audioCtx;
export function playTick() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
  oscillator.start(audioCtx.currentTime);
  oscillator.stop(audioCtx.currentTime + 0.05);
}
