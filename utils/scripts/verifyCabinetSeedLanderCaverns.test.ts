// Seed Lander depth pass, slice 3 part 2 (conductor kr-arcade/t-071, depth-pass CABINETS.md
// section 9): Firefly Caverns. The dark (lit by your glow, fireflies and relit lanterns), crystal
// bumpers, spore puffballs, the Lantern Run and Rescue missions, the Glowworm Queen, Free Flight's
// use of the new hazards, and a pilot probe over the island.
//
//   npx tsx utils/scripts/verifyCabinetSeedLanderCaverns.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import { create } from '../arcade/games/seedLander'
import { GlowwormQueen, QUEEN, makeBoss } from '../arcade/seedLander/bosses'
import type { Boss } from '../arcade/seedLander/bosses'
import {
  CRYSTAL,
  LANTERN,
  LIGHT,
  SPORE,
  crystalBump,
  darkAt,
  fireflyAt,
  lanternReached,
  sporeSwell,
  sporeTriggered,
} from '../arcade/seedLander/cavern'
import type { Pod } from '../arcade/seedLander/flight'
import { ALL_ACORNS, ISLANDS } from '../arcade/seedLander/islands'
import {
  BUILT_HAZARDS,
  freeHazards,
  freeHill,
} from '../arcade/seedLander/missions'
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
  lit: Set<string>
  blur: number
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
const CAVERNS = 3
/** A campaign game flying Firefly Caverns mission `m`, past its card. */
function caverns(m: number, seed = 1): Inner {
  const g = game(seed)
  g.update(press('a'))
  g.island = CAVERNS
  g.missionIndex = m
  g.update(press('a'))
  assert.equal(g.screen, null)
  g.card = 0
  return g
}

// --- the dark ------------------------------------------------------------------------------------
{
  const lights = [{ x: 100, y: 100, r: 50 }]
  assert.equal(darkAt(lights, 100, 100), LIGHT.night * 0, 'clear at the light')
  assert.equal(darkAt(lights, 300, 100), LIGHT.night, 'darkest far from any')
  assert.ok(
    darkAt(lights, 120, 100) < darkAt(lights, 140, 100),
    'it darkens with distance',
  )
  assert.ok(
    darkAt([...lights, { x: 300, y: 100, r: 50 }], 300, 100) < LIGHT.night,
    'a second light lights its own corner',
  )
  // Fireflies drift on the tick alone, and stay near home.
  const a = fireflyAt(200, 100, 1, 40)
  assert.deepEqual(a, fireflyAt(200, 100, 1, 40))
  assert.ok(Math.hypot(a.x - 200, a.y - 100) < 30)
}

// --- crystals, spores and lanterns ---------------------------------------------------------------
{
  const c = { x: 100, y: 100, r: 10 }
  assert.equal(crystalBump(c, 200, 100, -1, 0), null, 'clear of it')
  assert.equal(crystalBump(c, 112, 100, 1, 0), null, 'leaving: left alone')
  const v = crystalBump(c, 112, 100, -2, 0)!
  assert.ok(v.vx > 0, 'a pod flying into the gem bounces back out')
  assert.ok(
    v.vx < 2 * (1 + CRYSTAL.give) + 1,
    'the bump is gentle, not a launch',
  )
  const down = crystalBump(c, 100, 112, 0, -1.5)!
  assert.ok(down.vy > 0, 'from below it bounces down')

  const sp = { x: 100, y: 100, r: 9 }
  assert.ok(sporeTriggered(sp, 100, 100 - 9 - SPORE.trigger + 2))
  assert.ok(!sporeTriggered(sp, 100, 100 - 9 - SPORE.trigger - 8))
  assert.ok(
    sporeSwell(sp, 100, 80) > sporeSwell(sp, 100, 20),
    'it swells as the pod nears (the tell)',
  )
  assert.equal(SPORE.blur, 120, 'two seconds of blur')

  assert.ok(lanternReached({ id: 'a', x: 100 }, 100 + LANTERN.reach))
  assert.ok(!lanternReached({ id: 'a', x: 100 }, 100 + LANTERN.reach + 1))
}

// --- the Glowworm Queen --------------------------------------------------------------------------
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
  const b = makeBoss('queen', t, 400) as GlowwormQueen
  assert.ok(b instanceof GlowwormQueen)
  assert.equal(b.phases, 3)
  assert.equal(b.pads.length, QUEEN.segments)
  b.update()
  // Exactly one segment is landable, and the light visits them in the phase's order.
  const order: number[] = []
  for (let i = 0; i < QUEEN.step[0]! * 5 - 2; i++) {
    b.update()
    const open = b.pads.filter((p) => !p.blocked)
    assert.equal(open.length, 1, 'one lit segment at a time')
    const lit = b.lit()
    assert.equal(b.pads.indexOf(open[0]!), lit)
    if (order.at(-1) !== lit) order.push(lit)
  }
  assert.deepEqual(order, [0, 1, 2, 3, 4], 'phase 1 runs head to tail')
  assert.ok(b.litLeft() > 0 && b.litLeft() <= QUEEN.step[0]!)
  assert.ok(QUEEN.step[2]! < QUEEN.step[1]! && QUEEN.step[1]! < QUEEN.step[0]!)

  // Two plantings a phase, three phases; the new phase gets a dark breath, then speeds up.
  const seg = b.pads[b.lit()]!
  assert.equal(b.planted(seg), false)
  assert.equal(seg.planted, false, 'the segment takes another planting')
  assert.equal(b.planted(seg), true)
  assert.equal(b.phase, 1)
  assert.equal(b.lit(), -1, 'a breath of dark between phases')
  for (let i = 0; i < QUEEN.hold + 2; i++) b.update()
  assert.ok(b.lit() >= 0)
  b.planted(seg)
  b.planted(seg)
  assert.equal(b.phase, 2)
  b.planted(seg)
  assert.equal(b.done, false)
  b.planted(seg)
  assert.ok(b.done)
  assert.ok(b.pads.every((p) => !p.blocked))
  assert.ok(b.hits(400, 180), 'her belly bonks')
  assert.equal(b.hits(400, 120), null, 'above her is clear')
}

// --- the island's data ---------------------------------------------------------------------------
{
  const isle = ISLANDS[CAVERNS]!
  assert.equal(isle.id, 'caverns')
  assert.ok(THEMES[isle.theme], 'it has a sky')
  assert.deepEqual(
    isle.missions.map((m) => m.kind),
    ['plant', 'plant', 'plant', 'lantern', 'rescue', 'boss'],
  )
  assert.equal(isle.missions.at(-1)!.boss?.id, 'queen')
  assert.ok(
    isle.missions.every((m) => m.dark),
    'every mission is a dark cave',
  )
  assert.ok(isle.missions.some((m) => (m.crystals?.length ?? 0) > 0))
  assert.ok(isle.missions.some((m) => (m.spores?.length ?? 0) > 0))
  assert.ok(
    isle.missions.some((m) => m.unlocked?.includes('spore')),
    'spore puffballs are introduced on a mission card',
  )
  const lantern = isle.missions.find((m) => m.kind === 'lantern')!
  const lmap = new Terrain(lantern.map)
  for (const l of lantern.lanterns!)
    assert.ok(
      lmap.pads.some((p) => p.x0 <= l.x && p.x1 >= l.x && p.kind === 'home'),
      `${l.id} stands on a pad you can land on`,
    )
  const rescue = isle.missions.find((m) => m.kind === 'rescue')!
  const rmap = new Terrain(rescue.map)
  assert.equal(rescue.cargo!.length, 3)
  for (const c of rescue.cargo!) {
    assert.equal(c.kind, 'sprout')
    assert.equal(rmap.pad(c.to)?.kind, 'drop')
  }
  assert.equal(
    ALL_ACORNS.filter((a) => a.startsWith('caverns-')).length,
    3,
    'three golden acorns',
  )
}

// --- Free Flight uses the hazards built so far ---------------------------------------------------
{
  for (const h of ['waterfall', 'stalactite', 'pebble', 'spore'] as const)
    assert.ok(BUILT_HAZARDS.has(h), `${h} is in the Free Flight roster`)
  assert.ok(freeHazards(100).includes('spore'))
  const spec = freeHill(40, mulberry32(7))
  assert.ok((spec.falls?.length ?? 0) > 0, 'waterfalls by hill 40')
  assert.ok((spec.drips?.length ?? 0) > 0)
  assert.ok((spec.pebbles?.length ?? 0) > 0)
  assert.ok((spec.spores?.length ?? 0) > 0)
  // Deterministic from the seed.
  assert.deepEqual(freeHill(40, mulberry32(7)), spec)
  // Early hills stay as they were.
  const early = freeHill(2, mulberry32(7))
  assert.ok(!early.falls?.length && !early.spores?.length)
}

// --- the game ------------------------------------------------------------------------------------
{
  // A crystal bounces a flying pod back and does not bonk it.
  const c = caverns(1)
  const gem = c.mission.crystals![0]!
  Object.assign(c.pod, {
    x: gem.x + gem.r + CRYSTAL.pod - 1,
    y: gem.y,
    vx: -0.8,
    vy: 0,
    tilt: 0,
    restOn: null,
  })
  const lives = c.lives
  c.update(idle())
  assert.ok(c.pod.vx > 0, 'bounced away from the gem')
  assert.equal(c.lives, lives, 'no crash')

  // A puffball blurs the gauges for two seconds, then it clears.
  const s = caverns(2)
  const sp = s.mission.spores![0]!
  Object.assign(s.pod, {
    x: sp.x,
    y: sp.y - sp.r - 4,
    vx: 0,
    vy: 0,
    restOn: null,
  })
  s.update(idle())
  assert.ok(s.blur > SPORE.blur - 3, 'the gauges blur')
  for (let i = 0; i < SPORE.blur + 2; i++) {
    Object.assign(s.pod, { x: 40, y: 50, vx: 0, vy: 0 })
    s.update(idle())
  }
  assert.equal(s.blur, 0, 'and clear again')

  // Landing beside a lantern relights it; all four clear the Lantern Run.
  const l = caverns(3)
  assert.equal(l.mission.kind, 'lantern')
  for (const lamp of l.mission.lanterns!) {
    assert.ok(!l.lit.has(lamp.id))
    const pad = l.terrain.pads.find((p) => p.x0 <= lamp.x && p.x1 >= lamp.x)!
    Object.assign(l.pod, {
      x: lamp.x,
      y: pad.y - 14,
      vx: 0,
      vy: 0.15,
      tilt: 0,
      restOn: null,
      sun: 900,
    })
    for (let i = 0; i < 40 && !l.lit.has(lamp.id) && l.phase === 'fly'; i++)
      l.update(idle())
    assert.ok(l.lit.has(lamp.id), `${lamp.id} relit`)
  }
  assert.equal(l.phase, 'clear', 'the cave is lit: mission done')

  // Rescue: a sprout-bot set down gently on its home pad is rescued.
  const r = caverns(4)
  assert.equal(r.mission.kind, 'rescue')
  r.cargo.forEach((cg, i) => {
    const pad = r.terrain.pad(r.mission.cargo![i]!.to)!
    cg.x = (pad.x0 + pad.x1) / 2
    cg.y = pad.y - cg.r - 2
    cg.vy = 0.2
    cg.vx = 0
    cg.resting = false
  })
  for (let i = 0; i < 80 && r.delivered < 3; i++) r.update(idle())
  assert.equal(r.delivered, 3, 'three sprout-bots home')
  assert.equal(r.phase, 'clear')

  // Landing on a dark segment of the Queen bonks; a lit one plants.
  const q = caverns(5)
  const boss = q.boss as GlowwormQueen
  assert.ok(boss instanceof GlowwormQueen)
  for (let i = 0; i < 5; i++) q.update(idle())
  const dark = boss.pads.find((p) => p.blocked)!
  Object.assign(q.pod, {
    x: (dark.x0 + dark.x1) / 2,
    y: dark.y - 14,
    vx: 0,
    vy: 0.2,
    tilt: 0,
    restOn: null,
    sun: 900,
  })
  const before = q.lives
  for (let i = 0; i < 30 && q.phase === 'fly'; i++) {
    // Keep the dark segment dark while the pod comes down on it.
    q.update(idle())
  }
  assert.ok(q.lives < before || q.phase === 'bonk', 'a dark segment bonks')
}

// --- rendering never throws, lit or dark ---------------------------------------------------------
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
    const g = caverns(m)
    for (let i = 0; i < 20; i++) g.update(idle())
    g.render(ctx)
  }
  assert.ok(calls.n > 100, 'it drew something')
}

// --- the pilot probe -----------------------------------------------------------------------------
{
  const cleared: string[] = []
  for (let m = 0; m < 5; m++) {
    const g = caverns(m, 3)
    for (let t = 0; t < 60 * 60 * 8 && !g.screen; t++) {
      g.lives = Math.max(g.lives, 2)
      g.update(g.demoInput())
    }
    if (g.screen) cleared.push(g.mission.id)
  }
  assert.ok(
    cleared.length >= 3,
    `the pilot clears most of Firefly Caverns (${cleared.join(' ')})`,
  )
}

console.log('seed lander slice 3 part 2 (caverns) ok')
