// Prom of Doom: the Oct 29 larger-than-life cast and SPECIES henchman leaders
// (t-023, kind_robots#4443). Data contract, first encounters from a real
// seeded run, secret gates, callbacks and saves.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { CITY_SITES } from '../cometAcademy/cityMap'
import { notableCards } from '../cometAcademy/consoleScreens'
import { IDENTITY_ARCS } from '../cometAcademy/identityArcs'
import {
  CAST_STORIES,
  OCTOBER_CAST,
  castMember,
} from '../cometAcademy/octoberCast'
import {
  ALL_PATROL_STORIES,
  patrolStoryById,
} from '../cometAcademy/patrolStories'
import {
  COMPLETE_NIGHT_DECK,
  STUDENTS,
  activePatrolStory,
  assignPlayerCase,
  chooseEncounter,
  chooseNightPatrol,
  encounterFor,
  incidentsFor,
  nextSchoolDay,
  patrolOptionsFor,
  resolveDispatch,
  restoreAcademy,
  startFullAcademy,
  storyLaterModifier,
  storySecretUnlocked,
  visitCitySite,
  type AcademyRun,
} from '../cometAcademy/rules'

const fromRoot = (path: string) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
const page = fromRoot('pages/play/comet-city-academy.vue')
const screens = fromRoot(
  'components/play/cometAcademy/AcademyConsoleScreens.vue',
)
const roundTrip = (run: AcademyRun) => {
  const saved = JSON.parse(JSON.stringify(run))
  assert.deepEqual(restoreAcademy(saved), saved, `save day ${run.day}`)
  return run
}

// --------------------------------------------------------- data contract
const EXPECTED = [
  ['pod-20261029-01', 'Madame Afterparty', 'npc', null],
  ['pod-20261029-02', 'The Asterisk', 'npc', null],
  ['pod-20261029-03', 'Coach Event Horizon', 'npc', null],
  ['pod-20261029-04', 'Choir of One', 'npc', null],
  ['pod-20261029-05', 'Pledgebreaker', 'henchman_leader', 'thunder-tux-stags'],
  [
    'pod-20261029-06',
    'Miss Reflection',
    'henchman_leader',
    'glassjaw-gargoyles',
  ],
  [
    'pod-20261029-07',
    'Standing Ovation',
    'henchman_leader',
    'confetti-leeches',
  ],
  ['pod-20261029-08', 'Lady Hemline', 'henchman_leader', 'velvet-widows'],
] as const
assert.deepEqual(
  OCTOBER_CAST.map((m) => [m.key, m.name, m.kind, m.species?.slug ?? null]),
  EXPECTED,
)
const protectedNames = new Set([
  ...IDENTITY_ARCS.map((arc) => arc.realName),
  ...IDENTITY_ARCS.flatMap((arc) => [
    arc.student.alias,
    arc.hero.alias,
    arc.villain.alias,
  ]),
  ...STUDENTS.map((person) => person.name),
])
for (const member of OCTOBER_CAST) {
  assert.equal(member.provenance, 'comet-city-academy')
  assert.ok(!protectedNames.has(member.name), `${member.name} is new`)
  assert.ok(member.voice.length > 60, `${member.name} voice`)
  assert.ok(member.lines.every((line) => line.length > 30))
  for (const prompt of Object.values(member.prompts)) {
    assert.ok(
      prompt.includes(member.name) ||
        prompt.includes(member.species?.title ?? '#'),
    )
    assert.ok(prompt.includes('adults only'))
  }
  assert.deepEqual(Object.values(member.artKeys).length, 3)
  if (member.kind === 'henchman_leader') {
    assert.equal(member.species?.taxonomy, 'SPECIES')
    assert.equal(member.realName, null)
    assert.ok((member.species?.description.length ?? 0) > 80)
  } else {
    assert.equal(member.species, null, 'NPCs are people, not species')
    assert.ok(member.realName)
  }
  const story = patrolStoryById(member.storyId)!
  assert.equal(story.cast, member.key)
  assert.equal(castMember(member.key), member)
}
const voices = OCTOBER_CAST.flatMap((m) => [m.voice, ...m.lines])
assert.equal(new Set(voices).size, voices.length, 'eight distinct voices')
assert.equal(
  new Set(OCTOBER_CAST.map((m) => m.species?.slug).filter(Boolean)).size,
  4,
)

// Story shape: hero, villain and rogue stances, a refusal and a secret.
const prose: string[] = []
for (const story of CAST_STORIES) {
  const acts = story.choices.filter((c) => c.kind === 'act')
  assert.deepEqual(
    acts.map((c) => c.stance).sort(),
    ['hero', 'rogue', 'villain'],
    `${story.id} stances`,
  )
  assert.ok(acts.every((c) => c.certain && c.outcomes.success))
  assert.equal(story.choices.filter((c) => c.kind === 'refuse').length, 1)
  assert.equal(story.choices.filter((c) => c.kind === 'secret').length, 1)
  assert.ok(story.scene.length > 300 && story.secretHint.length > 60)
  for (const choice of story.choices)
    for (const outcome of Object.values(choice.outcomes)) {
      assert.ok(outcome.text.length > 120 && outcome.morning.length > 50)
      prose.push(outcome.text, outcome.morning)
    }
  assert.ok(
    story.choices.find((c) => c.kind === 'secret')!.outcomes.secret!.later,
    `${story.id} secret changes later nights`,
  )
}
assert.equal(new Set(prose).size, prose.length, 'no reused encounter prose')
// One story per district per night: windows never overlap within a zone.
for (const a of ALL_PATROL_STORIES)
  for (const b of ALL_PATROL_STORIES)
    if (a !== b && a.zone === b.zone)
      assert.ok(
        a.window.to < b.window.from || b.window.to < a.window.from,
        `${a.id} overlaps ${b.id}`,
      )

// ------------------------------- one real seeded term, snapshots by day
const snapshots = new Map<number, AcademyRun>()
let term = startFullAcademy('empathy', 2029)
while (term.day <= 27) {
  snapshots.set(term.day, roundTrip(term))
  const site = CITY_SITES.find(
    (entry) => (term.visitedDays?.[entry.id] ?? -7) <= term.day - 7,
  )!
  let next = visitCitySite(term, site.id)
  next = chooseEncounter(next, encounterFor(next).options[0]!.id)
  next = resolveDispatch(assignPlayerCase(next, incidentsFor(next)[0]!.id))
  term = nextSchoolDay(roundTrip(next))
}

/** Daylight at a fresh site, then the cast patrol, from a real snapshot. */
function meet(base: AcademyRun, zone: string, choiceId: string) {
  const site = CITY_SITES.find(
    (entry) => (base.visitedDays?.[entry.id] ?? -7) <= base.day - 7,
  )!
  let next = visitCitySite(base, site.id)
  next = chooseEncounter(next, encounterFor(next).options[0]!.id)
  const chosen = chooseNightPatrol(next, zone as never, choiceId)
  return { chosen, done: resolveDispatch(chosen) }
}

// A state that satisfies each secret, built on the real snapshot.
const unlock: Record<string, (run: AcademyRun) => AcademyRun> = {
  'cast-afterparty': (run) => ({
    ...run,
    playerEvolution: { ...run.playerEvolution!, exploit: 3, protect: 0 },
  }),
  'cast-asterisk': (run) => ({
    ...run,
    mastermind: 'the-architect',
    plotEvidence: ['the-architect-a1'],
  }),
  'cast-event-horizon': (run) => ({ ...run, contacts: ['kit'] }),
  'cast-choir': (run) => ({
    ...run,
    missionClues: ['frog-serum', 'mirror-court'],
  }),
  'cast-pledgebreaker': (run) => ({
    ...run,
    relationships: {
      connections: { mina: { trust: 4, helped: true, romance: true } },
      romance: 'mina',
      days: [2],
    },
  }),
  'cast-miss-reflection': (run) => ({
    ...run,
    betrayal: { ...run.betrayal!, status: 'reconciled' },
  }),
  'cast-standing-ovation': (run) => ({ ...run, cityStanding: 3 }),
  'cast-lady-hemline': (run) => ({
    ...run,
    relationships: {
      connections: { nix: { trust: 4, helped: true, romance: false } },
      partner: 'nix',
      days: [2],
    },
  }),
}

let encounters = 0
for (const story of CAST_STORIES) {
  const base = snapshots.get(story.window.from)!
  assert.ok(base, `real save exists for day ${story.window.from}`)
  assert.equal(activePatrolStory(base, story.zone)?.id, story.id)
  // Secret gates: never offered by default, offered once earned.
  const plain = {
    ...base,
    plotEvidence: [],
    missionClues: [],
    contacts: [],
    cityStanding: 0,
    relationships: { connections: {}, days: [] },
    playerEvolution: { ...base.playerEvolution!, exploit: 0, protect: 0 },
    betrayal: base.betrayal
      ? { ...base.betrayal, status: 'isolated' as const }
      : undefined,
  }
  assert.equal(storySecretUnlocked(plain, story), false, `${story.id} locked`)
  const secretId = story.choices.find((c) => c.kind === 'secret')!.id
  assert.ok(
    !patrolOptionsFor({ ...plain, phase: 'dispatch' }, story.zone).some(
      (o) => o.id === secretId,
    ),
  )
  const earned = unlock[story.id]!(base)
  assert.ok(storySecretUnlocked(earned, story), `${story.id} unlocks`)
  const texts = new Set<string>()
  for (const choice of story.choices) {
    const start = choice.kind === 'secret' ? earned : base
    const { chosen, done } = meet(start, story.zone, choice.id)
    assert.equal(
      chosen.nightPatrol?.encounterId,
      story.id,
      `${choice.id} chosen`,
    )
    const memory = done.patrolHistory!.at(-1)!
    const grade =
      choice.kind === 'secret'
        ? 'secret'
        : choice.kind === 'refuse'
          ? 'refusal'
          : 'success'
    assert.equal(memory.outcome, grade)
    const report = done.reports.find((r) => r.caseId.startsWith('patrol-'))!
    texts.add(report.text)
    if (choice.kind !== 'secret') roundTrip(done)
    const morning = nextSchoolDay(done)
    assert.ok(morning.scene.startsWith('The next bell rings.'))
    assert.ok(
      morning.scene.includes(choice.outcomes[grade]!.morning.slice(0, 30)),
    )
    assert.equal(activePatrolStory(morning, story.zone), null, 'once per term')
    const card = notableCards(done).find((c) => c.key === story.cast)!
    assert.equal(card.met, true)
    assert.equal(
      card.stance,
      choice.kind === 'secret'
        ? 'secret'
        : choice.kind === 'refuse'
          ? 'walked away'
          : choice.stance,
    )
    const later = choice.outcomes[grade]!.later
    if (later) {
      const incident = COMPLETE_NIGHT_DECK.find(
        (i) => i.need === later.need || i.allegiance === later.allegiance,
      )!
      assert.equal(storyLaterModifier(morning, incident), later.modifier)
    }
    encounters++
  }
  assert.equal(texts.size, story.choices.length, `${story.id} branches differ`)
}
assert.equal(encounters, 40)
// Unmet notables stay face-down and nameless.
assert.ok(
  notableCards(snapshots.get(2)!).every(
    (card) => !card.met && card.name === 'Unmet notable',
  ),
)

// Page and Scrapbook wiring.
assert.ok(page.includes('data-testid="academy-patrol-cast"'))
assert.ok(page.includes('castMember(patrolScene.value.story.cast)'))
assert.ok(screens.includes('data-testid="academy-notable-card"'))

console.log(
  `Prom of Doom Oct 29 cast: ${OCTOBER_CAST.length} characters (4 NPCs, 4 SPECIES henchman leaders), ${CAST_STORIES.length} first encounters, ${encounters} hero/villain/rogue/refusal/secret branches played from a real seeded term.`,
)
