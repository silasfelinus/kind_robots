import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  BOSS_CARD,
  HARMFUL_SIGN,
  JOB_TITLES,
  METERS,
  METER_LIMITS,
  ORIENTATION,
  SKILLS,
  advance,
  choose,
  currentCard,
  isHarmful,
  isRunState,
  lockReason,
  newRun,
  nextRandom,
  type RunState,
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

const allChoices = [
  ...ORIENTATION.encounters.flatMap((e) => e.choices),
  ...ORIENTATION.boss.choices,
]
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
assert.equal(isRunState({ ...a, version: 2 }), false)
assert.equal(isRunState({ ...a, deck: ['not-a-card'] }), false)

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
for (let i = 0; i < 3000; i++) {
  const job = JOB_TITLES[i % JOB_TITLES.length].id
  let run = newRun(`sim-${i}`, job)
  let rng = i + 1
  let guard = 0
  while (run.status === 'playing' && guard++ < 50) {
    const view = currentCard(run)!
    const open = view.card.choices.filter((c) => !lockReason(run, c))
    assert.ok(
      open.length > 0,
      `a card always has an open choice (${view.card.id})`,
    )
    const [r, next] = nextRandom(rng)
    rng = next
    const pick = open[Math.floor(r * open.length)]
    run = choose(run, pick.id, r < 0.3)
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
  assert.notEqual(run.status, 'playing', 'every run ends')
  if (run.status === 'eliminated') eliminated++
  outcomes.add(run.departmentOutcome ?? 'none')
}
for (const id of ORIENTATION.boss.department_outcomes.map((o) => o.id)) {
  if (id === 'reorientation') continue
  assert.ok(outcomes.has(id), `department outcome ${id} is reachable`)
}
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

console.log(`shifting desks contract ok (${eliminated}/3000 runs eliminated)`)
