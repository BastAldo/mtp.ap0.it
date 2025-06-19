// ===================================================================================
//  LIBRERIA DEGLI ESERCIZI
// ===================================================================================
// Qui si possono aggiungere o modificare gli esercizi.
// type: 'reps' per esercizi a ripetizioni, 'time' per esercizi a tempo (es. plank)

export const EXERCISE_LIBRARY = [
    {
        id: 'ex_calf_raises',
        name: "Calf Raises (2 Gambe)",
        description: "Esercizio base per la forza del polpaccio. Mantieni il corpo dritto e il core attivo. Spingi sulle punte dei piedi in modo controllato, raggiungi la massima contrazione per 1-2 secondi, e torna giù lentamente. Evita di rimbalzare o usare lo slancio. Fondamentale per la spinta finale nella pattinata.",
        type: 'reps',
        defaultSets: 3,
        defaultReps: 20,
        defaultTempo: { up: 2, hold: 1, down: 2 }
    },
    {
        id: 'ex_calf_raises_tempo',
        name: "Calf Raises (Tempo Lento)",
        description: "Variante cruciale per aumentare la forza e la resistenza. La discesa lenta (fase eccentrica) potenzia il muscolo e i tendini. Mantieni il controllo totale per tutti i 4 secondi di discesa, senza 'crollare' alla fine. Ottimo per la stabilità della caviglia in tutte le situazioni.",
        type: 'reps',
        defaultSets: 3,
        defaultReps: 15,
        defaultTempo: { up: 2, hold: 1, down: 4 }
    },
    {
        id: 'ex_calf_raises_uni',
        name: "Calf Raises (1 Gamba)",
        description: "Esercizio chiave che simula la spinta su un singolo pattino. Appoggiati leggermente a un muro solo per l'equilibrio, non per togliere peso. Concentrati sulla stabilità della caviglia e del ginocchio. La qualità del movimento è più importante della quantità.",
        type: 'reps',
        defaultSets: 3,
        defaultReps: 15,
        defaultTempo: { up: 2, hold: 1, down: 3 }
    },
    {
        id: 'ex_calf_hops',
        name: "Calf Hops (Saltelli Esplosivi)",
        description: "L'obiettivo qui è la rapidità e l'esplosività, non l'altezza. Pensa a saltare come se stessi usando una corda, con le ginocchia leggermente flesse. Ammortizza ogni atterraggio. Sviluppa la potenza necessaria per i salti e i cambi di direzione rapidi sui pattini.",
        type: 'reps',
        defaultSets: 4,
        defaultReps: 15,
        defaultTempo: { up: 0.5, hold: 0, down: 1 }
    },
    {
        id: 'ex_squat',
        name: "Squat a Corpo Libero",
        description: "Movimento fondamentale per la forza di quadricipiti e glutei. Tieni i piedi alla larghezza delle spalle. Scendi controllando il movimento, con il peso sui talloni, come per sederti. La profondità ideale è quella che ti permette di mantenere la schiena dritta. Simula e rinforza la posizione base del pattinaggio.",
        type: 'reps',
        defaultSets: 3,
        defaultReps: 15,
        defaultTempo: { up: 2, hold: 0, down: 2 }
    },
    {
        id: 'ex_lunges',
        name: "Affondi Alternati",
        description: "Eccellente per la forza e la stabilità di ogni singola gamba. Fai un passo controllato, non troppo lungo. Il ginocchio anteriore non deve superare la punta del piede. Mantieni il core contratto per non sbilanciarti. Migliora l'equilibrio e la potenza nella spinta laterale.",
        type: 'reps', // Reps per gamba
        defaultSets: 3,
        defaultReps: 10,
        defaultTempo: { up: 1.5, hold: 0, down: 1.5 },
    },
    {
        id: 'ex_plank',
        name: "Plank",
        description: "Esercizio isometrico per la stabilità del core. Il tuo corpo deve essere una tavola rigida. Non lasciare che i fianchi cedano verso il basso né che si alzino troppo. Un core forte è il centro di trasferimento della potenza dal corpo ai pattini, fondamentale per l'equilibrio e una pattinata efficiente.",
        type: 'time',
        defaultSets: 3,
        defaultDuration: 30, // in secondi
    }
];
