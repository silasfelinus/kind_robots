import assert from 'node:assert/strict'
import {
  commitWitnessedEncounter,
  emptyWitnessedEncounterLedger,
  restoreWitnessedEncounterLedger,
  type WitnessedEncounterDefinition,
  type WitnessedEncounterEvent,
} from '../memoryDungeon/witnessedEncounterLedger'

const definitions: WitnessedEncounterDefinition[] = [
  {
    sceneId: 'night-shift-laundromat',
    worldId: 'e03',
    choices: {
      'ask-attendant': ['uniform-name', 'attendant-account'],
      'walk-away': [],
    },
  },
  {
    sceneId: 'night-shift-hospital',
    worldId: 'e04',
    choices: {
      'wait-for-hours': ['visiting-hours'],
      'leave-quietly': [],
    },
  },
]

const first: WitnessedEncounterEvent = {
  eventId: 'e03-laundromat-1',
  sceneId: 'night-shift-laundromat',
  worldId: 'e03',
  choiceId: 'ask-attendant',
  turn: 4,
}
const empty = emptyWitnessedEncounterLedger()
const committed = commitWitnessedEncounter(empty, first, definitions)
assert.ok(committed)
assert.deepEqual(committed.evidence, ['attendant-account', 'uniform-name'])
assert.deepEqual(
  commitWitnessedEncounter(committed, first, definitions),
  committed,
  'replaying an identical event is idempotent',
)
assert.equal(
  commitWitnessedEncounter(
    committed,
    { ...first, choiceId: 'walk-away' },
    definitions,
  ),
  null,
  'an existing scene cannot be farmed for a different reward',
)
assert.equal(
  commitWitnessedEncounter(
    committed,
    { ...first, eventId: 'duplicate-scene', turn: 5 },
    definitions,
  ),
  null,
)
assert.equal(
  commitWitnessedEncounter(
    committed,
    { ...first, eventId: 'forged', choiceId: 'unknown', turn: 5 },
    definitions,
  ),
  null,
)
assert.equal(
  commitWitnessedEncounter(
    committed,
    { ...first, eventId: 'bad-world', worldId: 'e09', turn: 5 },
    definitions,
  ),
  null,
)
assert.equal(
  commitWitnessedEncounter(
    committed,
    { ...first, eventId: 'old-turn', turn: 3 },
    definitions,
  ),
  null,
)
const second = commitWitnessedEncounter(
  committed,
  {
    eventId: 'e04-hospital-1',
    sceneId: 'night-shift-hospital',
    worldId: 'e04',
    choiceId: 'wait-for-hours',
    turn: 7,
  },
  definitions,
)
assert.ok(second)
assert.deepEqual(second.evidence, [
  'attendant-account',
  'uniform-name',
  'visiting-hours',
])
assert.deepEqual(
  restoreWitnessedEncounterLedger(
    JSON.parse(JSON.stringify(second)),
    definitions,
  ),
  second,
  'save/reload reconstructs exactly the witnessed evidence',
)
assert.equal(
  restoreWitnessedEncounterLedger(
    { ...second, evidence: [...second.evidence, 'free-reward'] },
    definitions,
  ),
  null,
  'a forged inventory evidence flag cannot survive restore',
)
assert.equal(
  restoreWitnessedEncounterLedger(
    { ...second, events: [second.events[1], second.events[0]] },
    definitions,
  ),
  null,
  'reordered event chronology is rejected',
)
assert.equal(
  restoreWitnessedEncounterLedger(
    { ...second, events: [second.events[0], second.events[0]] },
    definitions,
  ),
  null,
  'duplicate events are rejected',
)

const sharedSceneDefinitions: WitnessedEncounterDefinition[] = [
  {
    sceneId: 'night-shift-crossing',
    worldId: 'e03',
    choices: { 'stay-behind': ['e03-crossing-witness'] },
  },
  {
    sceneId: 'night-shift-crossing',
    worldId: 'e04',
    choices: { 'board-train': ['e04-crossing-witness'] },
  },
]
const firstCrossing = commitWitnessedEncounter(
  emptyWitnessedEncounterLedger(),
  {
    eventId: 'e03-crossing-1',
    sceneId: 'night-shift-crossing',
    worldId: 'e03',
    choiceId: 'stay-behind',
    turn: 1,
  },
  sharedSceneDefinitions,
)
assert.ok(firstCrossing)
const bothCrossings = commitWitnessedEncounter(
  firstCrossing,
  {
    eventId: 'e04-crossing-2',
    sceneId: 'night-shift-crossing',
    worldId: 'e04',
    choiceId: 'board-train',
    turn: 2,
  },
  sharedSceneDefinitions,
)
assert.ok(bothCrossings)
assert.deepEqual(bothCrossings.evidence, [
  'e03-crossing-witness',
  'e04-crossing-witness',
])
assert.deepEqual(
  restoreWitnessedEncounterLedger(
    JSON.parse(JSON.stringify(bothCrossings)),
    sharedSceneDefinitions,
  ),
  bothCrossings,
  'same scene slug in separate worlds survives save restoration',
)
assert.equal(
  commitWitnessedEncounter(
    bothCrossings,
    {
      eventId: 'e04-crossing-repeat',
      sceneId: 'night-shift-crossing',
      worldId: 'e04',
      choiceId: 'board-train',
      turn: 3,
    },
    sharedSceneDefinitions,
  ),
  null,
  'the same world-scoped scene cannot pay twice',
)

console.log('Memory Dungeon witnessed encounter ledger: 18 assertions passed')
