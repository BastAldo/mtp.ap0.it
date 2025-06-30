/**
 * @file config.js
 *
 * Contiene dati di configurazione statici per l'applicazione,
 * come la lista degli esercizi disponibili.
 */

export const EXERCISES = [
    {
        id: 'ex01',
        name: 'Push Up',
        description: 'Classico piegamento sulle braccia.',
        type: 'reps', // 'reps' o 'time'
        series: 3,
        reps: 10,
        tempo: { up: 1, hold: 0, down: 2 }, // Durata in secondi per ogni fase
        rest: 60, // Secondi di riposo tra le serie
    },
    {
        id: 'ex02',
        name: 'Plank',
        description: 'Mantenere la posizione isometrica.',
        type: 'time',
        series: 3,
        duration: 45, // Durata in secondi
        rest: 60,
    },
    {
        id: 'ex03',
        name: 'Squat',
        description: 'Piegamento sulle gambe a corpo libero.',
        type: 'reps',
        series: 4,
        reps: 15,
        tempo: { up: 1, hold: 1, down: 2 },
        rest: 60,
    },
    {
        id: 'ex04',
        name: 'Jumping Jacks',
        description: 'Esercizio cardio.',
        type: 'time',
        series: 2,
        duration: 60,
        rest: 75,
    }
];
