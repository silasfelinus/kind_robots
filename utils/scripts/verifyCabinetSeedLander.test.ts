// Seed Lander depth pass, slice 1 (conductor kr-arcade/t-069, depth-pass CABINETS.md section 9):
// the flight core. Wide scrolling maps and the zoom-to-land camera, the Hop, landing ranks and the
// Feather streak, x1-x5 beds, the tether winch, sun per mission with sunflower refuel, the three
// flight tiers, the data-driven mission format and Free Flight rebuilt on it with a hazard unlock
// every 4 hills. Each rule is pinned on a staged island; a pilot probe lands every bed type and
// shows runs still end.
//
//   npx tsx utils/scripts/verifyCabinetSeedLander.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import {
  BONK_POINTS,
  DELIVERY_POINTS,
  EXTRA_POD_HILLS,
  PLANT_SUN,
  START_PODS,
  create,
} from '../arcade/games/seedLander'
import { Camera, ZOOM_MAX } from '../arcade/seedLander/camera'
import {
  FEATHER,
  HOP,
  POD_FEET,
  SAFE,
  SETTLE_TICKS,
  TIERS,
  canHop,
  newPod,
  nextStreak,
  predictArc,
  rankLanding,
  steerPod,
  streakMultiplier,
} from '../arcade/seedLander/flight'
import type { Pod } from '../arcade/seedLander/flight'
import {
  BUILT_HAZARDS,
  HAZARD_LADDER,
  MIN_PAD,
  W,
  freeHazards,
  freeHill,
  freeTheme,
  newHazards,
  padWidth,
} from '../arcade/seedLander/missions'
import type { MissionSpec } from '../arcade/seedLander/missions'
import {
  WINCH,
  canHook,
  groundCargo,
  newCargo,
  swingCargo,
} from '../arcade/seedLander/tether'
import { STEP, Terrain, knotAt } from '../arcade/seedLander/terrain'
import type { Pad } from '../arcade/seedLander/terrain'

type Inner = {
  score: number
  level: number
  lives: number
  over: boolean
  tick: number
  menu: { pick: number } | null
  tier: 'breezy' | 'standard' | 'gale'
  mission: MissionSpec
  terrain: Terrain
  pods: Pod[]
  pod: Pod
  cargo: ReturnType<typeof newCargo>[]
  phase: 'fly' | 'bonk' | 'dry' | 'clear'
  card: number
  planted: number
  streak: number
  sunMax: number
  wind: number
  windTarget: number
  camera: Camera
  vents: Array<{ x: number; w: number; h: number; lift: number }>
  update(input: InputFrame): void
  demoInput(): InputFrame
  startHill(hill: number): void
  startMission(spec: MissionSpec): void
  land(pod: Pod, pad: Pad, rank: string): void
  crash(pod: Pod, why: string): void
  render(g: CanvasRenderingContext2D): void
}

const quiet = { play: () => {} }
function game(seed = 1, demo = false): Inner {
  return create({
    rng: mulberry32(seed),
    sound: quiet,
    demo,
    hiScore: 0,
  }) as unknown as Inner
}
const frame = (...buttons: Array<keyof InputFrame['held']>) => {
  const f = emptyInput()
  for (const b of buttons) {
    f.held[b] = true
    f.pressed[b] = true
  }
  return f
}
const hold = (...buttons: Array<keyof InputFrame['held']>) => {
  const f = emptyInput()
  for (const b of buttons) f.held[b] = true
  return f
}

/** A flat test island: ground at 200, beds x1 and x5, a sunflower, a shed and a crate. */
function flatMission(over: Partial<MissionSpec> = {}): MissionSpec {
  return {
    id: 'test',
    name: 'TEST FIELD',
    brief: 'PLANT 2 BEDS',
    kind: 'plant',
    map: {
      w: 960,
      h: 260,
      ground: [
        [0, 200],
        [960, 200],
      ],
      pads: [
        { id: 'bed1', x: 200, w: 40, mult: 1 },
        { id: 'bed5', x: 400, w: 16, mult: 5 },
        { id: 'sun', x: 600, w: 30, kind: 'sun' },
        { id: 'shed', x: 800, w: 36, kind: 'drop' },
        { id: 'ledge', x: 900, w: 24, mult: 3, y: 150 },
      ],
    },
    start: { x: 100, y: 60 },
    sun: 1000,
    wind: 0,
    seeds: 2,
    cargo: [{ kind: 'crate', x: 700, seedlings: 3, to: 'shed' }],
    vents: [],
    par: { sun: 500, ticks: 60 * 40 },
    theme: 'dawn',
    ...over,
  }
}
/** A game on the test island, past the menu and the mission card. */
function staged(seed = 1, spec = flatMission()): Inner {
  const g = game(seed)
  g.menu = null
  g.startMission(spec)
  g.card = 0
  return g
}
/** Put the pod just above a pad, moving at (vx, vy) and leaning `tilt`, and let it touch down. */
function dropOnto(
  g: Inner,
  id: string,
  vx: number,
  vy: number,
  tilt = 0,
  dx = 0,
) {
  const pad = g.terrain.pad(id)!
  const pod = g.pod
  pod.x = (pad.x0 + pad.x1) / 2 + dx
  pod.y = pad.y - POD_FEET - 0.05
  pod.vx = vx
  pod.vy = vy
  pod.tilt = tilt
  g.update(emptyInput())
}

// --- flight rules -----------------------------------------------------------------------------------
{
  assert.equal(rankLanding(0, 0.1, 0), 'feather')
  assert.equal(rankLanding(0, FEATHER.vy + 0.05, 0), 'soft')
  assert.equal(rankLanding(FEATHER.vx + 0.05, 0.1, 0), 'soft')
  assert.equal(rankLanding(0, SAFE.vy + 0.1, 0), 'bumpy')
  assert.equal(rankLanding(0, SAFE.vy * 1.8, 0), 'bonk')
  assert.equal(rankLanding(0, SAFE.vy * 1.8, 0, 2), 'bumpy', 'springier legs')
  assert.equal(rankLanding(0, 0.1, SAFE.tilt + 0.01), 'bonk', 'too tilted')
  assert.equal(rankLanding(0, 0.1, 0.15), 'soft', 'a slight lean is no Feather')
  // The Feather streak: builds on Feathers, holds on Soft, breaks on worse.
  assert.equal(nextStreak(2, 'feather'), 3)
  assert.equal(nextStreak(3, 'soft'), 3)
  assert.equal(nextStreak(3, 'bumpy'), 0)
  assert.equal(streakMultiplier(0), 1)
  assert.equal(streakMultiplier(5), 1.5)
  assert.equal(streakMultiplier(40), 2, 'capped at x2')

  // Puffing upright climbs against gravity; leaning pushes sideways.
  const pod = newPod(0, 100, 100, 500)
  const still = { x: 0, y: 0 }
  for (let i = 0; i < 30; i++)
    steerPod(
      pod,
      { left: false, right: false, puff: true, hop: false },
      TIERS.standard,
      1,
      still,
    )
  assert.ok(pod.vy < 0, 'a puff climbs')
  assert.equal(pod.sun, 470, 'a tick of puffing costs a tick of sun')
  const lean = newPod(0, 100, 100, 500)
  for (let i = 0; i < 20; i++)
    steerPod(
      lean,
      { left: false, right: true, puff: true, hop: false },
      TIERS.standard,
      1,
      still,
    )
  assert.ok(lean.tilt > 0 && lean.vx > 0, 'leaning right pushes right')

  // Hop: upright, a strong puff, a big sun cost, a cooldown.
  const hop = newPod(0, 100, 100, 500)
  hop.tilt = 0.8
  hop.vy = 1
  assert.ok(
    steerPod(
      hop,
      { left: false, right: false, puff: false, hop: true },
      TIERS.standard,
      1,
      still,
    ),
  )
  assert.equal(hop.tilt, 0, 'the hop snaps the pod upright')
  assert.ok(hop.vy < -HOP.lift + 0.1, 'and throws it upward')
  assert.equal(hop.sun, 500 - HOP.cost)
  assert.ok(!canHop(hop, TIERS.standard), 'cooling down')
  hop.hopCool = 0
  assert.ok(
    canHop(hop, TIERS.standard),
    'Standard hops as often as the sun allows',
  )
  assert.ok(!canHop(hop, TIERS.gale), 'Gale: one hop a mission')
  hop.sun = HOP.cost - 1
  assert.ok(!canHop(hop, TIERS.standard), 'no hop without the sun for it')

  // Tiers: Gale is heavier, Breezy has the arc and more sun.
  assert.ok(TIERS.gale.gravity > TIERS.standard.gravity)
  assert.ok(TIERS.breezy.sun > TIERS.standard.sun && TIERS.breezy.arc)
  assert.ok(!TIERS.standard.arc && TIERS.standard.hops === Infinity)
  const heavy = newPod(0, 0, 0, 0)
  const light = newPod(0, 0, 0, 0)
  const none = { left: false, right: false, puff: false, hop: false }
  for (let i = 0; i < 40; i++) {
    steerPod(heavy, none, TIERS.gale, TIERS.gale.gravity, still)
    steerPod(light, none, TIERS.standard, 1, still)
  }
  assert.ok(heavy.vy > light.vy, 'Gale falls faster')

  // The Breezy arc ends on the floor.
  const arc = predictArc(newPod(0, 50, 50, 0), 1, 0, () => 150)
  assert.ok(arc.length > 2)
  assert.equal(arc.at(-1)!.y + POD_FEET, 150, 'the arc ends on the ground')
}

// --- terrain -----------------------------------------------------------------------------------------
{
  assert.equal(
    knotAt(
      [
        [0, 10],
        [10, 20],
      ],
      5,
    ),
    15,
  )
  assert.equal(
    knotAt(
      [
        [0, 10],
        [10, 20],
      ],
      50,
    ),
    20,
    'held past the end',
  )
  const t = new Terrain({
    w: 400,
    h: 260,
    ground: [
      [0, 200],
      [200, 160],
      [400, 200],
    ],
    roof: [
      [0, 40],
      [400, 40],
    ],
    pads: [
      { id: 'slope', x: 100, w: 30, mult: 2 },
      { id: 'perch', x: 300, w: 20, mult: 4, y: 120 },
      { id: 'shelf', x: 200, w: 20, mult: 3, y: 100, float: true },
    ],
  })
  const slope = t.pad('slope')!
  assert.equal(slope.x0 % STEP, 0, 'pads sit on the sample grid')
  for (let x = slope.x0; x <= slope.x1; x += 2)
    assert.ok(
      Math.abs(t.groundAt(x) - slope.y) < 0.001,
      'the ground is flattened under a bed',
    )
  const perch = t.pad('perch')!
  assert.equal(perch.y, 120)
  assert.equal(t.ledges.length, 2, 'a pad above the ground stands on a ledge')
  assert.equal(t.floorAt(300, 100), 120, 'the ledge top is the floor above it')
  assert.ok(t.insideLedge(300, 140), 'a pillar is solid down to the ground')
  assert.equal(
    t.floorAt(200, 140),
    160,
    'under a shelf the floor is the ground',
  )
  assert.equal(t.ceilingAt(200, 140), 106, 'and its underside is the roof')
  assert.equal(t.roofAt(50), 40, 'a cavern roof')
  assert.equal(t.padUnder(300, 5, 120)?.id, 'perch')
  assert.equal(
    t.padUnder(perch.x0 + 1, 5, 120),
    undefined,
    'a foot off the edge is off the pad',
  )
}

// --- the camera --------------------------------------------------------------------------------------
{
  assert.equal(Camera.zoomFor(80), 1, 'high up, no zoom')
  assert.equal(Camera.zoomFor(5), ZOOM_MAX, 'at touchdown, all the way in')
  assert.ok(
    Camera.zoomFor(30) > 1 && Camera.zoomFor(30) < ZOOM_MAX,
    'smooth between',
  )
  // The pod (about 19 px from sprig to feet) reads at 30+ px near the ground.
  assert.ok(19 * ZOOM_MAX >= 30)
  const c = new Camera()
  c.snap(10, 10, 960, 260)
  const v = c.view()
  assert.ok(v.x0 >= 0 && v.y0 >= 0, 'clamped inside the map')
  for (let i = 0; i < 200; i++) c.follow(900, 200, 4, 960, 260)
  assert.ok(c.zoom > ZOOM_MAX - 0.05, 'eases all the way in')
  assert.ok(c.view().x1 <= 960 + 0.001, 'never past the right edge')
  const s = c.toScreen(c.x, c.y)
  assert.equal(Math.round(s.x), W / 2)

  // In play: high over a wide map at 1x, close in at touchdown.
  const g = staged(3)
  assert.ok(g.terrain.w >= 3 * W, 'the island is several screens wide')
  g.update(emptyInput())
  assert.ok(g.camera.zoom < 1.05, 'high up, the whole sky')
  const pad = g.terrain.pad('bed1')!
  g.pod.x = (pad.x0 + pad.x1) / 2
  g.pod.y = pad.y - POD_FEET - 12
  for (let i = 0; i < 60; i++) {
    g.pod.y = pad.y - POD_FEET - 12
    g.pod.vy = 0
    g.update(hold('up'))
  }
  assert.ok(
    g.camera.zoom > 2,
    `zoomed in for touchdown (${g.camera.zoom.toFixed(2)})`,
  )
  // The camera scrolls: far along the island, the view has moved with the pod.
  g.pod.x = 880
  g.pod.y = 80
  for (let i = 0; i < 200; i++) {
    g.pod.vy = 0
    g.update(emptyInput())
  }
  assert.ok(g.camera.view().x0 > W, 'the view scrolls along the island')
}

// --- landing on beds ---------------------------------------------------------------------------------
{
  // A Feather landing on the x5 bed plants it: 500 x 5 x 1.5, the streak begins.
  const g = staged(1)
  dropOnto(g, 'bed5', 0, 0.1)
  assert.equal(g.pod.restOn, 'bed5')
  assert.ok(g.terrain.pad('bed5')!.planted)
  assert.equal(g.planted, 1)
  assert.equal(g.streak, 1)
  assert.equal(g.score, Math.round(50 * 5 * 1.5 * 1.1) * 10)
  // A Bumpy landing on the x1 bed plants for a third and breaks the streak; two beds clear the hill.
  g.pod.restOn = null
  dropOnto(g, 'bed1', 0, SAFE.vy + 0.15)
  assert.equal(g.streak, 0)
  assert.equal(g.planted, 2)
  assert.equal(g.phase, 'clear', 'enough beds planted: the mission is cleared')
  assert.ok(g.score > 4120 + 160)

  // Off the pad, too fast, too tilted: bonk, a pod lost, a few wildflowers.
  const b = staged(1)
  b.pod.x = 300
  b.pod.y = 200 - POD_FEET - 0.05
  b.pod.vy = 0.1
  b.update(emptyInput())
  assert.equal(b.phase, 'bonk')
  assert.equal(b.lives, START_PODS - 1)
  assert.equal(b.score, BONK_POINTS)
  for (let i = 0; i < 200 && b.phase === 'bonk'; i++) b.update(emptyInput())
  assert.equal(b.phase, 'fly', 'a spare pod drops in')
  assert.equal(b.pod.x, b.mission.start.x)
  const fast = staged(1)
  dropOnto(fast, 'bed1', 0, SAFE.vy * 2)
  assert.equal(fast.phase, 'bonk', 'too fast')
  const tilted = staged(1)
  dropOnto(tilted, 'bed1', 0, 0.1, 0.4)
  assert.equal(tilted.phase, 'bonk', 'too tilted')

  // A ledge pad up on its pillar is a bed like any other.
  const l = staged(1)
  dropOnto(l, 'ledge', 0, 0.2)
  assert.equal(l.pod.restOn, 'ledge')
  assert.ok(l.terrain.pad('ledge')!.planted)

  // Resting, the pod lifts off again with a puff once it has settled.
  const r = staged(1)
  dropOnto(r, 'bed1', 0, 0.1)
  r.update(hold('up'))
  assert.equal(r.pod.restOn, 'bed1', 'a planting holds the pod a moment')
  for (let i = 0; i < 60; i++) r.update(hold('up'))
  assert.equal(r.pod.restOn, null, 'then a puff lifts it off')
  assert.ok(r.pod.y < r.terrain.pad('bed1')!.y - POD_FEET - 2)
}

// --- sun per mission and the sunflowers --------------------------------------------------------------
{
  const g = staged(1)
  assert.equal(g.sunMax, 1000)
  assert.equal(g.pod.sun, 1000, 'each mission starts with its own full tank')
  g.pod.sun = 100
  dropOnto(g, 'sun', 0, 0.1)
  assert.equal(g.pod.restOn, 'sun')
  assert.equal(g.planted, 0, 'a sunflower is a rest stop, not a bed')
  for (let i = 0; i < 100; i++) g.update(emptyInput())
  assert.ok(g.pod.sun > 600, 'a sunflower refuels a resting pod')
  // Breezy gives a quarter more sun.
  const b = game(1)
  b.menu = null
  b.tier = 'breezy'
  b.startMission(flatMission())
  assert.equal(b.sunMax, 1250)

  // Running dry: the leaf cap opens, the pod floats down, the mission is tried again.
  const d = staged(1)
  d.terrain.pad('bed5')!.planted = true
  d.planted = 1
  d.pod.sun = 2
  d.update(hold('up'))
  d.update(hold('up'))
  d.update(hold('up'))
  assert.ok(d.pod.chute, 'out of sun: the leaf cap opens')
  let t = 0
  for (; t < 60 * 60 && d.phase !== 'dry'; t++) d.update(hold('up', 'left'))
  assert.equal(d.phase, 'dry', 'the parachute sets down anywhere, gently')
  assert.equal(d.lives, START_PODS, 'no bonk under the parachute')
  for (let i = 0; i < 200 && d.phase === 'dry'; i++) d.update(emptyInput())
  assert.equal(d.lives, START_PODS - 1, 'the retry costs a pod')
  assert.equal(d.pod.sun, d.sunMax, 'and comes with a full tank')
  assert.equal(d.planted, 0, 'the mission starts over')
  assert.ok(!d.terrain.pad('bed5')!.planted)

  // Stranded on a bed with an empty tank: tried again too, not stuck.
  const s = staged(1)
  s.terrain.pad('bed1')!.planted = true
  s.pod.sun = 0
  dropOnto(s, 'bed1', 0, 0.1)
  for (let i = 0; i < SETTLE_TICKS + 5; i++) s.update(emptyInput())
  assert.equal(s.phase, 'dry')

  // A planting breathes some sun back into the tank.
  const p = staged(1)
  p.pod.sun = 100
  dropOnto(p, 'bed1', 0, 0.1)
  assert.equal(p.pod.sun, 100 + Math.round(p.sunMax * PLANT_SUN))

  // Steering the parachute onto a sunflower saves the mission.
  const c = staged(1)
  const sun = c.terrain.pad('sun')!
  c.pod.x = (sun.x0 + sun.x1) / 2 - 40
  c.pod.y = 60
  c.pod.sun = 1
  c.update(hold('up'))
  c.update(hold('up'))
  assert.ok(c.pod.chute)
  for (let i = 0; i < 60 * 30 && !c.pod.restOn && c.phase === 'fly'; i++) {
    const dx = (sun.x0 + sun.x1) / 2 - c.pod.x
    c.update(hold(dx > 0 ? 'right' : 'left'))
  }
  assert.equal(c.pod.restOn, 'sun', 'the leaf cap steers onto the sunflower')
  assert.ok(!c.pod.chute, 'and closes')
  assert.equal(c.lives, START_PODS, 'no pod spent')
  for (let i = 0; i < 120; i++) c.update(emptyInput())
  assert.ok(c.pod.sun > 300, 'refuelling')
}

// --- the tether winch --------------------------------------------------------------------------------
{
  // The rules: hook under the pod, swing on the line, pull the pod, bump and spill a seedling.
  const pod = newPod(0, 100, 100, 500)
  const crate = newCargo('c', 'crate', 100, 100 + POD_FEET + 20, 3)
  assert.ok(canHook(pod, crate, WINCH.line))
  const far = newCargo('f', 'crate', 140, 120, 3)
  assert.ok(!canHook(pod, far, WINCH.line), 'too far to the side')
  crate.hookedBy = 0
  crate.y = 100 + POD_FEET + WINCH.line + 5
  crate.vy = 1
  pod.vy = 0
  swingCargo(pod, crate, WINCH.line, 1, 0)
  assert.ok(pod.vy > 0, 'a taut line tugs the pod down')
  assert.ok(
    Math.hypot(crate.x - pod.x, crate.y - pod.y - POD_FEET) <= WINCH.line + 1,
  )
  const loose = newCargo('l', 'crate', 0, 95, 3)
  loose.vy = 2
  assert.equal(groundCargo(loose, 100), 'bump')
  assert.equal(loose.seedlings, 2, 'a bumped crate spills a seedling')
  const gentle = newCargo('s', 'crate', 0, 95, 3)
  gentle.vy = 0.3
  assert.equal(groundCargo(gentle, 100), 'land')
  assert.equal(gentle.seedlings, 3)

  // In play: hold DOWN over the crate, tow it to the shed, set it down there.
  const g = staged(2)
  const c = g.cargo[0]!
  assert.ok(c.resting && c.y + c.r === 200, 'the crate waits on the ground')
  g.pod.x = c.x
  g.pod.y = c.y - 30
  g.pod.vy = 0
  g.update(hold('down', 'up'))
  assert.equal(c.hookedBy, 0, 'hooked')
  // Lift it: the pod feels the weight (it climbs slower than with nothing on the line).
  const free = staged(2)
  free.pod.x = 300
  free.pod.y = 120
  g.pod.y = 120
  g.pod.vy = 0
  free.pod.vy = 0
  c.x = g.pod.x
  c.y = g.pod.y + POD_FEET + WINCH.line
  for (let i = 0; i < 60; i++) {
    g.update(hold('up'))
    free.update(hold('up'))
  }
  assert.ok(g.pod.y > free.pod.y + 2, 'cargo weighs the pod down')
  // Carry it over the shed and let it down gently.
  const shed = g.terrain.pad('shed')!
  g.pod.x = (shed.x0 + shed.x1) / 2
  g.pod.vx = 0
  c.x = g.pod.x
  c.vx = 0
  c.vy = 0
  g.pod.y = shed.y - POD_FEET - WINCH.line - c.r * 2 - 4
  c.y = g.pod.y + POD_FEET + WINCH.line - 2
  const before = g.score
  for (let i = 0; i < 200 && !c.delivered; i++) {
    g.pod.vy = Math.min(g.pod.vy, 0.15)
    g.update(g.pod.vy > 0.1 ? hold('up') : emptyInput())
  }
  assert.ok(c.delivered, 'set down in the shed: delivered')
  assert.equal(c.hookedBy, -1)
  assert.equal(g.score - before, DELIVERY_POINTS * c.seedlings + 100)
  // Tap DOWN to let go of a crate mid-air.
  const h = staged(2)
  const hc = h.cargo[0]!
  h.pod.x = hc.x
  h.pod.y = hc.y - 30
  h.update(hold('down', 'up'))
  for (let i = 0; i < 25; i++) h.update(hold('up'))
  h.update(frame('down'))
  assert.equal(hc.hookedBy, -1, 'let go')
}

// --- updrafts and wind --------------------------------------------------------------------------------
{
  const g = staged(1)
  g.vents = [{ x: 500, w: 22, h: 150, lift: 0.024 }]
  g.pod.x = 500
  g.pod.y = 120
  g.pod.vy = 0
  const n = staged(1)
  n.pod.x = 300
  n.pod.y = 120
  n.pod.vy = 0
  for (let i = 0; i < 40; i++) {
    g.update(emptyInput())
    n.update(emptyInput())
  }
  assert.ok(g.pod.vy < 0, 'an updraft carries the pod up with no puffing')
  assert.ok(n.pod.vy > 0, 'outside it, the pod falls')
  const w = staged(1, flatMission({ wind: 0.008 }))
  w.windTarget = 0.008
  w.wind = 0.008
  w.pod.vx = 0
  for (let i = 0; i < 30; i++) w.update(emptyInput())
  assert.ok(w.pod.vx > 0.1, 'a gust pushes the pod')
}

// --- Free Flight -------------------------------------------------------------------------------------
{
  const a = freeHill(7, mulberry32(4))
  const b = freeHill(7, mulberry32(4))
  assert.deepEqual(a, b, 'a hill is the same from the same seed')
  assert.ok(freeHill(1, mulberry32(1)).map.w >= 2 * W)
  assert.ok(
    freeHill(12, mulberry32(1)).map.w > freeHill(1, mulberry32(1)).map.w,
    'hills widen',
  )
  const late = freeHill(9, mulberry32(2))
  const mults = late.map.pads
    .filter((p) => (p.kind ?? 'seed') === 'seed')
    .map((p) => p.mult)
  assert.deepEqual([...mults].sort(), [1, 2, 3, 4, 5], 'x1 to x5 beds')
  assert.ok(
    late.map.pads.some((p) => p.kind === 'sun'),
    'a sunflower to refuel at',
  )
  assert.ok(padWidth(1, 5) < padWidth(1, 1))
  assert.ok(padWidth(40, 5) >= MIN_PAD)
  assert.ok(padWidth(30, 1) < padWidth(1, 1), 'beds keep narrowing')
  // The x5 bed sits in a valley or on a peak: its ground is far from its neighbours'.
  for (let seed = 1; seed <= 8; seed++) {
    const hill = freeHill(9, mulberry32(seed))
    const t = new Terrain(hill.map)
    const x5 = t.pad('bed5')!
    const mid = (x5.x0 + x5.x1) / 2
    const around = [t.groundAt(mid - 26), t.groundAt(mid + 26)]
    assert.ok(
      around.every((y) => Math.abs(y - x5.y) > 15),
      'the x5 bed is tucked into a valley or up on a peak',
    )
  }
  // Odd hills from 3 have a crate to tow to the shed.
  assert.equal(freeHill(3, mulberry32(1)).cargo?.length, 1)
  assert.equal(freeHill(4, mulberry32(1)).cargo?.length, 0)
  // A new hazard every 4 hills: no plateau at hill 8.
  assert.deepEqual(freeHazards(1), ['gust'])
  assert.deepEqual(freeHazards(5), ['gust', 'updraft'])
  assert.deepEqual(newHazards(5), ['updraft'])
  assert.deepEqual(newHazards(6), [])
  const built = HAZARD_LADDER.filter((h) => BUILT_HAZARDS.has(h))
  assert.equal(freeHazards(1 + 4 * (built.length - 1)).length, built.length)
  assert.equal(freeHill(4, mulberry32(1)).vents?.length, 0)
  assert.ok(
    (freeHill(5, mulberry32(1)).vents?.length ?? 0) >= 1,
    'vents from hill 5',
  )
  assert.ok(
    (freeHill(17, mulberry32(1)).vents?.length ?? 0) > 1,
    'and more as hills go on',
  )
  assert.ok(
    freeHill(16, mulberry32(1)).wind > freeHill(8, mulberry32(1)).wind,
    'wind still rising past hill 8',
  )
  assert.notEqual(freeTheme(1), freeTheme(5), 'the sky moves on every 4 hills')

  // Hills clear one after another; a spare pod every few hills.
  const g = staged(1)
  g.startHill(1)
  g.card = 0
  for (let hill = 1; hill <= EXTRA_POD_HILLS; hill++) {
    const lives = g.lives
    const beds = g.terrain.pads.filter((p) => p.kind === 'seed')
    for (let k = 0; k < g.mission.seeds; k++) {
      g.pod.restOn = null
      dropOnto(g, beds[k]!.id, 0, 0.1)
    }
    assert.equal(g.phase, 'clear')
    for (let i = 0; i < 400 && g.phase === 'clear'; i++) g.update(emptyInput())
    assert.equal(g.level, hill + 1)
    if (hill === EXTRA_POD_HILLS)
      assert.equal(g.lives, lives + 1, 'a spare pod')
  }
}

// --- the mode card -----------------------------------------------------------------------------------
{
  const g = game(1)
  assert.ok(g.menu, 'a real game opens on the mode card')
  assert.equal(g.level, 1)
  g.update(frame('down'))
  g.update(frame('right'))
  assert.equal(g.tier, 'gale', 'right on the tier row turns it')
  g.update(frame('left'))
  g.update(frame('left'))
  assert.equal(g.tier, 'breezy')
  g.update(frame('up'))
  g.update(frame('a'))
  assert.equal(g.menu, null, 'A on Free Flight starts it')
  assert.equal(g.sunMax, Math.round(g.mission.sun * 1.25))
  assert.equal(g.level, 1)
  const demo = game(1, true)
  assert.equal(demo.menu, null, 'the attract demo skips the card')
}

// --- the attract demo, the pilot probe ---------------------------------------------------------------
{
  const demo = game(7, true)
  for (let t = 0; t < 60 * 120 && !demo.over; t++) demo.update(emptyInput())
  assert.equal(demo.score, 0, 'the attract demo never scores')
  assert.ok(demo.level >= 2 || demo.planted > 0, 'the demo pilot plants')

  // The pilot flying for real: it lands on every bed type and runs still end.
  const landed = new Set<string>()
  let ended = 0
  let hills = 0
  for (let seed = 1; seed <= 3; seed++) {
    const g = game(seed * 11)
    g.menu = null
    g.startHill(1)
    const land = g.land.bind(g)
    g.land = (pod, pad, rank) => {
      if (pad.kind === 'seed') landed.add(`x${pad.mult}`)
      else landed.add(pad.kind)
      land(pod, pad, rank)
    }
    let t = 0
    for (; t < 60 * 60 * 25 && !g.over; t++) g.update(g.demoInput())
    if (g.over) ended++
    hills += g.level
  }
  for (const kind of ['x1', 'x2', 'x3', 'x4', 'x5', 'sun'])
    assert.ok(landed.has(kind), `the pilot lands on ${kind}`)
  assert.equal(ended, 3, 'every pilot run ends')
  assert.ok(hills >= 12, `the pilot sees a few hills (${hills})`)
}

console.log('seed lander slice 1 ok')
