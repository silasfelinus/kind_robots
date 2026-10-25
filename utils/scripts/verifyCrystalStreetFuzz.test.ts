/**
 * Terrors on Crystal Street adversarial fuzzing (roadmap #4143, phase 4).
 *
 * Plays every nightmare x look x clique under three policies and checks the
 * engine's invariants after every step:
 * - careful: the near-optimal autoplay;
 * - careless: random legal play;
 * - adversarial: random play that also fires illegal moves (locked choices,
 *   double resolves, unaffordable buys, out-of-phase draws and activities,
 *   dismissing strangers) and asserts each one leaves the week untouched.
 *
 *   npx tsx utils/scripts/verifyCrystalStreetFuzz.test.ts [--deep]
 *
 * The default run covers every combination once per policy; --deep plays
 * five seeds per combination (over 30,000 weeks).
 */
import assert from 'node:assert/strict'
import { autoplay, carelessAutoplay } from '../crystalStreet/autoplay'
import {
  ARCHETYPES,
  AVATARS,
  CREW_LIMIT,
  ITEMS,
  LOCATIONS,
  MAX_DREAD,
  MAX_NERVE,
  MAX_STANDING,
  SKILL_CAP,
  VILLAINS,
  activitiesAt,
  awaitingDraw,
  buy,
  choose,
  currentEncounter,
  dismiss,
  doActivity,
  drawFrom,
  hashSeed,
  isRunState,
  lockReason,
  repairRun,
  newRun,
  nextRandom,
  nightfall,
  resolve,
  standingOf,
  useItem,
  type RunState,
} from '../crystalStreet/rules'
import { SKILLS } from '../crystalStreet/types'
import type {
  CompanionId,
  ItemId,
  LocationId,
  VillainId,
} from '../crystalStreet/ids'

const DEEP = process.argv.includes('--deep')
const SEEDS = DEEP ? 5 : 1
const STEP_CAP = 900

function invariants(run: RunState, where: string): void {
  const fail = (what: string) => assert.fail(`${where}: ${what}`)
  if (!Number.isInteger(run.nerve) || run.nerve < 0 || run.nerve > MAX_NERVE)
    fail(`nerve ${run.nerve}`)
  if (!Number.isInteger(run.dread) || run.dread < 0 || run.dread > MAX_DREAD)
    fail(`dread ${run.dread}`)
  if (!Number.isInteger(run.quarters) || run.quarters < 0)
    fail(`quarters ${run.quarters}`)
  for (const s of SKILLS)
    if (
      !Number.isInteger(run.skills[s]) ||
      run.skills[s] < 0 ||
      run.skills[s] > SKILL_CAP
    )
      fail(`skill ${s} ${run.skills[s]}`)
  for (const [f, n] of Object.entries(standingOf(run)))
    if (!Number.isInteger(n) || n < 0 || n > MAX_STANDING)
      fail(`standing ${f} ${n}`)
  if (run.crew.length > CREW_LIMIT) fail(`crew ${run.crew.length}`)
  if (new Set(run.crew).size !== run.crew.length) fail('duplicate crew')
  if (run.day < 1 || run.day > 7) fail(`day ${run.day}`)
  if (run.clues.length > 3) fail(`clues ${run.clues.length}`)
  if (run.pending) {
    const r = run.pending.roll
    if (![r.total, r.modifier, r.target, ...r.dice].every(Number.isFinite))
      fail('non-finite roll')
  }
  if (run.phase === 'ended' && !run.ending) fail('ended without an ending')
  if (run.ending && run.phase !== 'ended') fail('ending before the end')
  // No softlock: a week in progress always offers something to do.
  if (run.phase !== 'ended') {
    if (run.current) {
      const e = currentEncounter(run)
      if (!e) fail(`current ${run.current.id} does not resolve`)
      else if (!run.pending && !e.choices.some((c) => !lockReason(run, c)))
        fail(`every choice locked on ${e.id}`)
    } else if (run.phase === 'night' && !awaitingDraw(run))
      fail('a night with nothing to draw or face')
  }
}

function rng(seed: string) {
  let state = hashSeed(seed)
  const roll = () => {
    const [value, next] = nextRandom(state)
    state = next
    return value
  }
  return {
    roll,
    any<T>(list: readonly T[]): T {
      return list[Math.floor(roll() * list.length)]!
    },
  }
}

// Fire one illegal move and assert the week is returned untouched.
function attempt(run: RunState, r: ReturnType<typeof rng>, where: string) {
  const same = (next: RunState, what: string) =>
    assert.equal(next, run, `${where}: illegal ${what} changed the week`)
  const pick = Math.floor(r.roll() * 7)
  if (pick === 0 && run.current && !run.pending) {
    const locked = currentEncounter(run)?.choices.find((c) =>
      lockReason(run, c),
    )
    if (locked) same(choose(run, locked.id), 'locked choice')
  } else if (pick === 1 && !run.pending) same(resolve(run), 'resolve')
  else if (pick === 2) {
    const item = r.any(ITEMS)
    if (!run.shopOpen || run.quarters < item.price)
      same(buy(run, item.id as ItemId), 'buy')
  } else if (pick === 3 && !awaitingDraw(run))
    same(drawFrom(run, r.roll() < 0.5 ? 'villain' : 'street'), 'draw')
  else if (pick === 4 && run.phase !== 'day')
    same(
      doActivity(run, 'crystal-street' as LocationId, { kind: 'rest' }),
      'night activity',
    )
  else if (pick === 5) {
    const stranger = 'nobody-at-all' as CompanionId
    same(dismiss(run, stranger), 'dismiss a stranger')
  } else if (pick === 6 && run.phase === 'day' && run.current)
    same(nightfall(run), 'nightfall mid-encounter')
}

function adversarial(
  seed: string,
  villain: VillainId,
  archetype: string,
  avatar: string,
): RunState {
  const r = rng(`adversarial:${seed}`)
  let run = newRun({
    seed,
    name: 'Fuzz',
    pronouns: 'they/them',
    archetype,
    avatar,
    villain,
  })
  for (let step = 0; step < STEP_CAP && run.phase !== 'ended'; step++) {
    const where = `${seed} step ${step}`
    invariants(run, where)
    attempt(run, r, where)
    if (step % 40 === 0) {
      const saved = JSON.parse(JSON.stringify(run)) as RunState
      assert.ok(isRunState(saved), `${where}: a saved week reloads`)
      assert.deepEqual(repairRun(saved), saved, `${where}: repair keeps it`)
    }
    if (run.current) {
      const open =
        currentEncounter(run)?.choices.filter((c) => !lockReason(run, c)) ?? []
      run = resolve(choose(run, r.any(open).id))
    } else if (awaitingDraw(run))
      run = drawFrom(run, r.roll() < 0.5 ? 'villain' : 'street')
    else if (run.phase === 'day') {
      if (run.actions <= 0 || r.roll() < 0.08) run = nightfall(run)
      else {
        const location = r.any(LOCATIONS).id as LocationId
        const options = activitiesAt(run, location)
        if (options.length) run = doActivity(run, location, r.any(options))
        if (run.items.length && r.roll() < 0.1)
          run = useItem(run, r.any(run.items))
        if (run.crew.length > 6 && r.roll() < 0.05)
          run = dismiss(run, r.any(run.crew))
      }
    }
  }
  invariants(run, `${seed} final`)
  return run
}

let weeks = 0
const endings: Record<string, number> = {}
for (const v of VILLAINS)
  for (const look of AVATARS)
    for (const clique of ARCHETYPES)
      for (let s = 0; s < SEEDS; s++) {
        const seed = `fuzz-${v.id}-${look.id}-${clique.id}-${s}`
        for (const policy of ['careful', 'careless', 'adversarial'] as const) {
          const run =
            policy === 'careful'
              ? autoplay(seed, v.id as VillainId, clique.id, look.id)
              : policy === 'careless'
                ? carelessAutoplay(seed, v.id as VillainId, clique.id, look.id)
                : adversarial(seed, v.id as VillainId, clique.id, look.id)
          invariants(run, `${policy} ${seed}`)
          assert.equal(run.phase, 'ended', `${policy} ${seed} finishes`)
          const key = run.ending?.special ?? run.ending?.tier ?? 'none'
          endings[key] = (endings[key] ?? 0) + 1
          weeks++
        }
      }

// Save tampering: corrupt, stale and hand-edited weeks either repair into a
// week every invariant accepts or are refused; none can crash a screen.
{
  const base = newRun({
    seed: 'tamper',
    name: 'T',
    pronouns: 'they/them',
    archetype: 'jock',
    avatar: AVATARS[0]!.id,
    villain: 'counselor-jess',
  })
  const saved = JSON.parse(JSON.stringify(base)) as Record<string, unknown>
  const refused: unknown[] = [
    null,
    'not a week',
    42,
    [],
    { ...saved, version: 0 },
    { ...saved, villain: 'nobody' },
    { ...saved, seed: 7 },
    { ...saved, skills: 'strong' },
    { ...saved, phase: 'ended', ending: null },
  ]
  for (const bad of refused)
    assert.equal(
      repairRun(bad),
      null,
      `refuses ${JSON.stringify(bad)?.slice(0, 60)}`,
    )
  const tampered: Record<string, unknown>[] = [
    { ...saved, nerve: 9999, dread: -40, quarters: 1e12, day: 99, actions: -3 },
    { ...saved, nerve: 'lots', quarters: null, rng: 'x', draws: 50 },
    { ...saved, skills: { ...base.skills, brawn: 1e9, charm: -5 } },
    {
      ...saved,
      crew: ['dani-ortega', 'dani-ortega', 'ghost', 7, ...base.crew],
    },
    {
      ...saved,
      items: ['bogus', 3],
      clues: ['someone-elses-clue'],
      flags: 'x',
    },
    { ...saved, standing: { friends: 99, family: -9, officials: 'a' } },
    { ...saved, current: { id: 'missing-encounter', kind: 'night' } },
    { ...saved, current: { id: base.queue[0]?.id ?? 'x', kind: 'nope' } },
    { ...saved, pending: { choiceId: 'x', roll: { dice: [1, 2] } } },
    { ...saved, phase: 'twilight', queue: [{ id: 'nope', kind: 'night' }, 5] },
    {
      ...saved,
      log: [
        ...Array.from({ length: 5000 }, (_, i) => ({
          encounterId: `e${i}`,
          text: 'x',
        })),
        { nonsense: true },
      ],
    },
    { ...saved, ending: { tier: 'best', at: 1 }, phase: 'day' },
    {
      ...saved,
      name: 'x'.repeat(5000),
      avatar: 'nobody',
      archetype: 'astronaut',
    },
  ]
  for (const [i, bad] of tampered.entries()) {
    const fixed = repairRun(bad)
    assert.ok(fixed, `tampered save ${i} repairs`)
    invariants(fixed!, `tampered save ${i}`)
    assert.ok(fixed!.log.length <= 200, `tampered save ${i} trims the log`)
    assert.ok(fixed!.name.length <= 24)
    assert.equal(fixed!.ending, null)
    // A repaired week still plays to an ending.
    let run = fixed!
    for (let step = 0; step < STEP_CAP && run.phase !== 'ended'; step++) {
      if (run.current) {
        const open =
          currentEncounter(run)?.choices.filter((c) => !lockReason(run, c)) ??
          []
        run = resolve(choose(run, open[0]!.id))
      } else if (awaitingDraw(run)) run = drawFrom(run, 'street')
      else run = nightfall(run)
    }
    assert.equal(run.phase, 'ended', `tampered save ${i} still finishes`)
  }
  // An honest save repairs to itself.
  assert.deepEqual(repairRun(saved), base)
}

console.log(
  `Crystal Street fuzz: ${weeks} weeks, every invariant held. Endings: ${Object.entries(
    endings,
  )
    .map(([k, n]) => `${k} ${n}`)
    .join(', ')}`,
)
