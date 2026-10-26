import assert from 'node:assert/strict'
import {
  CITY_SITES,
  projectCitySites,
  projectedCityRoads,
} from '../cometAcademy/cityMap'
import {
  IDENTITY_ARCS,
  CHARACTER_ROSTER,
  identityFor,
  identityStoryFor,
} from '../cometAcademy/identityArcs'
import {
  GUEST_IDENTITIES,
  TESS_CREW_SOURCE,
} from '../cometAcademy/guestIdentities'
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
  ENCOUNTERS,
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
  visitCitySite,
} from '../cometAcademy/rules'

assert.equal(CITY_SITES.length, 7)
assert.equal(new Set(CITY_SITES.map((site) => site.id)).size, 7)
assert.equal(new Set(CITY_SITES.map((site) => site.encounterIndex)).size, 7)
assert.ok(CITY_SITES.filter((site) => site.district === 'academy').length >= 3)
assert.ok(CITY_SITES.filter((site) => site.district === 'city').length >= 3)
assert.ok(projectCitySites('campus').length >= 3)
assert.ok(projectCitySites('town').length >= 6)
assert.ok(projectCitySites('town').some((site) => site.id === 'academy-roof'))
assert.ok(projectCitySites('campus').some((site) => site.id === 'transit-gate'))
for (const view of ['campus', 'town'] as const) {
  const nodes = projectCitySites(view)
  assert.ok(
    nodes.every(
      (node) =>
        node.left >= 0 && node.left <= 100 && node.top >= 0 && node.top <= 100,
    ),
  )
  assert.ok(
    projectedCityRoads(view).every((edge) =>
      [edge.x1, edge.x2, edge.y1, edge.y2].every(Number.isFinite),
    ),
  )
}
for (const node of CITY_SITES)
  for (const neighbor of node.neighbors)
    assert.ok(
      CITY_SITES.find((item) => item.id === neighbor)?.neighbors.includes(
        node.id,
      ),
      `The geographic graph must be reciprocal: ${node.id} => ${neighbor}`,
    )

const fromRoot = (path: string) =>
  readFileSync(new URL('../../' + path, import.meta.url), 'utf8')
assert.equal(POWER_FORMS.length, 6)
assert.equal(POWER_AFFINITIES.length, 8)
assert.equal(POWER_VOWS.length, 3)
assert.equal(SIGNATURE_POWERS.length, 48)
assert.equal(IDENTITY_ARCS.length, 48)
assert.equal(CHARACTER_ROSTER.length, 50)
assert.equal(
  new Set(CHARACTER_ROSTER.map((person) => person.realName)).size,
  50,
)
assert.equal(
  new Set(CHARACTER_ROSTER.map((person) => person.backstory)).size,
  50,
)
assert.equal(GUEST_IDENTITIES[0].realName, 'Zuzu')
assert.equal(GUEST_IDENTITIES[0].hero.alias, 'Zuzu, Koala Assassin')
assert.equal(GUEST_IDENTITIES[0].source, 'Zuzu world')
assert.equal(GUEST_IDENTITIES[1].realName, TESS_CREW_SOURCE.name)
assert.equal(GUEST_IDENTITIES[1].pronouns, TESS_CREW_SOURCE.pronouns)
assert.equal(GUEST_IDENTITIES[1].source, 'This Means Warp')
for (const person of CHARACTER_ROSTER) {
  assert.ok(person.backstory.length > 60)
  assert.ok(person.realName.length > 2)
  assert.notEqual(person.student.alias, person.hero.alias)
  assert.notEqual(person.hero.alias, person.villain.alias)
  assert.notEqual(person.hero.method, person.villain.method)
  for (const viewpoint of ['protagonist', 'antagonist'] as const)
    for (const allegiance of ['hero', 'villain'] as const) {
      const lens = identityStoryFor(person, viewpoint, allegiance, [
        'sidekick',
        'partner',
        'romance',
      ])
      assert.equal(lens.person, person.realName)
      assert.equal(lens.backstory, person.backstory)
      assert.equal(lens.bondScenes.length, 3)
      assert.ok(lens.setup.length > 28)
      assert.ok(lens.decision.length > 40)
      assert.equal(lens.alias, person[allegiance].alias)
      assert.deepEqual(
        identityStoryFor(person, viewpoint, allegiance).bondScenes,
        [],
      )
    }
  assert.notEqual(
    identityStoryFor(person, 'protagonist', 'hero').setup,
    identityStoryFor(person, 'protagonist', 'villain').setup,
  )
  assert.notEqual(
    identityStoryFor(person, 'antagonist', 'hero').setup,
    identityStoryFor(person, 'antagonist', 'villain').setup,
  )
}
for (const seed of [1, 7, 24, 999]) {
  const sample = startAcademy('kinetic', seed)
  const deck = Array.from(
    { length: 7 },
    (_, index) => encounterFor({ ...sample, day: index + 1 }).title,
  )
  assert.equal(new Set(deck).size, 7, 'new runs get unique first-week scenes')
  assert.ok(deck.includes('The Stray Blade Arrives'))
  assert.ok(deck.includes('A Visitor from the Stars'))
}
assert.equal(ENCOUNTERS.length, 7)
for (const visitorAlignment of ['ally', 'opponent'] as const) {
  let run = startAcademy('kinetic', 24, 'impact-fire', 'shelter')
  for (let day = 1; day <= 7; day++) {
    const [first] = incidentsFor(run)
    run = visitCitySite(run, CITY_SITES[day - 1]!.id)
    assert.equal(run.phase, 'campus')
    const visit = encounterFor(run)
    const option =
      visit.options.find((entry) =>
        visitorAlignment === 'ally'
          ? ['shelter-zuzu', 'help-tess'].includes(entry.id)
          : ['contract-zuzu', 'sell-tess'].includes(entry.id),
      ) ?? visit.options[0]!
    run = chooseEncounter(run, option.id)
    assert.equal(run.phase, 'dispatch')
    run = assignTeam(run, first!.id, ['mina'])
    run = resolveDispatch(run)
    assert.equal(run.phase, 'debrief')
    run = nextSchoolDay(run)
  }
  const finale = finishAcademy(run, 'protect')
  assert.ok(finale.scene.includes('Zuzu remembers'))
  assert.ok(finale.scene.includes('Tess Helio'))
  assert.ok(finale.scene.includes('Ari Nadir'))
  assert.ok(
    finale.scene.includes(
      visitorAlignment === 'ally' ? 'Koala Assassin' : 'Shogun Null',
    ),
  )
  assert.ok(
    finale.scene.includes(
      visitorAlignment === 'ally' ? 'Starwake' : 'Void Cartographer',
    ),
  )
}
const legacyOrder = startAcademy('kinetic', 14)
assert.equal(
  encounterFor({
    ...legacyOrder,
    flowVersion: undefined,
    encounterDeckVersion: undefined,
  }).title,
  'A Promise on the Roof',
  'pre-migration saves retain their scheduled campus scene',
)
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
      assert.equal(run.phase, 'map')
      const place = CITY_SITES[day - 1]!
      assert.equal(visitCitySite(run, 'unknown' as never), run)
      run = visitCitySite(run, place.id)
      assert.equal(run.phase, 'campus')
      assert.equal(
        encounterFor(run).title,
        ENCOUNTERS[place.encounterIndex]!.title,
      )
      assert.equal(visitCitySite(run, place.id), run)
      const choice = encounterFor(run).options[day % 2]!
      run = chooseEncounter(run, choice.id)
      assert.equal(run.phase, 'dispatch')
      assert.ok(run.visitedSites?.includes(place.id))
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
      assert.equal(another.phase, 'debrief')
      assert.ok(
        another.reports.every((r) =>
          ['honors', 'pass', 'partial', 'failed'].includes(r.grade),
        ),
      )
      run = another
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
assert.equal(resolveDispatch(startAcademy('kinetic', 2)).phase, 'map')
assert.equal(restoreAcademy({}), null)
assert.equal(restoreAcademy({ version: 999 }), null)
const migrated = startAcademy('kinetic', 99)
const legacy = {
  ...migrated,
  flowVersion: undefined,
  visitedSites: undefined,
  phase: 'dispatch' as const,
}
assert.deepEqual(
  restoreAcademy(JSON.parse(JSON.stringify(legacy))),
  JSON.parse(JSON.stringify(legacy)),
)
assert.equal(
  resolveDispatch(assignTeam(legacy, incidentsFor(legacy)[0]!.id, ['mina']))
    .phase,
  'campus',
)
assert.equal(restoreAcademy({ ...migrated, selectedSite: 'bad-site' }), null)
assert.equal(restoreAcademy({ ...migrated, visitedSites: ['bad-site'] }), null)
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
assert.ok(page.includes('data-testid="academy-map"'))
assert.ok(page.includes("mapView === 'campus'"))
assert.ok(page.includes('RUN NIGHT SIMULATIONS'))
assert.ok(page.includes('data-testid="academy-crossover-roster"'))
assert.ok(page.includes('currentIdentity.backstory'))
assert.ok(page.includes('currentIdentityStory.setup'))
assert.ok(page.includes('selectedElement'))
assert.ok(page.includes('selectedVow'))
console.log('Capes & Tassels playable first-week slice and route: OK')
