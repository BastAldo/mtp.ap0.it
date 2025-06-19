// ===================================================================================
//  LIBRERIA DEGLI ESERCIZI
// ===================================================================================
// Qui puoi aggiungere o modificare tutti gli esercizi che vuoi.
// type: 'reps' per esercizi a ripetizioni, 'time' per esercizi a tempo (es. plank)

export const EXERCISE_LIBRARY = [
    {
        id: 'ex_calf_raises',
        name: "Calf Raises (2 Gambe)",
        description: "Sollevamento sui polpacci a due gambe. Concentrati sulla contrazione massima in alto e su una discesa controllata.",
        type: 'reps',
        defaultSets: 3,
        defaultReps: 20,
        defaultTempo: { up: 2, hold: 1, down: 2 }
    },
    {
        id: 'ex_calf_raises_tempo',
        name: "Calf Raises (Tempo Lento)",
        description: "Focus sulla fase di discesa. Scendi molto lentamente (4 secondi) per massimizzare la tensione muscolare.",
        type: 'reps',
        defaultSets: 3,
        defaultReps: 15,
        defaultTempo: { up: 2, hold: 1, down: 4 }
    },
    {
        id: 'ex_calf_raises_uni',
        name: "Calf Raises (1 Gamba)",
        description: "Sollevamento su un polpaccio alla volta. Mantieni l'equilibrio e controlla il movimento.",
        type: 'reps',
        defaultSets: 3,
        defaultReps: 15,
        defaultTempo: { up: 2, hold: 1, down: 3 }
    },
    {
        id: 'ex_calf_hops',
        name: "Calf Hops (Saltelli Esplosivi)",
        description: "Saltelli esplosivi sui polpacci. Spingi con forza e ammortizza l'atterraggio.",
        type: 'reps',
        defaultSets: 4,
        defaultReps: 15,
        defaultTempo: { up: 0.5, hold: 0, down: 1 }
    },
    {
        id: 'ex_squat',
        name: "Squat a Corpo Libero",
        description: "Scendi come se ti stessi sedendo su una sedia, mantenendo la schiena dritta e il petto in fuori.",
        type: 'reps',
        defaultSets: 3,
        defaultReps: 15,
        defaultTempo: { up: 2, hold: 0, down: 2 }
    },
    {
        id: 'ex_lunges',
        name: "Affondi Alternati",
        description: "Grande passo in avanti, ginocchio posteriore verso il suolo. Busto eretto.",
        type: 'reps', // Reps per gamba
        defaultSets: 3,
        defaultReps: 10,
        defaultTempo: { up: 1.5, hold: 0, down: 1.5 },
    },
    {
        id: 'ex_plank',
        name: "Plank",
        description: "Mantieni una linea retta dalla testa ai talloni, contraendo addominali e glutei.",
        type: 'time',
        defaultSets: 3,
        defaultDuration: 30, // in secondi
    }
];
