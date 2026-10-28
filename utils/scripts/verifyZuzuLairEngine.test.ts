// /utils/scripts/verifyZuzuLairEngine.test.ts
//
// Zuzu's Lair (conductor zuzu-lair/t-004): contract test for the pure QTE engine. Walks a
// perfect run, a run of deaths (wrong button, timeout, early press), game over and continue,
// the Assist/Classic differences, and validates the chapter graph.
//
//   npx tsx utils/scripts/verifyZuzuLairEngine.test.ts

import assert from 'node:assert/strict'
import { CHAPTER_1 } from '../zuzuLair/chapter1'
import { BAT_CORRIDOR } from '../zuzuLair/batCorridor'
import {
  CONTINUE_KEEP,
  lairReducer,
  NO_DEATH_BONUS,
  nodeById,
  POINTS_BASE,
  POINTS_SPEED,
  startRun,
  validateChapter,
  windowFor,
} from '../zuzuLair/engine'
import {
  FLASH_HZ,
  flashEnabled,
  hintLit,
  sanitizeLairPrefs,
} from '../zuzuLair/prefs'
import type {
  LairAction,
  LairChapter,
  LairDifficulty,
  LairRun,
} from '../zuzuLair/types'

const run = (r: LairRun, ...actions: LairAction[]) =>
  actions.reduce(lairReducer, r)
const tick = (dt: number): LairAction => ({ type: 'tick', dt })
/** Advance to `t` seconds into the current clip (the run must be at t = 0 or earlier). */
const to = (r: LairRun, t: number) => lairReducer(r, tick(t - r.t))
const moments = CHAPTER_1.nodes.filter((n) => n.kind === 'moment')

// -- graph validation ---------------------------------------------------------------------
assert.deepEqual(validateChapter(CHAPTER_1), [], 'chapter 1 graph is valid')

const bad = (mutate: (c: LairChapter) => void): string[] => {
  const c: LairChapter = JSON.parse(JSON.stringify(CHAPTER_1))
  mutate(c)
  return validateChapter(c)
}
assert.ok(
  bad((c) => {
    c.nodes[1]!.success = 'nowhere'
  }).some((e) => e.includes('unknown node')),
)
assert.ok(
  bad((c) => {
    c.nodes.push({ id: 'lost', kind: 'success', seconds: 3, next: 'closing' })
  }).some((e) => e.includes('orphan')),
)
assert.ok(
  bad((c) => {
    c.nodes[1]!.window = [2.2, 4.0]
  }).some((e) => e.includes('past the clip')),
)
assert.ok(
  bad((c) => {
    c.nodes[1]!.seconds = 9
  }).some((e) => e.includes('outside 2-5')),
)
assert.ok(
  bad((c) => {
    delete c.nodes[1]!.expect
  }).some((e) => e.includes('needs expect')),
)

// -- difficulty windows -------------------------------------------------------------------
const bridge = nodeById(CHAPTER_1, 'm1-bridge')
assert.deepEqual(windowFor(CHAPTER_1, bridge, 'classic'), [2.2, 3.0])
assert.deepEqual(windowFor(CHAPTER_1, bridge, 'assist'), [
  2.2,
  3.0 + CHAPTER_1.assistExtra,
])

// -- a perfect run ------------------------------------------------------------------------
function perfect(
  difficulty: LairDifficulty,
  pressAt: 'open' | 'close',
): LairRun {
  let r = startRun(CHAPTER_1, difficulty)
  r = to(r, 5) // opening ends -> first moment
  for (const m of moments) {
    assert.equal(r.node, m.id, 'arrived at the moment')
    const [open, close] = windowFor(CHAPTER_1, m, difficulty)
    r = to(r, pressAt === 'open' ? open : close)
    r = run(r, { type: 'press', button: m.expect! })
    assert.equal(
      r.node,
      m.success,
      `${m.id}: right press plays the success clip`,
    )
    r = to(r, 3) // success clip ends -> next
  }
  assert.equal(r.node, 'closing')
  return lairReducer(r, tick(5))
}

const fast = perfect('classic', 'open')
assert.equal(fast.phase, 'complete')
assert.equal(fast.deaths, 0)
assert.equal(fast.lives, CHAPTER_1.lives)
assert.equal(fast.bonus?.noDeath, NO_DEATH_BONUS)
assert.ok((fast.bonus?.time ?? 0) > 0, 'time bonus awarded')
assert.equal(
  fast.score,
  moments.length * (POINTS_BASE + POINTS_SPEED) +
    NO_DEATH_BONUS +
    (fast.bonus?.time ?? 0),
  'pressing at the window open scores the maximum',
)
const slow = perfect('classic', 'close')
assert.equal(
  slow.score - (slow.bonus?.time ?? 0) - NO_DEATH_BONUS,
  moments.length * POINTS_BASE,
  'pressing at the window close scores the base only',
)
assert.ok(fast.score > slow.score, 'earlier in the window scores more')
assert.equal(perfect('assist', 'open').phase, 'complete')

// the run is a value: the reducer never mutates its input
const frozen = startRun(CHAPTER_1, 'classic')
const snapshot = JSON.stringify(frozen)
run(frozen, tick(6), { type: 'press', button: 'up' })
assert.equal(JSON.stringify(frozen), snapshot, 'reducer is pure')

// -- inputs outside a moment are ignored ---------------------------------------------------
const idle = run(
  startRun(CHAPTER_1, 'classic'),
  { type: 'press', button: 'up' },
  tick(1),
)
assert.equal(idle.node, 'opening')
assert.equal(idle.deaths, 0)
assert.equal(lairReducer(startRun(CHAPTER_1, 'classic'), tick(0)).t, 0)

// -- deaths: wrong button, timeout, early press (Classic) ---------------------------------
const atBridge = (d: LairDifficulty) => to(startRun(CHAPTER_1, d), 5)

let r = to(atBridge('classic'), 2.5)
r = run(r, { type: 'press', button: 'down' })
assert.equal(r.node, 'm1-bridge-death', 'wrong button kills')
assert.equal(r.lives, CHAPTER_1.lives - 1)
assert.equal(r.deaths, 1)
r = lairReducer(r, tick(4)) // death clip ends -> the moment replays
assert.equal(r.node, 'm1-bridge', 'the moment restarts from its own clip')
assert.equal(r.t, 0)

r = to(atBridge('classic'), 3.4) // sits past the Classic close (3.0) without pressing
assert.equal(r.node, 'm1-bridge-death', 'timeout kills')
assert.equal(r.deaths, 1)
assert.ok(
  Math.abs(r.t - 0.4) < 1e-6,
  'a miss is judged at the window close, the rest plays the death clip',
)

r = run(atBridge('classic'), { type: 'press', button: 'up' }) // before the window opens
assert.equal(r.node, 'm1-bridge-death', 'Classic: an early press is wrong')

r = run(atBridge('assist'), { type: 'press', button: 'up' })
assert.equal(r.node, 'm1-bridge', 'Assist: an early press is ignored')
assert.equal(r.deaths, 0)

r = to(atBridge('assist'), 3.5) // past the Classic close, inside the Assist close
assert.equal(r.node, 'm1-bridge', 'Assist: the window is wider')
r = run(r, { type: 'press', button: 'up' })
assert.equal(
  r.node,
  'm1-bridge-ok',
  'Assist: a late-but-in-window press succeeds',
)
r = run(to(atBridge('classic'), 3.5)) // Classic: already dead by then
assert.equal(r.node, 'm1-bridge-death')

// -- lives, game over, continue ------------------------------------------------------------
function dieOnce(x: LairRun): LairRun {
  const open = nodeById(x.chapter, x.node).window![0]
  return run(to(x, open), { type: 'press', button: 'down' }, tick(5))
}
let go = atBridge('classic')
go = lairReducer(go, { type: 'press', button: 'up' }) // early = dead (life 3 -> 2)
go = lairReducer(go, tick(4))
go = dieOnce(go) // 2 -> 1
go = dieOnce(go) // 1 -> 0, game over once the clip ends
assert.equal(go.phase, 'gameover')
assert.equal(go.lives, 0)
assert.equal(go.deaths, 3)
assert.equal(lairReducer(go, tick(3)), go, 'a finished run ignores ticks')
assert.equal(
  lairReducer(go, { type: 'press', button: 'up' }),
  go,
  'and presses',
)

// score something first, then die out in a later moment and continue there
let scored = to(atBridge('classic'), 2.2)
scored = run(scored, { type: 'press', button: 'up' }, tick(3)) // m1 cleared, now m2-scorpion
assert.equal(scored.node, 'm2-scorpion')
const before = scored.score
assert.equal(before, POINTS_BASE + POINTS_SPEED)
for (let i = 0; i < CHAPTER_1.lives; i++) scored = dieOnce(scored)
assert.equal(scored.phase, 'gameover')
const cont = lairReducer(scored, { type: 'continue' })
assert.equal(cont.phase, 'playing')
assert.equal(cont.node, 'm2-scorpion', 'continue resumes at the last moment')
assert.equal(cont.t, 0)
assert.equal(cont.lives, CHAPTER_1.lives)
assert.equal(
  cont.score,
  Math.floor(before * CONTINUE_KEEP),
  'continue costs score',
)
assert.equal(cont.continues, 1)
assert.equal(
  lairReducer(cont, { type: 'continue' }),
  cont,
  'continue only works from game over',
)

// a continued run cannot take the no-death bonus
let again = cont
for (const m of moments.slice(1)) {
  again = to(again, windowFor(CHAPTER_1, m, 'classic')[0])
  again = run(again, { type: 'press', button: m.expect! }, tick(3))
}
again = lairReducer(again, tick(5))
assert.equal(again.phase, 'complete')
assert.equal(again.bonus?.noDeath, 0, 'deaths forfeit the no-death bonus')

// Assist: unlimited lives, never a game over
let forever = atBridge('assist')
for (let i = 0; i < 8; i++) forever = dieOnce(forever)
assert.equal(forever.phase, 'playing')
assert.equal(forever.lives, CHAPTER_1.lives)
assert.equal(forever.deaths, 8)

// -- one big tick crosses several clips ------------------------------------------------------
const skipped = lairReducer(startRun(CHAPTER_1, 'classic'), tick(5 + 1.0))
assert.equal(skipped.node, 'm1-bridge')
assert.ok(Math.abs(skipped.t - 1.0) < 1e-6)

// -- options and flash assist ------------------------------------------------------------------
assert.deepEqual(sanitizeLairPrefs('junk'), {
  difficulty: 'assist',
  flash: null,
  buttons: null,
  muted: false,
})
assert.equal(sanitizeLairPrefs({ difficulty: 'classic' }).difficulty, 'classic')
assert.equal(flashEnabled('assist', null), true)
assert.equal(flashEnabled('classic', null), false)
assert.equal(flashEnabled('classic', true), true)
assert.equal(hintLit(-0.1, false), false, 'dark before the window opens')
assert.equal(hintLit(0.3, true), true, 'steady under reduced motion')
assert.equal(hintLit(0.9, true), true)
assert.ok(FLASH_HZ <= 3, 'never strobes faster than 3 Hz')
let toggles = 0
let last = hintLit(0, false)
for (let t = 0.005; t < 1; t += 0.005) {
  const now = hintLit(t, false)
  if (now !== last) toggles++
  last = now
}
assert.ok(toggles <= 6, `at most 3 on/off cycles a second (saw ${toggles})`)

// -- Bat Corridor PoC: visible branching prototype independent of the film manifest -----------
assert.deepEqual(
  validateChapter(BAT_CORRIDOR),
  [],
  'bat corridor scene graph is valid',
)
const batMoment = nodeById(BAT_CORRIDOR, 'bat-horde')
assert.equal(batMoment.expect, 'down')
assert.deepEqual(windowFor(BAT_CORRIDOR, batMoment, 'classic'), [1.2, 2.2])
assert.deepEqual(windowFor(BAT_CORRIDOR, batMoment, 'assist'), [1.2, 3.0])

let bat = lairReducer(startRun(BAT_CORRIDOR, 'assist'), tick(3))
assert.equal(bat.node, 'bat-horde', 'Zuzu enters the corridor before the swarm')
bat = lairReducer(bat, tick(1.5))
bat = lairReducer(bat, { type: 'press', button: 'down' })
assert.equal(bat.node, 'bat-duck', 'DOWN ducks beneath the passing bats')
bat = lairReducer(bat, tick(3.6))
assert.equal(
  bat.node,
  'bat-escape',
  'the third animation climbs into the opening',
)
bat = lairReducer(bat, tick(3.2))
assert.equal(
  bat.phase,
  'complete',
  'surviving bats finishes the proof of concept',
)
assert.equal(bat.deaths, 0)

let batAttack = lairReducer(startRun(BAT_CORRIDOR, 'classic'), tick(3))
batAttack = lairReducer(batAttack, tick(1.5))
batAttack = lairReducer(batAttack, { type: 'press', button: 'up' })
assert.equal(
  batAttack.node,
  'bat-attack',
  'anything except DOWN triggers the attack animation',
)
assert.equal(batAttack.lives, 2)
batAttack = lairReducer(batAttack, tick(3.2))
assert.equal(
  batAttack.node,
  'bat-horde',
  'the attack returns to the bat corridor',
)

const batTimeout = lairReducer(
  lairReducer(startRun(BAT_CORRIDOR, 'assist'), tick(3)),
  tick(3.1),
)
assert.equal(
  batTimeout.node,
  'bat-attack',
  'missing the window triggers the bat attack',
)

console.log('verifyZuzuLairEngine: ok')
