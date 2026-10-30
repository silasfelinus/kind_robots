// Prom of Doom playtest readiness (t-015). A from-start seven-day action trace
// that mirrors what the console's buttons do, plus source contracts for the
// defects found by playing the real page at 390, 768 and 1440 px.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { decodeSaveCode, encodeSaveCode } from '../cometAcademy/consoleScreens'
import { CITY_SITES } from '../cometAcademy/cityMap'
import { fieldFor } from '../cometAcademy/identityArcs'
import { PATROL_ZONES } from '../cometAcademy/nightPatrols'
import { SOCIAL_DAYS } from '../cometAcademy/relationships'
import {
  assignPlayerCase,
  chooseEncounter,
  chooseNightPatrol,
  encounterFor,
  incidentsFor,
  nextSchoolDay,
  patrolOptionsFor,
  planThirdNight,
  resolveDispatch,
  restoreAcademy,
  startFullAcademy,
  visitCitySite,
  type AcademyRun,
} from '../cometAcademy/rules'
import { SIGNATURE_POWERS } from '../cometAcademy/specialPowers'

const fromRoot = (path: string) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')

// Autosave and save codes must reproduce the exact run after every choice.
function assertSaves(run: AcademyRun, label: string) {
  assert.deepEqual(
    restoreAcademy(JSON.parse(JSON.stringify(run))),
    run,
    `${label}: autosave round-trip`,
  )
  assert.deepEqual(
    decodeSaveCode(encodeSaveCode(run)),
    run,
    `${label}: save code round-trip`,
  )
}

const visitable = (run: AcademyRun) =>
  CITY_SITES.filter((site) => (run.visitedDays?.[site.id] ?? -7) <= run.day - 7)

const masterminds = new Set<string>()
const seeds = [4, 31, 2029, 77]
for (const [index, seed] of seeds.entries()) {
  const signature = SIGNATURE_POWERS[(index * 13) % SIGNATURE_POWERS.length].id
  let run = startFullAcademy(fieldFor(signature), seed, signature, 'shelter')
  masterminds.add(run.mastermind!)
  assert.equal(run.day, 1)
  assert.equal(run.phase, 'map')
  assertSaves(run, `seed ${seed} start`)
  for (let day = 1; day <= 7; day++) {
    const label = `seed ${seed} day ${day}`
    assert.equal(run.day, day, label)
    assert.equal(run.phase, 'map', `${label} opens on the map`)
    const sites = visitable(run)
    assert.ok(sites.length >= 1, `${label}: a landmark is always open`)
    const visited = visitCitySite(run, sites[day % sites.length].id)
    assert.notEqual(visited, run, `${label}: the visit is accepted`)
    run = visited
    assert.equal(run.phase, 'campus', `${label}: a visit opens its scene`)
    const options = encounterFor(run).options
    assert.ok(options.length >= 2, `${label}: the scene offers a real choice`)
    run = chooseEncounter(run, options[day % options.length].id)
    assert.equal(run.phase, 'dispatch', `${label}: day turns to night`)
    assertSaves(run, `${label} dusk`)
    const cases = incidentsFor(run)
    assert.ok(cases.length >= 1, `${label}: night has calls`)
    if (day === 3 && run.patrolOpening === 1)
      run = planThirdNight(run, cases[0].id, 'split')
    else if (day >= 4 && run.patrolOpening === 1 && day % 2 === 0) {
      const zone = PATROL_ZONES[day % PATROL_ZONES.length].id
      const choice = patrolOptionsFor(run, zone)[0]
      assert.ok(choice, `${label}: district ${zone} offers a patrol`)
      run = chooseNightPatrol(run, zone, choice.id)
      assert.ok(run.nightPatrol, `${label}: district patrol is recorded`)
    }
    if (!run.playerCaseId && !run.nightPatrol)
      run = assignPlayerCase(run, cases[0].id)
    for (const team of run.assignments)
      assert.ok(
        team.students.length >= 1 && team.students.length <= 3,
        `${label}: teams are one to three heroes`,
      )
    run = resolveDispatch(run)
    assert.equal(run.phase, 'debrief', `${label}: night resolves`)
    assert.ok(run.reports.length >= 1, `${label}: the debrief has a report`)
    assertSaves(run, `${label} debrief`)
    run = nextSchoolDay(run)
    assert.ok(
      !visitable(run).some((site) => site.id === sites[day % sites.length].id),
      `${label}: a visited landmark rests for a week`,
    )
  }
  assert.equal(run.day, 8)
  assert.equal(run.phase, 'map')
}
assert.ok(masterminds.size >= 2, 'different seeds face different masterminds')
assert.ok(SOCIAL_DAYS.filter((day) => day <= 7).length >= 4)

// Defects found playing the real page (2026-10-30 harness run).
const page = fromRoot('pages/play/comet-city-academy.vue')
const opening = fromRoot('components/play/cometAcademy/AcademyOpening.vue')

// 1. A stray ">" printed under an always-empty AFTER-ACTION REPORT box.
assert.ok(!page.includes('</strong>\n              ><span v-for="report'))
assert.ok(
  page.includes('v-if="run.flowVersion !== 2 && run.reports.length"'),
  'after-action box only shows when there are reports',
)
// 2. Thirty day lights overflowed the 390 px console header.
assert.match(
  page,
  /@media \(max-width: 640px\) \{\s*\.cca-serial \{\s*display: none;[\s\S]*?\.cca-day-lights \{\s*flex-wrap: wrap;/,
  'phone header wraps the thirty day lights and drops the serial',
)
// 3. Phone roster posters were forced into a row, crushing portrait and text.
assert.ok(
  !/\.cca-roster-button \{\s*flex-direction: row;/.test(page),
  'roster posters stay portrait cards on phones',
)
// 4. The relationship panel stayed open into the next day, hiding the map.
assert.ok(
  page.includes(
    "if (run.value?.phase !== 'map') showRelationships.value = false",
  ),
)
// 5. Console screens opened at the previous screen's scroll offset, and the
// scene kept 42% of a phone while reading Hero/Crew/Case File/Scrapbook.
assert.ok(page.includes('pane.value?.scrollTo?.({ top: 0 })'))
assert.ok(page.includes("'cca-layout-reading': consoleScreen !== 'play'"))
assert.match(page, /\.cca-layout-reading \{\s*grid-template-rows:/)
// 6. After NEW TERM a save code could not be loaded: the import box lived
// only inside a running term. The title's Settings now resumes from a code.
assert.ok(opening.includes('data-testid="academy-title-import-save"'))
assert.ok(opening.includes('store.importSave(importCode.value)'))

console.log(
  `Prom of Doom playtest readiness: ${seeds.length} seeds x 7 days traced map > scene > night > debrief with autosave and save-code round-trips (${masterminds.size} masterminds); 6 UI regressions pinned.`,
)
