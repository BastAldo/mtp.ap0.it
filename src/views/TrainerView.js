/**
 * @file TrainerView.js
 * @description Manages the entire training session view and its state machine.
 */
import { _ } from '../../assets/localization.js';
import * as Store from '../store.js';

const TrainerView = {
    viewElement: document.getElementById('trainer-view'),
    title: document.getElementById('trainer-title'),
    statusMessage: document.getElementById('status-message'),
    timerDisplay: document.getElementById('timer'),
    pauseButton: document.getElementById('pause-button'),
    playButton: document.getElementById('play-button'),
    stopButton: document.getElementById('stop-button'),

    // State Machine properties
    router: null,
    currentState: 'IDLE', // IDLE, PREPARATION, EXECUTION, REST, PAUSED, COMPLETED
    exercisePlan: [],
    currentExerciseIndex: 0,
    currentExercise: null,
    currentSeries: 0,
    currentRep: 0,

    // Timer properties
    timerInterval: null,
    timerDuration: 0,
    savedStateBeforePause: null,

    /**
     * Initializes the view, sets up event listeners.
     * @param {object} router - The application router instance.
     */
    init(router) {
        this.router = router;
        this.pauseButton.addEventListener('click', () => this.pause());
        this.playButton.addEventListener('click', () => this.resume());
        this.stopButton.addEventListener('click', () => this.stop());
    },

    /**
     * Starts a new training session with a list of exercise IDs.
     * @param {string[]} exerciseIds - An array of exercise IDs to perform.
     */
    start(exerciseIds) {
        if (!exerciseIds || exerciseIds.length === 0) {
            console.error("Cannot start trainer without exercises.");
            this.router.navigateTo('exercises');
            return;
        }

        this.exercisePlan = exerciseIds.map(id => Store.getExerciseById(id)).filter(Boolean);

        if (this.exercisePlan.length === 0) {
            console.error("Exercises not found for the given IDs.");
            this.router.navigateTo('exercises');
            return;
        }

        this.currentExerciseIndex = 0;
        this.currentExercise = this.exercisePlan[0];
        this._transitionTo('PREPARATION');
    },

    /**
     * Pauses the current timer and training state.
     */
    pause() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
            this.savedStateBeforePause = this.currentState;
            this._transitionTo('PAUSED');
        }
    },

    /**
     * Resumes training from a paused state.
     */
    resume() {
        if (this.currentState === 'PAUSED') {
            const resumingToState = this.savedStateBeforePause;
            this.savedStateBeforePause = null;
            // We don't use _transitionTo here because we need to resume a timer, not start a new phase.
            this.currentState = resumingToState;
            this._startTimer(this.timerDuration, this._getNextStateAfter(resumingToState));
        }
    },

    /**
     * Stops the training session completely and returns to the exercise selection.
     */
    stop() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this._transitionTo('IDLE');
        this.router.navigateTo('exercises');
    },

    /**
     * Transitions the state machine to a new state.
     * @param {string} newState - The state to transition to.
     */
    _transitionTo(newState) {
        this.currentState = newState;

        switch (this.currentState) {
            case 'IDLE':
                // Reset all properties for a clean slate
                this.exercisePlan = [];
                this.currentExercise = null;
                this.currentExerciseIndex = 0;
                this.currentSeries = 0;
                this.currentRep = 0;
                break;

            case 'PREPARATION':
                this.currentSeries = 1;
                this.currentRep = 1;
                this._startTimer(this.currentExercise.preparation, 'EXECUTION');
                break;

            case 'EXECUTION':
                this._startTimer(this.currentExercise.duration, 'REST');
                break;

            case 'REST':
                // Check if there are more reps in the current series
                if (this.currentRep < this.currentExercise.reps) {
                    this.currentRep++;
                    this._startTimer(this.currentExercise.rest, 'EXECUTION');
                }
                // Check if there are more series in the current exercise
                else if (this.currentSeries < this.currentExercise.series) {
                    this.currentSeries++;
                    this.currentRep = 1;
                    // FIX: After resting between series, go directly to EXECUTION.
                    this._startTimer(this.currentExercise.rest, 'EXECUTION');
                }
                // Otherwise, move to the next exercise or complete the workout
                else {
                    this.currentExerciseIndex++;
                    if (this.currentExerciseIndex < this.exercisePlan.length) {
                        this.currentExercise = this.exercisePlan[this.currentExerciseIndex];
                        this._transitionTo('PREPARATION');
                    } else {
                        this._transitionTo('COMPLETED');
                    }
                }
                break;

            case 'PAUSED':
            case 'COMPLETED':
                // These states don't trigger new timers, just update UI
                break;
        }

        // Update the UI after every state transition (except for timer-driven updates)
        this._updateUI();
    },

    /**
     * Starts a countdown timer.
     * @param {number} duration - The duration of the timer in seconds.
     * @param {string} nextState - The state to transition to when the timer finishes.
     */
    _startTimer(duration, nextState) {
        // Clear any existing timer to prevent multiple intervals running
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.timerDuration = duration;
        this._updateUI(); // Immediately update UI with the initial duration

        this.timerInterval = setInterval(() => {
            if (this.timerDuration > 0) {
                this.timerDuration--;
            }
            this._updateUI(); // Update UI every second with the new duration

            if (this.timerDuration <= 0) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
                this._transitionTo(nextState);
            }
        }, 1000);
    },

    /**
     * Determines the next logical state after a given state, used for resuming.
     * @param {string} state - The state we are resuming from.
     * @returns {string} The next state in the sequence.
     */
    _getNextStateAfter(state) {
        if (state === 'PREPARATION') return 'EXECUTION';
        if (state === 'EXECUTION' || state === 'REST') return 'REST';
        return 'IDLE'; // Default fallback
    },

    /**
     * Updates all DOM elements based on the current state of the trainer.
     * This function is designed to be robust and declarative.
     */
    _updateUI() {
        if (!this.currentExercise && this.currentState !== 'COMPLETED' && this.currentState !== 'IDLE') return;

        // --- UI Element Visibility ---
        const isRunning = this.currentState === 'PREPARATION' || this.currentState === 'EXECUTION' || this.currentState === 'REST';
        const isPaused = this.currentState === 'PAUSED';
        const isFinished = this.currentState === 'IDLE' || this.currentState === 'COMPLETED';

        this.pauseButton.style.display = isRunning ? 'block' : 'none';
        this.playButton.style.display = isPaused ? 'block' : 'none';
        this.stopButton.style.display = isFinished ? 'none' : 'block';

        // --- View Styling ---
        if (this.currentState === 'PREPARATION') {
            this.viewElement.classList.add('is-preparing');
        } else {
            this.viewElement.classList.remove('is-preparing');
        }

        // --- Text Content Updates ---
        this.title.textContent = this.currentExercise ? this.currentExercise.name : _('finished');

        switch (this.currentState) {
            case 'PREPARATION':
                this.statusMessage.textContent = _('preparation');
                this.timerDisplay.textContent = this.timerDuration;
                break;
            case 'EXECUTION':
                this.statusMessage.textContent = `${_('series')} ${this.currentSeries}/${this.currentExercise.series} | ${_('rep')} ${this.currentRep}/${this.currentExercise.reps}`;
                this.timerDisplay.textContent = this.timerDuration;
                break;
            case 'REST':
                this.statusMessage.textContent = _('rest');
                this.timerDisplay.textContent = this.timerDuration;
                break;
            case 'PAUSED':
                // Status message should remain as it was before pause.
                // The timer display also remains, showing time left.
                break;
            case 'COMPLETED':
                this.statusMessage.textContent = _('workout-completed');
                this.timerDisplay.textContent = '✓';
                break;
            default: // IDLE
                this.statusMessage.textContent = '';
                this.timerDisplay.textContent = '';
                break;
        }
    }
};

export default TrainerView;
