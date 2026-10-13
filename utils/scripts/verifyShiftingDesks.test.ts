import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  type RunState,
  BOSS_CARD,
  HARMFUL_SIGN,
  JOB_TITLES,
  METERS,
  METER_LIMITS,
  ORIENTATION,
  SKILLS,
  DECKS,
  DEPARTMENTS,
  MUTATIONS,
  descend,
  fallbackOutcome,
  SOCIETIES,
  advance,
  choose,
  favorAppliesTo,
  instantAvailable,
  mutationAppliesTo,
  societyById,
  upgradeRun,
  useInstant,
  currentCard,
  isHarmful,
  isRunState,
  lockReason,
  newRun,
  nextRandom,
} from '../shiftingDesks/rules'

const file = (path: string) => fileURLToPath(new URL(path, import.meta.url))
const asset = (path: string) => readFileSync(file(path), 'utf8')

assert.equal(ORIENTATION.schemaVersion, 1)
assert.equal(ORIENTATION.sourceSha.length, 40)
assert.equal(ORIENTATION.encounters.length, 12)
assert.deepEqual(
  ORIENTATION.locations.map((l) => l.encounter_ids.length),
  [4, 4, 4],
)
assert.doesNotMatch(
  JSON.stringify(ORIENTATION),
  /developer_note|"brief"|art_ref/,
)

const allChoices = DEPARTMENTS.flatMap((d) => [
  ...d.encounters.flatMap((e) => e.choices),
  ...d.boss.choices,
])
assert.deepEqual(
  DEPARTMENTS.map((d) => d.department.order),
  DEPARTMENTS.map((_, i) => i + 1),
  'departments are registered in order',
)
for (const d of DEPARTMENTS) {
  assert.equal(d.encounters.length, 12, `${d.department.id} has 12 cards`)
  assert.ok(d.boss.choices.some((c) => !c.requires))
  assert.ok(
    d.boss.department_outcomes.some((o) => o.id === fallbackOutcome(d)),
    `${d.department.id} has a recognised fallback outcome`,
  )
  assert.doesNotMatch(JSON.stringify(d), /developer_note|"brief"|art_ref/)
}
for (const c of allChoices) {
  assert.ok(
    isHarmful(c.cost) || isHarmful(c.success.effects),
    `no clean wins: ${c.id}`,
  )
  if (c.roll) {
    assert.ok(SKILLS.includes(c.roll.skill), `skill ${c.roll.skill}`)
    assert.ok(c.failure, `rolled choice ${c.id} needs a failure`)
  } else {
    assert.equal(c.failure, null, `certain choice ${c.id} has no failure`)
  }
}
assert.ok(ORIENTATION.boss.choices.some((c) => !c.requires))
for (const k of METERS)
  assert.ok(HARMFUL_SIGN[k] === 1 || HARMFUL_SIGN[k] === -1)
for (const job of JOB_TITLES) {
  assert.equal(
    SKILLS.reduce((sum, s) => sum + job.skills[s], 0),
    6,
    `${job.id} has a six-point spread`,
  )
}

const a = newRun('fixed-seed', 'intern')
const b = newRun('fixed-seed', 'intern')
assert.deepEqual(a, b, 'same seed, same deal')
assert.equal(a.deck.length, 4)
assert.equal(a.deck[3], BOSS_CARD)
assert.deepEqual(
  a.deck
    .slice(0, 3)
    .map((id) => ORIENTATION.encounters.find((e) => e.id === id)?.location_id),
  ORIENTATION.locations.map((l) => l.location_id),
  'one card per location, in order',
)
assert.equal(a.meters.successors, 6, 'Intern perk adds a Successor')
assert.equal(newRun('x', 'night-janitor').meters.clearance, 2)
assert.ok(isRunState(JSON.parse(JSON.stringify(a))))
assert.equal(isRunState({ ...a, version: 4 }), false)
assert.equal(isRunState({ ...a, deck: ['not-a-card'] }), false)

assert.ok(SOCIETIES.length >= 6 && MUTATIONS.length >= 8)
assert.equal(DECKS.schemaVersion, 1)
assert.deepEqual(
  DECKS.jobTitles.map((j) => [j.id, j.skills]),
  JOB_TITLES.map((j) => [j.id, j.skills]),
  'job titles match the Conductor decks',
)
const allFlags = new Set(
  allChoices.flatMap((c) => [
    ...c.success.add_flags,
    ...(c.failure?.add_flags ?? []),
  ]),
)
for (const soc of SOCIETIES) {
  for (const f of [
    ...(soc.objectives.orientation ?? []),
    ...(soc.betrayals.orientation ?? []),
  ]) {
    assert.ok(allFlags.has(f), `${soc.id} names a granted flag (${f})`)
  }
  assert.ok(soc.objective_text.orientation && soc.betrayal_text.orientation)
}
assert.ok(SOCIETIES.some((x) => x.id === a.societyId))
assert.ok(MUTATIONS.some((x) => x.id === a.mutationId))
const dealt = new Set<string>()
for (let i = 0; i < 400; i++) dealt.add(newRun(`deal-${i}`, 'temp').societyId)
assert.equal(dealt.size, SOCIETIES.length, 'every society gets dealt')

const v1Keys = new Set([
  'department',
  'societyId',
  'societyStatus',
  'favorUsed',
  'mutationId',
  'mutationUsed',
])
const v1 = {
  ...Object.fromEntries(
    Object.entries(JSON.parse(JSON.stringify(a))).filter(
      ([k]) => !v1Keys.has(k),
    ),
  ),
  version: 1,
}
const upgraded = upgradeRun(v1)
assert.ok(upgraded && upgraded.version === 3, 'v1 saves upgrade')
assert.equal(upgradeRun({ version: 1, seed: 'x' }), null, 'junk v1 rejected')

function withDossier(
  run: RunState,
  societyId: string,
  mutationId: string,
): RunState {
  return {
    ...run,
    societyId,
    mutationId,
    societyStatus: 'active',
    favorUsed: false,
    mutationUsed: false,
  }
}
function findRun(predicate: (r: RunState) => boolean): RunState {
  for (let i = 0; i < 5000; i++) {
    const r = newRun(`find-${i}`, 'intern')
    if (predicate(r)) return r
  }
  throw new Error('no seed matched')
}

const rolledFirst = findRun((r) => {
  const v = currentCard(r)
  return !!v && v.card.choices.some((c) => c.roll && !lockReason(r, c))
})
const rolledChoice = currentCard(rolledFirst)!.card.choices.find(
  (c) => c.roll && !lockReason(rolledFirst, c),
)!

const forced = withDossier(
  rolledFirst,
  'stapler-liberation-front',
  'spontaneous-calm',
)
assert.ok(favorAppliesTo(forced, rolledChoice))
for (let i = 0; i < 40; i++) {
  const r = { ...forced, rng: i * 7919 + 13 }
  const out = choose(r, rolledChoice.id, { useFavor: true })
  assert.equal(
    out.pending!.success,
    true,
    'Spare Staples always lands a rolled choice',
  )
  if (out.pending!.aids.includes('Spare Staples'))
    assert.equal(out.favorUsed, true)
}

const auto = withDossier(
  rolledFirst,
  'the-recyclers',
  'perfect-signature-mimicry',
)
const autoChoice = {
  ...rolledChoice,
  roll: { ...rolledChoice.roll!, skill: 'compliance' as const },
}
assert.equal(mutationAppliesTo(auto, autoChoice), true)
assert.equal(
  mutationAppliesTo(auto, {
    ...rolledChoice,
    roll: { ...rolledChoice.roll!, skill: 'rapport' as const },
  }),
  false,
)

const calm = withDossier(
  { ...rolledFirst, meters: { ...rolledFirst.meters, composure: 2 } },
  'the-recyclers',
  'spontaneous-calm',
)
assert.equal(instantAvailable(calm, 'mutation'), true)
const calmed = useInstant(calm, 'mutation')
assert.equal(calmed.meters.composure, 6)
assert.equal(calmed.mutationUsed, true)
assert.equal(
  calmed.position,
  calm.position,
  'instant use does not advance the deck',
)
assert.equal(
  useInstant(calmed, 'mutation'),
  calmed,
  'mutation is once per department',
)

const pot = withDossier(
  { ...rolledFirst, meters: { ...rolledFirst.meters, composure: 2 } },
  'friends-of-the-old-coffee-machine',
  'spontaneous-calm',
)
assert.equal(useInstant(pot, 'favor').meters.composure, 5)

const betray = societyById('stapler-liberation-front')
const pensRun = findRun((r) => r.deck.includes('the-last-box-of-pens'))
let walk = withDossier(pensRun, betray.id, 'spontaneous-calm')
while (currentCard(walk)?.card.id !== 'the-last-box-of-pens') {
  const v = currentCard(walk)!
  const open = v.card.choices.find(
    (c) =>
      !lockReason(walk, c) &&
      !c.success.add_flags.some(
        (f) =>
          betray.betrayals.orientation!.includes(f) ||
          betray.objectives.orientation!.includes(f),
      ) &&
      !(c.failure?.add_flags ?? []).some(
        (f) =>
          betray.betrayals.orientation!.includes(f) ||
          betray.objectives.orientation!.includes(f),
      ),
  )
  if (!open) break
  walk = advance(choose(walk, open.id))
}
if (
  currentCard(walk)?.card.id === 'the-last-box-of-pens' &&
  walk.societyStatus === 'active'
) {
  const before = walk.meters.suspicion
  const burned = choose(walk, 'take-the-box')
  assert.equal(
    burned.societyStatus,
    'betrayed',
    'hoarding the pens betrays the Front',
  )
  assert.equal(burned.favorUsed, true)
  assert.ok(
    burned.meters.suspicion >= Math.min(10, before + 2) ||
      burned.generation > walk.generation,
  )
}

const first = currentCard(a)
assert.equal(first?.kind, 'encounter')
const pickable = first!.card.choices.find((c) => !lockReason(a, c))!
const chosen = choose(a, pickable.id)
assert.equal(chosen.log.length, 1)
assert.ok(chosen.pending)
assert.deepEqual(
  choose(chosen, pickable.id),
  chosen,
  'no second choice while a result is pending',
)
assert.equal(advance(chosen).position, 1)
assert.deepEqual(choose(a, pickable.id), chosen, 'replay is deterministic')

const gated = ORIENTATION.boss.choices.find((c) => c.requires?.flag)!
const atBoss: RunState = { ...a, position: 3 }
assert.ok(
  lockReason(atBoss, gated),
  'flag-gated boss route is locked without the flag',
)
assert.deepEqual(
  choose(atBoss, gated.id),
  atBoss,
  'locked route cannot be taken',
)
assert.equal(
  lockReason(
    {
      ...atBoss,
      flags: [gated.requires!.flag!],
      meters: { ...atBoss.meters, clearance: 5, forms: 9 },
    },
    gated,
  ),
  null,
  'earning the flag unlocks the route',
)

const outcomes = new Set<string>()
let eliminated = 0
let reorientations = 0
let descents = 0
let completed = 0
for (let i = 0; i < 3000; i++) {
  const job = JOB_TITLES[i % JOB_TITLES.length]!.id
  let run = newRun(`sim-${i}`, job)
  let rng = i + 1
  let guard = 0
  while (
    (run.status === 'playing' || run.status === 'department-complete') &&
    guard++ < 80
  ) {
    if (run.status === 'department-complete') {
      const before = run.department
      run = descend(run)
      assert.notEqual(run.department, before, 'descend moves down a level')
      assert.equal(run.mutationUsed, false, 'mutation resets per department')
      descents++
      continue
    }
    const view = currentCard(run)!
    const open = view.card.choices.filter((c) => !lockReason(run, c))
    assert.ok(
      open.length > 0,
      `a card always has an open choice (${view.card.id})`,
    )
    const [r, next] = nextRandom(rng)
    rng = next
    const pick = open[Math.floor(r * open.length)]!
    run = choose(run, pick.id, {
      spendForm: r < 0.3,
      useFavor: r > 0.6,
      useMutation: r > 0.4,
    })
    if (r > 0.9 && instantAvailable(run, 'mutation'))
      run = useInstant(run, 'mutation')
    if (run.pending?.events.some((e) => e.startsWith('Reorientation')))
      reorientations++
    for (const k of METERS) {
      assert.ok(
        run.meters[k] >= METER_LIMITS[k].min &&
          run.meters[k] <= METER_LIMITS[k].max,
        `${k} in range`,
      )
    }
    run = advance(run)
  }
  assert.ok(
    run.status === 'complete' || run.status === 'eliminated',
    'every run ends',
  )
  assert.ok(run.bossAttempts <= 3, 'a review is attempted at most three times')
  if (run.status === 'eliminated') eliminated++
  if (run.status === 'complete') {
    completed++
    assert.deepEqual(
      Object.keys(run.departmentOutcomes),
      DEPARTMENTS.map((d) => d.department.id),
      'a complete run has an outcome for every department',
    )
  }
  for (const o of Object.values(run.departmentOutcomes)) outcomes.add(o)
}
for (const d of DEPARTMENTS) {
  for (const id of d.boss.department_outcomes.map((o) => o.id)) {
    if (id === fallbackOutcome(d)) continue
    assert.ok(outcomes.has(id), `department outcome ${id} is reachable`)
  }
}
assert.ok(descents > 1000, `most runs reach the next department (${descents})`)
assert.ok(completed > 1000, `most runs finish the demo (${completed})`)
assert.ok(
  reorientations > 0,
  'a failed review re-deals a file instead of ending the run',
)
assert.ok(
  eliminated < 3000 * 0.5,
  `elimination stays a risk, not the norm (${eliminated})`,
)

const page = asset('../../pages/play/shifting-desks.vue')
assert.doesNotMatch(page, /<h1[\s>]/)
assert.match(page, /class="kr-surface"/)
assert.doesNotMatch(page, /localStorage|\$fetch/)
assert.match(page, /prefers-reduced-motion: reduce/)
const tab = asset('../../content/channels/projects/shifting-desks.md')
assert.match(tab, /route: \/play\/shifting-desks/)
assert.match(asset('../../public/shifting-desks/front-poster.svg'), /<title/)

console.log(
  `shifting desks contract ok (${completed}/3000 completed, ${eliminated} eliminated)`,
)
