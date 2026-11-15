// Seed Lander depth pass, slice 5 part 3 (conductor kr-arcade/t-073, depth-pass CABINETS.md
// section 9): two pods in play. Tandem and Relay wired into the cabinet through the `players`
// frames (two pods on one island, the double plant, the shared winch, the buddy vine, drop-ins
// and the shared crate of pods; one pod passed from player to player), crew medals saved for the
// medal board, the board itself, and probes showing crew runs still end and the attract demo
// still scores nothing.
//
//   npx tsx utils/scripts/verifyCabinetSeedLanderCrew.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { ARCADE_GAMES } from '../arcade/games'
import { START_PODS, create } from '../arcade/games/seedLander'
import { freshSave, readLanderSave } from '../arcade/seedLander/campaign'
import { POD_FEET } from '../arcade/seedLander/flight'
import type { Pod } from '../arcade/seedLander/flight'
import {
  ISLANDS,
  MISSIONS_PER_ISLAND,
  VAULT_INDEX,
} from '../arcade/seedLander/islands'
import { masteryPoints } from '../arcade/seedLander/modes'
import type { MissionSpec } from '../arcade/seedLander/missions'
import {
  CREW_ORDER,
  DOUBLE_PLANT_BONUS,
  LEASH,
  crewMedal,
  crewPar,
  leash,
  readCrewMedals,
  tierFromValue,
} from '../arcade/seedLander/tandem'
import type { Cargo } from '../arcade/seedLander/tether'
import type { Pad, Terrain } from '../arcade/seedLander/terrain'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'

// --- the pure rules ---------------------------------------------------------------------------

assert.deepEqual([...CREW_ORDER], ['tandem', 'relay', 'solo'])
assert.equal(tierFromValue(3), 'gold')
assert.equal(tierFromValue(2), 'silver')
assert.equal(tierFromValue(1), 'bronze')
assert.equal(tierFromValue(0), null)
assert.equal(crewPar(3, 1, false), 3000 + 375)
assert.equal(
  crewPar(0, 99, true),
  1000 + 3750 + 16000,
  'goals floor at 1, level caps at 10',
)
assert.ok(crewPar(3, 5, false) > crewPar(3, 1, false), 'later islands ask more')
assert.deepEqual(
  readCrewMedals({ 'meadow-1': 3, 'x y': 2, b: 4, c: 1.5, d: 1 }),
  {
    'meadow-1': 3,
    d: 1,
  },
)
assert.deepEqual(readCrewMedals([3]), {})

// The buddy vine holds back only the pod pulling away; a still pod is never moved.
{
  const a = { x: 0, vx: -1 }
  const b = { x: LEASH + 40, vx: 0 }
  leash(a, b)
  assert.equal(b.x, LEASH + 40, 'the still pod stays put')
  assert.equal(a.x, 40, 'the runner is held to the vine')
  assert.equal(a.vx, 0, 'and loses its outward speed')
  const c = { x: 0, vx: -1 }
  const d = { x: LEASH + 40, vx: 1 }
  leash(c, d)
  assert.equal(Math.round(d.x - c.x), LEASH, 'two runners share the pull')
  const e = { x: 0, vx: 1 }
  const f = { x: 50, vx: 0 }
  assert.ok(leash(e, f) < 1, 'slack inside the vine')
  assert.equal(e.vx, 1, 'and nobody is touched')
}

// Crew medals add to the mastery ladder; the save keeps them and drops junk.
const none = { medals: {}, acorns: 0, cleared: 0, bestHill: 0, trials: {} }
assert.equal(masteryPoints({ ...none, crew: { a: 3, b: 1 } }), 4)
const read = (extra: object) =>
  readLanderSave(
    { ...freshSave(), ...extra },
    VAULT_INDEX + 1,
    MISSIONS_PER_ISLAND,
  )!
assert.deepEqual(read({ crew: { 'meadow-1': 2 } }).crew, { 'meadow-1': 2 })
assert.deepEqual(read({ crew: 'gold' }).crew, {})
assert.equal(read({ crewHill: 12 }).crewHill, 12)
assert.equal(read({ crewHill: -4 }).crewHill, 0)

// --- the cabinet ------------------------------------------------------------------------------

const meta = ARCADE_GAMES.find((m) => m.slug === 'seed-lander')!
assert.equal(meta.maxPlayers, 2, 'two can sit at the cabinet')
assert.ok(meta.blurb.includes('Tandem') && meta.blurb.includes('Relay'))
assert.ok(meta.howTo.some((l) => l.includes('TWO PODS')))

type Game = {
  score: number
  lives: number
  over: boolean
  level: number
  tick: number
  menu: { pick: number } | null
  screen: string | null
  mode: string
  crew: string
  crewPick: string
  phase: string
  pods: Pod[]
  pod: Pod
  cargo: Cargo[]
  terrain: Terrain
  mission: MissionSpec
  downFor: number[]
  relayTurn: number
  doubles: number
  missionStart: number
  seatPoints: number[]
  sunMax: number
  camera: { view(): { x0: number; x1: number; y0: number; y1: number } }
  tally: Array<{ label: string; value: string }>
  crewMedals: Record<string, number>
  boardPage: number
  save: { crew?: Record<string, number>; crewHill?: number } | null
  menuRows(): Array<{ id: string; name: string }>
  activePods(): Pod[]
  frameFor(pod: Pod, controls: InputFrame): InputFrame
  update(input: InputFrame, players?: InputFrame[]): void
  render(g: CanvasRenderingContext2D): void
  land(pod: Pod, pad: Pad, rank: string): void
  crash(pod: Pod, why: string): void
  updateCrew(): void
  followCamera(): void
  workWinch(pod: Pod, input: InputFrame): void
  startHill(hill: number): void
  clearMission(): void
}

const quiet = { play: () => {} }
const make = (players = 2, extra: object = {}, seed = 5): Game =>
  create({
    rng: mulberry32(seed),
    sound: quiet,
    demo: false,
    hiScore: 0,
    players,
    ...extra,
  } as never) as unknown as Game
const idle = () => emptyInput()
const press = (...buttons: Array<keyof InputFrame['held']>) => {
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
function stubContext(): CanvasRenderingContext2D {
  const gradient = { addColorStop: () => {} }
  return new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === 'createLinearGradient' || prop === 'createRadialGradient')
          return () => gradient
        return () => {}
      },
      set: () => true,
    },
  ) as CanvasRenderingContext2D
}
const g2d = stubContext()

/** Pick a mode card row and press A. */
function choose(g: Game, id: string, crew?: string) {
  if (crew)
    while (g.crewPick !== crew) {
      g.menu!.pick = g.menuRows().findIndex((r) => r.id === 'crew')
      g.update(press('right'))
    }
  g.menu!.pick = g.menuRows().findIndex((r) => r.id === id)
  assert.ok(g.menu!.pick >= 0, `the card offers ${id}`)
  g.update(press('a'))
}
const seedBed = (g: Game) =>
  g.terrain.pads.find(
    (p) => p.kind === 'seed' && !p.planted && p.x1 - p.x0 >= 24,
  )!

// One seat: no crew row, one pod, as before. A demo never seats two.
{
  const solo = make(1)
  assert.ok(!solo.menuRows().some((r) => r.id === 'crew'))
  choose(solo, 'free')
  assert.equal(solo.pods.length, 1)
  assert.equal(solo.lives, START_PODS)
  const demo = create({
    rng: mulberry32(2),
    sound: quiet,
    demo: true,
    hiScore: 0,
    players: 2,
  }) as unknown as Game
  assert.equal(demo.pods.length, 1)
}

// Two seated: the card offers the crew, Tandem first, and the picker steps through all three.
{
  const g = make()
  const row = g.menuRows().find((r) => r.id === 'crew')!
  assert.equal(row.name, 'CREW: TANDEM')
  g.menu!.pick = g.menuRows().findIndex((r) => r.id === 'crew')
  const seen = [g.crewPick]
  for (let i = 0; i < 3; i++) {
    g.update(press('right'))
    seen.push(g.crewPick)
  }
  assert.deepEqual(seen, ['tandem', 'relay', 'solo', 'tandem'])
}

// Tandem: two pods, one more in the crate, each flown by its own player.
{
  const g = make()
  choose(g, 'free', 'tandem')
  assert.equal(g.crew, 'tandem')
  assert.equal(g.pods.length, 2)
  assert.deepEqual(
    g.pods.map((p) => p.seat),
    [0, 1],
  )
  assert.notEqual(g.pods[0]!.x, g.pods[1]!.x, 'side by side at the start')
  assert.equal(g.lives, START_PODS + 1)
  g.update(idle(), [idle(), hold('right')])
  assert.equal(g.pods[0]!.tilt, 0, 'P1 untouched')
  assert.ok(g.pods[1]!.tilt > 0, "P2's stick leans P2's pod")
  g.update(hold('left'), [hold('left'), idle()])
  assert.ok(g.pods[0]!.tilt < 0, "P1's stick leans P1's pod")

  // The double plant: P1 plants a wide bed, P2 lands beside it.
  const bed = seedBed(g)
  const [p1, p2] = g.pods as [Pod, Pod]
  g.land(p1, bed, 'soft')
  assert.ok(bed.planted)
  const before = g.score
  g.land(p2, bed, 'soft')
  assert.equal(g.doubles, 1, 'two pods, one bed')
  assert.equal(g.score - before, DOUBLE_PLANT_BONUS * bed.mult * 4)
  assert.ok(Math.abs(p1.x - p2.x) >= 10, 'standing side by side')
  assert.ok(g.seatPoints[0]! > 0 && g.seatPoints[1]! > 0, 'both earned')
  g.land(p1, bed, 'soft')
  assert.equal(g.doubles, 1, 'a bed doubles once')

  // A bonk costs one pod and benches only that pod; it drops back in beside its partner.
  g.startHill(1)
  const lives = g.lives
  g.crash(g.pods[1]!, 'test')
  assert.equal(g.lives, lives - 1)
  assert.equal(g.phase, 'fly', 'the partner flies on')
  assert.equal(g.activePods().length, 1)
  g.crash(g.pods[1]!, 'again')
  assert.equal(g.lives, lives - 1, 'a benched pod cannot bonk twice')
  for (let i = 0; i < 200 && g.activePods().length < 2; i++) g.updateCrew()
  assert.equal(g.activePods().length, 2, 'a spare pod drops in')
  assert.ok(g.pods[1]!.sun >= g.sunMax * 0.25)
  assert.ok(Math.abs(g.pods[1]!.x - g.pods[0]!.x) <= LEASH)

  // The buddy vine keeps them on one screen, and the camera frames both.
  const [a, b] = g.pods as [Pod, Pod]
  a.x = 80
  a.vx = -1
  b.x = 80 + LEASH + 60
  b.vx = 1
  a.restOn = b.restOn = null
  g.updateCrew()
  assert.ok(Math.abs(b.x - a.x) <= LEASH + 1e-6, 'the vine pulls taut')
  for (let i = 0; i < 300; i++) g.followCamera()
  const v = g.camera.view()
  assert.ok(
    v.x0 <= Math.min(a.x, b.x) && v.x1 >= Math.max(a.x, b.x),
    'both in view',
  )
  g.render(g2d)

  // Shared hold: P2 can take P1's crate onto its own line.
  g.startHill(3)
  const crate = g.cargo[0]!
  assert.ok(crate, 'hill 3 has a crate')
  crate.hookedBy = 0
  const q = g.pods[1]!
  q.x = crate.x
  q.y = crate.y - crate.r - POD_FEET - 10
  q.tilt = 0
  q.restOn = null
  g.workWinch(q, hold('down'))
  assert.equal(crate.hookedBy, 1, 'handed over')
}

// Tandem runs out of pods: a pod with none left for it sits out; the last bonk ends the run.
{
  const g = make()
  choose(g, 'free', 'tandem')
  g.lives = 2
  g.crash(g.pods[1]!, 'one')
  for (let i = 0; i < 200; i++) g.updateCrew()
  assert.equal(g.downFor[1], -1, 'no spare for P2: it sits out')
  assert.equal(g.over, false, 'P1 still flies')
  g.crash(g.pods[0]!, 'two')
  for (let i = 0; i < 200 && !g.over; i++) g.updateCrew()
  assert.equal(g.over, true, 'nobody left in the air or the crate')
  // A mission begun with one pod left seats P2 out from the start.
  const h = make()
  choose(h, 'free', 'tandem')
  h.lives = 1
  h.startHill(2)
  assert.equal(h.activePods().length, 1)
}

// Relay: one pod, passed after each planting and each bonk; the score is shared.
{
  const g = make()
  choose(g, 'free', 'relay')
  assert.equal(g.crew, 'relay')
  assert.equal(g.pods.length, 1)
  assert.equal(g.lives, START_PODS)
  const p1 = hold('left')
  const p2 = hold('right')
  assert.equal(g.frameFor(g.pod, p1), g.frameFor(g.pod, p1))
  g.update(p1, [p1, p2])
  assert.equal(g.frameFor(g.pod, p1), p1, "P1's turn first")
  const bed = seedBed(g)
  g.land(g.pod, bed, 'soft')
  assert.equal(g.relayTurn, 1)
  assert.equal(g.pod.seat, 1, 'the pod passes after a planting')
  g.update(p1, [p1, p2])
  assert.equal(g.frameFor(g.pod, p1), p2, "now P2's stick flies it")
  g.crash(g.pod, 'test')
  for (let i = 0; i < 200 && g.phase === 'bonk'; i++)
    g.update(idle(), [idle(), idle()])
  assert.equal(g.pod.seat, 0, 'and passes back after a bonk')
  assert.equal(g.activePods().length, 1)
  g.render(g2d)
}

// A crew clear earns a crew medal against the mission's par, kept for the board.
{
  const g = make()
  choose(g, 'campaign', 'tandem')
  assert.equal(g.screen, 'map')
  g.update(press('a'))
  assert.equal(g.screen, null)
  const first = ISLANDS[0]!.missions[0]!
  assert.equal(g.mission.id, first.id)
  assert.equal(g.pods.length, 2)
  g.score = g.missionStart + 40_000
  g.clearMission()
  assert.ok(
    g.tally.some((l) => l.value === 'CREW GOLD'),
    'a gold crew run',
  )
  assert.equal(g.crewMedals[first.id], 3)
  assert.equal(g.save!.crew![first.id], 3)
  assert.equal(
    crewMedal(40_000, crewPar(first.seeds, 1, false)),
    'gold',
    'the same rule the board shows',
  )
  g.render(g2d)
}

// The medal board: on the card once something is earned, paged by island, back with B.
{
  const first = ISLANDS[0]!.missions[0]!
  const g = make(1, {
    resume: {
      ...freshSave(),
      medals: { [first.id]: 5 },
      crew: { [first.id]: 2 },
      trials: { [first.id]: 600 },
      bestHill: 9,
      crewHill: 6,
    },
  })
  assert.ok(g.menuRows().some((r) => r.id === 'board'))
  assert.ok(
    !make(1)
      .menuRows()
      .some((r) => r.id === 'board'),
    'nothing yet, no board',
  )
  choose(g, 'board')
  assert.equal(g.screen, 'board')
  assert.equal(g.boardPage, 0)
  g.render(g2d)
  g.update(press('right'))
  assert.equal(g.boardPage, 1)
  for (let i = 0; i < 12; i++) g.update(press('right'))
  g.render(g2d)
  g.update(press('b'))
  assert.equal(g.screen, null)
  assert.equal(g.menuRows()[g.menu!.pick]!.id, 'board', 'back on the board row')
}

// A crew run is deterministic: the same seed and the same two sticks give the same game.
function scripted(t: number, shift: number): InputFrame {
  const f = emptyInput()
  const k = t + shift
  f.held.up = k % 90 < 34
  f.held.a = f.held.up
  f.held.left = k % 400 < 40
  f.held.right = k % 400 > 200 && k % 400 < 240
  f.pressed.a = k % 61 === 0
  f.held.down = k % 500 < 30
  f.pressed.down = k % 500 === 0
  return f
}
function crewRun(crew: string, seed: number) {
  const g = make(2, {}, seed)
  choose(g, 'free', crew)
  let t = 0
  for (; t < 60 * 60 * 8 && !g.over; t++) {
    const a = scripted(t, 0)
    const b = scripted(t, 137)
    g.update(a, [a, b])
    if (t % 97 === 0) g.render(g2d)
  }
  return { g, t }
}
for (const crew of ['tandem', 'relay']) {
  const one = crewRun(crew, 11)
  const two = crewRun(crew, 11)
  assert.equal(one.g.score, two.g.score, `${crew}: deterministic score`)
  assert.equal(one.g.level, two.g.level, `${crew}: deterministic hill`)
  assert.ok(one.g.score <= meta.maxPlausibleScore)
  console.log(
    `${crew} probe: hill ${one.g.level}, score ${one.g.score}, ${one.t} ticks`,
  )
}

// Pilot probe: the attract pilot flies a crew's lead pod. In Relay it flies whoever's turn it is
// and the crew climbs hills while the pod changes hands; in Tandem it flies P1 while an idle P2
// bonks, drops in and finally sits out, and the crew still plants on.
{
  const r = make(2, {}, 21)
  choose(r, 'free', 'relay')
  let passed = 0
  for (let t = 0; t < 60 * 60 * 6 && !r.over && r.level < 4; t++) {
    const before = r.relayTurn
    const p = (r as unknown as { demoInput(): InputFrame }).demoInput()
    r.update(p, [p, p])
    if (r.relayTurn !== before) passed++
    if (t % 150 === 0) r.render(g2d)
  }
  assert.ok(passed >= 2, `relay: the pod changed hands ${passed} times`)
  assert.ok(r.level >= 2, `relay: the crew reached hill ${r.level}`)
  const k = make(2, {}, 21)
  choose(k, 'free', 'tandem')
  for (let t = 0; t < 60 * 60 * 6 && !k.over && k.level < 3; t++) {
    const p = (k as unknown as { demoInput(): InputFrame }).demoInput()
    k.update(p, [p, idle()])
    if (t % 150 === 0) k.render(g2d)
  }
  assert.ok(k.level >= 2, `tandem: the crew reached hill ${k.level}`)
  console.log(
    `pilot probe: relay hill ${r.level} (${passed} hand-offs), tandem hill ${k.level}`,
  )
}

// Crews nobody flies still end (pods fall, bonk and run out).
for (const crew of ['tandem', 'relay']) {
  const g = make(2, {}, 3)
  choose(g, 'free', crew)
  let t = 0
  for (; t < 60 * 60 * 5 && !g.over; t++) g.update(idle(), [idle(), idle()])
  assert.ok(g.over, `${crew}: an idle crew run ends`)
}

// The attract demo, even with two seated, flies one pod and scores nothing.
{
  const d = create({
    rng: mulberry32(9),
    sound: quiet,
    demo: true,
    hiScore: 0,
    players: 2,
  }) as unknown as Game
  for (let t = 0; t < 60 * 60 * 3 && !d.over; t++) {
    d.update(idle(), [idle(), idle()])
    if (t % 120 === 0) d.render(g2d)
  }
  assert.equal(d.score, 0)
  assert.equal(d.pods.length, 1)
}

// A solo pod keeps the old one-pod rules (a bonk stops play until the spare drops in).
{
  const g = make(2)
  choose(g, 'free', 'solo')
  assert.equal(g.pods.length, 1)
  g.crash(g.pod, 'solo')
  assert.equal(g.phase, 'bonk')
}

console.log('seed lander crew: ok')
