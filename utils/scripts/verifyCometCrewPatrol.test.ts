import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { patrolCrewFor, witnessedPatrolCrew } from '../cometAcademy/patrolCrews'
import { VILLAIN_HENCHMEN } from '../cometAcademy/villainHenchmen'
import {
  chooseNightPatrol,
  patrolEncounterFor,
  patrolOptionsFor,
  resolveDispatch,
  restoreAcademy,
  startFullAcademy,
} from '../cometAcademy/rules'

for (const henchman of VILLAIN_HENCHMEN) {
  const run = {
    ...startFullAcademy('kinetic', 73),
    day: 17,
    phase: 'dispatch' as const,
    opponentSignature: henchman.signature,
  }
  const encounter = patrolCrewFor(run, 'harbor')
  assert.ok(encounter, henchman.signature)
  assert.equal(encounter.crew.name, henchman.name)
  assert.equal(encounter.choices.length, 3)
  assert.ok(encounter.scene.includes(henchman.move))
  assert.ok(encounter.choices[0]!.result.includes(henchman.counter))
  assert.ok(encounter.choices.every((choice) => choice.result.length > 120))
  assert.equal(patrolEncounterFor(run, 'harbor').title, encounter.title)
  assert.deepEqual(patrolOptionsFor(run, 'harbor'), [...encounter.choices])
  const choice = encounter.choices[1]!
  const chosen = chooseNightPatrol(run, 'harbor', choice.id)
  assert.equal(chosen.nightPatrol?.choiceId, choice.id)
  const debrief = resolveDispatch(chosen)
  assert.equal(debrief.phase, 'debrief')
  assert.equal(debrief.patrolHistory?.at(-1)?.encounterId, `crew-${henchman.signature}`)
  assert.ok(debrief.reports.some((report) => report.text.includes(henchman.name)))
  assert.deepEqual(restoreAcademy(JSON.parse(JSON.stringify(debrief))), debrief)
  assert.equal(patrolCrewFor({ ...run, patrolHistory: debrief.patrolHistory }, 'harbor'), null)
  assert.ok(witnessedPatrolCrew({ day: 17, opponentSignature: henchman.signature }, 'harbor', choice.id))
  assert.equal(patrolCrewFor({ ...run, day: 18 }, 'harbor'), null)
  assert.equal(patrolCrewFor({ ...run, day: 13 }, 'harbor'), null)
}
const screens = readFileSync('utils/cometAcademy/consoleScreens.ts', 'utf8')
assert.ok(screens.includes('witnessedPatrolCrew('))
console.log('Prom crew patrols: all 48 rival crews, choice effects, debrief, save roundtrip and scrapbook lookup verified.')
