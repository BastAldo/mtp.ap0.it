# Contratto API e Dati Mock

Questo documento definisce il contratto dati tra il frontend e il backend. Il frontend svilupperà basandosi su queste strutture. Il backend dovrà implementare API che restituiscano dati conformi a questo contratto.

## 1. Oggetto Workout
```json
{
  "id": "workout-uuid-001",
  "date": "2025-07-21",
  "name": "Spinta A - Petto e Tricipiti",
  "items": [
    { "exerciseId": "ex-001", "exerciseName": "Panca Piana", "sets": 3, "reps": 8 },
    { "exerciseId": "ex-003", "exerciseName": "Plank", "sets": 2, "durationSeconds": 60 }
  ]
}
```

## 2. Oggetto ExecutionPlan
```json
[
  { "type": "PREPARE", "durationSeconds": 5 },
  { "type": "ANNOUNCE", "exerciseName": "Panca Piana" },
  { "type": "EXERCISE", "set": 1, "reps": 8 },
  { "type": "REST", "durationSeconds": 90 },
  { "type": "EXERCISE", "set": 2, "reps": 8 },
  { "type": "REST", "durationSeconds": 90 },
  { "type": "EXERCISE", "set": 3, "reps": 8 },
  { "type": "FINISHED" }
]
```
