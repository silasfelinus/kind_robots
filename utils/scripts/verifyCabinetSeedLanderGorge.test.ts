// Seed Lander depth pass, slice 3 part 1 (conductor kr-arcade/t-071, depth-pass CABINETS.md
// section 9): Waterfall Gorge. Waterfalls that push the pod down, drip stalactites with a tell and
// a beat, pebble rollers, the Water mission (carry a bubble to a dry bed; a hard landing pops it),
// The Geyser Tortoise (land on the shell when the geyser calms), and a pilot probe over the island.
//
//   npx tsx utils/scripts/verifyCabinetSeedLanderGorge.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import { create } from '../arcade/games/seedLander'
import { GeyserTortoise, TORTOISE, makeBoss } from '../arcade/seedLander/bosses'
import type { Boss } from '../arcade/seedLander/bosses'
import { POD_FEET } from '../arcade/seedLander/flight'
import type { Pod } from '../arcade/seedLander/flight'
import {
  DRIP,
  PEBBLE,
  dripAt,
  fallPush,
  inFall,
  pebbleAt,
} from '../arcade/seedLander/hazards'
import { ALL_ACORNS, ISLANDS } from '../arcade/seedLander/islands'
import type { MissionSpec } from '../arcade/seedLander/missions'
import { THEMES } from '../arcade/seedLander/art'
import type { newCargo } from '../arcade/seedLander/tether'
import { Terrain } from '../arcade/seedLander/terrain'

type Inner = {
  lives: number
  mode: 'free' | 'campaign'
  screen: 'map' | 'shed' | 'soon' | null
  mission: MissionSpec
  terrain: Terrain
  pod: Pod
  cargo: ReturnType<typeof newCargo>[]
  boss: Boss | null
  phase: 'fly' | 'bonk' | 'dry' | 'clear'
  card: number
  delivered: number
  island: number
  missionIndex: number
  tick: number
  update(input: InputFrame): void
  demoInput(): InputFrame
  pushAt(x: number, y: number): { x: number; y: number }
}

const quiet = { play: () => {} }
function game(seed = 1): Inner {
  return create({
    rng: mulberry32(seed),
    sound: quiet,
    demo: false,
    hiScore: 0,
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
const GORGE = 2
/** A campaign game flying Waterfall Gorge mission `m`, past its card. */
function gorge(m: number, seed = 1): Inner {
  const g = game(seed)
  g.update(press('a'))
  g.island = GORGE
  g.missionIndex = m
  g.update(press('a'))
  assert.equal(g.screen, null)
  g.card = 0
  return g
}

// --- the hazards ---------------------------------------------------------------------------------
{
  const falls = [{ x0: 100, x1: 120, y0: 20, y1: 200, push: 0.012 }]
  assert.equal(fallPush(falls, 110, 100), 0.012)
  assert.equal(fallPush(falls, 130, 100), 0, 'beside the fall: nothing')
  assert.equal(fallPush(falls, 110, 210), 0, 'below its foot: nothing')
  assert.ok(inFall(falls, 100, 20) && !inFall(falls, 99, 100))

  // A stalactite drips on a fixed beat: swell (the tell), one beat's hang, then it falls.
  const d = { x: 50, y: 30, every: 200, offset: 0 }
  const floor = 200
  const seen = new Set<string>()
  let last = -1
  for (let t = 0; t < d.every; t++) {
    const v = dripAt(d, t, floor)
    seen.add(v.state)
    if (v.state === 'swell')
      assert.ok(v.swell >= last, 'it swells monotonically')
    if (v.state === 'swell') last = v.swell
    assert.ok(v.y <= floor)
  }
  assert.deepEqual(
    [...seen],
    ['swell', 'hang', 'fall', 'wait'],
    'swell, hang, fall, wait',
  )
  assert.equal(dripAt(d, DRIP.swell + 3, floor).state, 'hang')
  assert.equal(
    dripAt(d, 0, floor).y,
    dripAt(d, 10, floor).y,
    'it does not move while it swells',
  )
  const again = dripAt({ ...d, offset: 60 }, 0, floor)
  assert.equal(
    again.state,
    dripAt(d, 60, floor).state,
    'offset shifts the beat',
  )

  // A pebble wobbles at the top of its slope (the tell), then rolls the length of it and is gone.
  const p = { x0: 100, x1: 300, every: 400, offset: 0 }
  const ground = () => 200
  const wobble = pebbleAt(p, 10, ground)!
  assert.ok(!wobble.rolling && wobble.x === 100, 'it wobbles first')
  const mid = pebbleAt(p, PEBBLE.wobble + 60, ground)!
  assert.ok(mid.rolling && mid.x > 100 && mid.x < 300)
  assert.equal(mid.x, 100 + 60 * PEBBLE.speed)
  assert.equal(pebbleAt(p, 399, ground), null, 'and the slope is quiet again')
}

// --- the Geyser Tortoise -------------------------------------------------------------------------
{
  const t = new Terrain({
    w: 800,
    h: 260,
    ground: [
      [0, 220],
      [800, 220],
    ],
    pads: [],
  })
  const b = makeBoss('tortoise', t, 400) as GeyserTortoise
  assert.ok(b instanceof GeyserTortoise)
  assert.equal(b.phases, 3)
  assert.equal(b.wind, null)
  const shell = b.pads[0]!
  assert.equal(shell.id, 'shell')
  assert.ok(shell.live)
  let sawCalm = false
  let sawSurge = false
  let lowest = 0
  let highest = Infinity
  for (let i = 0; i < TORTOISE.cycle[0]!; i++) {
    b.update()
    const calm = b.calm()
    sawCalm ||= calm
    sawSurge ||= !calm
    assert.equal(!!shell.blocked, !calm, 'only the calm is landable')
    lowest = Math.max(lowest, shell.y)
    highest = Math.min(highest, shell.y)
  }
  assert.ok(sawCalm && sawSurge)
  assert.ok(lowest > TORTOISE.lowY - 1 && highest < TORTOISE.highY + 1)
  // At the calm the shell is level, so a landing is not judged against a moving pad.
  const calmAt = Math.round(TORTOISE.cycle[0]! * 0.5)
  const y0 = b.shellY(calmAt)
  assert.ok(Math.abs(b.shellY(calmAt + 20) - y0) < 1.5)

  // Two plantings a phase: three phases clear it. Planting re-arms the shell each time.
  assert.equal(b.planted(), false)
  assert.equal(shell.planted, false, 'the shell takes a second planting')
  assert.equal(b.planted(), true)
  assert.equal(b.phase, 1)
  // Phase 2 swims between banks underwater: x only moves while the shell is down.
  const c1 = TORTOISE.cycle[1]!
  const [, endCalm] = TORTOISE.calm[1]!
  assert.equal(b.shellX(0), 400, 'it starts where it was')
  assert.equal(b.shellX(Math.floor(c1 * 0.4)), b.shellX(Math.floor(c1 * 0.5)))
  assert.ok(
    b.shellX(Math.floor(c1 * (endCalm + 0.05))) !==
      b.shellX(Math.floor(c1 * 0.5)) || b.shellX(c1 - 1) !== b.shellX(c1 * 0.5),
    'the shell swims after the surge',
  )
  assert.equal(b.shellX(c1 + 10), 400 - TORTOISE.swim, 'to the left bank')
  assert.equal(b.shellX(2 * c1 + 10), 400 + TORTOISE.swim, 'then the right')
  assert.equal(b.calmX(), 400, 'a pilot waits where it first surfaces')
  b.planted()
  b.planted()
  assert.equal(b.phase, 2)
  const c2 = TORTOISE.cycle[2]!
  assert.deepEqual(
    [0, 1, 2, 3].map((k) => b.shellX(k * c2 + 5) - 400),
    [...TORTOISE.spots, TORTOISE.spots[0]!],
    'phase 3 surfaces in three places in turn',
  )
  assert.ok(TORTOISE.cycle[2]! < TORTOISE.cycle[0]!, 'each phase is quicker')
  b.planted()
  assert.equal(b.done, false)
  b.planted()
  assert.ok(b.done)
  assert.equal(shell.blocked, false)
  // The pool and the shell's flanks bonk; the top does not.
  const cx = (shell.x0 + shell.x1) / 2
  assert.ok(b.hits(cx, shell.y + 10), 'beside the shell')
  assert.equal(b.hits(cx, shell.y - POD_FEET), null, 'standing on it is fine')
  assert.equal(b.hits(cx + 80, shell.y + 10), null, 'well clear of it')
}

// --- the island's data ---------------------------------------------------------------------------
{
  const isle = ISLANDS[GORGE]!
  assert.equal(isle.id, 'gorge')
  assert.ok(THEMES[isle.theme], 'it has a sky')
  assert.deepEqual(
    isle.missions.map((m) => m.kind),
    ['plant', 'plant', 'water', 'plant', 'rings', 'boss'],
  )
  assert.ok(isle.missions.some((m) => m.name === 'THIRSTY TERRACES'))
  assert.equal(isle.missions.at(-1)!.boss?.id, 'tortoise')
  const hazards = new Set(isle.missions.flatMap((m) => m.unlocked ?? []))
  for (const h of ['waterfall', 'stalactite', 'pebble'])
    assert.ok(hazards.has(h as never), `${h} is introduced on its mission card`)
  assert.ok(isle.missions.some((m) => (m.falls?.length ?? 0) > 0))
  assert.ok(isle.missions.some((m) => (m.drips?.length ?? 0) > 0))
  assert.ok(isle.missions.some((m) => (m.pebbles?.length ?? 0) > 0))
  for (const m of isle.missions) {
    const map = new Terrain(m.map)
    for (const d of m.drips ?? [])
      assert.ok(
        d.y < map.groundAt(d.x) - 60,
        `${m.id}: a drip has room to fall`,
      )
    for (const p of m.pebbles ?? []) {
      assert.ok(Math.abs(p.x1 - p.x0) > 60 && p.every > 120)
      // A pebble slope never runs across a sunflower or the home perch you rest on.
      for (const pad of map.pads)
        if (pad.kind === 'sun' || pad.kind === 'home')
          assert.ok(
            pad.x1 < Math.min(p.x0, p.x1) || pad.x0 > Math.max(p.x0, p.x1),
            `${m.id}: pebbles keep off ${pad.id}`,
          )
    }
    for (const f of m.falls ?? [])
      assert.ok(f.y1 <= map.groundAt((f.x0 + f.x1) / 2) + 2 && f.push > 0)
  }
  const water = isle.missions.find((m) => m.kind === 'water')!
  assert.equal(water.cargo!.length, 3, 'three bubbles for three terraces')
  const wmap = new Terrain(water.map)
  for (const c of water.cargo!) {
    assert.equal(c.kind, 'water')
    assert.equal(wmap.pad(c.to)?.kind, 'drop')
  }
  const gorgeAcorns = ALL_ACORNS.filter((a) => a.startsWith('gorge-'))
  assert.equal(gorgeAcorns.length, 3, 'three golden acorns')
}

// --- the game ------------------------------------------------------------------------------------
{
  // A waterfall pushes the pod down; beside it the air is still.
  const g = gorge(0)
  const f = g.mission.falls![0]!
  const inside = g.pushAt((f.x0 + f.x1) / 2, 100)
  const beside = g.pushAt(f.x1 + 40, 100)
  assert.ok(inside.y > beside.y, 'the white water pushes down')
  const vx = (g.pod.vx = 1)
  g.pod.x = (f.x0 + f.x1) / 2
  g.pod.y = 100
  g.pod.vy = 0
  g.update(idle())
  assert.ok(g.pod.vx < vx, 'and its spray slows the pod')

  // The water mission: a gentle set-down waters the bed; a hard one pops the bubble, which
  // wells up again at its spring.
  const w = gorge(2)
  assert.equal(w.mission.kind, 'water')
  const [first] = w.cargo
  const home = first!.x
  first!.vy = 2.4
  first!.y = w.terrain.groundAt(first!.x) - first!.r - 10
  first!.resting = false
  for (let i = 0; i < 40; i++) w.update(idle())
  assert.equal(w.cargo.length, 3)
  assert.equal(first!.x, home, 'a popped bubble returns to its spring')
  assert.equal(w.delivered, 0)
  for (const c of w.cargo) {
    const pad = w.terrain.pad(w.mission.cargo![w.cargo.indexOf(c)]!.to)!
    c.x = (pad.x0 + pad.x1) / 2
    c.y = pad.y - c.r - 2
    c.vy = 0.2
    c.vx = 0
    c.resting = false
  }
  for (let i = 0; i < 80 && w.delivered < 3; i++) w.update(idle())
  assert.equal(w.delivered, 3, 'three beds watered')
  assert.equal(w.phase, 'clear', 'and the mission is done')

  // A rolling pebble bonks a pod resting on the slope; a drip knocks a pod in the air.
  const r = gorge(3)
  const pb = r.mission.pebbles![0]!
  const slopeX = (pb.x0 + pb.x1) / 2
  let t = 0
  while (t < 2000) {
    const v = pebbleAt(pb, r.tick + 1, (x) => r.terrain.groundAt(x))
    if (v?.rolling && Math.abs(v.x - slopeX) < 2) break
    r.update(idle())
    t++
  }
  const lives = r.lives
  Object.assign(r.pod, {
    x: slopeX,
    y: r.terrain.groundAt(slopeX) - POD_FEET,
    vx: 0,
    vy: 0,
    tilt: 0,
    restOn: r.terrain.pads[0]!.id,
  })
  for (let i = 0; i < 6; i++) r.update(idle())
  assert.ok(
    r.lives < lives || r.phase === 'bonk',
    'a pebble bonks a resting pod',
  )

  const d = gorge(1)
  const drip = d.mission.drips![0]!
  let k = 0
  while (k < 2000) {
    const v = dripAt(drip, d.tick + 1, d.terrain.groundAt(drip.x))
    if (v.state === 'fall' && v.y > 100) break
    d.update(idle())
    k++
  }
  const v = dripAt(drip, d.tick + 1, d.terrain.groundAt(drip.x))
  Object.assign(d.pod, {
    x: drip.x,
    y: v.y,
    vx: 0,
    vy: 0,
    tilt: 0,
    restOn: null,
  })
  d.update(idle())
  assert.ok(
    Math.abs(d.pod.tilt) > 0.2 || d.pod.vx !== 0,
    'a drip knocks the lean',
  )
}

// --- the pilot probe -----------------------------------------------------------------------------
{
  // The pilot flies Waterfall Gorge's five missions before the boss and clears most of them.
  const cleared: string[] = []
  for (let m = 0; m < 5; m++) {
    const g = gorge(m, 3)
    for (let t = 0; t < 60 * 60 * 8 && !g.screen; t++) {
      g.lives = Math.max(g.lives, 2)
      g.update(g.demoInput())
    }
    if (g.screen) cleared.push(g.mission.id)
  }
  assert.ok(
    cleared.length >= 4,
    `the pilot clears Waterfall Gorge (${cleared.join(' ')})`,
  )
  // And the boss: the pilot gets onto the shell and plants a phase.
  const b = gorge(5, 3)
  for (let t = 0; t < 60 * 60 * 3 && !b.screen; t++) {
    b.lives = Math.max(b.lives, 2)
    b.update(b.demoInput())
    if (b.boss && b.boss.phase >= 1) break
  }
  assert.ok(
    b.screen || (b.boss && b.boss.phase >= 1),
    'the pilot plants on the shell',
  )
}

console.log('seed lander slice 3 (gorge) ok')
