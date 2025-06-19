
// workouts.js
// ===================================================================================
//  LIBRERIA DEGLI ESERCIZI
// ===================================================================================
// Qui si possono aggiungere o modificare gli esercizi.
// type: 'reps' per esercizi a ripetizioni, 'time' per esercizi a tempo (es. plank)


export const WORKOUTS = [
  {
    name: 'Squat',
    type: 'reps', // 'reps' or 'time'
    description: 'Scendi piegando le ginocchia come se ti stessi sedendo su una sedia, mantenendo la schiena dritta e il petto in fuori.',
    defaultParams: {
      series: 3,
      reps: 12,
      rest: 60, // seconds
    }
  },
  {
    name: 'Plank',
    type: 'time',
    description: 'Mantieni una posizione di push-up, appoggiandoti sugli avambracci. Tieni il corpo in linea retta dalla testa ai piedi.',
    defaultParams: {
      series: 3,
      duration: 30, // seconds
      rest: 60,
    }
  },
  {
    name: 'Push-up',
    type: 'reps',
    description: 'Partendo dalla posizione di plank, piega i gomiti per abbassare il petto verso il pavimento e poi spingi per tornare su.',
    defaultParams: {
      series: 3,
      reps: 10,
      rest: 60,
    }
  },
  {
    name: 'Jumping Jacks',
    type: 'time',
    description: 'Parti in piedi con le gambe unite e le braccia lungo i fianchi. Salta divaricando le gambe e portando le braccia sopra la testa, poi torna alla posizione di partenza.',
    defaultParams: {
        series: 1,
        duration: 60, // seconds
        rest: 0,
    }
  }
];