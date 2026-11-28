// Prom of Doom patrol stories, hidden matchups, multi-day threads and a
// twelve-seed from-start comparison (t-022, kind_robots#4402).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { CITY_SITES } from '../cometAcademy/cityMap'
import { fieldFor, IDENTITY_ARCS } from '../cometAcademy/identityArcs'
import { scrapbookMoments } from '../cometAcademy/consoleScreens'
import {
  EXPANDED_MISSIONS,
  expandedMissionFor,
} from '../cometAcademy/expandedNightCases'
import { missionRoute, missionRouteRoster } from '../cometAcademy/missionTeams'
import { PATROL_STORIES, patrolStoryById } from '../cometAcademy/patrolStories'
import {
  PATROL_IDENTITY_AFTERMATH,
  patrolIdentityAftermath,
} from '../cometAcademy/patrolIdentityAftermath'
import { PATROL_ZONES, type PatrolZoneId } from '../cometAcademy/nightPatrols'
import { patrolCrewFor } from '../cometAcademy/patrolCrews'
import { VILLAIN_HENCHMEN } from '../cometAcademy/villainHenchmen'
import {
  COMPLETE_NIGHT_DECK,
  activePatrolStory,
  assignPlayerCase,
  assignTeam,
  callEmergencyVolunteer,
  chooseEncounter,
  chooseNightPatrol,
  dispatchModifier,
  emergencyContact,
  encounterFor,
  incidentsFor,
  knownContacts,
  missionSecretFor,
  nextSchoolDay,
  patrolEncounterFor,
  patrolOptionsFor,
  recruitContact,
  recruitableContact,
  resolveDispatch,
  restoreAcademy,
  startFullAcademy,
  storyLaterModifier,
  storySecretUnlocked,
  storyTeammate,
  studentAvailable,
  visitCitySite,
  type AcademyRun,
  type StudentId,
} from '../cometAcademy/rules'

const page = readFileSync(
  new URL('../../pages/play/comet-city-academy.vue', import.meta.url),
  'utf8',
)
const roundTrip = (run: AcademyRun) => {
  const saved = JSON.parse(JSON.stringify(run))
  assert.deepEqual(restoreAcademy(saved), saved, `save day ${run.day}`)
  return run
}

// ---------------------------------------------------------- authored data
const TITLES = [
  'The Frog Under the Clocktower',
  "Grandma's Last Stop",
  'The Rooftop With Two Shadows',
]
assert.deepEqual(
  PATROL_STORIES.map((story) => story.title),
  TITLES,
)
const allText: string[] = []
for (const story of PATROL_STORIES) {
  assert.ok(story.scene.length > 250, `${story.id} scene`)
  assert.ok(story.secretHint.length > 40)
  const acts = story.choices.filter((choice) => choice.kind === 'act')
  assert.ok(acts.length >= 3, `${story.id} offers several approaches`)
  assert.equal(story.choices.filter((c) => c.kind === 'refuse').length, 1)
  assert.equal(story.choices.filter((c) => c.kind === 'secret').length, 1)
  for (const choice of acts)
    for (const grade of ['success', 'mixed', 'failure'] as const) {
      const outcome = choice.outcomes[grade]
      assert.ok(outcome, `${choice.id} ${grade}`)
      assert.ok(outcome.text.length > 90 && outcome.morning.length > 40)
      allText.push(outcome.text, outcome.morning)
    }
  for (const choice of story.choices.filter((c) => c.kind !== 'act')) {
    const outcome = Object.values(choice.outcomes)[0]!
    assert.ok(outcome.text.length > 90 && outcome.morning.length > 40)
    allText.push(outcome.text, outcome.morning)
  }
  // Every story changes a later night, for better or worse.
  assert.ok(
    story.choices.some((c) => Object.values(c.outcomes).some((o) => o.later)),
  )
}
assert.equal(new Set(allText).size, allText.length, 'no reused outcome prose')
// A successful arrest is a moral failure in the city's eyes.
const arrest = patrolStoryById('story-last-stop')!.choices[0]!.outcomes.success!
assert.ok(arrest.standing < 0 && arrest.influence > 0)

// --------------------------------------------- from-start play helpers
type Plan = {
  zone?: PatrolZoneId
  pick?: number
  site?: string
  onDebrief?: (run: AcademyRun) => void
}

function dayPlan(run: AcademyRun, plan: Plan = {}): AcademyRun {
  assert.equal(run.phase, 'map', `day ${run.day} starts in daylight`)
  const site =
    plan.site ??
    CITY_SITES.find(
      (entry) => (run.visitedDays?.[entry.id] ?? -7) <= run.day - 7,
    )!.id
  let next = visitCitySite(run, site as never)
  assert.equal(next.phase, 'campus')
  const recruit = recruitableContact(next)
  if (recruit && knownContacts(next).length < 3)
    next = recruitContact(next, recruit.id)
  else next = chooseEncounter(next, encounterFor(next).options[0]!.id)
  assert.equal(next.phase, 'dispatch', `day ${run.day} reaches night`)
  if (emergencyContact(next)) next = callEmergencyVolunteer(next)
  if (plan.zone && next.day >= 4) {
    const options = patrolOptionsFor(next, plan.zone)
    const choice = options[(plan.pick ?? 0) % options.length]!
    next = chooseNightPatrol(next, plan.zone, choice.id)
    assert.equal(next.nightPatrol?.choiceId, choice.id)
  } else next = assignPlayerCase(next, incidentsFor(next)[0]!.id)
  for (const incident of incidentsFor(next).slice(1)) {
    const free = knownContacts(next).find(
      (id) =>
        studentAvailable(next, id) &&
        storyTeammate(next) !== id &&
        !next.assignments.some((entry) => entry.students.includes(id)),
    )
    if (free) next = assignTeam(next, incident.id, [free])
  }
  next = resolveDispatch(next)
  assert.equal(next.phase, 'debrief')
  roundTrip(next)
  plan.onDebrief?.(next)
  return nextSchoolDay(next)
}

function playTo(run: AcademyRun, day: number, plan: Plan = {}) {
  while (run.day < day) run = dayPlan(run, plan.site ? plan : {})
  return run
}

// ------------------------------------ The Frog Under the Clocktower
{
  const fresh = startFullAcademy('kinetic', 31)
  const run = playTo(fresh, 6)
  assert.ok(activePatrolStory({ ...run, phase: 'dispatch' }, 'academy'))
  assert.equal(activePatrolStory({ ...run, day: 5 }, 'academy'), null)
  assert.equal(activePatrolStory(run, 'harbor'), null)
  const story = patrolStoryById('story-clocktower')!
  const lab = run.visitedDays?.['engineering-workshop']
  // The secret depends on an earlier daytime lab, never on tonight's choice.
  assert.equal(storySecretUnlocked(run, story), Boolean(lab && lab < 6))
  const noLab = { ...run, visitedDays: {}, missionClues: [] }
  assert.equal(storySecretUnlocked(noLab, story), false)
  assert.ok(patrolEncounterFor(noLab, 'academy').hint, 'clue, not spoiler')
  const withLab = {
    ...run,
    visitedDays: { ...run.visitedDays, 'engineering-workshop': 2 },
  }
  assert.ok(storySecretUnlocked(withLab, story))
  assert.equal(patrolEncounterFor(withLab, 'academy').hint, null)
  // Play every branch from the same night and compare.
  const night = (base: AcademyRun, choiceId: string) => {
    let next = visitCitySite(base, 'student-commons')
    next = chooseEncounter(next, encounterFor(next).options[0]!.id)
    next = chooseNightPatrol(next, 'academy', choiceId)
    assert.equal(next.nightPatrol?.encounterId, story.id)
    return resolveDispatch(next)
  }
  const texts = new Set<string>()
  for (const choice of story.choices) {
    const base = choice.kind === 'secret' ? withLab : run
    const done = night(base, choice.id)
    const memory = done.patrolHistory!.at(-1)!
    assert.equal(memory.encounterId, story.id)
    assert.ok(memory.outcome)
    assert.ok(done.reports.some((r) => r.title.endsWith(story.title)))
    texts.add(done.reports.find((r) => r.caseId.startsWith('patrol-'))!.text)
    roundTrip(done)
    const morning = nextSchoolDay(done)
    const outcome = choice.outcomes[memory.outcome!]!
    assert.equal(morning.scene, `The next bell rings. ${outcome.morning}`)
    // Once only: the academy roofs go back to their rotating scenes.
    assert.equal(activePatrolStory(morning, 'academy'), null)
    if (outcome.later) {
      const later = COMPLETE_NIGHT_DECK.find(
        (incident) =>
          incident.need === outcome.later!.need ||
          incident.allegiance === outcome.later!.allegiance,
      )!
      assert.equal(storyLaterModifier(morning, later), outcome.later.modifier)
      assert.equal(storyLaterModifier(done, later), 0, 'not on the same night')
    }
  }
  assert.equal(
    texts.size,
    story.choices.length,
    'every branch reads differently',
  )
  // The secret is unavailable without the lab and cannot be forced.
  const forced = chooseNightPatrol(
    { ...noLab, phase: 'dispatch' },
    'academy',
    'clocktower-secret',
  )
  assert.equal(forced.nightPatrol, noLab.nightPatrol)
}

// ------------------------------------------------- Grandma's Last Stop
{
  const story = patrolStoryById('story-last-stop')!
  const run = playTo(startFullAcademy('spatial', 47), 11)
  assert.ok(activePatrolStory(run, 'transit'))
  const strangers = { ...run, contacts: [] as StudentId[], patrolHistory: [] }
  assert.equal(storySecretUnlocked(strangers, story), false)
  assert.ok(
    storySecretUnlocked({ ...strangers, contacts: ['mara', 'lark'] }, story),
    'union organizer plus an empath',
  )
  assert.equal(
    storySecretUnlocked({ ...strangers, contacts: ['mara'] }, story),
    false,
  )
  // A prior promise to the riders: an earlier transit patrol.
  let rider = startFullAcademy('spatial', 47)
  rider = playTo(rider, 4)
  rider = dayPlan(rider, { zone: 'transit' })
  rider = playTo(rider, 11)
  assert.ok(storySecretUnlocked(rider, story))
  const secret = dayPlan(rider, {
    zone: 'transit',
    pick: patrolOptionsFor(
      { ...rider, phase: 'dispatch' },
      'transit',
    ).findIndex((o) => o.id === 'last-stop-secret'),
  })
  assert.equal(secret.patrolHistory!.at(-1)!.outcome, 'secret')
  assert.ok(secret.scene.includes('transit union'))
  // Spatial missions run one step easier for the rest of the term.
  const spatial = COMPLETE_NIGHT_DECK.find((i) => i.need === 'spatial')!
  assert.equal(storyLaterModifier(secret, spatial), 2)
  assert.equal(
    dispatchModifier(secret, spatial, []) -
      dispatchModifier({ ...secret, patrolHistory: [] }, spatial, []),
    2,
  )
  // Refusal is not a dead end: the night ends and tomorrow remembers.
  const refused = dayPlan(run, {
    zone: 'transit',
    pick: patrolOptionsFor({ ...run, phase: 'dispatch' }, 'transit').findIndex(
      (o) => o.id === 'last-stop-refuse',
    ),
  })
  assert.equal(refused.patrolHistory!.at(-1)!.outcome, 'refusal')
  assert.ok(refused.scene.includes('crossed your name off a list'))
}

// ------------------------------------------- The Rooftop With Two Shadows
{
  const story = patrolStoryById('story-two-shadows')!
  let run = startFullAcademy('empathy', 59)
  run = playTo(run, 22)
  assert.ok(run.betrayal, 'the day-20 betrayal has happened')
  assert.ok(activePatrolStory(run, 'transit'))
  const reconciled = {
    ...run,
    betrayal: { ...run.betrayal!, status: 'reconciled' as const },
  }
  const isolated = {
    ...run,
    betrayal: { ...run.betrayal!, status: 'isolated' as const },
  }
  assert.ok(storySecretUnlocked(reconciled, story))
  assert.equal(storySecretUnlocked(isolated, story), false)
  const secretLabel = patrolOptionsFor(
    { ...reconciled, phase: 'dispatch' },
    'transit',
  ).find((o) => o.id === 'two-shadows-secret')!.label
  assert.ok(!secretLabel.includes('{betrayer}'), 'names are filled in')
  // The split sends the most trusted available teammate, who can be hurt.
  const night = (base: AcademyRun, choiceId: string) => {
    let next = visitCitySite(base, 'student-commons')
    next = chooseEncounter(next, encounterFor(next).options[0]!.id)
    return chooseNightPatrol(next, 'transit', choiceId)
  }
  let hurt: AcademyRun | null = null
  for (let seed = 59; seed < 140 && !hurt; seed++) {
    const base = { ...isolated, seed, contacts: ['mina', 'kit'] as StudentId[] }
    const chosen = night(base, 'two-shadows-split')
    if (chosen.nightPatrol?.choiceId !== 'two-shadows-split') continue
    const mate = storyTeammate(chosen)!
    const done = resolveDispatch(chosen)
    const grade = done.patrolHistory!.at(-1)!.outcome
    if (grade === 'mixed' || grade === 'failure') {
      assert.ok(done.reports.some((r) => r.names.includes('(injured)')))
      assert.ok(
        done.reports.some((r) => r.text.includes('working for the other side')),
        'an unreconciled betrayer works the trap',
      )
      const morning = nextSchoolDay(done)
      assert.equal(studentAvailable(morning, mate), false, 'benched tomorrow')
      roundTrip(done)
      hurt = morning
    }
  }
  assert.ok(hurt, 'some seed injures the teammate sent to the other roof')
  // Without allies the split option is never offered.
  const alone = {
    ...run,
    contacts: [] as StudentId[],
    phase: 'dispatch' as const,
  }
  assert.ok(
    !patrolOptionsFor(alone, 'transit').some(
      (o) => o.id === 'two-shadows-split',
    ),
  )
}

// --------------------------------------------- save guards for stories
{
  let run = playTo(startFullAcademy('kinetic', 31), 6)
  run = dayPlan(run, { zone: 'academy' })
  const saved = roundTrip(run)
  const memory = saved.patrolHistory!.at(-1)!
  assert.equal(memory.encounterId, 'story-clocktower')
  assert.ok(
    scrapbookMoments(saved).some((moment) =>
      moment.title.endsWith('The Frog Under the Clocktower'),
    ),
    'the story is kept in the Scrapbook',
  )
  const tamper = (entry: object) =>
    restoreAcademy({
      ...saved,
      patrolHistory: [...saved.patrolHistory!.slice(0, -1), entry],
    })
  assert.equal(tamper({ ...memory, outcome: 'secret' }), null)
  assert.equal(tamper({ ...memory, outcome: undefined }), null)
  assert.equal(tamper({ ...memory, day: 3 }), null)
  assert.equal(tamper({ ...memory, zone: 'harbor' }), null)
  assert.equal(
    restoreAcademy({
      ...saved,
      patrolHistory: [...saved.patrolHistory!, { ...memory, day: 7 }],
      day: 7,
    }),
    null,
    'a story cannot be played twice',
  )
  // Ordinary scenes never carry a story grade.
  const plain = playTo(startFullAcademy('kinetic', 31), 4)
  const walked = dayPlan(plain, { zone: 'harbor' })
  const entry = walked.patrolHistory!.at(-1)!
  assert.equal(entry.outcome, undefined)
  assert.equal(
    restoreAcademy({
      ...walked,
      patrolHistory: [{ ...entry, outcome: 'success' }],
    }),
    null,
  )
}

// ---------------------------------------- 12 hidden two-person matchups
const matchups = COMPLETE_NIGHT_DECK.flatMap((incident) =>
  missionRouteRoster(incident.id)
    .filter((pair) => pair.length >= 2)
    .map((pair) => ({ incident, pair })),
)
assert.ok(matchups.length >= 12, `${matchups.length} hidden matchups`)
const routeResults = new Set<string>()
for (const { incident, pair } of matchups) {
  const route = missionRoute(incident.id, pair)!
  assert.ok(route.result.length > 80)
  routeResults.add(route.result)
  // Hidden: half a pair unlocks nothing.
  assert.equal(missionRoute(incident.id, [pair[0]!]), null)
}
assert.equal(
  routeResults.size,
  matchups.length,
  'each matchup has its own story',
)
// The board names a route only once that exact team is assembled.
assert.ok(
  page.includes('v-if="missionRoute(incident.id, teamFor(incident.id))"'),
)

// ----------------------------------------------------- multi-day threads
// Four clue threads: a clue found on one night opens a different secret on a
// later night in the same thread. Three story threads change later nights.
const clueThreads = new Set(EXPANDED_MISSIONS.map((mission) => mission.thread))
assert.equal(clueThreads.size, 4)
for (const thread of clueThreads) {
  const missions = EXPANDED_MISSIONS.filter((m) => m.thread === thread)
  assert.ok(missions.length >= 2)
  const [first, second] = missions
  const base = {
    ...startFullAcademy(second!.incident.need, 77),
    day: 12,
    phase: 'dispatch' as const,
  }
  const later = { ...base, playerCaseId: second!.incident.id }
  assert.equal(missionSecretFor(later, second!.incident.id), null)
  assert.equal(
    missionSecretFor(
      { ...later, missionClues: [first!.incident.id] },
      second!.incident.id,
    ),
    second!.secret,
  )
  assert.ok(expandedMissionFor(first!.incident.id))
}
const storyThreads = PATROL_STORIES.filter((story) =>
  story.choices.some((c) => Object.values(c.outcomes).some((o) => o.later)),
)
assert.ok(clueThreads.size + storyThreads.length >= 6, 'six multi-day threads')

// The known rival's one-hit SPECIES now takes the field on a real patrol,
// with counter, mercy and coercion choices, without replacing authored stories.
assert.equal(VILLAIN_HENCHMEN.length, 48)
const crewChoices = new Set<string>()
for (const henchman of VILLAIN_HENCHMEN) {
  const encounter = patrolCrewFor(
    { day: 17, opponentSignature: henchman.signature },
    'harbor',
  )!
  assert.ok(encounter.scene.includes(henchman.name))
  assert.ok(encounter.scene.includes(henchman.move))
  assert.equal(encounter.choices.length, 3)
  for (const choice of encounter.choices) {
    assert.ok(
      choice.result.includes(henchman.counter) ||
        choice.result.includes(henchman.story),
    )
    crewChoices.add(choice.id)
  }
}
assert.equal(crewChoices.size, 144)
assert.equal(
  patrolCrewFor({ day: 13, opponentSignature: 'accident-fire' }, 'harbor'),
  null,
  'secret rival crews do not appear before reveal',
)
const crewBase = {
  ...startFullAcademy('kinetic', 91),
  day: 25,
  phase: 'dispatch' as const,
}
const crewZone = PATROL_ZONES.map((zone) => zone.id).find(
  (zone) => !activePatrolStory(crewBase, zone),
)!
assert.ok(crewZone, 'an available district supports the crew intervention')
const offeredCrew = patrolOptionsFor(crewBase, crewZone).filter((option) =>
  option.id.startsWith('crew-'),
)
assert.equal(offeredCrew.length, 3)
assert.ok(patrolEncounterFor(crewBase, crewZone).scene.includes('one-hit'))
const mercyChoice = offeredCrew.find((option) =>
  option.id.endsWith('-mercy-intervene'),
)!
const coercedChoice = offeredCrew.find((option) =>
  option.id.endsWith('-command-exploit'),
)!
const mercyPatrol = chooseNightPatrol(crewBase, crewZone, mercyChoice.id)
assert.equal(mercyPatrol.nightPatrol?.choiceId, mercyChoice.id)
assert.ok(restoreAcademy(JSON.parse(JSON.stringify(mercyPatrol))))
const mercyDebrief = resolveDispatch(mercyPatrol)
assert.ok(
  mercyDebrief.patrolHistory?.some(
    (memory) => memory.choiceId === mercyChoice.id,
  ),
)
assert.ok(
  mercyDebrief.reports.some((report) =>
    report.text.includes('without a casualty'),
  ),
)
const mercyMoment = scrapbookMoments(mercyDebrief).find((moment) =>
  moment.title.includes('on Patrol'),
)!
assert.ok(mercyMoment)
assert.ok(mercyMoment.text.includes(mercyChoice.result))
assert.ok(restoreAcademy(JSON.parse(JSON.stringify(mercyDebrief))))
const falseRival =
  mercyDebrief.opponentSignature === 'psychic-water'
    ? 'accident-fire'
    : 'psychic-water'
const forgedCrew = {
  ...mercyDebrief,
  patrolHistory: mercyDebrief.patrolHistory!.map((memory) => ({
    ...memory,
    choiceId: `crew-${falseRival}-mercy-intervene`,
  })),
}
assert.equal(
  restoreAcademy(JSON.parse(JSON.stringify(forgedCrew))),
  null,
  "a saved crew choice must match the run's actual opponent",
)
const exploitDebrief = resolveDispatch(
  chooseNightPatrol(crewBase, crewZone, coercedChoice.id),
)
assert.equal(exploitDebrief.influence, mercyDebrief.influence + 2)
assert.equal(exploitDebrief.danger, mercyDebrief.danger + 3)
const laterCrew = patrolCrewFor(
  {
    day: 29,
    opponentSignature: mercyDebrief.opponentSignature,
    patrolHistory: mercyDebrief.patrolHistory,
  },
  crewZone,
)
assert.equal(laterCrew, null, 'one signature crew encounter per term')
assert.equal(
  patrolOptionsFor(
    { ...mercyDebrief, day: 29, phase: 'dispatch' },
    crewZone,
  ).some((option) => option.id.startsWith('crew-')),
  false,
  'repeat patrols keep their original choice sets',
)

// ------------------------------- twelve seeds, from New Game to the finale
const SEEDS = [3, 8, 15, 22, 29, 36, 41, 50, 63, 77, 88, 99]
const phases = {
  early: [] as number[],
  mid: [] as number[],
  late: [] as number[],
}
let injuredSomewhere = 0
let unstaffedSomewhere = 0
let storiesPlayed = 0
for (const seed of SEEDS) {
  const powers = [
    'kinetic',
    'technopathy',
    'empathy',
    'elemental',
    'spatial',
    'biotech',
  ] as const
  let run = startFullAcademy(powers[seed % 6]!, seed)
  assert.equal(knownContacts(run).length, 0, 'rookie starts alone')
  let previous: string[] = []
  while (run.day <= 28) {
    const offered = incidentsFor({ ...run, phase: 'dispatch' }).map((i) => i.id)
    const bucket = run.day <= 7 ? 'early' : run.day <= 21 ? 'mid' : 'late'
    phases[bucket].push(offered.length)
    assert.ok(
      offered.every((id) => !previous.includes(id)),
      `seed ${seed} day ${run.day} repeats last night's call`,
    )
    if (run.day <= 3) assert.ok(offered.length <= 2)
    previous = offered
    const zone: PatrolZoneId | undefined =
      run.day >= 6 && run.day <= 11 && seed % 2 === 0
        ? 'academy'
        : run.day >= 11 && seed % 3 === 0
          ? 'transit'
          : undefined
    const day = run.day
    const before = run.patrolHistory?.filter((m) => m.outcome).length ?? 0
    run = dayPlan(run, zone ? { zone, pick: seed } : {})
    assert.equal(run.day, day + 1, 'day follows night, never the reverse')
    storiesPlayed +=
      (run.patrolHistory?.filter((m) => m.outcome).length ?? 0) - before
    if (
      Object.values(run.injuries ?? {}).some((until) => (until ?? 0) > run.day)
    )
      injuredSomewhere++
    if (/— (failed|refused)$/.test(run.log.at(-1) ?? '') || run.danger > 6)
      unstaffedSomewhere++
  }
  assert.equal(run.day, 29)
  run = dayPlan(run)
  assert.equal(run.phase, 'finale', `seed ${seed} reaches the prom`)
  assert.ok(knownContacts(run).length >= 1, 'the roster grew through play')
}
const mean = (list: number[]) => list.reduce((a, b) => a + b, 0) / list.length
assert.ok(mean(phases.early) < mean(phases.mid), 'calls grow mid-month')
assert.ok(mean(phases.mid) < mean(phases.late), 'calls grow late-month')
assert.ok(injuredSomewhere > 0, 'injuries occur across seeds')
assert.ok(unstaffedSomewhere > 0, 'unstaffed or failed calls occur')
assert.ok(storiesPlayed >= 8, `${storiesPlayed} story nights across seeds`)

assert.ok(page.includes('data-testid="academy-patrol-story-flag"'))
assert.ok(page.includes('patrolEncounterFor(run.value, patrolZone.value)'))

console.log(
  `Prom of Doom patrol stories: 3 commissioned stories with every branch, secret, refusal, callback and later-night effect; ${matchups.length} hidden matchups; ${clueThreads.size + storyThreads.length} multi-day threads; ${SEEDS.length} seeds from New Game to the prom (calls ${mean(phases.early).toFixed(1)} → ${mean(phases.mid).toFixed(1)} → ${mean(phases.late).toFixed(1)}).`,
)

// Every canonical origin gets a legal full-term patrol trace. No synthetic
// day, roster, opponent, or grade overrides: begin at the title's new game.
const identityGrades = [
  'success',
  'mixed',
  'failure',
  'refusal',
  'secret',
] as const
assert.deepEqual(
  Object.keys(PATROL_IDENTITY_AFTERMATH).sort(),
  IDENTITY_ARCS.map((identity) => identity.signature).sort(),
)
const personalMornings = new Set<string>()
for (const { signature } of IDENTITY_ARCS)
  for (const grade of identityGrades) {
    const text = patrolIdentityAftermath(signature, grade)
    assert.ok(text.length > 40 && text.length <= 300)
    personalMornings.add(text)
    assert.equal(patrolIdentityAftermath(undefined, grade), '')
  }
assert.equal(personalMornings.size, 240)

const canonicalRuns = new Set<string>()
const witnessedIdentityMornings = new Set<string>()
const witnessedCases = new Set<string>()
const witnessedGrades = new Set<string>()
const walkedZones = new Set<PatrolZoneId>()
const deckIds = new Set(COMPLETE_NIGHT_DECK.map((incident) => incident.id))
let witnessedNights = 0
for (const [index, identity] of IDENTITY_ARCS.entries()) {
  const signature = identity.signature
  let run = startFullAcademy(fieldFor(signature), 4181 + index, signature)
  assert.equal(run.signature, signature)
  assert.equal(knownContacts(run).length, 0)
  assert.notEqual(run.opponentSignature, signature)
  for (let day = 1; day <= 29; day++) {
    const zone =
      day >= 4 && day < 29 && (day + index) % 3 !== 0
        ? PATROL_ZONES[(day + index) % PATROL_ZONES.length]!.id
        : undefined
    const count = run.patrolHistory?.length ?? 0
    run = dayPlan(run, {
      zone,
      pick: day + index,
      onDebrief: (done) => {
        assert.equal(done.signature, signature)
        assert.equal(done.day, day)
        assert.ok(done.reports.length > 0)
        const cases = done.reports.filter((report) =>
          deckIds.has(report.caseId),
        )
        assert.equal(
          new Set(cases.map((report) => report.caseId)).size,
          cases.length,
        )
        for (const report of cases) {
          assert.ok(report.text.trim())
          witnessedCases.add(report.caseId)
          witnessedGrades.add(report.grade)
        }
        if (zone) {
          assert.equal(done.patrolHistory?.length, count + 1)
          assert.equal(done.patrolHistory?.at(-1)?.zone, zone)
          assert.ok(
            done.reports.some(
              (report) => report.caseId === `patrol-${day}-${zone}`,
            ),
          )
          walkedZones.add(zone)
        }
        witnessedNights++
      },
    })
    assert.equal(run.signature, signature)
    const memory = run.patrolHistory?.at(-1)
    if (day < 29 && memory?.day === day && memory.outcome) {
      const line = patrolIdentityAftermath(signature, memory.outcome)
      assert.ok(
        run.scene.includes(line),
        `${signature} ${memory.outcome} morning`,
      )
      witnessedIdentityMornings.add(signature)
      roundTrip(run)
    }
    assert.equal(run.phase, day === 29 ? 'finale' : 'map')
  }
  roundTrip(run)
  canonicalRuns.add(signature)
}
assert.equal(canonicalRuns.size, 48)
assert.ok(witnessedIdentityMornings.size > 0)
assert.equal(witnessedNights, 48 * 29)
assert.equal(walkedZones.size, PATROL_ZONES.length)
assert.ok(
  witnessedCases.size >= 36,
  `only ${witnessedCases.size} playable calls`,
)
assert.deepEqual([...witnessedGrades].sort(), [
  'failed',
  'honors',
  'partial',
  'pass',
])
console.log(
  `Canonical patrol acceptance: ${canonicalRuns.size} identities, ${witnessedNights} nights, ${witnessedCases.size} resolved case IDs and all four grades; each run reaches prom.`,
)
