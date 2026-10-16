// Seed Lander depth pass, slice 4 part 1 (conductor kr-arcade/t-072, depth-pass CABINETS.md
// section 9): Storm Shelf and Thunderhead. The rain-heavy island data, the boss's phases
// (drifting tops, telegraphed lightning, bouncing hail), rendering, and a pilot probe.
//
//   npx tsx utils/scripts/verifyCabinetSeedLanderStorm.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import { create } from '../arcade/games/seedLander'
import { THUNDERHEAD, Thunderhead, makeBoss } from '../arcade/seedLander/bosses'
import type { Boss } from '../arcade/seedLander/bosses'
import type { Pod } from '../arcade/seedLander/flight'
import { ALL_ACORNS, ISLANDS } from '../arcade/seedLander/islands'
import type { MissionSpec } from '../arcade/seedLander/missions'
import { THEMES } from '../arcade/seedLander/art'
import type { newCargo } from '../arcade/seedLander/tether'
import { Terrain } from '../arcade/seedLander/terrain'

type Inner = {
  lives: number
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
  render(g: CanvasRenderingContext2D): void
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
const STORM = 4
function storm(m: number, seed = 1): Inner {
  const g = game(seed)
  g.update(press('a'))
  g.island = STORM
  g.missionIndex = m
  g.update(press('a'))
  assert.equal(g.screen, null)
  g.card = 0
  return g
}

// --- Thunderhead ---------------------------------------------------------------------------------
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
  const b = makeBoss('thunderhead', t, 400) as Thunderhead
  assert.ok(b instanceof Thunderhead)
  assert.equal(b.phases, 3)
  assert.equal(b.pads.length, THUNDERHEAD.tops)
  for (let i = 0; i < 300; i++) {
    b.update()
    assert.equal(b.charging(), -1, 'phase 1 is rain only: no lightning')
    assert.ok(b.pads.every((p) => !p.blocked))
  }
  const top = b.pads[0]!
  assert.equal(b.planted(top), false)
  assert.equal(top.planted, false, 'a top takes another planting')
  assert.equal(b.planted(top), true)
  assert.equal(b.phase, 1)
  for (let i = 0; i < THUNDERHEAD.hold + 2; i++) b.update()
  // Phase 2: exactly one top crackles at a time, and a crackling top is blocked.
  const seen = new Set<number>()
  for (let i = 0; i < THUNDERHEAD.charge[1]! * 4; i++) {
    b.update()
    const c = b.charging()
    assert.ok(c >= 0)
    seen.add(c)
    assert.equal(b.pads.filter((p) => p.blocked).length, 1)
    assert.ok(b.pads[c]!.blocked, 'the charging top is where the strike lands')
  }
  assert.equal(seen.size, THUNDERHEAD.tops, 'every top takes its turn')
  b.planted(top)
  b.planted(top)
  assert.equal(b.phase, 2)
  assert.ok(THUNDERHEAD.charge[2]! < THUNDERHEAD.charge[1]!, 'hail is quicker')
  b.planted(top)
  b.planted(top)
  assert.ok(b.done)
  assert.ok(b.pads.every((p) => !p.blocked))
  assert.ok(b.hits(400, THUNDERHEAD.y + 36), 'his belly bonks')
  assert.equal(b.hits(400, 60), null, 'above him is clear')
}

// --- the island's data ---------------------------------------------------------------------------
{
  const isle = ISLANDS[STORM]!
  assert.equal(isle.id, 'storm')
  assert.ok(THEMES[isle.theme], 'it has a sky')
  assert.deepEqual(
    isle.missions.map((m) => m.kind),
    ['plant', 'plant', 'deliver', 'rings', 'rescue', 'boss'],
  )
  assert.equal(isle.missions.at(-1)!.boss?.id, 'thunderhead')
  assert.ok(
    isle.missions.every((m) => (m.gravity ?? 1) >= 1),
    'rain never makes the pod lighter',
  )
  const acorns = isle.missions.flatMap((m) => m.acorns ?? [])
  assert.equal(acorns.length, 3, 'three golden acorns')
  for (const a of acorns) assert.ok(ALL_ACORNS.includes(a.id))
  assert.equal(
    new Set(ALL_ACORNS).size,
    ALL_ACORNS.length,
    'acorn ids are unique',
  )
}

// --- rendering never throws ----------------------------------------------------------------------
{
  const calls = { n: 0 }
  const ctx = new Proxy(
    {},
    {
      get(_t, key) {
        if (key === 'createRadialGradient' || key === 'createLinearGradient')
          return () => ({ addColorStop: () => {} })
        if (key === 'measureText') return () => ({ width: 4 })
        return () => {
          calls.n++
        }
      },
      set: () => true,
    },
  ) as unknown as CanvasRenderingContext2D
  for (let m = 0; m < 6; m++) {
    const g = storm(m)
    for (let i = 0; i < 400; i++) g.update(idle())
    g.render(ctx)
  }
  assert.ok(calls.n > 100, 'it drew something')
}

// --- the pilot probe -----------------------------------------------------------------------------
{
  const cleared: string[] = []
  for (let m = 0; m < 6; m++) {
    const g = storm(m, 3)
    for (let t = 0; t < 60 * 60 * 8 && !g.screen; t++) {
      g.lives = Math.max(g.lives, 2)
      g.update(g.demoInput())
    }
    if (g.screen) cleared.push(g.mission.id)
  }
  assert.ok(
    cleared.length >= 3,
    `the pilot clears most of Storm Shelf (${cleared.join(' ')})`,
  )
  console.log('pilot cleared:', cleared.join(' '))
}

console.log('seed lander slice 4 part 1 (storm shelf) ok')
