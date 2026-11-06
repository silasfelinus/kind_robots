// Prom of Doom t-016: a visible hero <-> villain track for the player and
// every roster classmate, moved by night choices, and two classmate arcs
// (a betrayal and an accomplice) whose authored beats fire from that saved
// track rather than a die. Pins: the track moves as choices dictate, both arcs
// are reachable by seeded play from New Game and absent from hero-only play,
// prevention and redemption follow the player's own choices, payoffs land on
// later nights and at the prom, and saves round-trip with tamper guards.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  ACCOMPLICE_CHOICES,
  BETRAYAL_CHOICES,
  STORY_CHOICE_LEANS,
  accompliceBonus,
  alignmentLabel,
  alignmentScore,
  alignmentSide,
  alignmentTally,
  alignmentTrack,
  arcSeparated,
  caseLean,
  patrolChoiceLean,
  recruiterFor,
  type ArcBeatCard,
  type Lean,
} from '../cometAcademy/alignmentArcs'
import { campaignBetrayer, campaignVillain } from '../cometAcademy/campaign'
import { CITY_SITES } from '../cometAcademy/cityMap'
import {
  followerRoster,
  heroDossier,
  encodeSaveCode,
  decodeSaveCode,
} from '../cometAcademy/consoleScreens'
import { IDENTITY_ARCS } from '../cometAcademy/identityArcs'
import { PATROL_ZONES } from '../cometAcademy/nightPatrols'
import { ALL_PATROL_STORIES } from '../cometAcademy/patrolStories'
import {
  STUDENTS,
  activePatrolStory,
  alignmentTrackFor,
  answerArcBeat,
  assignPlayerCase,
  assignTeam,
  callEmergencyVolunteer,
  chooseEncounter,
  chooseNightPatrol,
  chooseNovelNight,
  dispatchModifier,
  emergencyContact,
  encounterFor,
  finishAcademy,
  incidentsFor,
  knownContacts,
  nextSchoolDay,
  openingNightFriend,
  patrolOptionsFor,
  pendingArcBeat,
  recruitContact,
  recruitableContact,
  resolveDispatch,
  restoreAcademy,
  startFullAcademy,
  studentAvailable,
  tonightsAlignment,
  visitCitySite,
  type AcademyRun,
  type Incident,
  type StudentId,
} from '../cometAcademy/rules'

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8')
const page = read('../../pages/play/comet-city-academy.vue')
const screens = read(
  '../../components/play/cometAcademy/AcademyConsoleScreens.vue',
)
const storeSource = read('../../stores/cometAcademyStore.ts')

let roundTrips = 0
const roundTrip = (run: AcademyRun) => {
  const saved = JSON.parse(JSON.stringify(run))
  assert.deepEqual(restoreAcademy(saved), saved, `save day ${run.day}`)
  assert.deepEqual(decodeSaveCode(encodeSaveCode(run)), saved)
  roundTrips++
  return run
}

// ------------------------------------------------------------ track rules
const tally = (hero: number, villain: number, rogue: number) => ({
  hero,
  villain,
  rogue,
})
assert.equal(alignmentLabel(tally(0, 0, 0)), 'undecided')
assert.equal(alignmentLabel(tally(1, 0, 0)), 'hero-leaning')
assert.equal(alignmentLabel(tally(3, 0, 1)), 'hero')
assert.equal(alignmentLabel(tally(0, 2, 0)), 'villain-leaning')
assert.equal(alignmentLabel(tally(1, 4, 0)), 'villain')
assert.equal(alignmentLabel(tally(1, 1, 2)), 'rogue')
assert.equal(alignmentSide(tally(1, 0, 0)), null, 'one step is a lean')
assert.equal(alignmentSide(tally(2, 0, 0)), 'hero')
assert.equal(alignmentSide(tally(0, 2, 1)), 'villain')
assert.equal(alignmentSide(tally(0, 0, 2)), 'rogue')
assert.equal(alignmentScore(tally(4, 1, 9)), 3)
{
  const track = alignmentTrack(
    [
      { day: 3, marks: { you: 'villain' } },
      { day: 4, marks: { you: 'villain', mina: 'hero' } },
    ],
    'you',
    'You',
  )
  assert.equal(track.score, -2)
  assert.ok(track.position < 50, 'villain steps move the marker left')
  assert.equal(track.label, 'villain-leaning')
  assert.ok(track.text.startsWith('LEANS VILLAIN · 0 hero / 2 villain'))
}
assert.equal(caseLean('villain', false), 'villain')
assert.equal(caseLean('rogue', true), 'rogue')
assert.equal(caseLean('shared', false), null, 'shared teamwork moves nobody')
assert.equal(caseLean('shared', true, 'rescue'), 'hero')
assert.equal(caseLean('shared', true, 'investigate'), 'rogue')
assert.equal(patrolChoiceLean('roof-curfew-intervene'), 'hero')
assert.equal(patrolChoiceLean('roof-curfew-investigate'), 'rogue')
assert.equal(patrolChoiceLean('academy-secret'), 'hero')
assert.equal(patrolChoiceLean('clocktower-refuse'), null)
assert.equal(patrolChoiceLean('clocktower-seal'), null)
assert.equal(patrolChoiceLean('afterparty-villain', 'villain'), 'villain')
// Every authored story lean names a real choice without its own stance, and
// every stanced story choice moves the track its own way.
const storyChoices = ALL_PATROL_STORIES.flatMap((story) => story.choices)
for (const id of Object.keys(STORY_CHOICE_LEANS)) {
  const choice = storyChoices.find((entry) => entry.id === id)
  assert.ok(choice && !choice.stance, `${id} is an unstanced story choice`)
}
let stanced = 0
for (const choice of storyChoices)
  if (choice.stance) {
    assert.equal(patrolChoiceLean(choice.id, choice.stance), choice.stance)
    stanced++
  }
assert.ok(stanced >= 24, `${stanced} cast-story stances move the track`)

// ------------------------------------------------------- seeded drivers
type Plan = {
  /** Which call the player leads tonight; null walks a district instead. */
  lead: (cases: Incident[]) => Incident | null
  patrolLean: Lean
  /** The classmate the plan pushes, and which contracts they are sent on. */
  target?: (run: AcademyRun) => StudentId
  targetOn?: Incident['allegiance'][]
  /** Everyone else is sent only on these contracts. */
  othersOn: Incident['allegiance'][]
  answer?: (card: ArcBeatCard, run: AcademyRun) => string | null
}

const byAllegiance = (cases: Incident[], kinds: Incident['allegiance'][]) =>
  kinds
    .map((kind) => cases.find((incident) => incident.allegiance === kind))
    .find(Boolean) ?? null

const cards: ArcBeatCard[] = []
let forcedVillainNights = 0
function playDay(start: AcademyRun, plan: Plan): AcademyRun {
  const site = CITY_SITES.find(
    (entry) => (start.visitedDays?.[entry.id] ?? -7) <= start.day - 7,
  )!.id
  let run = visitCitySite(start, site)
  const recruit = recruitableContact(run)
  if (recruit && knownContacts(run).length < 4)
    run = recruitContact(run, recruit.id)
  else run = chooseEncounter(run, encounterFor(run).options[0]!.id)
  if (emergencyContact(run)) run = callEmergencyVolunteer(run)
  assert.equal(run.phase, 'dispatch')
  const cases = incidentsFor(run)
  const lead = plan.lead(cases)
  if (lead) run = assignPlayerCase(run, lead.id)
  else if (run.day >= 4)
    for (const zone of PATROL_ZONES) {
      const stances = activePatrolStory(run, zone.id)?.choices ?? []
      const choice = patrolOptionsFor(run, zone.id).find(
        (option) =>
          patrolChoiceLean(
            option.id,
            stances.find((entry) => entry.id === option.id)?.stance,
          ) === plan.patrolLean,
      )
      if (choice) {
        run = chooseNightPatrol(run, zone.id, choice.id)
        break
      }
    }
  if (!run.playerCaseId && !run.nightPatrol) {
    // Nights one to three have a single call and no district walks: take it.
    const only =
      cases.find((incident) => incident.allegiance !== 'villain') ?? cases[0]!
    if (only.allegiance === 'villain') forcedVillainNights++
    run = assignPlayerCase(run, only.id)
  }
  const free = (id: StudentId) =>
    studentAvailable(run, id) &&
    !run.assignments.some((entry) => entry.students.includes(id))
  const target = plan.target?.(run)
  if (target && knownContacts(run).includes(target) && free(target)) {
    const job = byAllegiance(cases, plan.targetOn ?? [])
    if (job) run = assignTeam(run, job.id, [target])
  }
  for (const incident of cases) {
    if (!plan.othersOn.includes(incident.allegiance)) continue
    if (run.assignments.some((entry) => entry.caseId === incident.id)) continue
    const helper = knownContacts(run).find((id) => id !== target && free(id))
    if (helper) run = assignTeam(run, incident.id, [helper])
  }
  const before = run
  run = roundTrip(resolveDispatch(run))
  checkNightMarks(before, run)
  const card = pendingArcBeat(run)
  if (card) {
    cards.push(card)
    assert.ok(card.options.some((option) => option.id === card.silent))
    const choice = plan.answer?.(card, run)
    if (choice) {
      const answered = roundTrip(answerArcBeat(run, choice))
      assert.notEqual(answered, run, `${card.title}: ${choice} is offered`)
      assert.equal(pendingArcBeat(answered), null, 'one beat per night')
      run = answered
    }
  }
  return roundTrip(nextSchoolDay(run))
}

/** The track moves exactly as tonight's choices dictate. */
let marksChecked = 0
function checkNightMarks(before: AcademyRun, after: AcademyRun) {
  const night = after.alignmentLog?.find((entry) => entry.day === before.day)
  const led = incidentsFor(before).find((c) => c.id === before.playerCaseId)
  const expectedYou = led
    ? caseLean(led.allegiance, true, before.missionApproach)
    : before.nightPatrol
      ? patrolChoiceLean(
          before.nightPatrol.choiceId,
          activePatrolStory(before, before.nightPatrol.zone)?.choices.find(
            (c) => c.id === before.nightPatrol!.choiceId,
          )?.stance,
        )
      : null
  assert.equal(night?.marks.you ?? null, expectedYou, `day ${before.day} you`)
  for (const assignment of before.assignments) {
    const incident = incidentsFor(before).find(
      (c) => c.id === assignment.caseId,
    )!
    for (const id of assignment.students)
      assert.equal(
        night?.marks[id] ?? null,
        caseLean(incident.allegiance, false),
        `day ${before.day} ${id} on ${incident.id}`,
      )
  }
  const moved = Object.keys(night?.marks ?? {}).length
  assert.equal(
    moved,
    (expectedYou ? 1 : 0) +
      before.assignments
        .filter(
          (a) =>
            caseLean(
              incidentsFor(before).find((c) => c.id === a.caseId)!.allegiance,
              false,
            ) !== null,
        )
        .reduce((sum, a) => sum + a.students.length, 0),
    'nobody else moves',
  )
  marksChecked++
}

function playTerm(seed: number, plan: Plan): AcademyRun {
  forcedVillainNights = 0
  let run = startFullAcademy('kinetic', seed)
  while (run.phase === 'map' && run.day < 30) run = playDay(run, plan)
  assert.equal(run.phase, 'finale', `seed ${seed} reaches the prom`)
  return run
}

const friend = (run: AcademyRun) => openingNightFriend(run.seed).id
const HERO_PLAN: Plan = {
  lead: (cases) => byAllegiance(cases, ['hero', 'shared']),
  patrolLean: 'hero',
  othersOn: ['hero', 'shared'],
}

// --------------------------------------------- not by default: hero play
for (let seed = 1; seed <= 10; seed++) {
  const run = playTerm(seed, HERO_PLAN)
  assert.equal(run.classmateArcs, undefined, `seed ${seed}: no arcs fire`)
  const you = alignmentTally(run.alignmentLog, 'you')
  assert.equal(
    you.villain,
    forcedVillainNights,
    'hero play only steps villain-ward when the lone opening call is one',
  )
  assert.equal(alignmentSide(you), 'hero', `seed ${seed} ends on the hero side`)
  for (const id of knownContacts(run))
    assert.equal(alignmentTally(run.alignmentLog, id).villain, 0)
  // Without arcs the prom is the same prom.
  const ending = finishAcademy(run, 'share')
  assert.ok(!/second radio|notebook|accomplice everyone/.test(ending.scene))
}
// A fresh run moves nobody before its first night, and saves stay lean.
{
  const fresh = startFullAcademy('kinetic', 4)
  assert.equal(fresh.alignmentLog, undefined)
  assert.equal(fresh.classmateArcs, undefined)
  assert.equal(alignmentTrackFor(fresh, 'you').label, 'undecided')
  assert.equal(heroDossier(fresh).alignment?.position, 50)
}

// --------------------------------------- the betrayal: dirty hands plan
const DIRTY_HANDS = (answers: Record<string, string>): Plan => ({
  lead: (cases) => byAllegiance(cases, ['hero', 'shared']),
  patrolLean: 'hero',
  target: friend,
  targetOn: ['villain'],
  othersOn: ['hero', 'shared'],
  answer: (card) =>
    card.arc === 'betrayal'
      ? (answers[`${card.beat}${card.outcome ? ':' + card.outcome : ''}`] ??
        answers[String(card.beat)] ??
        null)
      : null,
})

let betrayalSeed = 0
let turnedRun: AcademyRun | null = null
for (let seed = 1; seed <= 24 && !turnedRun; seed++) {
  const run = playTerm(
    seed,
    DIRTY_HANDS({ 1: 'reach', 2: 'release', '3:turned': 'door' }),
  )
  const arc = run.classmateArcs?.betrayal
  if (arc?.outcome !== 'turned') continue
  betrayalSeed = seed
  turnedRun = run
}
assert.ok(turnedRun, 'a seeded dirty-hands term reaches a real heel turn')
{
  const run = turnedRun!
  const arc = run.classmateArcs!.betrayal!
  assert.equal(arc.person, friend(run), 'the classmate you pushed is the one')
  assert.notEqual(arc.person, campaignBetrayer(run.seed))
  assert.equal(arc.direction, 'to-villain')
  assert.deepEqual(
    arc.beats.map((m) => m.choice),
    ['reach', 'release', 'door'],
  )
  const [one, two, three] = arc.beats
  assert.ok(one!.day >= 7 && one!.day <= 20)
  assert.ok(two!.day >= Math.max(12, one!.day + 3))
  assert.ok(three!.day >= Math.max(17, two!.day + 3))
  // The turn is the track, not a die: at the turn the classmate is still
  // three-or-more villain steps out while you stand on the hero side.
  assert.ok(
    alignmentScore(alignmentTally(run.alignmentLog, arc.person, three!.day)) <=
      -2,
  )
  assert.ok(
    alignmentScore(alignmentTally(run.alignmentLog, 'you', three!.day)) >= 0,
  )
  // Later nights: off the roster from the morning after the turn.
  assert.equal(arcSeparated(run.classmateArcs, arc.person, three!.day), false)
  assert.equal(
    studentAvailable({ ...run, day: three!.day + 1 }, arc.person),
    false,
  )
  assert.ok(
    run.log.some((line) => line.includes('The Other Side of the Radio')),
  )
  const card = followerRoster(run).find((p) => p.id === arc.person)!
  assert.ok(
    card.status.some((tag) => tag.startsWith('Turned to the mastermind')),
  )
  assert.ok(card.alignment && card.alignment.score <= -2)
  // Prom: reaching out on beat one and leaving the door open brings them home.
  const prom = finishAcademy(run, 'share')
  const name = STUDENTS.find((p) => p.id === arc.person)!.name
  assert.ok(prom.scene.includes(`${name} walked back through the door`))
  const cut = finishAcademy(
    {
      ...run,
      classmateArcs: {
        betrayal: {
          ...arc,
          beats: [arc.beats[0]!, arc.beats[1]!, { ...three!, choice: 'cut' }],
        },
      },
    },
    'share',
  )
  assert.ok(cut.scene.includes(`${name} stood beside`))
  // Tamper guards: the saved track decides the outcome.
  const reject = (patch: Partial<AcademyRun>, why: string) =>
    assert.equal(
      restoreAcademy(JSON.parse(JSON.stringify({ ...run, ...patch }))),
      null,
      why,
    )
  reject(
    { classmateArcs: { betrayal: { ...arc, outcome: 'averted' } } },
    'outcome must match the track',
  )
  reject(
    {
      classmateArcs: {
        betrayal: { ...arc, person: campaignBetrayer(run.seed) },
      },
    },
    'the seeded day-20 betrayer is never cast',
  )
  reject(
    {
      classmateArcs: {
        betrayal: {
          ...arc,
          beats: [{ ...one!, day: 5 }, two!, three!],
        },
      },
    },
    'beat one waits for day seven',
  )
  reject(
    {
      classmateArcs: {
        betrayal: {
          ...arc,
          beats: [one!, { ...two!, choice: 'expose' }, three!],
        },
      },
    },
    'expose needs the tail',
  )
  reject(
    { alignmentLog: [{ day: 3, marks: { you: 'saint' as Lean } }] },
    'unknown lean',
  )
  reject(
    { alignmentLog: [{ day: 31, marks: { you: 'hero' } }] },
    'future night',
  )
  reject(
    { alignmentLog: [{ day: 3, marks: { nobody: 'hero' } as never }] },
    'unknown classmate',
  )
  reject({ alignmentLog: undefined }, 'arcs need their track')
  // Older saves without either field still load.
  const legacy = JSON.parse(JSON.stringify(run))
  delete legacy.alignmentLog
  delete legacy.classmateArcs
  assert.ok(restoreAcademy(legacy), 'a pre-t-016 save loads')
}

// Prevention: the same seed, but the player promises at beat two and keeps
// the promise. Nobody else is forced to turn in their place.
{
  const kept = DIRTY_HANDS({ 1: 'reach', 2: 'promise', '3:averted': 'stand' })
  const plan: Plan = {
    ...kept,
    targetOn: ['villain'],
    target: (run) =>
      run.classmateArcs?.betrayal?.beats[1]?.choice === 'promise'
        ? ('nobody' as StudentId)
        : friend(run),
  }
  const run = playTerm(betrayalSeed, plan)
  const arc = run.classmateArcs!.betrayal!
  assert.equal(arc.outcome, 'averted', 'a kept promise prevents the turn')
  assert.equal(typeof arc.promise, 'number')
  assert.equal(arcSeparated(run.classmateArcs, arc.person, 29), false)
  const prom = finishAcademy(run, 'share')
  assert.ok(prom.scene.includes('The betrayal everyone expected never came'))
  // The seeded day-20 heel turn still happens: prevention never removes it.
  assert.equal(run.betrayal?.day, 20)
  // Breaking the promise turns them, and the card says why.
  const broken = playTerm(betrayalSeed, kept)
  const brokenArc = broken.classmateArcs!.betrayal!
  assert.equal(brokenArc.beats[1]!.choice, 'promise')
  assert.equal(brokenArc.outcome, 'turned', 'a broken promise is remembered')
  const turnCard = cards.find(
    (card) =>
      card.arc === 'betrayal' &&
      card.beat === 3 &&
      card.scene.includes('then put'),
  )
  assert.ok(turnCard, 'the turn names the broken promise')
}

// Tail and expose: the recruiter becomes accomplice evidence for the prom.
{
  const run = playTerm(
    betrayalSeed,
    DIRTY_HANDS({ 1: 'tail', 2: 'expose', '3:turned': 'cut' }),
  )
  const arc = run.classmateArcs!.betrayal!
  const villain = campaignVillain(run.seed, run.mastermind)
  const recruiter = recruiterFor(villain, arc.beats[0]!.day)!
  assert.ok(run.plotEvidence?.includes(recruiter.id), 'recruiter exposed')
}

// ---------------------------------- the accomplice: partners in crime
const VILLAIN_PLAN = (
  answers: Record<string, string>,
  informant = false,
): Plan => ({
  lead: (cases) => byAllegiance(cases, ['villain', 'rogue']),
  patrolLean: 'villain',
  target: friend,
  targetOn: ['villain', 'rogue'],
  othersOn: informant ? ['hero'] : [],
  answer: (card) =>
    card.arc === 'accomplice'
      ? (answers[`${card.beat}${card.outcome ? ':' + card.outcome : ''}`] ??
        answers[String(card.beat)] ??
        null)
      : (answers[`b${card.beat}`] ?? null),
})

let accompliceSeed = 0
let partnered: AcademyRun | null = null
for (let seed = 1; seed <= 24 && !partnered; seed++) {
  const run = playTerm(
    seed,
    VILLAIN_PLAN({ 1: 'partner', 2: 'keep', '3:loyal': 'double' }),
  )
  if (run.classmateArcs?.accomplice?.beats.length !== 3) continue
  accompliceSeed = seed
  partnered = run
}
assert.ok(partnered, 'a seeded villain term reaches the accomplice arc')
{
  const run = partnered!
  const arc = run.classmateArcs!.accomplice!
  assert.equal(arc.person, friend(run))
  assert.equal(arc.outcome, 'loyal', 'partners split the haul and stay loyal')
  const you = alignmentTally(run.alignmentLog, 'you', arc.beats[0]!.day)
  assert.ok(['villain', 'rogue'].includes(alignmentSide(you)!))
  // The accomplice's know-how shows on later villain contracts, exactly +1.
  const handshake = arc.beats[0]!.day
  const villainCase = {
    ...incidentsFor({ ...run, day: handshake + 1, phase: 'dispatch' })[0]!,
    allegiance: 'villain' as const,
  }
  const later = { ...run, day: handshake + 1, phase: 'dispatch' as const }
  assert.equal(
    accompliceBonus(run.classmateArcs, handshake + 1, 'villain', [arc.person]),
    1,
  )
  assert.equal(
    accompliceBonus(run.classmateArcs, handshake, 'villain', [arc.person]),
    0,
    'not on the night of the handshake',
  )
  assert.equal(
    accompliceBonus(run.classmateArcs, handshake + 1, 'hero', [arc.person]),
    0,
    'not on rescues',
  )
  assert.equal(
    dispatchModifier(later, villainCase, [arc.person]) -
      dispatchModifier({ ...later, classmateArcs: undefined }, villainCase, [
        arc.person,
      ]),
    1,
  )
  // Going undercover takes them off the roster and pays off at the prom.
  const offer = arc.beats[2]!.day
  assert.equal(studentAvailable({ ...run, day: offer + 1 }, arc.person), false)
  const name = STUDENTS.find((p) => p.id === arc.person)!.name
  assert.ok(
    finishAcademy(run, 'command').scene.includes(
      `${name}, the accomplice everyone thought had sold you out`,
    ),
  )
  const card = followerRoster(run).find((p) => p.id === arc.person)!
  assert.ok(card.status.some((tag) => tag.includes('double agent')))
  const reject = (patch: Partial<AcademyRun>, why: string) =>
    assert.equal(
      restoreAcademy(JSON.parse(JSON.stringify({ ...run, ...patch }))),
      null,
      why,
    )
  reject(
    { classmateArcs: { accomplice: { ...arc, outcome: 'sold-out' } } },
    'a partner cannot be saved as a sellout',
  )
  reject(
    {
      classmateArcs: {
        accomplice: { ...arc, beats: [{ ...arc.beats[0]!, choice: 'bribe' }] },
      },
    },
    'unknown choice',
  )
}
// Hiring help and keeping the take: the same classmate sells you out.
{
  const run = playTerm(
    accompliceSeed,
    VILLAIN_PLAN({ 1: 'hire', 2: 'keep', '3:sold-out': 'let-go' }),
  )
  const arc = run.classmateArcs!.accomplice!
  assert.equal(arc.outcome, 'sold-out')
  assert.equal(
    studentAvailable({ ...run, day: arc.beats[2]!.day + 1 }, arc.person),
    false,
  )
  assert.ok(finishAcademy(run, 'command').scene.includes('learned the lesson'))
  // Hiring but sharing the haul keeps them loyal: the deal and the take decide.
  const fair = playTerm(
    accompliceSeed,
    VILLAIN_PLAN({ 1: 'hire', 2: 'share', '3:loyal': 'refuse' }),
  )
  assert.equal(fair.classmateArcs!.accomplice!.outcome, 'loyal')
  assert.equal(
    arcSeparated(
      fair.classmateArcs,
      fair.classmateArcs!.accomplice!.person,
      fair.classmateArcs!.accomplice!.beats[2]!.day + 1,
    ),
    false,
    'turning the offer down keeps them on the roster',
  )
}
// Silence declines: an accomplice needs the player's handshake.
{
  const run = playTerm(accompliceSeed, VILLAIN_PLAN({}))
  const arc = run.classmateArcs?.accomplice
  assert.ok(arc, 'the pitch still arrives')
  assert.deepEqual(
    arc!.beats.map((m) => m.choice),
    ['decline'],
  )
  assert.equal(arc!.outcome, 'declined')
}
// A villain who also sends a classmate on rescues gets an informant: both
// arcs can run in one term, never on the same debrief.
let bothSeed = 0
for (let seed = 1; seed <= 24 && !bothSeed; seed++) {
  const run = playTerm(seed, VILLAIN_PLAN({ 1: 'partner', 2: 'burn' }, true))
  const arcs = run.classmateArcs
  if (!arcs?.betrayal || !arcs.accomplice) continue
  assert.equal(arcs.betrayal.direction, 'to-hero')
  assert.notEqual(arcs.betrayal.person, arcs.accomplice.person)
  const days = [...arcs.betrayal.beats, ...arcs.accomplice.beats].map(
    (m) => m.day,
  )
  assert.equal(new Set(days).size, days.length)
  bothSeed = seed
}
assert.ok(bothSeed, 'an informant arc reaches a villain term')

// ------------------------------------------ visual-novel nights
{
  let run = startFullAcademy('kinetic', 5, undefined, undefined, 'student', {
    tacticalMissions: true,
    nightPatrols: false,
  })
  for (let i = 0; i < 6; i++) {
    run = visitCitySite(
      run,
      CITY_SITES.find((s) => (run.visitedDays?.[s.id] ?? -7) <= run.day - 7)!
        .id,
    )
    run = chooseEncounter(run, encounterFor(run).options[0]!.id)
    const cases = incidentsFor(run)
    run = chooseNovelNight(
      run,
      cases[0]!.id,
      run.day === 3 ? 'concentrate' : 'rescue',
    )
    run = roundTrip(resolveDispatch(run))
    for (const night of run.alignmentLog ?? [])
      assert.deepEqual(
        Object.keys(night.marks).filter((actor) => actor !== 'you'),
        [],
        'volunteers the game assigns do not move',
      )
    run = nextSchoolDay(run)
  }
  assert.ok(run.alignmentLog?.length, 'the player still moves')
}

// --------------------------------------------- debrief strip and UI hooks
{
  let run = startFullAcademy('kinetic', 2)
  while (run.day < 5) run = playDay(run, HERO_PLAN)
  run = visitCitySite(
    run,
    CITY_SITES.find((s) => (run.visitedDays?.[s.id] ?? -7) <= run.day - 7)!.id,
  )
  run = chooseEncounter(run, encounterFor(run).options[0]!.id)
  run = assignPlayerCase(run, incidentsFor(run)[0]!.id)
  run = resolveDispatch(run)
  const strip = tonightsAlignment(run)
  assert.ok(strip.length >= 1)
  assert.ok(strip.some((mark) => mark.actor === 'you'))
}
for (const hook of [
  'data-testid="academy-alignment-night"',
  'data-testid="academy-arc-beat"',
  'data-testid="academy-arc-choice"',
  'store.arcChoice(option.id)',
  'pendingArcBeat(run.value)',
])
  assert.ok(page.includes(hook), hook)
for (const hook of [
  'data-testid="academy-alignment-you"',
  'data-testid="academy-follower-alignment"',
])
  assert.ok(screens.includes(hook), hook)
assert.ok(storeSource.includes('answerArcBeat(run.value, choiceId)'))

// ------------------------------------------------ canon stays intact
assert.equal(IDENTITY_ARCS.length, 48, 'the 48 hero identities are unchanged')
assert.deepEqual([...BETRAYAL_CHOICES[1], ...BETRAYAL_CHOICES[2]].length, 6)
assert.equal(Object.keys(ACCOMPLICE_CHOICES).length, 4)
for (const card of cards) {
  assert.ok(card.scene.length > 120, `${card.title} scene`)
  for (const option of card.options) {
    assert.ok(option.text.length > 60, `${card.title} / ${option.id}`)
    assert.ok(option.morning.length > 20)
  }
}
const titles = new Set(cards.map((card) => card.title))

console.log(
  `Prom of Doom alignment arcs: ${marksChecked} nights of track movement checked; hero play fires no arcs on 10 seeds; betrayal turns on seed ${betrayalSeed} (prevented by a kept promise, re-earned by a broken one, recruiter exposed by a tail); accomplice arc on seed ${accompliceSeed} (loyal partner, hired sellout, silent decline); informant + accomplice together on seed ${bothSeed}; ${titles.size} distinct authored beats; ${roundTrips} save round-trips.`,
)
