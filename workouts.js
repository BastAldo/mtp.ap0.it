export const EXERCISE_LIBRARY = [
    {
        id: 'ex_calf_raises',
        name: "Calf Raises (2 Gambe)",
        description: "Sollevamento sui polpacci. Contrazione massima in alto e discesa controllata.",
        type: 'reps',
        defaultSets: 3,
        defaultReps: 20,
        defaultTempo: { up: 2, hold: 1, down: 2 }
    },
    {
        id: 'ex_calf_raises_uni',
        name: "Calf Raises (1 Gamba)",
        description: "Sollevamento su un polpaccio alla volta. Mantieni l'equilibrio.",
        type: 'reps',
        defaultSets: 3,
        defaultReps: 15,
        defaultTempo: { up: 2, hold: 1, down: 3 }
    },
    {
        id: 'ex_calf_hops',
        name: "Calf Hops",
        description: "Saltelli esplosivi sui polpacci. Spingi con forza e ammortizza.",
        type: 'reps',
        defaultSets: 4,
        defaultReps: 15,
        defaultTempo: { up: 0.5, hold: 0, down: 1 }
    },
    {
        id: 'ex_squat',
        name: "Squat a Corpo Libero",
        description: "Scendi come se ti sedessi, schiena dritta e petto in fuori.",
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
