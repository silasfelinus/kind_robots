// Seed Lander depth pass, slice 4 part 2 (conductor kr-arcade/t-072, depth-pass CABINETS.md
// section 9): the Moon Garden island and the Old Lander boss (low gravity, no wind, meteor streaks).
//
//   npx tsx utils/scripts/verifyCabinetSeedLanderMoon.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import { create } from '../arcade/games/seedLander'
import { OLD_LANDER, OldLander, makeBoss } from '../arcade/seedLander/bosses'
import { ALL_ACORNS, ISLANDS } from '../arcade/seedLander/islands'
import { THEMES } from '../arcade/seedLander/art'
import { Terrain } from '../arcade/seedLander/terrain'

type Inner = {
  lives: number
  screen: 'map' | 'shed' | 'soon' | null
  mission: { id: string }
  island: number
  missionIndex: number
  card: number
  update(input: InputFrame): void
  demoInput(): InputFrame
  render(g: CanvasRenderingContext2D): void
}

const press = (b: keyof InputFrame['held']) => {
  const f = emptyInput()
  f.held[b] = true
  f.pressed[b] = true
  return f
}
const MOON = 5
function moon(m: number, seed = 1): Inner {
  const g = create({
    rng: mulberry32(seed),
    sound: { play: () => {} },
    demo: false,
    hiScore: 0,
  }) as unknown as Inner
  g.update(press('a'))
  g.island = MOON
  g.missionIndex = m
  g.update(press('a'))
  assert.equal(g.screen, null)
  g.card = 0
  return g
}

// --- the Old Lander ------------------------------------------------------------------------------
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
  const b = makeBoss('oldlander', t, 400) as OldLander
  assert.ok(b instanceof OldLander)
  assert.equal(b.pads.length, OLD_LANDER.legs)
  for (let i = 0; i < 300; i++) {
    b.update()
    assert.equal(b.streaking(), -1, 'phase 1 has no meteors')
  }
  const leg = b.pads[0]!
  assert.equal(b.planted(leg), false)
  assert.equal(b.planted(leg), true)
  assert.equal(b.phase, 1)
  for (let i = 0; i < OLD_LANDER.hold + 2; i++) b.update()
  const seen = new Set<number>()
  for (let i = 0; i < OLD_LANDER.streak[1]! * 3; i++) {
    b.update()
    const c = b.streaking()
    assert.ok(c >= 0)
    seen.add(c)
    assert.equal(b.pads.filter((p) => p.blocked).length, 1)
  }
  assert.equal(seen.size, OLD_LANDER.legs, 'every footpad takes its turn')
  b.planted(leg)
  b.planted(leg)
  assert.equal(b.phase, 2)
  assert.ok(OLD_LANDER.streak[2]! < OLD_LANDER.streak[1]!)
  b.planted(leg)
  b.planted(leg)
  assert.ok(b.done)
  assert.ok(b.pads.every((p) => !p.blocked))
  assert.ok(b.hits(400, OLD_LANDER.y - 40), 'the cabin bonks')
  assert.equal(b.hits(400, 40), null)
}

// --- the island ----------------------------------------------------------------------------------
{
  const isle = ISLANDS[MOON]!
  assert.equal(isle.id, 'moon')
  assert.ok(THEMES[isle.theme])
  assert.deepEqual(
    isle.missions.map((m) => m.kind),
    ['plant', 'plant', 'deliver', 'rings', 'rescue', 'boss'],
  )
  assert.equal(isle.missions.at(-1)!.boss?.id, 'oldlander')
  assert.ok(
    isle.missions.every((m) => (m.gravity ?? 1) < 0.6),
    'low gravity',
  )
  assert.ok(
    isle.missions.every((m) => m.wind === 0),
    'no wind',
  )
  assert.ok(
    isle.missions[0]!.map.pads.some((p) => p.mult === 5),
    'a x5 pad',
  )
  assert.equal(new Set(isle.missions.map((m) => m.id)).size, 6)
  assert.equal(new Set(ALL_ACORNS).size, ALL_ACORNS.length, 'unique acorns')
  assert.equal(isle.missions.flatMap((m) => m.acorns ?? []).length, 3)
}

// --- rendering and the pilot ---------------------------------------------------------------------
{
  const ctx = new Proxy(
    {},
    {
      get(_t, key) {
        if (key === 'createRadialGradient' || key === 'createLinearGradient')
          return () => ({ addColorStop: () => {} })
        if (key === 'measureText') return () => ({ width: 4 })
        return () => {}
      },
      set: () => true,
    },
  ) as unknown as CanvasRenderingContext2D
  for (let m = 0; m < 6; m++) {
    const g = moon(m)
    for (let i = 0; i < 400; i++) g.update(emptyInput())
    g.render(ctx)
  }
  const cleared: string[] = []
  for (let m = 0; m < 6; m++) {
    const g = moon(m, 3)
    for (let t = 0; t < 60 * 60 * 8 && !g.screen; t++) {
      g.lives = Math.max(g.lives, 2)
      g.update(g.demoInput())
    }
    if (g.screen) cleared.push(g.mission.id)
  }
  assert.ok(cleared.length >= 3, `the pilot clears most (${cleared.join(' ')})`)
  console.log('pilot cleared:', cleared.join(' '))
}

console.log('seed lander slice 4 part 2 (moon garden) ok')
