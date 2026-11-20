import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  crewPatrolAftermath,
  patrolCrewFor,
  witnessedPatrolCrew,
} from '../cometAcademy/patrolCrews'
import { crewSpeciesCards } from '../cometAcademy/consoleScreens'
import { VILLAIN_HENCHMEN } from '../cometAcademy/villainHenchmen'
import { PATROL_ZONES } from '../cometAcademy/nightPatrols'
import {
  activePatrolStory,
  chooseNightPatrol,
  nightPatrolBeat,
  patrolEncounterFor,
  patrolOptionsFor,
  resolveDispatch,
  restoreAcademy,
  startFullAcademy,
} from '../cometAcademy/rules'

const choices = new Set<string>()
for (const henchman of VILLAIN_HENCHMEN) {
  const encounter = patrolCrewFor(
    { day: 17, opponentSignature: henchman.signature },
    'harbor',
  )
  assert.ok(encounter, henchman.signature)
  assert.equal(encounter.crew.name, henchman.name)
  assert.equal(encounter.choices.length, 3)
  assert.ok(encounter.scene.includes(henchman.move))
  assert.ok(encounter.choices[0]!.result.includes(henchman.counter))
  assert.ok(encounter.choices.every((choice) => choice.result.length > 120))
  for (const choice of encounter.choices) {
    assert.ok(!choices.has(choice.id), 'unique choices for all 48 crews')
    choices.add(choice.id)
    assert.ok(
      witnessedPatrolCrew(
        { day: 17, opponentSignature: henchman.signature },
        'harbor',
        choice.id,
      ),
    )
  }
}
assert.equal(choices.size, 144)

// Adversarial, seeded end-to-end routes through all three captain choices.
for (const seed of [1, 73, 404, 777, 2314, 99007]) {
  const start = {
    ...startFullAcademy('kinetic', seed),
    day: 17,
    phase: 'dispatch' as const,
  }
  const patrolZone = PATROL_ZONES.find(
    (candidate) => !activePatrolStory(start, candidate.id),
  )!.id
  const crew = patrolCrewFor(start, patrolZone)!
  assert.equal(crewSpeciesCards(start).length, 0, 'unknown crews stay hidden')
  for (const choice of crew.choices) {
    const selected = chooseNightPatrol(start, patrolZone, choice.id)
    assert.equal(selected.nightPatrol?.choiceId, choice.id)
    const debrief = resolveDispatch(selected)
    assert.equal(debrief.phase, 'debrief')
    assert.deepEqual(
      restoreAcademy(JSON.parse(JSON.stringify(debrief))),
      debrief,
      'crew choice survives a save round-trip',
    )
    const cards = crewSpeciesCards(debrief)
    assert.equal(cards.length, 1, 'only the witnessed SPECIES is unlocked')
    assert.equal(cards[0]!.name, crew.crew.name)
    assert.equal(cards[0]!.captain, crew.crew.captain)
    assert.equal(cards[0]!.facetType, 'SPECIES')
    assert.equal(cards[0]!.hp, 1)
    const nextNight = {
      ...debrief,
      day: 18,
      phase: 'dispatch' as const,
    }
    const callback = crewPatrolAftermath(nextNight)
    assert.ok(callback?.includes(crew.crew.captain))
    assert.ok(nightPatrolBeat(nextNight)?.text.includes(callback!))
    assert.equal(crewPatrolAftermath({ ...nextNight, day: 19 }), null)
  }
}

const run = {
  ...startFullAcademy('kinetic', 73),
  day: 25,
  phase: 'dispatch' as const,
}
const zone = PATROL_ZONES.find(
  (candidate) => !activePatrolStory(run, candidate.id),
)!.id
const encounter = patrolCrewFor(run, zone)!
const scene = patrolEncounterFor(run, zone)
assert.ok(scene.title.includes(encounter.title))
assert.ok(scene.scene.includes(encounter.crew.name))
const options = patrolOptionsFor(run, zone)
for (const choice of encounter.choices)
  assert.ok(options.some((entry) => entry.id === choice.id))
assert.ok(
  options.some((option) => !option.id.startsWith('crew-')),
  'the existing rotating patrol choices remain playable for old saves',
)
const mercy = encounter.choices[1]!
const chosen = chooseNightPatrol(run, zone, mercy.id)
assert.equal(chosen.nightPatrol?.choiceId, mercy.id)
assert.equal(crewSpeciesCards(chosen).length, 0, 'pending choices reveal nothing')
assert.deepEqual(restoreAcademy(JSON.parse(JSON.stringify(chosen))), chosen)
const debrief = resolveDispatch(chosen)
assert.equal(debrief.phase, 'debrief')
assert.equal(debrief.patrolHistory?.at(-1)?.encounterId, scene.id)
assert.ok(
  debrief.reports.some((report) => report.text.includes(encounter.crew.name)),
)
assert.deepEqual(restoreAcademy(JSON.parse(JSON.stringify(debrief))), debrief)
assert.equal(
  patrolCrewFor(
    { ...run, day: 29, patrolHistory: debrief.patrolHistory },
    zone,
  ),
  null,
  'meeting the crew persists: do not re-encounter them later',
)
assert.equal(patrolCrewFor({ ...run, day: 18 }, zone), null)
assert.equal(patrolCrewFor({ ...run, day: 13 }, zone), null)
const forged = {
  ...debrief,
  patrolHistory: debrief.patrolHistory!.map((memory) => ({
    ...memory,
    choiceId: 'crew-psychic-water-mercy-intervene',
  })),
}
if (run.opponentSignature !== 'psychic-water')
  assert.equal(
    restoreAcademy(JSON.parse(JSON.stringify(forged))),
    null,
    'the crew recorded in a save must match its canonical rival',
  )
const screens = readFileSync('utils/cometAcademy/consoleScreens.ts', 'utf8')
const ui = readFileSync('components/play/cometAcademy/AcademyConsoleScreens.vue', 'utf8')
assert.ok(ui.includes('data-testid="academy-species-card"'))
assert.ok(screens.includes('witnessedPatrolCrew('))
console.log(
  'Prom crew patrols: 48 canonical rival species, 144 authored choices, live debrief, saved history, legacy patrols and forgery guards verified.',
)
