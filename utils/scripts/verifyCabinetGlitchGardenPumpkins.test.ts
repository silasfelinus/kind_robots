import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import {
  GIANT_PUMPKIN_HP,
  INCHWORM_SLOW_TICKS,
  PUMPKIN_HP,
  create,
} from '../arcade/games/glitchGarden'
import {
  CAMPAIGN,
  GARDENS,
  LAYOUT_PUMPKIN,
  PLAYS_PER_LAP,
  PUMPKIN_PATCH,
  campaignPlay,
  gardenStart,
  layoutCells,
} from '../arcade/games/glitchGardenGardens'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'

type Pumpkin = {
  x: number
  y: number
  hp: number
  maxHp: number
  rolling: boolean
  giant: boolean
  hydra?: boolean
  lit?: boolean
  vx: number
  vy: number
}
type Inchworm = { x: number; y: number; vx: number }
type Cell = { hp: number; kind: string } | null
type Probe = {
  score: number
  level: number
  lives: number
  lap: number
  clear: number
  over: boolean
  garden: { id: string }
  pumpkins: Pumpkin[]
  inchworms: Inchworm[]
  slowTicks: number
  grid: Cell[]
  worms: unknown[]
  px: number
  py: number
  objectiveDone: boolean
  trowels: Set<string>
  boss: { id: string; phase: number; defeated: boolean } | null
  startWave(n: number): void
  hitPumpkin(x: number, y: number): boolean
  hitInchworm(x: number, y: number): boolean
  updatePumpkins(): void
  checkHits(): void
  newBeam(x: number, y: number, child: boolean): unknown
  stepBeam(beam: unknown): boolean
  update(input: InputFrame): void
  render(g: CanvasRenderingContext2D): void
  demoInput(): InputFrame
}

const make = (seed = 91, demo = false) =>
  create({
    rng: mulberry32(seed),
    sound: { play: () => {} },
    demo,
    hiScore: 0,
  }) as unknown as Probe

assert.equal(GARDENS.length, 8)
assert.equal(GARDENS[5], PUMPKIN_PATCH)
assert.equal(PUMPKIN_PATCH.layout.length, 36)
assert.ok(PUMPKIN_PATCH.layout.every((row) => row.length === 30))
assert.ok(layoutCells(PUMPKIN_PATCH, LAYOUT_PUMPKIN).length >= 8)
assert.equal(PLAYS_PER_LAP, 44)
assert.equal(gardenStart(5), campaignPlay(28).index)
assert.deepEqual(campaignPlay(45), { index: 0, lap: 1 })
assert.equal(CAMPAIGN.filter((step) => step.kind === 'wave').length, 40)
assert.equal(PUMPKIN_PATCH.waves[2]!.objective?.kind, 'great-pumpkin')

{
  const g = make()
  g.startWave(28)
  assert.equal(g.garden.id, 'pumpkin-patch')
  assert.equal(g.pumpkins.length, 3)
  assert.equal(g.inchworms.length, 1)
  const pumpkin = g.pumpkins[0]!
  assert.equal(pumpkin.hp, PUMPKIN_HP)
  assert.equal(pumpkin.rolling, false)
  const col = Math.floor(pumpkin.x / 8)
  const row = Math.floor((pumpkin.y - 16) / 8)
  const protectedCell = g.grid[row * 30 + col]
  const beam = g.newBeam(pumpkin.x, pumpkin.y + 8, false)
  assert.equal(g.stepBeam(beam), false, 'the pumpkin catches an actual shot')
  assert.equal(pumpkin.hp, PUMPKIN_HP - 1)
  assert.equal(g.grid[row * 30 + col], protectedCell)
  for (let hit = 1; hit < PUMPKIN_HP; hit++)
    assert.equal(g.hitPumpkin(pumpkin.x, pumpkin.y), true)
  assert.ok(!g.pumpkins.includes(pumpkin), 'eighth hit cracks the pumpkin')
  assert.ok(g.grid.some((cell) => cell?.kind === 'sprout'))
  assert.ok(g.score >= 250, 'pumpkin cracks pay real score')
}

{
  const g = make()
  g.startWave(29)
  const roller = g.pumpkins.find((p) => p.rolling)!
  assert.ok(roller, 'wave two adds a rolling danger')
  roller.y = 16 + 31 * 8
  const x = roller.x
  g.updatePumpkins()
  assert.notEqual(roller.x, x, 'a roller travels across the flowerbed')
  g.worms = []
  g.px = roller.x
  g.py = roller.y
  const lives = g.lives
  g.checkHits()
  assert.equal(g.lives, lives - 1, 'touching a roller costs a sprayer')
  const inchworm = g.inchworms[0]!
  assert.ok(g.hitInchworm(inchworm.x, inchworm.y))
  assert.equal(g.slowTicks, INCHWORM_SLOW_TICKS)
  assert.ok(!g.inchworms.includes(inchworm))
}

{
  const g = make()
  g.startWave(30)
  const giant = g.pumpkins.find((p) => p.giant)!
  assert.equal(giant.hp, GIANT_PUMPKIN_HP)
  g.worms = []
  g.update(emptyInput())
  assert.equal(g.clear, 0, 'the Great Pumpkin must be fixed before advancing')
  for (let hit = 0; hit < GIANT_PUMPKIN_HP; hit++)
    assert.ok(g.hitPumpkin(giant.x, giant.y))
  assert.equal(g.objectiveDone, true, 'the giant awards its authored objective')
  assert.ok(!g.pumpkins.some((p) => p.giant))
  g.update(emptyInput())
  assert.ok(g.clear > 0, 'the special front can now finish')
  assert.ok(
    g.trowels.has('pumpkin-patch'),
    'perfect clear gives a golden trowel',
  )
  assert.ok(g.score >= 5000, 'boss and objective bonuses award real points')
}

{
  const g = make(98)
  g.startWave(33)
  const head = g.pumpkins.find((p) => p.hydra)!
  const x = head.x
  g.slowTicks = INCHWORM_SLOW_TICKS
  g.update(emptyInput())
  assert.equal(
    head.x,
    x,
    'inchworm slow also pauses hydra movement on alternate frames',
  )
  g.update(emptyInput())
  assert.notEqual(head.x, x, 'hydra advances on the next active frame')
}

{
  const a = make(93)
  const b = make(93)
  a.startWave(28)
  b.startWave(28)
  for (let i = 0; i < 900; i++) {
    a.update(a.demoInput())
    b.update(b.demoInput())
  }
  assert.equal(a.score, b.score, 'seeded score repeatability')
  assert.equal(a.level, b.level, 'seeded level repeatability')
  assert.deepEqual(a.pumpkins, b.pumpkins, 'seeded pumpkin state repeatability')
  const gradient = { addColorStop() {} }
  const g = new Proxy(
    {},
    {
      get: (_target, key) =>
        key === 'createLinearGradient' || key === 'createRadialGradient'
          ? () => gradient
          : key === 'measureText'
            ? () => ({ width: 8 })
            : () => {},
      set: () => true,
    },
  ) as CanvasRenderingContext2D
  a.render(g)
}

{
  const demo = make(95, true)
  demo.startWave(30)
  for (let i = 0; i < 600; i++) demo.update(emptyInput())
  assert.equal(demo.score, 0, 'attract-mode never saves a score')
}

{
  const g = make(97)
  g.startWave(33)
  assert.equal(g.boss?.id, 'gourd-hydra')
  assert.equal(g.pumpkins.filter((p) => p.hydra).length, 3)
  const dark = g.pumpkins.find((p) => p.hydra && !p.lit)!
  const darkHp = dark.hp
  assert.ok(g.hitPumpkin(dark.x, dark.y), 'dark heads absorb a shot')
  assert.equal(dark.hp, darkHp, 'an unlit hydra head is invulnerable')
  for (let phase = 0; phase < 3; phase++) {
    const head = g.pumpkins.find((p) => p.hydra)!
    head.lit = true
    const hits = head.hp
    for (let n = 0; n < hits; n++) assert.ok(g.hitPumpkin(head.x, head.y))
    assert.equal(g.boss!.phase, phase + 2, 'each head advances the boss')
    const left = g.pumpkins.filter((p) => p.hydra)
    if (left.length === 1) {
      assert.ok(left[0]!.rolling, 'the last head becomes a roller')
      assert.ok(left[0]!.lit, 'the rolling head stays vulnerable')
    }
  }
  assert.ok(g.boss!.defeated, 'all three heads fixed')
  g.worms = []
  g.update(emptyInput())
  assert.ok(g.clear > 0, 'defeating the boss advances the campaign')
  assert.ok(g.score >= 15000, 'the hydra pays its season boss bonus')
}

console.log('Glitch Garden pumpkins: breakable cover, rollers and hydra OK')
