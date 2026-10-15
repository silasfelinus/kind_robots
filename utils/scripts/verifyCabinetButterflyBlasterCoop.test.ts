// /utils/scripts/verifyCabinetButterflyBlasterCoop.test.ts
//
// Butterfly Blaster depth slice 4, part 2 (conductor kr-arcade t-058, depth-pass/CABINETS.md
// section 6, "Modes"): Co-op Flight for two to four butterflies through the `players` frames,
// the team lasso, and the shared lives and village.
//
//   npx tsx utils/scripts/verifyCabinetButterflyBlasterCoop.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import mod from '../arcade/games/butterflyBlaster'
import { ARCADE_GAMES } from '../arcade/games'
import { Ribbon } from '../arcade/butterflyBlaster/lasso'
import {
  COOP_LIVES_PER_EXTRA,
  TEAM_MULTIPLIER,
  newMates,
  teamLoop,
} from '../arcade/butterflyBlaster/coop'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'

/* eslint-disable @typescript-eslint/no-explicit-any */

const quiet = { play: () => {} }
const make = (players: number, seed = 5) =>
  mod.create({
    rng: mulberry32(seed),
    sound: quiet,
    demo: false,
    hiScore: 0,
    players,
  }) as any
const press = (...b: Array<keyof InputFrame['held']>) => {
  const f = emptyInput()
  for (const k of b) {
    f.held[k] = true
    f.pressed[k] = true
  }
  return f
}
const step = (g: any, frames: InputFrame[]) => g.update(frames[0], frames)
/** Open Co-op Flight (row 4 of the menu) and wait for the night to start. */
function startCoop(g: any, seats: number) {
  const idle = () => Array.from({ length: seats }, () => emptyInput())
  for (let i = 0; i < 10; i++) step(g, idle())
  for (let i = 0; i < 4; i++) step(g, [press('down'), ...idle().slice(1)])
  step(g, [press('a'), ...idle().slice(1)])
  for (let i = 0; i < 400 && g.phase !== 'play'; i++)
    step(g, [press('a'), ...idle().slice(1)])
}
const lay = (r: Ribbon, pts: Array<[number, number]>) =>
  pts.forEach(([x, y], i) => r.lay(x, y, i * 2, i > 0))

// --- the registry seats four -----------------------------------------------------------------------
{
  const meta = ARCADE_GAMES.find((m) => m.slug === 'butterfly-blaster')!
  assert.equal(meta.maxPlayers, 4, 'four seats')
  assert.ok(
    meta.howTo.some((l) => /CO-?OP/.test(l)),
    'the how-to mentions co-op',
  )
}

// --- wingmates: one per extra seat ---------------------------------------------------------------
{
  assert.equal(newMates(1).length, 0)
  assert.deepEqual(
    newMates(4).map((m) => m.seat),
    [1, 2, 3],
  )
}

// --- the team lasso: two ribbons that cross close a loop ----------------------------------------
{
  const a = new Ribbon()
  const b = new Ribbon()
  // A flies right along y=100; B flies down across it at x=120, then loops back.
  lay(
    a,
    Array.from({ length: 30 }, (_, i) => [60 + i * 4, 100] as [number, number]),
  )
  lay(
    b,
    Array.from({ length: 30 }, (_, i) => [120, 60 + i * 4] as [number, number]),
  )
  const loop = teamLoop(
    { ribbon: a, shift: { x: 0, y: 0 } },
    { ribbon: b, shift: { x: 0, y: 0 } },
  )
  assert.ok(loop, 'crossing ribbons close a team loop')
  assert.ok(loop!.area > 200)
  // Ribbons that never meet make no loop.
  const c = new Ribbon()
  lay(
    c,
    Array.from({ length: 20 }, (_, i) => [300, 40 + i * 4] as [number, number]),
  )
  assert.equal(
    teamLoop(
      { ribbon: a, shift: { x: 0, y: 0 } },
      { ribbon: c, shift: { x: 0, y: 0 } },
    ),
    null,
  )
}

// --- Co-op Flight needs a second seat -----------------------------------------------------------
{
  const solo = make(1)
  startCoop(solo, 1)
  assert.equal(solo.phase, 'menu', 'one seat cannot start Co-op Flight')

  const g = make(2)
  startCoop(g, 2)
  assert.equal(g.phase, 'play')
  assert.equal(g.mode, 'coop')
  assert.equal(g.mates.length, 1)
  assert.equal(g.lives, 3 + COOP_LIVES_PER_EXTRA, 'shared lives grow per seat')
  const m = g.mates[0]
  const x0 = m.x
  for (let i = 0; i < 60; i++) step(g, [emptyInput(), press('right', 'up')])
  assert.notEqual(m.x, x0, "player 2's frame steers the wingmate")
  assert.ok(m.angle > 0, 'and turns it')
}

// --- the team lasso nets a swarm for double, and a wingmate's hit costs a shared life --------------
{
  const g = make(2, 11)
  startCoop(g, 2)
  for (let i = 0; i < 200; i++) step(g, [emptyInput(), emptyInput()])
  assert.ok(g.swarms.length > 0)
  const m = g.mates[0]
  const swarm = g.swarms[0]
  // Cross two ribbons round the swarm's spot.
  g.alive = true
  m.alive = true
  g.ship.x = swarm.x - 40
  g.ship.y = swarm.y
  g.unwrapped = { x: g.ship.x, y: g.ship.y }
  g.ribbon.clear()
  m.x = swarm.x
  m.y = swarm.y - 40
  m.unwrapped = { x: m.x, y: m.y }
  m.ribbon.clear()
  lay(
    g.ribbon,
    Array.from(
      { length: 40 },
      (_, i) => [swarm.x - 40 + i * 2, swarm.y] as [number, number],
    ),
  )
  lay(
    m.ribbon,
    Array.from(
      { length: 40 },
      (_, i) => [swarm.x, swarm.y - 40 + i * 2] as [number, number],
    ),
  )
  g.swarms = [swarm]
  swarm.x += 12
  swarm.y += 12
  const before = g.score
  // The heads are at (+38, 0) and (0, +38) of the crossing: a triangle round the swarm.
  g.teamLasso()
  assert.equal(g.swarms.length, 0, 'the team lasso netted the swarm')
  assert.ok(g.score > before, 'and paid')
  assert.ok(TEAM_MULTIPLIER >= 2)

  const lives = g.lives
  m.invuln = 0
  m.alive = true
  g.swarms = [{ ...swarm, x: m.x, y: m.y, size: 2 }]
  step(g, [emptyInput(), emptyInput()])
  assert.equal(g.mates[0].alive, false, 'a hit grounds the wingmate')
  assert.equal(g.lives, lives - 1, 'at the cost of a shared life')
}

// --- runs end at every seat count -------------------------------------------------------------------
for (const seats of [2, 3, 4]) {
  let ended = 0
  for (let seed = 1; seed <= 2; seed++) {
    const g = make(seats, seed * 31)
    startCoop(g, seats)
    for (let t = 0; t < 60 * 60 * 15 && !g.over; t++) {
      const lead = g.demoInput()
      step(g, [lead, ...Array.from({ length: seats - 1 }, () => emptyInput())])
      if (t % 300 === 0) g.render(makeCtx())
    }
    if (g.over) ended++
    assert.ok(g.score <= 12_000_000)
  }
  assert.equal(ended, 2, `${seats} seats: runs end`)
}

function makeCtx(): any {
  return new Proxy(
    {},
    {
      get: (_t, k) =>
        k === 'canvas'
          ? { width: 480, height: 360 }
          : k === 'createLinearGradient' || k === 'createRadialGradient'
            ? () => ({ addColorStop() {} })
            : k === 'measureText'
              ? () => ({ width: 0 })
              : () => {},
      set: () => true,
    },
  )
}

console.log('butterfly blaster co-op ok')
