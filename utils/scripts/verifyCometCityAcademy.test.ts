import {
  PERSONAL_QUESTS,
  PERSONAL_DAYS,
  personalQuestEvent,
  personalOutcomeArtKey,
  validPersonalHistory,
  personalStanding,
  personalFinale,
  type PersonalMemory,
} from '../cometAcademy/personalQuests'
import assert from 'node:assert/strict'
import { PROM_ART_PROMPTS } from '../cometAcademy/artPrompts'
import { CAST_LOOKS, TEAM_LOOKS } from '../cometAcademy/castLooks'
import {
  CITY_SITES,
  projectCitySites,
  projectedCityRoads,
} from '../cometAcademy/cityMap'
import {
  DISTRICT_ENCOUNTERS,
  districtEncounterFor,
} from '../cometAcademy/districtEncounters'
import { REAL_NIGHT_CASES, realNightCase } from '../cometAcademy/nightCases'
import {
  SOCIAL_CAST,
  SOCIAL_DAYS,
  newSocialState,
  socialChoices,
  applySocialChoice,
  socialMissionBonus,
  socialFinaleText,
  validSocialState,
} from '../cometAcademy/relationships'
import {
  beginPlayerEvolution,
  canEvolve,
  evolutionEncounter,
  evolutionNightModifier,
  isValidPlayerEvolution,
  recordPlayerValues,
  resolveEvolution,
} from '../cometAcademy/protagonistEvolution'
import {
  campaignOpponent,
  antagonistBeat,
  opponentPressure,
  antagonistFinale,
} from '../cometAcademy/opponents'
import {
  CAMPAIGN_ANCHORS,
  CAMPAIGN_VILLAINS,
  PROM_FINALE,
  campaignVillain,
  campaignBetrayer,
  campaignPlotEvent,
} from '../cometAcademy/campaign'
import {
  IDENTITY_ARCS,
  CHARACTER_ROSTER,
  fieldFor,
  identityFor,
  identityStoryFor,
} from '../cometAcademy/identityArcs'
import {
  GUEST_IDENTITIES,
  TESS_CREW_SOURCE,
} from '../cometAcademy/guestIdentities'
import {
  POWER_ORIGINS,
  POWER_AFFINITIES,
  POWER_VOWS,
  SIGNATURE_POWERS,
  STATS,
  finaleFor,
  migrateSignatureId,
  signatureFor,
} from '../cometAcademy/specialPowers'
import {
  PERSONAL_ARCS,
  PERSONAL_CHAPTER_DAYS,
  personalEncounter,
  personalArcFor,
  personalCounterpart,
  personalEnding,
  personalOutcomeArt,
  personalOutcomeModifier,
  isValidPersonalHistory,
} from '../cometAcademy/identitySerial'
import {
  openingRouteFor,
  openingRouteDays,
  routeStanding,
  isVowMemory,
  routeEpilogue,
} from '../cometAcademy/openingRoutes'
import {
  missionReaction,
  missionRoute,
  missionRouteRoster,
} from '../cometAcademy/missionTeams'
import { readFileSync } from 'node:fs'
import {
  POWERS,
  STUDENTS,
  INCIDENTS,
  ENCOUNTERS,
  assignTeam,
  knownContacts,
  startingContacts,
  recruitableContact,
  recruitContact,
  callEmergencyVolunteer,
  emergencyContact,
  dispatchChance,
  dispatchModifier,
  chooseEncounter,
  encounterFor,
  finishAcademy,
  incidentsFor,
  nextSchoolDay,
  resolveDispatch,
  socialize,
  restoreAcademy,
  startAcademy,
  startFullAcademy,
  studentAvailable,
  tendInfirmary,
  type AcademyRun,
  type StudentId,
  visitCitySite,
} from '../cometAcademy/rules'

assert.equal(CITY_SITES.length, 24)
assert.equal(new Set(CITY_SITES.map((site) => site.id)).size, 24)
assert.equal(
  new Set(
    CITY_SITES.filter((site) => site.encounterIndex !== undefined).map(
      (site) => site.encounterIndex,
    ),
  ).size,
  7,
)
assert.equal(Object.keys(DISTRICT_ENCOUNTERS).length, 17)
assert.ok(CITY_SITES.filter((site) => site.district === 'academy').length >= 3)
assert.ok(CITY_SITES.filter((site) => site.district === 'city').length >= 3)
assert.equal(
  CITY_SITES.filter((site) => site.district === 'academy').length,
  12,
)
assert.equal(CITY_SITES.filter((site) => site.district === 'city').length, 12)
assert.equal(projectCitySites('campus').length, 13)
assert.equal(projectCitySites('town').length, 14)
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

const projectedIds = new Set(
  (['campus', 'town'] as const).flatMap((view) =>
    projectCitySites(view).map((site) => site.id),
  ),
)
assert.equal(projectedIds.size, 24, 'Every landmark is reachable on a map')
const connected = new Set<string>([CITY_SITES[0]!.id])
const queue = [CITY_SITES[0]!.id]
for (let i = 0; i < queue.length; i++) {
  const current = CITY_SITES.find((site) => site.id === queue[i])!
  for (const neighbor of current.neighbors)
    if (!connected.has(neighbor)) {
      connected.add(neighbor)
      queue.push(neighbor)
    }
}
assert.equal(
  connected.size,
  24,
  'All locations form one connected street graph',
)
assert.equal(
  new Set(Object.values(DISTRICT_ENCOUNTERS).map((entry) => entry.title)).size,
  17,
)
const districtOptionIds = new Set<string>()
for (const site of CITY_SITES) {
  assert.ok(site.teaser.length > 20)
  if (site.encounterIndex !== undefined) continue
  const story = districtEncounterFor(site.id)
  assert.ok(story, `Missing story for ${site.id}`)
  assert.equal(story.options.length, 2)
  assert.ok(story.scene.length > 100)
  for (const option of story.options) {
    assert.ok(option.text.length > 100)
    assert.ok(option.label.length > 10)
    assert.ok(!districtOptionIds.has(option.id))
    districtOptionIds.add(option.id)
    assert.ok(option.trust !== 0)
  }
}
assert.equal(districtOptionIds.size, 34)
assert.equal(districtEncounterFor('academy-roof'), undefined)

const campusChoiceRun = chooseEncounter(
  visitCitySite(startAcademy('kinetic', 31), 'student-commons'),
  'student-commons-help',
)
assert.equal(campusChoiceRun.phase, 'dispatch')
assert.equal(campusChoiceRun.academyStanding, 2)
assert.equal(campusChoiceRun.cityStanding, 0)
assert.deepEqual(campusChoiceRun.visitedSites, ['student-commons'])
const cityChoiceRun = chooseEncounter(
  visitCitySite(startAcademy('kinetic', 31), 'civic-hospital'),
  'civic-hospital-exploit',
)
assert.equal(cityChoiceRun.academyStanding, 0)
assert.equal(cityChoiceRun.cityStanding, -2)
assert.equal(
  chooseEncounter(
    visitCitySite(startAcademy('kinetic', 31), 'civic-hospital'),
    'unknown',
  ).phase,
  'campus',
  'Unknown encounter options cannot alter state',
)
assert.deepEqual(
  restoreAcademy(JSON.parse(JSON.stringify(cityChoiceRun))),
  cityChoiceRun,
)
assert.equal(restoreAcademy({ ...cityChoiceRun, cityStanding: NaN }), null)
assert.equal(restoreAcademy({ ...cityChoiceRun, academyStanding: 1.5 }), null)

// Goodwill should never make public rescue outcomes worse, and its
// benefits must change real seeded results, not merely UI copy.
const gradeRank = { failed: 0, partial: 1, pass: 2, honors: 3 }
let goodwillChangedGrade = false
for (let seed = 1; seed <= 36; seed++) {
  const base = {
    ...startAcademy('kinetic', seed),
    day: 3,
    phase: 'dispatch' as const,
  }
  const target = incidentsFor(base).find(
    (incident) => incident.allegiance === 'hero',
  )
  if (!target) continue
  const assigned = assignTeam(base, target.id, ['mina'])
  const positive = resolveDispatch({
    ...assigned,
    cityStanding: 4,
    academyStanding: 4,
  })
  const negative = resolveDispatch({
    ...assigned,
    cityStanding: -4,
    academyStanding: -4,
  })
  const goodGrade = positive.reports.find(
    (report) => report.caseId === target.id,
  )!.grade
  const badGrade = negative.reports.find(
    (report) => report.caseId === target.id,
  )!.grade
  assert.ok(gradeRank[goodGrade] >= gradeRank[badGrade])
  if (gradeRank[goodGrade] > gradeRank[badGrade]) goodwillChangedGrade = true
}
assert.ok(goodwillChangedGrade)

const fromRoot = (path: string) =>
  readFileSync(new URL('../../' + path, import.meta.url), 'utf8')
assert.deepEqual(
  POWER_ORIGINS.map((origin) => origin.id),
  ['accident', 'mutant', 'tech', 'magic', 'alien', 'psychic'],
)
assert.deepEqual(
  POWER_AFFINITIES.map((affinity) => affinity.id),
  [
    'fire',
    'air',
    'earth',
    'water',
    'discipline',
    'genius',
    'birthright',
    'social',
  ],
)
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
assert.equal(GUEST_IDENTITIES[1].source, 'Space Couch')
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
assert.equal(Object.keys(REAL_NIGHT_CASES).length, INCIDENTS.length)
for (const incident of INCIDENTS) {
  const realCase = realNightCase(incident.id)
  assert.ok(realCase, `Missing real-night branch for ${incident.id}`)
  assert.ok(realCase.briefing.length > 80)
  for (const grade of ['honors', 'pass', 'partial', 'failed'] as const)
    assert.ok(realCase.consequences[grade].length > 90)
  assert.equal(new Set(Object.values(realCase.consequences)).size, 4)
}
for (const seed of [1, 15, 900]) {
  let realRun: AcademyRun = {
    ...startAcademy('kinetic', seed),
    day: 3,
    phase: 'dispatch' as const,
  }
  for (const [index, incident] of incidentsFor(realRun).entries())
    realRun = assignTeam(realRun, incident.id, index === 0 ? ['mina'] : ['sol'])
  const finished = resolveDispatch(realRun)
  assert.equal(finished.phase, 'debrief')
  assert.ok(
    finished.reports.every((report) =>
      Object.values(realNightCase(report.caseId)!.consequences).includes(
        report.text,
      ),
    ),
  )
}
for (const visitorAlignment of ['ally', 'opponent'] as const) {
  let run = startAcademy(
    fieldFor('accident-fire'),
    24,
    'accident-fire',
    'shelter',
  )
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
  assert.ok(finale.scene.includes('Dez Okafor'))
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
assert.equal(signatureFor('accident', 'fire').name, 'Pilot Light')
assert.equal(identityFor('accident-fire').hero.alias, 'Backdraft')
const statTotal = (stats: Record<string, number>) =>
  Object.values(stats).reduce((sum, value) => sum + value, 0)
const heroFoci = new Set<string>()
const villainFoci = new Set<string>()
let divergentFocus = 0
for (const origin of POWER_ORIGINS)
  for (const affinity of POWER_AFFINITIES) {
    const skill = signatureFor(origin.id, affinity.id)
    assert.equal(skill.id, `${origin.id}-${affinity.id}`)
    const identity = identityFor(skill.id)
    for (const role of ['student', 'hero', 'villain'] as const) {
      const persona = identity[role]
      assert.ok(persona.focus.length > 2)
      for (const stat of STATS) {
        const value = persona.stats[stat.id]
        assert.ok(Number.isInteger(value) && value >= 1 && value <= 5)
      }
      const total = statTotal(persona.stats)
      if (role === 'student') assert.ok(total >= 12 && total <= 16)
      else assert.ok(total >= 18 && total <= 23)
    }
    assert.notDeepEqual(
      identity.hero.stats,
      identity.villain.stats,
      `${skill.id} hero and villain must play differently`,
    )
    heroFoci.add(identity.hero.focus)
    villainFoci.add(identity.villain.focus)
    if (identity.hero.focus !== identity.villain.focus) divergentFocus++
    assert.ok(identity.pronouns.includes('/'))
    assert.ok(skill.prom.length > 30)
    assert.notEqual(identity.student.alias, identity.hero.alias)
    assert.notEqual(identity.hero.alias, identity.villain.alias)
    assert.notEqual(identity.hero.method, identity.villain.method)
    assert.ok(identity.student.conflict.length > 16)
    assert.ok(identity.quests.partner.length > 16)
    assert.ok(identity.quests.protagonist.length > 16)
    assert.ok(identity.quests.antagonist.length > 16)
    for (const vow of POWER_VOWS)
      assert.ok(
        finaleFor(skill, identity.realName, identity.villain.alias, vow.id)
          .length > 80,
      )
    const run = startAcademy(fieldFor(skill.id), 99, skill.id, 'shelter')
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
    assert.ok(!heroicPreview.scene.includes('..'))
  }
assert.ok(heroFoci.size >= 10, 'heroes span many play styles')
assert.ok(villainFoci.size >= 10, 'villains span many play styles')
assert.ok(
  divergentFocus >= 36,
  'most villains abandon the hero toolkit rather than reskinning it',
)
assert.equal(migrateSignatureId('impact-fire'), 'accident-fire')
assert.equal(migrateSignatureId('veil-shadow'), 'psychic-social')
assert.equal(migrateSignatureId('accident-fire'), 'accident-fire')
assert.equal(migrateSignatureId('nonsense'), undefined)
assert.equal(
  new Set(
    ['impact', 'arc', 'veil', 'step', 'weave', 'beacon'].flatMap((form) =>
      [
        'fire',
        'ice',
        'storm',
        'stone',
        'light',
        'shadow',
        'bloom',
        'gravity',
      ].map((element) => migrateSignatureId(`${form}-${element}`)),
    ),
  ).size,
  48,
  'every pre-redesign signature maps to a distinct new person',
)
const legacySave = {
  ...startAcademy('kinetic', 7),
  signature: 'impact-fire',
  vow: 'shelter',
}
const migratedSave = restoreAcademy(JSON.parse(JSON.stringify(legacySave)))
assert.equal(migratedSave?.signature, 'accident-fire')
assert.equal(migratedSave?.power, fieldFor('accident-fire'))
assert.equal(
  restoreAcademy({ ...legacySave, signature: 'impact-nothing' }),
  null,
)
assert.equal(
  startAcademy('kinetic', 99).signature,
  undefined,
  'legacy saves remain valid',
)
assert.throws(() => startAcademy('spatial', 99, 'impact-fire' as never))
assert.throws(() =>
  startAcademy(
    STATS.find((stat) => stat.field !== fieldFor('accident-fire'))!.field,
    99,
    'accident-fire',
  ),
)
assert.equal(POWERS.length, 6)
assert.equal(STUDENTS.length, 12)
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
        ENCOUNTERS[place.encounterIndex!]!.title,
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

// The original first-week construction stays seven-day for existing saved runs.
// New sessions take a deterministic, mandatory thirty-day route.
// Public identity choices are earned, optional and tied to the person's own
// three unique personas. Every canonical signature can take any earned future.
const novice = beginPlayerEvolution()
assert.equal(novice.form, 'student')
assert.ok(!canEvolve(novice, 'hero', 'accident-fire'))
assert.ok(!canEvolve(novice, 'villain', 'accident-fire'))
const protective = recordPlayerValues(
  recordPlayerValues(novice, { influence: 1, danger: 0 }),
  { influence: 2, danger: -1 },
)
const coercive = recordPlayerValues(
  recordPlayerValues(novice, { influence: -1, danger: 2 }),
  { influence: -2, danger: 1 },
)
assert.equal(protective.protect, 2)
assert.equal(coercive.exploit, 2)
assert.deepEqual(beginPlayerEvolution(), novice)
assert.equal(resolveEvolution(novice, 'evolve-hero', 16, 'accident-fire'), null)
assert.equal(
  resolveEvolution(novice, 'evolve-villain', 16, 'accident-fire'),
  null,
)
assert.equal(
  resolveEvolution(protective, 'evolve-hero', 15, 'accident-fire'),
  null,
)
assert.equal(
  resolveEvolution(protective, 'fabricated', 16, 'accident-fire'),
  null,
)
assert.equal(evolutionNightModifier(undefined, 'hero'), 0)
assert.equal(evolutionNightModifier(protective, 'hero'), 0)
const allForms = new Set<string>()
for (const identity of IDENTITY_ARCS) {
  const token = identity.signature
  const heroEvent = evolutionEncounter(token, protective, 16)
  assert.ok(heroEvent.scene.includes(identity.realName))
  assert.ok(heroEvent.scene.includes(identity.hero.method))
  assert.ok(heroEvent.options.some((o) => o.id === 'evolve-hero'))
  assert.ok(!heroEvent.options.some((o) => o.id === 'evolve-villain'))
  const hero = resolveEvolution(protective, 'evolve-hero', 16, token)!
  assert.equal(hero.form, 'hero')
  assert.ok(heroEvent.options[0]!.text.includes(identity.heroDecision))
  assert.equal(resolveEvolution(hero, 'evolve-hero', 16, token), null)
  assert.equal(evolutionNightModifier(hero, 'hero'), 2)
  assert.equal(evolutionNightModifier(hero, 'villain'), -1)
  const villainEvent = evolutionEncounter(token, coercive, 16)
  assert.ok(villainEvent.options.some((o) => o.id === 'evolve-villain'))
  assert.ok(villainEvent.options.some((o) => o.id === 'evolve-student'))
  const villain = resolveEvolution(coercive, 'evolve-villain', 16, token)!
  assert.equal(villain.form, 'villain')
  assert.equal(evolutionNightModifier(villain, 'villain'), 2)
  assert.equal(evolutionNightModifier(villain, 'hero'), -1)
  const independent = resolveEvolution(protective, 'evolve-student', 16, token)!
  assert.equal(independent.form, 'student')
  assert.ok(isValidPlayerEvolution(independent, token))
  const earnedBoth = { ...hero, exploit: 3 }
  const reversal = resolveEvolution(earnedBoth, 'evolve-villain', 23, token)!
  assert.equal(reversal.form, 'villain')
  assert.equal(reversal.milestones.length, 2)
  assert.ok(
    evolutionEncounter(token, reversal, 23).scene.includes(
      identity.villainDecision,
    ),
  )
  assert.ok(isValidPlayerEvolution(reversal, token))
  assert.ok(!isValidPlayerEvolution({ ...reversal, form: 'hero' }, token))
  allForms.add(identity.hero.alias)
  allForms.add(identity.villain.alias)
}
assert.equal(IDENTITY_ARCS.length, 48)
assert.ok(allForms.size >= 90)
assert.deepEqual(
  evolutionEncounter(undefined, novice, 16).options.map((o) => o.id),
  ['evolve-student'],
)
assert.equal(resolveEvolution(protective, 'evolve-hero', 16), null)
assert.ok(
  !isValidPlayerEvolution({ ...protective, exploit: -3 }, 'accident-fire'),
)
assert.ok(
  !isValidPlayerEvolution(
    { ...protective, milestones: [{ day: 17, form: 'hero' }] },
    'accident-fire',
  ),
)

const evolveSeed = startFullAcademy(
  fieldFor('accident-fire'),
  816,
  'accident-fire',
)
const earnedSeed = {
  ...evolveSeed,
  day: 16,
  phase: 'campus' as const,
  playerEvolution: protective,
}
const promotionScene = encounterFor(earnedSeed)
assert.ok(promotionScene.scene.includes(CAMPAIGN_ANCHORS[15]!))
assert.ok(promotionScene.options.some((o) => o.id === 'evolve-hero'))
const promoted = chooseEncounter(earnedSeed, 'evolve-hero')
assert.equal(promoted.phase, 'dispatch')
assert.equal(promoted.playerEvolution?.form, 'hero')
assert.equal(promoted.playerEvolution?.milestones[0]?.day, 16)
assert.ok(promoted.scene.includes(identityFor('accident-fire').hero.alias))
assert.deepEqual(restoreAcademy(JSON.parse(JSON.stringify(promoted))), promoted)
assert.deepEqual(chooseEncounter(earnedSeed, 'evolve-villain'), earnedSeed)
const reckoning = {
  ...promoted,
  day: 23,
  phase: 'campus' as const,
  playerEvolution: { ...promoted.playerEvolution!, exploit: 3 },
}
const changed = chooseEncounter(reckoning, 'evolve-villain')
assert.equal(changed.playerEvolution?.form, 'villain')
assert.equal(changed.playerEvolution?.milestones.length, 2)
const lastDay = { ...changed, day: 30, phase: 'finale' as const }
const end = finishAcademy(lastDay, 'share')
assert.ok(end.scene.includes(identityFor('accident-fire').villain.alias))
assert.deepEqual(restoreAcademy(JSON.parse(JSON.stringify(end))), end)
const oldThirty = { ...evolveSeed, playerEvolution: undefined }
assert.deepEqual(
  restoreAcademy(JSON.parse(JSON.stringify(oldThirty))),
  JSON.parse(JSON.stringify(oldThirty)),
)
assert.equal(
  restoreAcademy({
    ...promoted,
    playerEvolution: { ...protective, form: 'hero' },
  }),
  null,
)
assert.equal(
  restoreAcademy({
    ...promoted,
    playerEvolution: {
      ...promoted.playerEvolution!,
      milestones: [{ day: 23, form: 'hero' }],
    },
  }),
  null,
)

assert.equal(
  restoreAcademy({
    ...promoted,
    playerEvolution: { ...promoted.playerEvolution!, protect: 0 },
  }),
  null,
)
assert.equal(
  restoreAcademy({
    ...changed,
    playerEvolution: { ...changed.playerEvolution!, exploit: 0 },
  }),
  null,
)
// Distinct adult classmates have their own conflicts, boundaries and consent.
// A social scene uses one daytime action; it is never a free map overlay.
assert.equal(SOCIAL_CAST.length, 6)
assert.equal(new Set(SOCIAL_CAST.map((person) => person.id)).size, 6)
assert.equal(new Set(SOCIAL_CAST.map((person) => person.dilemma)).size, 6)
assert.equal(new Set(SOCIAL_CAST.map((person) => person.help)).size, 6)
assert.equal(SOCIAL_CAST.filter((person) => person.romanceable).length, 3)
assert.equal(SOCIAL_DAYS.length, 18)
assert.ok(!SOCIAL_DAYS.includes(20 as never))
assert.ok(!SOCIAL_DAYS.includes(24 as never))
assert.ok(!SOCIAL_DAYS.includes(16 as never))
assert.ok(SOCIAL_CAST.every((p) => p.boundary && p.duty && p.privateMoment))
const blankSocial = newSocialState()
assert.ok(validSocialState(blankSocial, 2))
assert.deepEqual(socialChoices(blankSocial, 'mina', 20), [])
assert.deepEqual(
  socialChoices(blankSocial, 'mina', 2, { unavailable: true }),
  [],
)
assert.ok(!socialChoices(blankSocial, 'mina', 2).some((c) => c.id === 'invite'))
assert.equal(applySocialChoice(blankSocial, 'mina', 2, 'date'), null)
assert.equal(socialMissionBonus(undefined, ['mina']), 0)
assert.equal(
  socialFinaleText(
    undefined,
    Object.fromEntries(STUDENTS.map((s) => [s.id, s.name])) as Record<
      StudentId,
      string
    >,
  ),
  '',
)
let socialRun: AcademyRun = { ...startFullAcademy('kinetic', 101), day: 2 }
const firstMeet = socialize(socialRun, 'nix', 'listen')
assert.equal(firstMeet.phase, 'dispatch')
assert.equal(firstMeet.relationships?.connections.nix?.trust, 1)
assert.ok(firstMeet.scene.includes('Nix'))
assert.deepEqual(socialize(firstMeet, 'nix', 'help'), firstMeet)
assert.deepEqual(
  restoreAcademy(JSON.parse(JSON.stringify(firstMeet))),
  firstMeet,
)
socialRun = { ...firstMeet, day: 3, phase: 'map' }
socialRun = socialize(socialRun, 'nix', 'help')
assert.equal(socialRun.relationships?.connections.nix?.trust, 3)
assert.equal(socialRun.relationships?.connections.nix?.helped, true)
assert.deepEqual(
  restoreAcademy(JSON.parse(JSON.stringify(socialRun))),
  socialRun,
)
socialRun = { ...socialRun, day: 4, phase: 'map' }
socialRun = socialize(socialRun, 'nix', 'invite')
assert.equal(socialRun.relationships?.connections.nix?.courtingDay, 4)
assert.equal(socialRun.relationships?.romance, undefined)
assert.deepEqual(
  restoreAcademy(JSON.parse(JSON.stringify(socialRun))),
  socialRun,
)
socialRun = { ...socialRun, day: 5, phase: 'map' }
socialRun = socialize(socialRun, 'nix', 'date')
assert.equal(socialRun.relationships?.romance, 'nix')
assert.equal(socialRun.relationships?.connections.nix?.romance, true)
assert.deepEqual(
  restoreAcademy(JSON.parse(JSON.stringify(socialRun))),
  socialRun,
)
socialRun = { ...socialRun, day: 6, phase: 'map' }
socialRun = socialize(socialRun, 'nix', 'partner')
assert.equal(socialRun.relationships?.partner, 'nix')
socialRun = { ...socialRun, day: 7, phase: 'map' }
socialRun = socialize(socialRun, 'nix', 'sidekick')
assert.equal(socialRun.relationships?.sidekick, 'nix')
assert.equal(socialMissionBonus(socialRun.relationships!, ['nix']), 2)
assert.equal(socialMissionBonus(socialRun.relationships!, ['mina']), 0)
assert.deepEqual(
  restoreAcademy(JSON.parse(JSON.stringify(socialRun))),
  socialRun,
)
const finaleSocial = finishAcademy(
  { ...socialRun, day: 30, phase: 'finale' },
  'protect',
)
assert.ok(finaleSocial.scene.includes('Nix Venn coordinates the rescue line'))
assert.ok(finaleSocial.scene.includes('Nix Venn meets you after the alarms'))
assert.ok(finaleSocial.scene.includes('your sidekick'))
const leaving = socialize(
  { ...socialRun, day: 9, phase: 'map' },
  'nix',
  'release',
)
assert.equal(leaving.relationships?.partner, undefined)
assert.equal(leaving.relationships?.sidekick, undefined)
assert.equal(leaving.relationships?.romance, undefined)
assert.equal(leaving.relationships?.connections.nix?.romance, false)
assert.deepEqual(restoreAcademy(JSON.parse(JSON.stringify(leaving))), leaving)
// No unearned partner, automatic romance, double social day, or forced courtship.
const noBond = {
  ...startFullAcademy('kinetic', 100),
  day: 3,
  phase: 'map' as const,
}
assert.deepEqual(socialize(noBond, 'mina', 'partner'), noBond)
assert.deepEqual(socialize(noBond, 'mina', 'invite'), noBond)
assert.deepEqual(socialize({ ...noBond, day: 20 }, 'mina', 'listen'), {
  ...noBond,
  day: 20,
})
assert.deepEqual(socialize({ ...noBond, day: 29 }, 'mina', 'listen'), {
  ...noBond,
  day: 29,
})
const unavailableSocial = { ...noBond, day: 21, injuries: { mina: 23 } }
assert.deepEqual(
  socialize(unavailableSocial, 'mina', 'listen'),
  unavailableSocial,
)
const separatedSocial = {
  ...noBond,
  day: 21,
  betrayal: {
    day: 20 as const,
    person: 'mina' as const,
    status: 'isolated' as const,
  },
}
assert.deepEqual(socialize(separatedSocial, 'mina', 'listen'), separatedSocial)
const deniedMina = {
  ...socialRun,
  day: 10,
  phase: 'map' as const,
  relationships: {
    ...socialRun.relationships!,
    partner: undefined,
    sidekick: undefined,
    romance: undefined,
    connections: { mina: { trust: 3, helped: true, romance: false } },
    days: [2, 3],
  },
  playerEvolution: {
    ...socialRun.playerEvolution!,
    form: 'villain' as const,
    protect: 0,
    exploit: 2,
    milestones: [{ day: 16 as const, form: 'villain' as const }],
  },
}
assert.ok(
  !socialChoices(deniedMina.relationships, 'mina', 10, {
    form: 'villain',
  }).some((c) => c.id === 'invite'),
)
assert.ok(
  !socialChoices(deniedMina.relationships, 'sol', 10).some(
    (c) => c.id === 'invite',
  ),
)
assert.ok(
  !socialChoices(deniedMina.relationships, 'imani', 10, { danger: 20 }).some(
    (c) => c.id === 'invite',
  ),
)
const olderSocial = { ...noBond, relationships: undefined }
assert.deepEqual(
  restoreAcademy(JSON.parse(JSON.stringify(olderSocial))),
  JSON.parse(JSON.stringify(olderSocial)),
)
assert.equal(
  restoreAcademy({ ...noBond, relationships: { ...blankSocial, days: [29] } }),
  null,
)
assert.equal(
  restoreAcademy({
    ...noBond,
    relationships: { ...blankSocial, partner: 'bad' },
  }),
  null,
)
assert.equal(
  restoreAcademy({
    ...noBond,
    relationships: {
      ...blankSocial,
      connections: { mina: { trust: -10, helped: true, romance: true } },
    },
  }),
  null,
)

assert.equal(CAMPAIGN_ANCHORS.length, 30)
assert.equal(new Set(CAMPAIGN_ANCHORS).size, 30)
// All 48 character identities can independently become the antagonist.
// The eight conspiracy templates are schemes, not an eight-character ceiling.
assert.equal(IDENTITY_ARCS.length, 48)
const observedOpponents = new Set<string>()
const observedPressures = new Set<number>()
for (const protagonist of IDENTITY_ARCS) {
  const rivals = new Set<string>()
  for (let seed = 1; seed <= 47; seed++) {
    const villain = campaignOpponent(seed, protagonist.signature)
    assert.notEqual(villain.signature, protagonist.signature)
    assert.equal(identityFor(villain.signature).realName, villain.realName)
    assert.notEqual(villain.hero.alias, villain.villain.alias)
    assert.ok(villain.quests.antagonist.length > 35)
    assert.ok(villain.villain.method.length > 35)
    rivals.add(villain.signature)
    observedOpponents.add(villain.signature)
    observedPressures.add(
      opponentPressure(protagonist.signature, villain.signature),
    )
  }
  assert.equal(
    rivals.size,
    47,
    'Every character can confront all other 47 people',
  )
}
assert.equal(observedOpponents.size, 48)
assert.ok(observedPressures.has(1))
assert.ok(observedPressures.has(0))
assert.ok(observedPressures.has(-1))
for (const villain of IDENTITY_ARCS) {
  assert.ok(antagonistBeat(villain, 15).includes(villain.quests.antagonist))
  assert.ok(antagonistBeat(villain, 20).includes(villain.villain.method))
  assert.ok(antagonistFinale(villain, true).includes(villain.backstory))
  assert.ok(antagonistFinale(villain, false).includes(villain.villain.method))
}
const identityRun = startFullAcademy(
  fieldFor('accident-fire'),
  47,
  'accident-fire',
)
const identityFoe = identityFor(identityRun.opponentSignature!)
assert.notEqual(identityRun.opponentSignature, identityRun.signature)
assert.ok(
  encounterFor({ ...identityRun, day: 15, phase: 'campus' }).scene.includes(
    identityFoe.quests.antagonist,
  ),
)
assert.ok(
  nextSchoolDay({ ...identityRun, day: 29, phase: 'debrief' }).scene.includes(
    identityFoe.villain.alias,
  ),
)
const identityEnding = finishAcademy(
  { ...identityRun, day: 30, phase: 'finale' },
  'protect',
)
assert.ok(identityEnding.scene.includes(identityFoe.realName))
assert.ok(identityEnding.scene.includes(identityFoe.villain.method))
assert.deepEqual(
  restoreAcademy(JSON.parse(JSON.stringify(identityEnding))),
  identityEnding,
)
assert.equal(
  restoreAcademy({ ...identityRun, opponentSignature: identityRun.signature }),
  null,
)
assert.equal(
  restoreAcademy({ ...identityRun, opponentSignature: 'unknown-power' }),
  null,
)
const oldCampaign = { ...identityRun, opponentSignature: undefined }
assert.deepEqual(
  restoreAcademy(JSON.parse(JSON.stringify(oldCampaign))),
  JSON.parse(JSON.stringify(oldCampaign)),
)
assert.ok(
  !finishAcademy(
    { ...oldCampaign, day: 30, phase: 'finale' },
    'protect',
  ).scene.includes(identityFoe.realName),
)

assert.equal(CAMPAIGN_VILLAINS.length, 8)
assert.equal(new Set(CAMPAIGN_VILLAINS.map((v) => v.id)).size, 8)
const allAccomplices = CAMPAIGN_VILLAINS.flatMap((v) => v.accomplices ?? [])
assert.equal(allAccomplices.length, 24)
assert.equal(new Set(allAccomplices.map((a) => a.id)).size, 24)
assert.equal(new Set(allAccomplices.map((a) => a.name)).size, 24)
assert.ok(
  allAccomplices.every((a) => a.motive.length > 24 && a.sabotage.length > 24),
)
assert.equal(new Set(CAMPAIGN_VILLAINS.map((v) => v.method)).size, 8)
for (let seed = 1; seed <= 8; seed++) {
  const villain = campaignVillain(seed)
  assert.equal(villain.id, CAMPAIGN_VILLAINS[seed % 8]!.id)
  assert.ok(villain.countermeasure && villain.fall && villain.coup)
  assert.ok(
    campaignPlotEvent(seed, villain.id, 8, 'Mina')?.scene.includes(
      'anonymous message',
    ),
  )
  assert.ok(
    campaignPlotEvent(seed, villain.id, 15, 'Mina')?.scene.includes(
      'duplicate emergency key',
    ),
  )
  assert.ok(
    campaignPlotEvent(seed, villain.id, 20, 'Mina')?.scene.includes(
      'betrayal is real',
    ),
  )
  for (const [day, index] of [
    [11, 0],
    [17, 1],
    [26, 2],
  ] as const) {
    const event = campaignPlotEvent(seed, villain.id, day, 'Mina')!
    assert.ok(event.scene.includes(villain.accomplices![index]!.name))
    assert.equal(event.options.length, 2)
  }
  const original = startFullAcademy('kinetic', seed)
  assert.equal(original.mastermind, villain.id)
  assert.equal(original.betrayer, campaignBetrayer(seed))
  const go = (day: number, choice: string) =>
    chooseEncounter({ ...original, day, phase: 'campus' }, choice)
  const betrayed = go(20, 'plot-betrayal-hear')
  assert.equal(betrayed.betrayal?.person, campaignBetrayer(seed))
  assert.equal(betrayed.betrayal?.day, 20)
  assert.equal(betrayed.betrayal?.status, 'active')
  assert.equal(studentAvailable(betrayed, campaignBetrayer(seed)), false)
  const blockedTeam = { ...betrayed, phase: 'dispatch' as const }
  assert.deepEqual(
    assignTeam(blockedTeam, incidentsFor(blockedTeam)[0]!.id, [
      campaignBetrayer(seed),
    ]),
    blockedTeam,
  )
  assert.ok(
    betrayed.log.some((line) => line.includes('The Hero Turns at the Gate')),
  )
  assert.deepEqual(
    restoreAcademy(JSON.parse(JSON.stringify(betrayed))),
    betrayed,
  )
  const reconciled = chooseEncounter(
    { ...betrayed, day: 24, phase: 'campus' },
    'plot-return-accountable',
  )
  assert.equal(reconciled.betrayal?.status, 'reconciled')
  assert.equal(studentAvailable(reconciled, campaignBetrayer(seed)), true)
  const isolated = chooseEncounter(
    { ...betrayed, day: 24, phase: 'campus' },
    'plot-return-separate',
  )
  assert.equal(isolated.betrayal?.status, 'isolated')
  assert.equal(studentAvailable(isolated, campaignBetrayer(seed)), false)
  const exposed = go(11, 'plot-a1-expose')
  assert.deepEqual(exposed.plotEvidence, [villain.accomplices![0]!.id])
  const withheld = go(11, 'plot-a1-bargain')
  assert.deepEqual(withheld.plotEvidence, [])
  assert.deepEqual(restoreAcademy(JSON.parse(JSON.stringify(exposed))), exposed)
  assert.equal(
    restoreAcademy({ ...exposed, plotEvidence: ['fabricated-lead'] }),
    null,
  )
  assert.equal(
    restoreAcademy({
      ...betrayed,
      betrayal: { day: 20, person: 'nobody', status: 'active' },
    }),
    null,
  )
}
const formerFourSeed = {
  ...startFullAcademy('kinetic', 4),
  mastermind: 'the-architect',
}
assert.equal(campaignVillain(4, formerFourSeed.mastermind).id, 'the-architect')
assert.deepEqual(
  restoreAcademy(JSON.parse(JSON.stringify(formerFourSeed))),
  formerFourSeed,
)

assert.equal(PROM_FINALE.choices.length, 4)
for (const seed of [1, 2, 3, 4, 997]) {
  let run = startFullAcademy(
    fieldFor('accident-fire'),
    seed,
    'accident-fire',
    'shelter',
  )
  assert.equal(run.flowVersion, 3)
  assert.equal(run.mastermind, campaignVillain(seed).id)
  assert.equal(restoreAcademy(JSON.parse(JSON.stringify(run)))?.flowVersion, 3)
  for (let day = 1; day <= 29; day++) {
    assert.equal(run.day, day)
    assert.equal(run.phase, 'map')
    const site = CITY_SITES[(day - 1) % CITY_SITES.length]!
    assert.notEqual(visitCitySite(run, 'unknown' as never).phase, 'campus')
    run = visitCitySite(run, site.id)
    assert.equal(run.phase, 'campus')
    assert.ok(encounterFor(run).scene.includes(CAMPAIGN_ANCHORS[day - 1]!))
    const choice =
      encounterFor(run).options[
        (seed + day) % encounterFor(run).options.length
      ]!
    run = chooseEncounter(run, choice.id)
    assert.equal(run.phase, 'dispatch')
    if (day === 20) {
      assert.equal(run.betrayal?.day, 20)
      assert.equal(studentAvailable(run, campaignBetrayer(seed)), false)
    }
    if (day === 24) assert.ok(run.betrayal?.status)
    if (day === 29) assert.ok(run.guestPlan)
    if (emergencyContact(run)) {
      run = callEmergencyVolunteer(run)
      assert.ok(knownContacts(run).length >= 3)
    }
    const cases = incidentsFor(run)
    for (const incident of cases) {
      const picked = STUDENTS.find(
        (student) =>
          knownContacts(run).includes(student.id) &&
          studentAvailable(run, student.id) &&
          !run.assignments.some((assignment) =>
            assignment.students.includes(student.id),
          ),
      )
      if (picked) run = assignTeam(run, incident.id, [picked.id])
    }
    if (!run.assignments.length && emergencyContact(run)) {
      run = callEmergencyVolunteer(run)
      const firstCase = cases[0]!
      const helper = knownContacts(run).find((id) => studentAvailable(run, id))!
      run = assignTeam(run, firstCase.id, [helper])
    }
    assert.ok(run.assignments.length)
    run = resolveDispatch(run)
    assert.equal(run.phase, 'debrief')
    assert.ok(run.injuries)
    assert.deepEqual(restoreAcademy(JSON.parse(JSON.stringify(run))), run)
    const after = nextSchoolDay(run)
    assert.equal(after.day, day === 29 ? 30 : day + 1)
    if (day < 29) assert.equal(after.phase, 'map')
    run = after
  }
  assert.equal(run.day, 30)
  assert.equal(run.phase, 'finale')
  assert.ok(run.scene.includes('real, not a simulation'))
  assert.ok(run.scene.includes('fourth dance'))
  const endings = ['protect', 'command', 'share', 'evacuate'] as const
  const titles = endings.map((choice) => finishAcademy(run, choice).ending)
  assert.equal(new Set(titles).size, 3)
  for (const choice of endings) {
    const ended = finishAcademy(run, choice)
    assert.equal(ended.phase, 'ending')
    assert.ok(ended.scene.includes('twelve-sided chandelier'))
    assert.ok(ended.scene.includes(campaignVillain(seed).name))
    assert.ok(ended.log.some((entry) => entry.includes('Day 30:')))
    assert.deepEqual(restoreAcademy(JSON.parse(JSON.stringify(ended))), ended)
  }
}
const injuredRun = {
  ...startFullAcademy('kinetic', 88),
  day: 6,
  injuries: { mina: 8 },
}
assert.equal(studentAvailable(injuredRun, 'mina'), false)
const dispatched = { ...injuredRun, phase: 'dispatch' as const }
assert.deepEqual(
  assignTeam(dispatched, incidentsFor(dispatched)[0]!.id, ['mina']),
  dispatched,
)
const betrayedInjured = {
  ...injuredRun,
  day: 21,
  injuries: { mina: 23 },
  betrayal: {
    day: 20 as const,
    person: 'mina' as const,
    status: 'active' as const,
  },
}
assert.deepEqual(tendInfirmary(betrayedInjured, 'mina'), betrayedInjured)
const healed = tendInfirmary(injuredRun, 'mina')
assert.equal(healed.phase, 'dispatch')
assert.equal(healed.injuries?.mina, 6)
assert.equal(healed.infirmaryDays?.[0], 6)
assert.equal(studentAvailable(healed, 'mina'), true)
assert.deepEqual(tendInfirmary(injuredRun, 'sol'), injuredRun)
assert.equal(restoreAcademy({ ...injuredRun, injuries: { mystery: 9 } }), null)
assert.equal(
  restoreAcademy({ ...injuredRun, visitedDays: { mystery: 2 } }),
  null,
)

for (const vow of POWER_VOWS) {
  assert.deepEqual(openingRouteDays(vow.id), [3, 10, 18, 25, 28])
  const titles = new Set<string>()
  for (const day of openingRouteDays(vow.id)) {
    const run = {
      ...startFullAcademy(
        fieldFor('mutant-genius'),
        20261026,
        'mutant-genius',
        vow.id,
      ),
      day,
      phase: 'campus' as const,
    }
    const event = openingRouteFor(run)
    assert.ok(event)
    titles.add(event.title)
    assert.equal(event.options.length, 3)
    assert.ok(event.scene.includes('Theo Lindqvist'))
    assert.ok(event.scene.includes('Mutant'))
    assert.ok(event.scene.includes('Genius'))
    assert.ok(
      event.options[0]!.text.includes(signatureFor('mutant', 'genius').name),
    )
    const outcome = chooseEncounter(run, event.options[0]!.id)
    assert.equal(outcome.phase, 'dispatch')
    assert.ok(outcome.log.some((line) => line.includes(event.title)))
    assert.ok(outcome.influence > run.influence)
    assert.ok(outcome.cityStanding !== undefined)
    assert.deepEqual(outcome.vowHistory, [{ day, action: 'protect' }])
    assert.deepEqual(restoreAcademy(outcome)?.vowHistory, outcome.vowHistory)
  }
  assert.equal(
    titles.size,
    5,
    'Each philosophy gets five nonrepeating personal adventures',
  )
}
assert.equal(
  openingRouteFor(
    startFullAcademy(fieldFor('mutant-genius'), 4, 'mutant-genius', 'claim'),
  ),
  null,
)
assert.notEqual(
  openingRouteFor({
    ...startFullAcademy(
      fieldFor('mutant-genius'),
      14,
      'mutant-genius',
      'shelter',
    ),
    day: 3,
    phase: 'campus',
  })?.scene,
  openingRouteFor({
    ...startFullAcademy(
      fieldFor('mutant-genius'),
      21,
      'mutant-genius',
      'shelter',
    ),
    day: 3,
    phase: 'campus',
  })?.scene,
  'An opening promise should have seeded alternate complications',
)

const goodPromise = [3, 10, 18, 25, 28].map((day) => ({
  day,
  action: 'protect' as const,
}))
const brokenPromise = goodPromise.map((event) => ({
  ...event,
  action: 'bargain' as const,
}))
assert.equal(routeStanding(goodPromise), 10)
assert.equal(routeStanding(brokenPromise), -10)
assert.equal(isVowMemory(goodPromise, 30), true)
assert.equal(isVowMemory(goodPromise, 18), false)
assert.equal(isVowMemory([...goodPromise, goodPromise[0]], 30), false)
assert.equal(isVowMemory([{ day: 3, action: 'hacked' }], 30), false)
assert.ok(routeEpilogue('unmask', goodPromise).includes('yearbook'))
const baseVowRun = startFullAcademy(
  fieldFor('mutant-genius'),
  20261026,
  'mutant-genius',
  'shelter',
)
const positiveEnding = finishAcademy(
  { ...baseVowRun, day: 30, phase: 'finale', vowHistory: goodPromise },
  'share',
)
const negativeEnding = finishAcademy(
  { ...baseVowRun, day: 30, phase: 'finale', vowHistory: brokenPromise },
  'share',
)
assert.equal(positiveEnding.ending, 'A CITY WITH A THOUSAND KEYS')
assert.equal(negativeEnding.ending, 'THE BROKEN GRID')
assert.ok(positiveEnding.scene.includes('missing bus'))
assert.ok(negativeEnding.scene.includes('Past bargains'))
assert.equal(
  restoreAcademy({
    ...baseVowRun,
    day: 30,
    vowHistory: [
      { day: 10, action: 'protect' },
      { day: 3, action: 'protect' },
    ],
  }),
  null,
  'Route memory cannot be out of order',
)
assert.ok(restoreAcademy({ ...baseVowRun, day: 30, vowHistory: brokenPromise }))
assert.ok(
  restoreAcademy(
    startFullAcademy(fieldFor('mutant-genius'), 42, 'mutant-genius'),
  ),
)

// Every new game starts with only two close friends; legacy saves stay playable.
for (const seed of [1, 2, 5, 42, 88, 101]) {
  const run = startFullAcademy('kinetic', seed)
  assert.equal(knownContacts(run).length, 2)
  assert.deepEqual(run.contacts, startingContacts(seed))
  assert.equal(new Set(run.contacts).size, 2)
  assert.ok(
    run.contacts.every(
      (id) => STUDENTS.find((p) => p.id === id)?.origin === 'academy',
    ),
  )
  const outsider = STUDENTS.find((person) => person.origin !== 'academy')!
  const dispatch = { ...run, phase: 'dispatch' as const }
  assert.deepEqual(
    assignTeam(dispatch, incidentsFor(dispatch)[0]!.id, [outsider.id]),
    dispatch,
  )
  const oldRun = startAcademy('kinetic', seed)
  assert.equal(knownContacts(oldRun).length, STUDENTS.length)
}
for (const person of STUDENTS) {
  const run = startFullAcademy('kinetic', 77)
  if (run.contacts!.includes(person.id)) continue
  const visited = visitCitySite(run, person.introSite)
  assert.equal(visited.phase, 'campus')
  const offered = recruitableContact(visited)
  assert.equal(offered?.id, person.id)
  assert.deepEqual(recruitContact(visited, 'nonsense' as StudentId), visited)
  const gained = recruitContact(visited, person.id)
  assert.equal(gained.phase, 'dispatch')
  assert.ok(knownContacts(gained).includes(person.id))
  assert.equal(knownContacts(gained).length, 3)
  assert.ok(gained.log.some((line) => line.includes(person.name)))
  assert.ok(restoreAcademy(gained))
  assert.equal(recruitableContact(gained), null)
}
const badContacts = startFullAcademy('kinetic', 99)
assert.equal(
  restoreAcademy({ ...badContacts, contacts: ['mina', 'mina'] }),
  null,
)
assert.equal(restoreAcademy({ ...badContacts, contacts: ['unknown'] }), null)
const allKnown = {
  ...startFullAcademy('kinetic', 2),
  contacts: STUDENTS.map((p) => p.id),
  phase: 'dispatch' as const,
}
for (const incident of INCIDENTS) {
  const moods = new Set(
    STUDENTS.map((person) => missionReaction(person.id, incident.id).mood),
  )
  assert.ok(moods.size >= 2, 'Every quest has distinctive reactions')
  for (const person of STUDENTS)
    assert.ok(missionReaction(person.id, incident.id).line.length > 12)
  assert.ok(missionRouteRoster(incident.id).length >= 2)
  const panel = { ...allKnown, day: 3, seed: 77 }
  if (!incidentsFor(panel).some((item) => item.id === incident.id)) continue
  const team = STUDENTS.slice(0, 3).map((p) => p.id)
  const threshold = dispatchModifier(panel, incident, team)
  const expected = Math.round(
    (100 *
      [0, 1, 2, 3, 4, 5].filter((n) => n + threshold >= incident.risk).length) /
      6,
  )
  assert.equal(dispatchChance(panel, incident.id, team), expected)
}
for (const group of missionRouteRoster('monorail')) {
  assert.ok(missionRoute('monorail', group))
}
const commission = {
  ...startFullAcademy('kinetic', 1),
  phase: 'dispatch' as const,
  day: 3,
  contacts: STUDENTS.map((s) => s.id),
}
const monorail = INCIDENTS.find((caseFile) => caseFile.id === 'monorail')!
const monorailRun = {
  ...commission,
  seed: 6,
  day:
    1 +
    ((INCIDENTS.length + INCIDENTS.indexOf(monorail) - (6 % INCIDENTS.length)) %
      INCIDENTS.length),
}
assert.ok(incidentsFor(monorailRun).some((item) => item.id === 'monorail'))
const joint = assignTeam(monorailRun, 'monorail', ['mara', 'sol'])
assert.equal(joint.assignments[0]?.students.length, 2)
assert.equal(
  missionRoute('monorail', joint.assignments[0]!.students)?.label,
  'The Union Override',
)
const outcome = resolveDispatch(joint)
assert.ok(
  outcome.reports
    .find((report) => report.caseId === 'monorail')
    ?.text.includes('The Union Override'),
)

assert.equal(PERSONAL_ARCS.length, 48)
assert.deepEqual(PERSONAL_CHAPTER_DAYS, [4, 12, 21, 27])
assert.equal(new Set(PERSONAL_ARCS.map((arc) => arc.signature)).size, 48)
assert.equal(new Set(PERSONAL_ARCS.map((arc) => arc.secret)).size, 48)
assert.equal(new Set(PERSONAL_ARCS.map((arc) => arc.relationship)).size, 48)
assert.equal(new Set(PERSONAL_ARCS.map((arc) => arc.betrayal)).size, 48)
assert.equal(new Set(PERSONAL_ARCS.map((arc) => arc.fallout)).size, 48)
const uniqueScenes = new Set<string>()
for (const identity of IDENTITY_ARCS) {
  const id = identity.signature
  const peer = personalCounterpart(id)
  assert.notEqual(peer.signature, id)
  assert.equal(personalCounterpart(peer.signature).signature, id)
  assert.equal(personalArcFor(id).signature, id)
  let narrativeRun = startFullAcademy(fieldFor(id), 742, id, 'shelter')
  for (const [day, option] of [
    [4, 'investigate'],
    [12, 'court'],
    [21, 'expose'],
    [27, 'hero'],
  ] as const) {
    const campus = {
      ...narrativeRun,
      day,
      phase: 'campus' as const,
      selectedSite: 'academy-roof' as const,
    }
    const episode = personalEncounter(campus)
    assert.ok(episode)
    assert.ok(episode.scene.includes(identity.realName))
    assert.ok(episode.scene.includes(peer.realName))
    assert.equal(episode.options.length, 3)
    assert.ok(episode.options.some((choice) => choice.id === option))
    assert.ok(encounterFor(campus).scene.includes(identity.realName))
    uniqueScenes.add(episode.scene)
    narrativeRun = chooseEncounter(campus, option)
    assert.equal(narrativeRun.phase, 'dispatch')
    assert.equal(narrativeRun.identityHistory?.at(-1)?.choice, option)
    assert.deepEqual(
      restoreAcademy(JSON.parse(JSON.stringify(narrativeRun))),
      narrativeRun,
    )
  }
  assert.equal(narrativeRun.identityHistory?.length, 4)
  assert.equal(
    personalOutcomeArt(narrativeRun),
    'identities/' + id + '/outcomes/hero',
  )
  assert.ok(personalEnding(narrativeRun).includes(identity.realName))
  assert.ok(personalEnding(narrativeRun).includes(peer.realName))
  const villainRun = {
    ...narrativeRun,
    identityHistory: [
      { day: 4 as const, choice: 'conceal' as const },
      { day: 12 as const, choice: 'distance' as const },
      { day: 21 as const, choice: 'leverage' as const },
      { day: 27 as const, choice: 'villain' as const },
    ],
  }
  assert.equal(
    personalOutcomeArt(villainRun),
    'identities/' + id + '/outcomes/villain',
  )
  assert.ok(personalEnding(villainRun).includes(identity.villain.alias))
  assert.ok(personalEnding(villainRun).includes('broken promise'))
  assert.ok(
    personalOutcomeModifier(narrativeRun.identityHistory) >
      personalOutcomeModifier(villainRun.identityHistory),
  )
  const betrayalScene = personalOutcomeArt({
    ...villainRun,
    identityHistory: villainRun.identityHistory.slice(0, 3),
  })
  assert.equal(betrayalScene, 'identities/' + id + '/outcomes/betrayal')
  assert.equal(
    personalOutcomeArt({
      ...narrativeRun,
      identityHistory: narrativeRun.identityHistory!.slice(0, 2),
    }),
    'identities/' + id + '/outcomes/partner',
  )
  const finale = finishAcademy(
    { ...narrativeRun, day: 30, phase: 'finale' },
    'share',
  )
  assert.ok(finale.scene.includes(personalArcFor(id).fallout))
  assert.ok(finale.scene.includes(peer.realName))
}
assert.equal(uniqueScenes.size, 48 * 4)
const samplePersonal = startFullAcademy(
  fieldFor('accident-fire'),
  12,
  'accident-fire',
)
assert.equal(
  isValidPersonalHistory([{ day: 4, choice: 'investigate' }], 4),
  true,
)
assert.equal(isValidPersonalHistory([{ day: 12, choice: 'court' }], 4), false)
assert.equal(
  isValidPersonalHistory([{ day: 21, choice: 'invented' }], 21),
  false,
)
assert.equal(
  isValidPersonalHistory(
    [
      { day: 12, choice: 'ally' },
      { day: 4, choice: 'investigate' },
    ],
    27,
  ),
  false,
)
assert.equal(
  restoreAcademy({
    ...samplePersonal,
    day: 30,
    identityHistory: [{ day: 27, choice: 'invented' }],
  }),
  null,
)
assert.equal(
  restoreAcademy({
    ...samplePersonal,
    day: 30,
    identityHistory: [
      { day: 27, choice: 'hero' },
      { day: 27, choice: 'villain' },
    ],
  }),
  null,
)
assert.ok(
  restoreAcademy({
    ...samplePersonal,
    day: 30,
    identityHistory: [{ day: 27, choice: 'independent' }],
  }),
)
const selfArt = fromRoot('utils/cometAcademy/artSlots.ts')
assert.ok(selfArt.includes('personalOutcomeArt'))

const ngPlus = startFullAcademy(
  fieldFor('mutant-genius'),
  20261026,
  'mutant-genius',
  'unmask',
  'hero',
)
assert.equal(ngPlus.playerEvolution?.form, 'hero')
assert.equal(ngPlus.initialForm, 'hero')
assert.equal(
  restoreAcademy(JSON.parse(JSON.stringify(ngPlus)))?.playerEvolution?.form,
  'hero',
)
assert.equal(
  restoreAcademy({
    ...ngPlus,
    initialForm: undefined,
  }),
  null,
  'Starting in a heroic identity needs an explicit New Game Plus origin',
)
const ngVillain = startFullAcademy(
  fieldFor('mutant-genius'),
  20261026,
  'mutant-genius',
  'claim',
  'villain',
)
assert.equal(restoreAcademy(ngVillain)?.playerEvolution?.form, 'villain')
assert.equal(
  startFullAcademy(fieldFor('mutant-genius'), 42, 'mutant-genius')
    .playerEvolution?.form,
  'student',
)

assert.equal(PERSONAL_QUESTS.length, 48)
assert.equal(new Set(PERSONAL_QUESTS.map((quest) => quest.signature)).size, 48)
assert.equal(new Set(PERSONAL_QUESTS.map((quest) => quest.proof)).size, 48)
assert.equal(new Set(PERSONAL_QUESTS.map((quest) => quest.betrayal)).size, 48)
assert.equal(new Set(PERSONAL_QUESTS.map((quest) => quest.location)).size, 48)
assert.deepEqual(PERSONAL_DAYS, [6, 9, 19, 22])
for (const identity of IDENTITY_ARCS) {
  const quest = PERSONAL_QUESTS.find(
    (entry) => entry.signature === identity.signature,
  )
  assert.ok(quest, 'Personal arc required for ' + identity.realName)
  assert.ok(quest.boundary.length >= 30)
  assert.ok(quest.illustrations.student.includes(identity.student.alias))
  assert.ok(quest.illustrations.hero.includes(identity.hero.alias))
  assert.ok(quest.illustrations.villain.includes(identity.villain.alias))
  for (const form of ['student', 'hero', 'villain'] as const) {
    assert.ok(quest.illustrations[form].length >= 170)
    assert.ok(quest.illustrations[form].includes(quest.location))
  }
  for (const day of PERSONAL_DAYS) {
    const run = {
      ...startFullAcademy(
        fieldFor(identity.signature),
        211,
        identity.signature,
        'claim',
      ),
      day,
      phase: 'campus' as const,
    }
    const event = personalQuestEvent(run)
    assert.ok(event)
    assert.ok(encounterFor(run).scene.includes(CAMPAIGN_ANCHORS[day - 1]!))
    assert.equal(event.options.length, 3)
    assert.ok(event.scene.includes(identity.realName) || day !== 22)
    for (const resolution of ['protect', 'confront', 'exploit'] as const) {
      const selected = event.options.find((option) =>
        option.id.endsWith(resolution),
      )
      assert.ok(selected)
      const outcome = chooseEncounter(run, selected.id)
      assert.equal(outcome.phase, 'dispatch')
      assert.deepEqual(outcome.personalHistory, [{ day, choice: resolution }])
      assert.deepEqual(
        restoreAcademy(outcome)?.personalHistory,
        outcome.personalHistory,
      )
      assert.ok(
        outcome.scene.includes(quest.boundary) || resolution !== 'exploit',
      )
      const plate = personalOutcomeArtKey(
        identity.signature,
        outcome.personalHistory,
        day,
      )
      assert.equal(
        plate,
        'identities/' +
          identity.signature +
          '/outcomes/' +
          (day < 16 || resolution === 'confront'
            ? 'student'
            : resolution === 'protect'
              ? 'hero'
              : 'villain'),
      )
    }
  }
  const good: PersonalMemory[] = PERSONAL_DAYS.map((day) => ({
    day,
    choice: 'protect' as const,
  }))
  const bad: PersonalMemory[] = PERSONAL_DAYS.map((day) => ({
    day,
    choice: 'exploit' as const,
  }))
  assert.equal(personalStanding(good), 8)
  assert.equal(personalStanding(bad), -8)
  assert.equal(validPersonalHistory(good, 30), true)
  assert.equal(validPersonalHistory(good, 19), false)
  assert.equal(validPersonalHistory([...good, good[0]], 30), false)
  assert.equal(validPersonalHistory([{ day: 6, choice: 'hacked' }], 30), false)
  assert.ok(
    personalFinale(identity.signature, good).includes(identity.hero.alias),
  )
  assert.ok(
    personalFinale(identity.signature, bad).includes(identity.villain.alias),
  )
  const final = startFullAcademy(
    fieldFor(identity.signature),
    211,
    identity.signature,
    'claim',
  )
  const honest = finishAcademy(
    { ...final, day: 30, phase: 'finale', personalHistory: good },
    'share',
  )
  const corrupt = finishAcademy(
    { ...final, day: 30, phase: 'finale', personalHistory: bad },
    'share',
  )
  assert.ok(honest.scene.includes(identity.hero.alias))
  assert.ok(corrupt.scene.includes(identity.villain.alias))
  assert.notEqual(honest.ending, corrupt.ending)
  assert.equal(
    restoreAcademy({
      ...final,
      personalHistory: [{ day: 19, choice: 'hacked' }],
    }),
    null,
  )
}
assert.equal(
  personalQuestEvent(
    startFullAcademy(fieldFor('mutant-genius'), 17, 'mutant-genius'),
  ),
  null,
)

const page = fromRoot('pages/play/comet-city-academy.vue')
const opening = fromRoot('components/play/cometAcademy/AcademyOpening.vue')
const store = fromRoot('stores/cometAcademyStore.ts')
const tab = fromRoot('content/channels/arcade/comet-city-academy.md')
const art = fromRoot('public/comet-city-academy/academy-stage.svg')
assert.ok(page.includes('data-layout="console-fixed"'))
assert.ok(page.includes('data-testid="academy-dispatch"'))
assert.ok(page.includes('data-testid="academy-personal-story-progress"'))
assert.ok(page.includes('data-testid="academy-personal-identity-chapter"'))
assert.ok(page.includes('data-testid="academy-quest-poster-row"'))
assert.ok(page.includes('data-testid="academy-quest-odds"'))
assert.ok(page.includes('data-testid="academy-special-mission-route"'))
assert.ok(page.includes('data-testid="academy-contact-encounter"'))
assert.ok(tab.includes('route: /play/comet-city-academy'))
assert.ok(art.includes('viewBox="0 0 1440 900"'))
assert.ok(page.includes('Prom of Doom | Capes & Tassels'))
assert.ok(tab.includes("title: 'Prom of Doom'"))
assert.ok(opening.includes('data-testid="academy-new-game"'))
assert.ok(opening.includes("screen === 'title'"))
assert.ok(opening.includes("screen === 'origin' || screen === 'affinity'"))
assert.ok(opening.includes('data-testid="academy-persona-triad"'))
assert.ok(opening.includes('data-testid="academy-confirm"'))
assert.ok(opening.includes('data-testid="academy-begin"'))
assert.ok(opening.includes('unlockedForms.includes(form)'))
assert.ok(opening.includes('data-testid="academy-returning-hero"'))
assert.ok(store.includes('YEARBOOK_KEY'))
assert.ok(store.includes('!yearbook.value[signature]?.forms.includes(form)'))
assert.ok(page.includes('FACE THE PROM-NIGHT SIMULATION'))
assert.ok(page.includes('data-testid="academy-vow-journal"'))
assert.ok(page.includes('data-testid="academy-map"'))
assert.ok(page.includes('data-testid="academy-map-sites"'))
assert.ok(page.includes('data-testid="academy-plot-status"'))
assert.ok(page.includes('data-testid="academy-villain-identity"'))
assert.ok(page.includes('data-testid="academy-evolution-dossier"'))
assert.ok(page.includes('data-testid="academy-identity-choice"'))
assert.ok(page.includes('data-testid="academy-social-switch"'))
assert.ok(page.includes('data-testid="academy-social-panel"'))
assert.ok(page.includes('data-testid="academy-social-choice"'))
assert.ok(page.includes("store.end('share')"))
assert.ok(page.includes('store.heal(student.id)'))
assert.ok(page.includes('site.teaser'))
assert.ok(page.includes("mapView === 'campus'"))
assert.ok(page.includes('RUN NIGHT SIMULATIONS'))
assert.ok(!page.includes('POWER_FORMS'))
// Art prompts: one fixed description per person, reused word for word.
for (const person of CHARACTER_ROSTER) {
  const look = CAST_LOOKS[person.signature]
  assert.ok(look, `${person.signature} has a cast look`)
  const prompt =
    PROM_ART_PROMPTS[`identities/${person.signature}/student`] ?? ''
  assert.ok(
    prompt.includes(look.look.slice(1)),
    `${person.signature} portrait reuses its look`,
  )
  assert.ok(!prompt.includes(person.realName), 'names stay out of prompts')
}
assert.deepEqual(
  Object.keys(TEAM_LOOKS).sort(),
  STUDENTS.map((student) => student.id).sort(),
)
for (const [key, prompt] of Object.entries(PROM_ART_PROMPTS))
  assert.ok(
    prompt.length >= 120 && prompt.length <= 900,
    `${key} prompt length ${prompt.length}`,
  )
console.log(
  'Prom of Doom opening, earned personas, yearbook and thirty-day gameplay: OK',
)
