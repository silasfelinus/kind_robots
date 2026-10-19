// Rover Ramble depth pass, slice 1 (conductor kr-arcade/t-098, depth-pass CABINETS.md section 15):
// the course engine and Moon 1. The A-to-Z course is authored data that always lays out whole, a
// moon's outpost prints a time report with stamps, and clearing Z ends the run. Each new threat is
// pinned on a staged track: landmines, tanks and their shells, bomber and zig saucers, moon
// creepers, dust devils, pursuers from behind, ramps with the big-air bonus, and the boulder
// stomp. A pilot probe shows that attract runs are deterministic, score nothing and still end.
//
//   npx tsx utils/scripts/verifyCabinetRoverRamble.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import roverRamble from '../arcade/games/roverRamble'
import {
  COURSE,
  COURSE_LENGTH,
  LEAD_IN,
  LEAD_OUT,
  MOONS,
  OUTPOSTS,
  RAMP_GAP_W,
  RAMP_W,
  SECTION_COUNT,
  checkpointReport,
  courseProblems,
  isOutpost,
  layoutSection,
  moonRange,
  parseBeats,
  sectionStart,
} from '../arcade/roverRamble/course'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'

type Ob = {
  kind: string
  x: number
  w: number
  hp: number
  passed: boolean
  gone: boolean
  t: number
  dir: number
}
type Inner = {
  score: number
  level: number
  lives: number
  over: boolean
  wx: number
  speed: number
  alt: number
  vy: number
  crash: number
  roverX: number
  camera: number
  sectionStart: number
  sectionLen: number
  sectionTicks: number
  moonTicks: number
  moonCrashes: number
  obstacles: Ob[]
  cues: { kind: string; x: number; done: boolean }[]
  sprites: {
    kind: string
    x: number
    y: number
    baseY: number
    vx: number
    phase: number
    targetWx: number
    dropped: boolean
  }[]
  shells: { x: number }[]
  bombs: { wx: number; y: number }[]
  pursuers: { x: number; passed: boolean; gone: boolean }[]
  fwd: { x: number; y: number; ox: number } | null
  ups: { x: number; y: number }[]
  airBonus: boolean
  report: { data: { moon: number; bonus: number } } | null
  won: boolean
  banner: { text: string } | null
  update(input: InputFrame): void
  startSection(section: number, rewind?: boolean): void
}

function make(seed = 7, demo = false): Inner {
  return roverRamble.create({
    rng: mulberry32(seed),
    sound: { play: () => {} },
    demo,
    hiScore: 0,
  }) as unknown as Inner
}

const idle = () => emptyInput()
function press(
  ...buttons: ('up' | 'a' | 'b' | 'left' | 'right')[]
): InputFrame {
  const f = emptyInput()
  for (const b of buttons) {
    f.held[b] = true
    f.pressed[b] = true
  }
  return f
}
const ob = (kind: string, x: number, w = 0): Ob => ({
  kind,
  x,
  w,
  hp: kind === 'big' || kind === 'tank' ? 2 : 1,
  passed: false,
  gone: false,
  t: kind === 'tank' ? 90 : 0,
  dir: 0,
})

/** A clean section A track: nothing on it, nothing scripted. */
function bare(seed = 7): Inner {
  const g = make(seed)
  g.obstacles = []
  g.cues = []
  g.banner = null
  return g
}
function run(g: Inner, ticks: number, input: () => InputFrame = idle) {
  for (let i = 0; i < ticks && !g.over; i++) g.update(input())
}

// --- the course is data, and it is sound ------------------------------------------------------

assert.deepEqual(courseProblems(), [], 'every section is sound')
assert.equal(SECTION_COUNT, 26)
assert.equal(COURSE.map((s) => s.letter).join(''), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')
assert.deepEqual(
  OUTPOSTS,
  [4, 9, 14, 19, 25],
  'the outposts are E, J, O, T and Z',
)
assert.deepEqual(OUTPOSTS.map((i) => COURSE[i]!.letter).join(''), 'EJOTZ')
assert.deepEqual(moonRange(0), [0, 4])
assert.deepEqual(moonRange(4), [20, 25])
assert.equal(MOONS.length, 5)
assert.ok(isOutpost(9) && !isOutpost(8))
for (const s of COURSE)
  assert.equal(OUTPOSTS[s.moon]! >= COURSE.indexOf(s), true)
assert.ok(new Set(COURSE.map((s) => s.len)).size > 12, 'section lengths vary')
assert.equal(sectionStart(0), 0)
assert.equal(sectionStart(26), COURSE_LENGTH)
assert.equal(sectionStart(3), COURSE[0]!.len + COURSE[1]!.len + COURSE[2]!.len)
assert.throws(() => parseBeats('c r ?'), /unknown beat token/)

const kinds = new Set(COURSE.flatMap((s) => s.beats))
for (const k of [
  'crater',
  'twin',
  'rock',
  'big',
  'roller',
  'mine',
  'tank',
  'ramp',
  'creeper',
  'devil',
  'sprites',
  'zig',
  'bomber',
  'pursuer',
])
  assert.ok(kinds.has(k as never), `the course uses ${k}`)
const moon1 = new Set(COURSE.slice(0, 5).flatMap((s) => s.beats))
for (const k of ['mine', 'tank', 'bomber', 'devil', 'pursuer', 'ramp'])
  assert.ok(moon1.has(k as never), `Moon 1 introduces ${k}`)

// Every layout fits its section whatever the dice say, and craters keep their width range.
for (let seed = 1; seed <= 30; seed++) {
  COURSE.forEach((def, i) => {
    const start = sectionStart(i)
    const { places, cues } = layoutSection(def, start, mulberry32(seed))
    const solids = def.beats.filter(
      (b) => !['sprites', 'zig', 'bomber', 'pursuer', 'rest'].includes(b),
    )
    assert.ok(places.length >= solids.length, `${def.letter} places every beat`)
    assert.equal(
      cues.length,
      def.beats.filter((b) =>
        ['sprites', 'zig', 'bomber', 'pursuer'].includes(b),
      ).length,
    )
    for (const p of places) {
      assert.ok(
        p.x >= start + LEAD_IN - 1,
        `${def.letter} starts after the lead-in`,
      )
      assert.ok(
        p.x + p.w <= start + def.len - LEAD_OUT + 20,
        `${def.letter} seed ${seed}: ${p.kind} at ${p.x} runs past the end`,
      )
      if (p.kind === 'crater') assert.ok(p.w >= 16 && p.w <= RAMP_GAP_W + 1)
    }
    const sorted = [...places].sort((a, b) => a.x - b.x)
    for (let k = 1; k < sorted.length; k++)
      assert.ok(
        sorted[k - 1]!.kind === 'ramp' ||
          sorted[k]!.x - (sorted[k - 1]!.x + sorted[k - 1]!.w) >= 20,
        `${def.letter} seed ${seed}: beats overlap`,
      )
    for (const c of cues) assert.ok(c.x >= start + 120)
  })
}
const again = layoutSection(COURSE[3]!, sectionStart(3), mulberry32(9))
assert.deepEqual(
  again,
  layoutSection(COURSE[3]!, sectionStart(3), mulberry32(9)),
  'same seed, same layout',
)
assert.notDeepEqual(
  again,
  layoutSection(COURSE[3]!, sectionStart(3), mulberry32(10)),
  'a new seed varies it',
)
// A ramp always throws the rover at a crater wide enough to need it.
const ramped = layoutSection(COURSE[0]!, 0, mulberry32(3))
const rampAt = ramped.places.find((p) => p.kind === 'ramp')!
assert.equal(rampAt.w, RAMP_W)
const gapAt = ramped.places.find(
  (p) => p.kind === 'crater' && p.x === rampAt.x + RAMP_W + 8,
)
assert.equal(gapAt?.w, RAMP_GAP_W, 'a ramp is followed by its gap')

// --- the outpost report -----------------------------------------------------------------------

const parOne = COURSE.slice(0, 5).reduce((n, s) => n + s.par, 0)
const clean = checkpointReport(0, { ticks: (parOne - 5) * 60, crashes: 0 })
assert.equal(clean.par, parOne)
assert.ok(clean.underPar && clean.noScrape)
assert.equal(clean.bonus, 2000, 'two stamps on Moon 1 pay 1,000 each')
const slow = checkpointReport(0, { ticks: (parOne + 20) * 60, crashes: 2 })
assert.ok(!slow.underPar && !slow.noScrape)
assert.equal(slow.bonus, 0)
assert.equal(
  checkpointReport(2, { ticks: 1, crashes: 0 }).bonus,
  6000,
  'later moons pay more',
)
assert.equal(checkpointReport(4, { ticks: 1, crashes: 1 }).name, 'THE FAR SIDE')

// --- the track: crater, mine, rock -------------------------------------------------------------

{
  const g = bare()
  assert.equal(g.level, 1)
  g.obstacles = [ob('crater', g.wx + 80, 30)]
  run(g, 120)
  assert.equal(g.lives, 2, 'driving into a crater costs a rover')
  assert.equal(g.moonCrashes, 1)
}
{
  const g = bare()
  g.obstacles = [ob('mine', g.wx + 60)]
  run(g, 80)
  assert.equal(g.lives, 2, 'a landmine blows the rover up')
}
{
  const g = bare()
  g.obstacles = [ob('mine', g.wx + 60)]
  let jumped = false
  for (let i = 0; i < 100; i++) {
    const near = g.obstacles[0]!.x - g.wx < 30 && !jumped && g.alt === 0
    if (near) jumped = true
    g.update(near ? press('up') : idle())
  }
  assert.equal(g.lives, 3, 'a mine can be jumped')
  assert.ok(g.score >= 100, 'and it pays')
}
{
  const g = bare()
  g.obstacles = [ob('mine', g.wx + 90)]
  for (let i = 0; i < 40; i++) g.update(press('a'))
  assert.equal(g.obstacles[0]!.gone, false, 'a zap cannot clear a mine')
}

// --- stomping a boulder -------------------------------------------------------------------------

{
  const g = bare()
  g.obstacles = [ob('rock', g.wx + 4)]
  g.alt = 15.5
  g.vy = -1
  const before = g.score
  g.update(idle())
  g.update(idle())
  assert.equal(
    g.obstacles.length === 0 || g.obstacles[0]!.gone,
    true,
    'landing on a boulder breaks it',
  )
  assert.equal(g.lives, 3, 'without costing a rover')
  assert.ok(g.vy > 0, 'the rover bounces')
  assert.equal(g.score - before, 200, 'a stomp is a stunt worth 200')
}
{
  const g = bare()
  g.obstacles = [ob('rock', g.wx + 6)]
  g.alt = 6
  g.vy = 0.5
  g.update(idle())
  assert.equal(g.lives, 2, 'a rising rover that is still low bumps the boulder')
}

// --- ramps and big air --------------------------------------------------------------------------

{
  const g = bare()
  const rampX = g.wx + 40
  g.obstacles = [
    ob('ramp', rampX, RAMP_W),
    ob('crater', rampX + RAMP_W + 8, RAMP_GAP_W),
  ]
  g.speed = 2.6
  const before = g.score
  let peak = 0
  for (let i = 0; i < 90; i++) {
    g.update(press('right'))
    peak = Math.max(peak, g.alt)
  }
  assert.equal(g.lives, 3, 'a ramp at full speed clears its gap')
  assert.ok(peak > 40, `the launch is high (${peak.toFixed(0)})`)
  assert.equal(
    g.score - before >= 300,
    true,
    'full speed earns the big-air bonus',
  )
}
{
  const g = bare()
  const rampX = g.wx + 40
  g.obstacles = [
    ob('ramp', rampX, RAMP_W),
    ob('crater', rampX + RAMP_W + 8, RAMP_GAP_W),
  ]
  g.speed = 1
  run(g, 120, () => press('left'))
  assert.equal(g.lives, 2, 'crawling up a ramp falls short of its gap')
}

// --- tanks --------------------------------------------------------------------------------------

{
  const g = bare()
  g.obstacles = [ob('tank', g.wx + 200)]
  run(g, 140, () => press('left'))
  assert.ok(g.shells.length > 0 || g.lives < 3, 'a tank in range fires a shell')
  assert.equal(g.obstacles[0]!.t < 170, true)
}
{
  const g = bare()
  g.shells = [{ x: g.wx + 30 }]
  run(g, 30)
  assert.equal(g.lives, 2, 'a shell along the ground hits the rover')
}
{
  const g = bare()
  g.shells = [{ x: g.wx + 30 }]
  let hopped = false
  for (let i = 0; i < 40; i++) {
    const go =
      !hopped && g.shells[0] !== undefined && g.shells[0]!.x - g.wx < 40
    if (go) hopped = true
    g.update(go ? press('up') : idle())
  }
  assert.equal(g.lives, 3, 'a jumped shell passes underneath')
}
{
  const g = bare()
  g.obstacles = [ob('tank', g.wx + 110)]
  const before = g.score
  let shots = 0
  for (let i = 0; i < 60 && !g.obstacles[0]!.gone; i++) {
    g.update(i % 6 === 0 ? press('a') : idle())
    shots++
  }
  assert.equal(
    g.obstacles.length === 0 || g.obstacles[0]!.gone,
    true,
    'two zaps destroy a tank',
  )
  assert.equal(g.score - before, 300)
  assert.ok(shots > 6)
}

// --- creepers and dust devils ------------------------------------------------------------------

{
  const g = bare()
  const vine = ob('creeper', g.wx + 160)
  g.obstacles = [vine]
  run(g, 10, () => press('left'))
  assert.ok(vine.t > 0 && vine.t < 110, 'the bud swells as the rover nears')
  vine.x = g.wx + 70
  g.update(press('a'))
  for (let i = 0; i < 40; i++) g.update(idle())
  assert.equal(vine.gone, true, 'a bud can be zapped')
  assert.equal(g.lives, 3)
}
{
  const g = bare()
  const vine = ob('creeper', g.wx + 60)
  vine.t = 110
  g.obstacles = [vine]
  run(g, 60)
  assert.equal(g.lives, 2, 'a full vine blocks the road')
}
{
  const g = bare()
  const vine = ob('creeper', g.wx + 60)
  vine.t = 110
  g.obstacles = [vine]
  g.update(press('a'))
  for (let i = 0; i < 20; i++) g.update(idle())
  assert.equal(vine.gone, false, 'a full vine shrugs off a zap')
}
{
  const g = bare()
  const devil = ob('devil', g.wx + 10)
  devil.dir = 1
  g.obstacles = [devil]
  const before = g.speed
  g.update(idle())
  assert.ok(g.speed > before, 'a dust devil shoves the throttle')
  const push = ob('devil', g.wx + 10)
  push.dir = -1
  g.obstacles = [push]
  const mid = g.speed
  g.update(idle())
  assert.ok(g.speed < mid, 'and can shove it the other way')
  assert.equal(g.lives, 3, 'it never costs a rover')
}

// --- saucers and bombs --------------------------------------------------------------------------

{
  const g = bare()
  g.cues = [{ kind: 'bomber', x: g.wx + 1, done: false }]
  run(g, 3, () => press('right'))
  const b = g.sprites.find((s) => s.kind === 'bomber')
  assert.ok(b, 'the cue sends a bomber')
  assert.ok(b!.targetWx > g.wx + 100, 'its ring is on the track ahead')
  b!.targetWx = g.wx + 400
  const ahead = b!.targetWx
  for (let i = 0; i < 240 && !g.over; i++) {
    g.update(press('left'))
    if (g.obstacles.some((o) => o.kind === 'crater') && g.bombs.length === 0)
      break
  }
  const hole = g.obstacles.find((o) => o.kind === 'crater')
  assert.ok(hole, 'the bomb blasts a crater')
  assert.ok(Math.abs(hole!.x + hole!.w / 2 - ahead) < 3, 'right at its ring')
}
{
  const g = bare()
  g.cues = [{ kind: 'bomber', x: g.wx + 1, done: false }]
  g.update(idle())
  const bomber = g.sprites.find((s) => s.kind === 'bomber')!
  bomber.targetWx = g.wx - 100_000
  const before = g.score
  for (let i = 0; i < 20; i++) {
    bomber.x = (g.ups[0]?.x ?? g.wx - 4) - g.camera - g.speed
    bomber.y = 150
    g.update(i === 0 ? press('a') : idle())
  }
  assert.equal(
    g.score - before,
    150,
    'an up-shot pops a bomber before its bomb drops',
  )
  assert.equal(g.bombs.length, 0)
}
{
  const g = bare()
  g.cues = [{ kind: 'zig', x: g.wx + 1, done: false }]
  g.update(idle())
  assert.ok(
    g.sprites.some((s) => s.kind === 'zig'),
    'the cue sends a zig saucer',
  )
}
{
  const g = bare()
  g.cues = [{ kind: 'zig', x: g.wx + 1, done: false }]
  g.update(idle())
  const zig = g.sprites.find((s) => s.kind === 'zig')!
  zig.x = g.roverX + 4
  zig.y = 190
  zig.vx = 0
  g.update(idle())
  assert.equal(g.lives, 2, 'a low zig saucer sideswipes a grounded rover')
}
{
  const g = bare()
  g.cues = [{ kind: 'zig', x: g.wx + 1, done: false }]
  g.update(idle())
  const zig = g.sprites.find((s) => s.kind === 'zig')!
  zig.x = g.roverX + 4
  zig.y = 150
  zig.vx = 0
  g.alt = 0
  g.update(idle())
  assert.equal(
    g.lives,
    3,
    'a zig saucer at its high zig passes over a grounded rover',
  )
}

// --- pursuers from behind -----------------------------------------------------------------------

{
  const g = bare()
  g.cues = [{ kind: 'pursuer', x: g.wx + 1, done: false }]
  g.update(idle())
  assert.equal(g.pursuers.length, 1, 'a horn and a pursuer behind')
  assert.ok(g.pursuers[0]!.x < g.wx, 'it starts behind the rover')
  run(g, 300)
  assert.equal(g.lives, 2, 'a pursuer runs down a rover that never jumps')
  assert.equal(g.moonCrashes, 1)
}
{
  const g = bare()
  g.cues = [{ kind: 'pursuer', x: g.wx + 1, done: false }]
  g.update(idle())
  let hopped = false
  let ahead = false
  const before = g.score
  for (let i = 0; i < 300 && g.lives === 3 && !ahead; i++) {
    const chaser = g.pursuers[0]!
    ahead = chaser.passed
    const gap = g.wx - chaser.x
    const go = !hopped && gap > 24 && gap < 36
    if (go) hopped = true
    g.update(go ? press('up') : idle())
  }
  assert.ok(hopped, 'the pursuer arrived')
  assert.equal(g.lives, 3, 'jumping as it arrives lets it pass underneath')
  assert.ok(ahead, 'and it is now ahead')
  assert.ok(g.score - before >= 100, 'a close shave pays')
}

// --- the course ends at Z ------------------------------------------------------------------------

{
  const g = bare()
  g.startSection(SECTION_COUNT)
  g.obstacles = []
  g.cues = []
  g.banner = null
  g.wx = g.sectionStart + g.sectionLen - 3
  const before = g.score
  run(g, 5)
  assert.ok(g.over && g.won, 'finishing Z wins the rally')
  assert.ok(g.lives >= 3, 'with no rover lost')
  assert.ok(g.score - before >= 5000, 'and pays the finish bonus')
  assert.ok(g.report, 'Z is an outpost, so it prints a report')
  assert.equal(g.report!.data.moon, 4)
}
{
  const g = bare()
  g.startSection(5)
  g.obstacles = []
  g.cues = []
  g.moonTicks = 100
  g.wx = g.sectionStart + g.sectionLen - 3
  run(g, 5)
  assert.equal(g.level, 6, 'clearing E rolls on to F')
  assert.ok(g.report && g.report.data.moon === 0, 'E is the Moon 1 outpost')
  assert.ok(g.moonTicks < 10, 'a new moon starts a fresh split')
}
{
  const g = bare()
  g.startSection(2)
  g.obstacles = []
  g.cues = []
  g.wx = g.sectionStart + g.sectionLen - 3
  run(g, 5)
  assert.equal(g.level, 3)
  assert.equal(g.report, null, 'a plain checkpoint prints no report')
}

// --- determinism and the pilot ------------------------------------------------------------------

function pilot(seed: number, limit: number) {
  const g = make(seed, true)
  let ticks = 0
  while (!g.over && ticks < limit) {
    g.update(idle())
    ticks++
  }
  return {
    score: g.score,
    level: g.level,
    over: g.over,
    won: g.won,
    ticks,
    lives: g.lives,
  }
}
const a = pilot(11, 1_200_000)
const b = pilot(11, 1_200_000)
assert.deepEqual(a, b, 'the attract pilot is deterministic')
assert.equal(a.score, 0, 'the attract demo scores nothing')
assert.ok(a.over, `a pilot run ends (reached ${a.level} in ${a.ticks} ticks)`)
for (const seed of [1, 2, 3])
  assert.ok(pilot(seed, 1_200_000).over, `pilot seed ${seed} ends`)

function idleRun(seed: number) {
  const g = make(seed)
  run(g, 100_000)
  return g
}
const lost = idleRun(5)
assert.ok(lost.over && !lost.won, 'an idle player runs out of rovers')
assert.ok(lost.level <= 2, 'an idle player does not get far')

console.log('Rover Ramble course engine and Moon 1: ok')
