// Sink Suds depth pass, slice 4 (conductor kr-arcade/t-046): the mode menu, Bubble Buddies
// (merge-and-split co-op for two to four), Suds Sumo (versus), the Squeaky Clean time attack,
// Endless Sink, Classic Sink, and the medals with a board per room.
//
//   npx tsx utils/scripts/verifyCabinetSinkSudsModes.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { findArcadeGame } from '../arcade/games'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import {
  ENDLESS_PLAYLIST,
  MAX_STAGE,
  ROOMS,
  STAGE_RADIUS,
  classicPlan,
  create,
  endlessSinkPlan,
  readSudsSave,
} from '../arcade/games/sinkSuds'
import type { Bubble, Pest, SudsSave } from '../arcade/games/sinkSuds'
import type { BASINS } from '../arcade/sinkSuds/basins'
import type { Grime } from '../arcade/sinkSuds/grime'
import {
  MEDAL,
  MODES,
  SUMO,
  medalKey,
  medalsFor,
  modesFor,
} from '../arcade/sinkSuds/modes'
import type { BasinPlan } from '../arcade/sinkSuds/rooms'

type Inner = {
  score: number
  level: number
  lives: number
  over: boolean
  save: SudsSave | null | undefined
  mode: string
  menu: { mode: number; pick: number; board: boolean } | null
  result: { title: string; t: number } | null
  sumo: { round: number; wins: number[]; t: number; pause: number } | null
  plan: BasinPlan
  basin: (typeof BASINS)[keyof typeof BASINS]
  bubbles: Bubble[]
  pests: Pest[]
  mess: Array<{ x: number; y: number }>
  grime: Grime
  medals: Record<string, number>
  times: Record<string, number>
  reached: number
  stepIndex: number
  inEndless: boolean
  update(input: InputFrame, players?: InputFrame[]): void
  radiusOf(b: Bubble): number
}

const quiet = { play: () => {} }
function game(players = 1, seed = 1, resume?: unknown): Inner {
  return create({
    rng: mulberry32(seed),
    sound: quiet,
    demo: false,
    hiScore: 0,
    players,
    resume,
  }) as unknown as Inner
}
const press = (...buttons: Array<keyof InputFrame['held']>) => {
  const f = emptyInput()
  for (const b of buttons) {
    f.held[b] = true
    f.pressed[b] = true
  }
  return f
}
const idle = () => emptyInput()
/** Pick a mode on the menu by id and start it. */
function choose(g: Inner, id: string, seats: number) {
  const index = modesFor(seats).findIndex((m) => m.id === id)
  assert.ok(index >= 0, `${id} is on the menu for ${seats}`)
  for (let i = 0; i < index; i++) g.update(press('down'))
  g.update(press('a'))
  assert.equal(g.menu, null)
  assert.equal(g.mode, id)
}
function cleanAll(g: Inner) {
  for (let y = 0; y < 360; y += 4)
    for (let x = 0; x < 420; x += 4) g.grime.scrub(x, y, 6)
}

// --- the registry and the menu ---------------------------------------------------------------
{
  const meta = findArcadeGame('sink-suds')!
  assert.equal(meta.maxPlayers, 4, 'two to four bubbles')
  assert.equal(meta.maxPlausibleScore, 10_000_000)
  assert.ok(meta.howTo.some((l) => l.includes('MERGE OR SUMO')))
  assert.ok(
    meta.blurb.includes('Bubble Buddies') && meta.blurb.includes('Suds Sumo'),
  )
  assert.deepEqual(
    modesFor(1).map((m) => m.id),
    ['campaign', 'squeaky', 'endless', 'classic'],
    'solo: the campaign, the time attack, Endless Sink and Classic Sink',
  )
  assert.deepEqual(
    modesFor(3).map((m) => m.id),
    ['campaign', 'endless', 'classic', 'sumo'],
    'seated together: Bubble Buddies and Suds Sumo',
  )
  assert.equal(MODES.length, 5)
  const g = game()
  assert.ok(g.menu, 'a new game opens on the mode menu')
  assert.equal(g.level, 1)
  g.update(press('b'))
  assert.equal(g.menu!.board, true, 'B shows the medal board')
  g.update(press('b'))
  g.update(press('down'))
  g.update(press('up'))
  assert.equal(g.menu!.mode, 0)
  g.update(press('a'))
  assert.equal(g.mode, 'campaign')
  assert.equal(g.stepIndex, 0)
  const demo = create({
    rng: mulberry32(1),
    sound: quiet,
    demo: true,
    hiScore: 0,
  }) as unknown as Inner
  assert.equal(demo.menu, null, 'the attract demo plays straight away')
}

// --- Endless Sink and Classic Sink ---------------------------------------------------------
{
  assert.deepEqual(Object.keys(endlessSinkPlan(1).pests), ['mite'])
  const late = endlessSinkPlan(16)
  for (const kind of [
    'mite',
    'brush',
    'sponge',
    'gremlin',
    'slug',
    'loofah',
    'lint',
    'sock',
    'algae',
    'snail',
    'puffer',
    'strider',
    'leafboat',
    'wax',
    'spinner',
  ])
    assert.ok(
      late.pests[kind as Pest['kind']],
      `every pest by sink 16: ${kind}`,
    )
  assert.equal(new Set(ENDLESS_PLAYLIST).size, 8, 'every shape in turn')
  assert.ok(endlessSinkPlan(24).pests.mite! > endlessSinkPlan(1).pests.mite!)
  const e = game()
  choose(e, 'endless', 1)
  assert.ok(e.inEndless)
  assert.equal(e.level, 1)
  assert.equal(e.basin.id, 'oval')
  e.pests = []
  e.bubbles[0]!.stage = MAX_STAGE
  for (let t = 0; t < 200 && e.level === 1; t++) {
    e.bubbles[0]!.x = e.basin.drain.x
    e.bubbles[0]!.y = e.basin.drain.y + 6
    e.update(idle())
  }
  assert.equal(e.level, 2)
  assert.equal(e.basin.id, 'double')
  for (let level = 1; level <= 12; level++) {
    const plan = classicPlan(level)
    assert.equal(plan.basin, 'oval', 'Classic Sink: the one kitchen sink')
    assert.deepEqual(Object.keys(plan.pests).sort(), ['brush', 'mite'])
  }
  const c = game()
  choose(c, 'classic', 1)
  assert.equal(c.basin.id, 'oval')
}

// --- Squeaky Clean ---------------------------------------------------------------------------
{
  const g = game(1, 1, {
    v: 1,
    step: 0,
    score: 0,
    lives: 3,
    bars: 0,
    reached: 2,
  })
  assert.equal(g.reached, 2)
  const index = modesFor(1).findIndex((m) => m.id === 'squeaky')
  for (let i = 0; i < index; i++) g.update(press('down'))
  for (let i = 0; i < 5; i++) g.update(press('right'))
  g.update(press('a'))
  assert.equal(g.mode, 'squeaky')
  assert.equal(
    g.plan.title,
    ROOMS[1]!.basins[1].title,
    'the fifth pick: Bath Time, basin 2',
  )
  assert.equal(g.plan.special, undefined)
  g.pests = []
  for (let t = 0; t < 120; t++) g.update(idle())
  cleanAll(g)
  g.update(idle())
  assert.ok(g.result, 'scrubbed 95% clean: the clock stops')
  const key = medalKey('bath', 1)
  assert.ok(g.times[key]! > 100 && g.times[key]! < 200, 'the time is kept')
  assert.equal(g.save?.times?.[key], g.times[key])
  assert.ok(g.score >= 1_000)
  for (let t = 0; t < 100; t++) g.update(idle())
  g.update(press('a'))
  assert.ok(g.over, 'then the game ends')
  // Only the rooms reached can be picked.
  const fresh = game()
  choose(fresh, 'squeaky', 1)
  assert.equal(fresh.room?.id ?? 'kitchen', 'kitchen')
}

// --- Bubble Buddies --------------------------------------------------------------------------
{
  const g = game(2)
  assert.equal(g.lives, 6, 'a shared pool of bubbles')
  choose(g, 'campaign', 2)
  g.pests = []
  const [a, b] = g.bubbles as [Bubble, Bubble]
  assert.notEqual(a.x, b.x, 'side by side at the start')
  for (let t = 0; t < 70; t++) g.update(idle(), [idle(), idle()])
  a.stage = 3
  b.stage = 2
  a.x = 200
  a.y = 220
  b.x = 214
  b.y = 220
  g.update(idle(), [idle(), idle()])
  assert.deepEqual(a.members, [1], 'touching bubbles merge into the bigger one')
  assert.equal(b.host, 0)
  assert.equal(a.stage, 4, 'a size bigger than either')
  assert.ok(g.radiusOf(a) > STAGE_RADIUS[4], 'and bigger than any one bubble')
  // Both steer: the same way moves it, opposite ways cancel out.
  const x0 = a.x
  for (let t = 0; t < 20; t++)
    g.update(press('right'), [press('right'), press('right')])
  assert.ok(a.x > x0 + 10, 'both right: off it goes')
  a.vx = 0
  a.vy = 0
  const x1 = a.x
  for (let t = 0; t < 20; t++) {
    const l = emptyInput()
    l.held.left = true
    const r = emptyInput()
    r.held.right = true
    g.update(r, [r, l])
  }
  assert.ok(Math.abs(a.x - x1) < 3, 'opposite ways: it holds still')
  assert.equal(b.x, a.x, 'the guest rides inside')
  // B (from either player) splits it again.
  const whole = a.stage
  g.update(idle(), [idle(), press('b')])
  assert.deepEqual(a.members, [])
  assert.equal(b.host, null)
  assert.ok(
    b.alive && b.stage === whole - 1 && a.stage === whole - 1,
    `each a size smaller than the whole (${whole}: ${a.stage} ${b.stage} ${b.alive})`,
  )
  for (let t = 0; t < 5; t++) g.update(idle(), [idle(), idle()])
  assert.deepEqual(a.members, [], 'no instant re-merge')
  // A merged bubble that pops costs one bubble from the pool, and everyone respawns.
  a.mergeCool = 0
  b.mergeCool = 0
  b.x = a.x + 10
  b.y = a.y
  g.update(idle(), [idle(), idle()])
  assert.equal(a.members.length, 1)
  const lives = g.lives
  a.stage = 1
  a.invuln = 0
  g.pests = [
    {
      kind: 'mite',
      x: a.x + 4,
      y: a.y,
      vx: 0,
      vy: 0,
      heading: 0,
      turn: 999,
      t: 0,
      state: 'roam',
      trap: 0,
      target: null,
      size: 0,
      segs: [],
    },
  ]
  g.update(idle(), [idle(), idle()])
  assert.equal(a.alive || b.alive, false, 'both popped')
  assert.equal(g.lives, lives - 1, 'for one bubble off the pool')
  for (let t = 0; t < 200; t++) g.update(idle(), [idle(), idle()])
  assert.ok(a.alive && b.alive, 'both back')
  // Four seated: four bubbles, twelve in the pool.
  const four = game(4)
  assert.equal(four.bubbles.length, 4)
  assert.equal(four.lives, 12)
}

// --- Suds Sumo -------------------------------------------------------------------------------
{
  const g = game(2, 3)
  choose(g, 'sumo', 2)
  assert.ok(g.sumo)
  assert.equal(g.basin.id, 'oval')
  const [a, b] = g.bubbles as [Bubble, Bubble]
  g.pests = []
  for (let t = 0; t < 100; t++) g.update(idle(), [idle(), idle()])
  // A big bubble shoves a small one.
  a.stage = 5
  b.stage = 1
  a.x = 140
  a.y = 260
  b.x = 140 + 22
  b.y = 260
  a.vx = 2.5
  a.vy = 0
  b.vx = 0
  b.vy = 0
  g.update(idle(), [idle(), idle()])
  assert.ok(b.vx > a.vx, 'the small one flies off')
  // Shoved down the drain: out.
  b.x = g.basin.drain.x + 6
  b.y = g.basin.drain.y
  g.update(idle(), [idle(), idle()])
  assert.equal(b.out, true, 'the drain swallows it')
  for (let t = 0; t < 10; t++) g.update(idle(), [idle(), idle()])
  assert.equal(
    g.sumo!.wins[0],
    1,
    'the last bubble in the basin wins the round',
  )
  for (let t = 0; t < 160 && g.sumo!.round === 1; t++)
    g.update(idle(), [idle(), idle()])
  assert.equal(g.sumo!.round, 2)
  assert.ok(!a.out && !b.out, 'everyone back for round 2')
  // A soap shot knocks a rival a size down.
  g.pests = []
  for (let t = 0; t < 100; t++) g.update(idle(), [idle(), idle()])
  a.stage = 4
  b.stage = 3
  a.x = 100
  a.y = 260
  b.x = 160
  b.y = 260
  a.faceX = 1
  a.faceY = 0
  b.invuln = 0
  g.update(idle(), [press('b'), idle()])
  for (let t = 0; t < 20 && b.stage === 3; t++) {
    b.x = 160
    b.y = 260
    g.update(idle(), [idle(), idle()])
  }
  assert.equal(b.stage, 2, 'the shot knocks it a size down')
  // Second round to player 1: match over.
  b.x = g.basin.drain.x
  b.y = g.basin.drain.y
  for (let t = 0; t < 200 && !g.result; t++) g.update(idle(), [idle(), idle()])
  assert.ok(
    g.result && g.result.title === 'P1 WINS!',
    'two rounds wins the match',
  )
  for (let t = 0; t < 60 * 13 && !g.over; t++)
    g.update(idle(), [idle(), idle()])
  assert.ok(g.over)
  assert.equal(SUMO.wins, 2)
  // The clock: the biggest bubble takes a round that runs out.
  const c = game(3, 4)
  choose(c, 'sumo', 3)
  c.pests = []
  c.bubbles[2]!.stage = 5
  c.sumo!.t = SUMO.roundTicks
  c.update(idle(), [idle(), idle(), idle()])
  assert.equal(c.sumo!.wins[2], 1, 'time: the biggest bubble wins')
}

// --- medals ----------------------------------------------------------------------------------
{
  assert.equal(
    medalsFor(96, 0, 60 * 30, 70),
    MEDAL.squeaky | MEDAL.noPop | MEDAL.quick,
  )
  assert.equal(medalsFor(50, 1, 60 * 90, 70), 0)
  assert.equal(medalsFor(95, 2, 60 * 71, 70), MEDAL.squeaky)
  const g = game()
  choose(g, 'campaign', 1)
  g.pests = []
  cleanAll(g)
  const b = g.bubbles[0]!
  b.stage = MAX_STAGE
  for (let t = 0; t < 200 && g.stepIndex === 0; t++) {
    b.x = g.basin.drain.x
    b.y = g.basin.drain.y + 6
    g.update(idle())
  }
  const key = medalKey('kitchen', 0)
  assert.equal(
    g.medals[key],
    MEDAL.squeaky | MEDAL.noPop | MEDAL.quick,
    'all three on a quick, clean, pop-free basin',
  )
  assert.equal(g.save?.medals?.[key], g.medals[key], 'saved straight away')
  // A pop loses No Pop on the next basin.
  g.pests = []
  b.stage = 1
  b.invuln = 0
  g.pests = [
    {
      kind: 'mite',
      x: b.x + 4,
      y: b.y,
      vx: 0,
      vy: 0,
      heading: 0,
      turn: 999,
      t: 0,
      state: 'roam',
      trap: 0,
      target: null,
      size: 0,
      segs: [],
    },
  ]
  g.update(idle())
  for (let t = 0; t < 200 && !b.alive; t++) g.update(idle())
  g.pests = []
  b.stage = MAX_STAGE
  for (let t = 0; t < 200 && g.stepIndex === 1; t++) {
    b.x = g.basin.drain.x
    b.y = g.basin.drain.y + 6
    g.update(idle())
  }
  const second = g.medals[medalKey('kitchen', 1)] ?? 0
  assert.equal(second & MEDAL.noPop, 0, 'no No Pop after a pop')
  // Medals and times come back with the save; bad keys are dropped.
  const save = readSudsSave({
    v: 1,
    step: 0,
    score: 0,
    lives: 3,
    bars: 0,
    medals: { 'kitchen:1': 7, 'palace:1': 7, 'kitchen:9': 1, 'bath:2': 99 },
    times: { 'bath:2': 600 },
    reached: 3,
  })!
  assert.deepEqual(save.medals, { 'kitchen:1': 7 })
  assert.deepEqual(save.times, { 'bath:2': 600 })
  assert.equal(save.reached, 3)
  const back = game(1, 1, save)
  assert.equal(back.medals['kitchen:1'], 7)
  assert.ok(JSON.stringify(g.save).length < 2000)
}

// --- the cabinet's own co-op run, two to four seats ---------------------------------------
{
  const scripted = (tick: number) => {
    const f = emptyInput()
    f.held.right = tick % 240 < 60
    f.held.up = tick % 300 < 20
    f.held.a = true
    f.pressed.a = tick % 9 === 0
    f.pressed.b = tick % 170 === 0
    return f
  }
  for (const players of [2, 3, 4]) {
    for (const mode of ['campaign', 'sumo']) {
      const g = game(players, players)
      choose(g, mode, players)
      for (let t = 0; t < 60 * 60 * 3 && !g.over; t++) {
        const all = Array.from({ length: players }, (_, i) =>
          scripted(t + i * 37),
        )
        g.update(all[0]!, all)
      }
      assert.ok(g.score >= 0 && g.score < 10_000_000)
      assert.ok(g.lives >= 0, 'the pool never goes negative')
    }
  }
}

console.log('verifyCabinetSinkSudsModes: ok')
