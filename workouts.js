export const WORKOUTS = [
    {
        id: 'ex_calf_raises',
        name: "Calf Raises (2 Gambe)",
        description: "Sollevamento sui polpacci. Contrazione massima in alto e discesa controllata.",
        type: 'reps',
        defaultSets: 3,
        defaultReps: 20,
        defaultRest: 60,
        defaultTempo: { up: 2, hold: 1, down: 2 }
    },
    {
        id: 'ex_calf_raises_uni',
        name: "Calf Raises (1 Gamba)",
        description: "Sollevamento su un polpaccio alla volta. Mantieni l'equilibrio.",
        type: 'reps',
        defaultSets: 3,
        defaultReps: 15,
        defaultRest: 60,
        defaultTempo: { up: 2, hold: 1, down: 3 }
    },
    {
        id: 'ex_squat',
        name: "Squat a Corpo Libero",
        description: "Scendi come se ti sedessi, schiena dritta e petto in fuori.",
        type: 'reps',
        defaultSets: 3,
        defaultReps: 15,
        defaultRest: 90,
        defaultTempo: { up: 2, hold: 0, down: 2 }
    },
    {
        id: 'ex_squa_fake_test',
        name: "Squat a Corpo Libero",
        description: "Scendi come se ti sedessi, schiena dritta e petto in fuori.",
        type: 'reps',
        defaultSets: 1,
        defaultReps: 1,
        defaultRest: 1,
        defaultTempo: { up: 2, hold: 0, down: 2 }
    },
    {
        id: 'ex_pushup',
        name: "Push-up",
        description: "Partendo dalla posizione di plank, piega i gomiti per abbassare il petto verso il pavimento e poi spingi per tornare su.",
        type: 'reps',
        defaultSets: 3,
        defaultReps: 10,
        defaultRest: 60,
        defaultTempo: { up: 1, hold: 0, down: 2 }
    },
    {
        id: 'ex_plank',
        name: "Plank",
        description: "Mantieni una linea retta dalla testa ai talloni, contraendo addominali e glutei.",
        type: 'time',
        defaultSets: 3,
        defaultDuration: 30,
        defaultRest: 45,
    },
    {
        id: 'ex_jumping_jacks',
        name: "Jumping Jacks",
        description: "Esercizio cardio per riscaldamento o defaticamento.",
        type: 'time',
        defaultSets: 1,
        defaultDuration: 60,
        defaultRest: 0,
    }
];