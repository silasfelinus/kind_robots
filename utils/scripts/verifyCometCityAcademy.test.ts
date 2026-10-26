import assert from 'node:assert/strict'
import { IDENTITY_ARCS, identityFor } from '../cometAcademy/identityArcs'
import {
  POWER_FORMS,
  POWER_AFFINITIES,
  POWER_VOWS,
  SIGNATURE_POWERS,
  signatureFor,
} from '../cometAcademy/specialPowers'
import { readFileSync } from 'node:fs'
import {
  POWERS,
  STUDENTS,
  INCIDENTS,
  assignTeam,
  chooseEncounter,
  encounterFor,
  finishAcademy,
  incidentsFor,
  nextSchoolDay,
  resolveDispatch,
  restoreAcademy,
  startAcademy,
  type StudentId,
} from '../cometAcademy/rules'

const fromRoot = (path: string) =>
  readFileSync(new URL('../../' + path, import.meta.url), 'utf8')
assert.equal(POWER_FORMS.length, 6)
assert.equal(POWER_AFFINITIES.length, 8)
assert.equal(POWER_VOWS.length, 3)
assert.equal(SIGNATURE_POWERS.length, 48)
assert.equal(IDENTITY_ARCS.length, 48)
assert.deepEqual(
  IDENTITY_ARCS.map((identity) => identity.signature).sort(),
  SIGNATURE_POWERS.map((power) => power.id).sort(),
)
for (const state of ['student', 'hero', 'villain'] as const) {
  assert.equal(
    new Set(IDENTITY_ARCS.map((identity) => identity[state].alias)).size,
    48,
    `All ${state} names must identify distinct people`,
  )
}
assert.equal(new Set(SIGNATURE_POWERS.map((p) => p.id)).size, 48)
assert.equal(signatureFor('impact', 'fire').name, 'Flaming Fists')
for (const form of POWER_FORMS)
  for (const element of POWER_AFFINITIES) {
    const skill = signatureFor(form.id, element.id)
    assert.equal(skill.legacy, form.legacy)
    const identity = identityFor(skill.id)
    assert.notEqual(identity.student.alias, identity.hero.alias)
    assert.notEqual(identity.hero.alias, identity.villain.alias)
    assert.notEqual(identity.hero.method, identity.villain.method)
    assert.ok(identity.student.conflict.length > 16)
    assert.ok(identity.quests.partner.length > 16)
    assert.ok(identity.quests.protagonist.length > 16)
    assert.ok(identity.quests.antagonist.length > 16)
    assert.ok(skill.special_route.trigger.length > 35)
    for (const vow of POWER_VOWS) assert.ok(skill.finales[vow.id].length > 80)
    const run = startAcademy(form.legacy, 99, skill.id, 'shelter')
    assert.equal(run.signature, skill.id)
    assert.equal(run.vow, 'shelter')
    assert.deepEqual(restoreAcademy(JSON.parse(JSON.stringify(run))), run)
    const heroicPreview = finishAcademy({ ...run, phase: 'finale' }, 'protect')
    const villainousPreview = finishAcademy(
      { ...run, phase: 'finale' },
      'command',
    )
    assert.ok(heroicPreview.scene.includes(identity.hero.alias))
    assert.ok(villainousPreview.scene.includes(identity.villain.alias))
    assert.ok(heroicPreview.scene.includes('not yet earned'))
    assert.ok(villainousPreview.scene.includes('not yet inevitable'))
  }
assert.equal(
  startAcademy('kinetic', 99).signature,
  undefined,
  'legacy saves remain valid',
)
assert.throws(() => startAcademy('spatial', 99, 'impact-fire'))
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
      assert.deepEqual(
        assignTeam(run, b.id, ['kit', 'kit']),
        run,
        'no duplicate roster slots',
      )
      const immutable = JSON.stringify(run)
      const another = resolveDispatch(run)
      assert.equal(
        JSON.stringify(run),
        immutable,
        'resolve must not mutate the caller',
      )
      assert.equal(another.reports.length, 2)
      assert.equal(another.phase, 'campus')
      assert.ok(
        another.reports.every((r) =>
          ['honors', 'pass', 'partial', 'failed'].includes(r.grade),
        ),
      )
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
const fallback = assignTeam(startAcademy('kinetic', 2), 'unlisted', [
  'mina' as StudentId,
])
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
assert.ok(page.includes('Capes & Tassels: Prom of Doom'))
assert.ok(tab.includes("title: 'Capes & Tassels: Prom of Doom'"))
assert.ok(page.includes('FACE THE PROM-NIGHT SIMULATION'))
assert.ok(page.includes('data-testid="academy-signature-detail"'))
assert.ok(page.includes('data-testid="academy-identity-preview"'))
assert.ok(page.includes('selectedElement'))
assert.ok(page.includes('selectedVow'))
console.log('Capes & Tassels playable first-week slice and route: OK')
