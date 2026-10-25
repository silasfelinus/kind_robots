import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  POWERS, STUDENTS, INCIDENTS, assignTeam, chooseEncounter, encounterFor,
  finishAcademy, incidentsFor, nextSchoolDay, resolveDispatch, restoreAcademy, startAcademy,
  type StudentId,
} from '../cometAcademy/rules'

const fromRoot = (path: string) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')
assert.equal(POWERS.length, 6)
assert.equal(STUDENTS.length, 6)
assert.equal(INCIDENTS.length, 6)

for (const power of POWERS) {
  for (const seed of [1, 5, 10, 888, 2026]) {
    let run = startAcademy(power.id, seed)
    for (let day = 1; day <= 7; day++) {
      assert.equal(run.phase, 'dispatch')
      const [a, b] = incidentsFor(run)
      assert.ok(a && b && a.id !== b.id)
      run = assignTeam(run, a.id, ['mina', 'sol'])
      const rejected = assignTeam(run, b.id, ['sol'])
      assert.equal(rejected, run, 'one volunteer cannot work two cases')
      run = assignTeam(run, b.id, ['imani', 'ash', 'nix'])
      assert.equal(run.assignments.length, 2)
      assert.deepEqual(assignTeam(run, b.id, ['kit', 'kit']), run, 'no duplicate roster slots')
      const immutable = JSON.stringify(run)
      const another = resolveDispatch(run)
      assert.equal(JSON.stringify(run), immutable, 'resolve must not mutate the caller')
      assert.equal(another.reports.length, 2)
      assert.equal(another.phase, 'campus')
      assert.ok(another.reports.every((r) => ['honors', 'pass', 'partial', 'failed'].includes(r.grade)))
      const choice = encounterFor(another).options[day % 2]!
      run = chooseEncounter(another, choice.id)
      assert.equal(run.phase, 'debrief')
      const saved = JSON.parse(JSON.stringify(run)) as unknown
      assert.deepEqual(restoreAcademy(saved), run, 'save data remains valid')
      run = nextSchoolDay(run)
    }
    assert.equal(run.phase, 'finale')
    for (const choice of ['protect', 'command'] as const) {
      const ended = finishAcademy(run, choice)
      assert.equal(ended.phase, 'ending')
      assert.ok(ended.ending && ended.scene.length > 25)
      assert.ok(ended.log.some((line) => line.startsWith('Finale:')))
    }
    assert.equal(startAcademy(power.id, seed).seed, seed)
  }
}
const fallback = assignTeam(startAcademy('kinetic', 2), 'unlisted', ['mina' as StudentId])
assert.equal(fallback.assignments.length, 0)
assert.equal(resolveDispatch(startAcademy('kinetic', 2)).phase, 'dispatch')
assert.equal(restoreAcademy({}), null)
assert.equal(restoreAcademy({ version: 999 }), null)
const page = fromRoot('pages/play/comet-city-academy.vue')
const tab = fromRoot('content/channels/arcade/comet-city-academy.md')
const art = fromRoot('public/comet-city-academy/academy-stage.svg')
assert.ok(page.includes('data-layout="console-fixed"'))
assert.ok(page.includes('data-testid="academy-dispatch"'))
assert.ok(tab.includes('route: /play/comet-city-academy'))
assert.ok(art.includes('viewBox="0 0 1440 900"'))
console.log('Comet City Academy playable slice rules and route: OK')
