import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { GARDEN_LOOKS } from '../arcade/games/glitchGardenArt'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import {
  FROST_HP,
  FROST_SPREAD_TICKS,
  FROST_SPRITE_EVERY,
  HEATER_RADIUS,
  SNOWBALL_HP,
  MOLE_TELL_TICKS,
  MOLE_WAIT_TICKS,
  create,
} from '../arcade/games/glitchGarden'
import {
  CAMPAIGN,
  campaignPlay,
  FROST_FRAME_GREENHOUSE,
  GARDENS,
  LAYOUT_HEATER,
  PLAYS_PER_LAP,
  SNOWBALL_HILL,
  gardenStart,
  layoutCells,
} from '../arcade/games/glitchGardenGardens'

type Obstacle = {
  hp: number
  kind: string
  frosted?: boolean
  lit?: boolean
} | null

type Snowball = { x: number; y: number; hp: number; vy: number }
type Mole = { x: number; y: number; phase: 'tell' | 'up'; ticks: number }

type Probe = {
  garden: { id: string; icyBed?: boolean }
  grid: Obstacle[]
  wave: { objective?: { kind: string } }
  frostTimer: number
  boss: { id: string; phase: number; defeated: boolean } | null
  frostMillipede: Array<{ x: number; y: number; thawed: boolean }>
  score: number
  clear: number
  level: number
  lap: number
  shed: unknown
  leaveShed(): void
  startFrostPhase(): void
  frostSprite: { x: number; y: number; vx: number } | null
  frostSpriteTimer: number
  snowballs: Snowball[]
  snowballsFixed: number
  objectiveDone: boolean
  lives: number
  worms: unknown[]
  mole: Mole | null
  moleTimer: number
  px: number
  py: number
  glideX: number
  beginStep(index: number, lap: number, level: number): void
  update(input: InputFrame): void
  newBeam(x: number, y: number, child: boolean): unknown
  stepBeam(beam: unknown): boolean
  thawHeater(col: number, row: number): void
  splash(col: number, row: number, chain: number): void
  beetle: { x: number; y: number; vx: number; vy: number; turn: number } | null
  updateBeetle(): void
  updateFrost(): void
  water(col: number, row: number, ob: NonNullable<Obstacle>): void
  hitFrostMillipede(x: number, y: number): boolean
  updateFrostSprite(): void
  hitFrostSprite(x: number, y: number): boolean
  updateMole(): void
  hitMole(x: number, y: number): boolean
  checkHits(): void
  afterDeath(): void
  hitSnowball(x: number, y: number): boolean
  moveSprayer(input: InputFrame): void
}

const COLS = 30
const HUD = 16
const CELL = 8
const make = (seed = 17) =>
  create({
    rng: mulberry32(seed),
    sound: { play: () => {} },
    demo: false,
    hiScore: 0,
  }) as unknown as Probe
const countFrost = (g: Probe) => g.grid.filter((ob) => ob?.frosted).length
const at = (g: Probe, col: number, row: number) => g.grid[row * COLS + col]!
const moleOf = (g: Probe): Mole | null => g.mole

assert.equal(GARDENS.length, 8)
assert.equal(PLAYS_PER_LAP, 44)
assert.equal(CAMPAIGN.filter((s) => s.kind === 'wave').length, 40)
assert.equal(GARDENS[6], FROST_FRAME_GREENHOUSE)
assert.equal(GARDENS[7], SNOWBALL_HILL)
assert.equal(layoutCells(FROST_FRAME_GREENHOUSE, LAYOUT_HEATER).length, 4)
assert.equal(FROST_FRAME_GREENHOUSE.waves[2]!.objective?.kind, 'warm-heaters')
assert.equal(SNOWBALL_HILL.waves[2]!.objective?.kind, 'snow-day')
assert.equal(SNOWBALL_HILL.icyBed, true)
assert.ok(GARDEN_LOOKS['frost-frame-greenhouse'])
assert.ok(GARDEN_LOOKS['snowball-hill'])
assert.ok(FROST_FRAME_GREENHOUSE.waves.every((w) => w.frost > 0))
assert.ok(SNOWBALL_HILL.waves.every((w) => w.snowballs > 0))

{
  const g = make()
  g.beginStep(gardenStart(6), 0, 34)
  assert.equal(g.garden.id, 'frost-frame-greenhouse')
  assert.equal(countFrost(g), 8)
  assert.ok(g.grid.some((lamp) => lamp?.frosted && lamp.hp === FROST_HP))
  g.frostTimer = 1
  g.updateFrost()
  assert.equal(g.frostTimer, FROST_SPREAD_TICKS)
  assert.equal(countFrost(g), 9, 'frost spreads across spaced lamps')

  const heaters = layoutCells(FROST_FRAME_GREENHOUSE, LAYOUT_HEATER)
  const [col, row] = heaters[1]!
  const nearby = g.grid.filter((lamp) => lamp?.frosted).length
  g.thawHeater(col, row)
  assert.ok(at(g, col, row)?.lit, 'heater lights on spray')
  assert.ok(countFrost(g) < nearby, 'heated radius melts frozen lamps')
  assert.ok(
    g.grid.every((lamp) => !lamp?.frosted || lamp.hp >= 1),
    'thawed lamps stay usable',
  )
  assert.equal(HEATER_RADIUS, 3)
  g.thawHeater(col, row)
  assert.equal(at(g, col, row)?.lit, true, 'a lit heater stays lit')
}

{
  const g = make(5)
  g.beginStep(gardenStart(6) + 2, 0, 36)
  assert.equal(g.wave.objective?.kind, 'warm-heaters')
  const heaters = layoutCells(FROST_FRAME_GREENHOUSE, LAYOUT_HEATER)
  for (const [col, row] of heaters) {
    const x = col * CELL + CELL / 2
    const y = HUD + (row + 1) * CELL + CELL / 2
    const beam = g.newBeam(x, y, false)
    for (let i = 0; i < 4 && !at(g, col, row)?.lit; i++) g.stepBeam(beam)
    assert.ok(at(g, col, row)?.lit, 'real beam lights a heater')
  }
  assert.ok(g.objectiveDone, 'four live heaters award Warm Up')
}

{
  const g = make(8)
  g.beginStep(gardenStart(7), 0, 40)
  assert.equal(g.garden.id, 'snowball-hill')
  assert.equal(g.snowballs.length, 1)
  const x = g.px
  const right = emptyInput()
  right.held.right = true
  for (let i = 0; i < 8; i++) g.moveSprayer(right)
  const pushed = g.px
  assert.ok(pushed > x)
  g.moveSprayer(emptyInput())
  assert.ok(g.px > pushed, 'icy bed keeps gliding after release')
  assert.ok(g.glideX > 0)
  const ball = g.snowballs[0]!
  assert.equal(ball.hp, SNOWBALL_HP)
  for (let i = 0; i < SNOWBALL_HP; i++) assert.ok(g.hitSnowball(ball.x, ball.y))
  assert.equal(g.snowballsFixed, 1)
  assert.equal(g.snowballs.length, 0, 'sprayed snowball is fixed')
}

{
  const g = make(21)
  g.beginStep(gardenStart(7) + 2, 0, 42)
  assert.equal(g.wave.objective?.kind, 'snow-day')
  assert.equal(g.snowballs.length, 3)
  for (const ball of [...g.snowballs])
    for (let i = 0; i < SNOWBALL_HP; i++)
      assert.ok(g.hitSnowball(ball.x, ball.y))
  assert.equal(g.snowballsFixed, 3)
  assert.equal(g.objectiveDone, true, 'Snow Day awards the special objective')
}

{
  const run = (seed: number) => {
    const g = make(seed)
    g.beginStep(gardenStart(6), 0, 34)
    g.frostTimer = 1
    g.updateFrost()
    return g.grid.map((ob) => (ob?.frosted ? 1 : 0)).join('')
  }
  assert.equal(run(29), run(29), 'winter frost is seeded and repeatable')
}

{
  const g = make(71)
  g.beginStep(gardenStart(7) + 1, 0, 41)
  assert.equal(SNOWBALL_HILL.waves[1]!.mole, true)
  assert.equal(moleOf(g), null)
  g.moleTimer = 1
  g.updateMole()
  assert.equal(moleOf(g)?.phase, 'tell', 'mole warns before an ambush')
  const warning = moleOf(g)!
  assert.equal(warning.ticks, MOLE_TELL_TICKS)
  const x = warning.x
  const y = warning.y
  g.px += 32
  moleOf(g)!.ticks = 1
  g.updateMole()
  assert.equal(moleOf(g)?.phase, 'up', 'mole emerges after warning')
  const lives = g.lives
  g.worms = []
  g.snowballs = []
  g.checkHits()
  assert.equal(g.lives, lives, 'moving off the mound avoids the ambush')
  assert.ok(g.hitMole(x, y), 'emerged mole can be fixed with a spray')
  assert.equal(moleOf(g), null)
  assert.equal(g.moleTimer, MOLE_WAIT_TICKS)
  assert.equal(g.hitMole(x, y), false, 'fixed mole pays only once')
}

{
  const g = make(72)
  g.beginStep(gardenStart(7) + 1, 0, 41)
  g.moleTimer = 1
  g.updateMole()
  moleOf(g)!.ticks = 1
  g.updateMole()
  g.worms = []
  g.snowballs = []
  const lives = g.lives
  g.checkHits()
  assert.equal(g.lives, lives - 1, 'standing on a popping mole costs one life')
}

{
  const g = make(73)
  g.beginStep(gardenStart(7) + 2, 0, 42)
  assert.equal(g.snowballs.length, 3)
  const first = g.snowballs[0]!
  for (let i = 0; i < SNOWBALL_HP; i++)
    assert.ok(g.hitSnowball(first.x, first.y))
  assert.equal(g.snowballsFixed, 1)
  g.afterDeath()
  assert.equal(g.snowballsFixed, 1, 'snow day progress survives respawn')
  assert.equal(g.snowballs.length, 2, 'unfixed snowballs respawn')
  for (const ball of [...g.snowballs])
    for (let i = 0; i < SNOWBALL_HP; i++)
      assert.ok(g.hitSnowball(ball.x, ball.y))
  assert.equal(g.objectiveDone, true, 'respawn cannot strand Snow Day reward')
}

{
  const g = make(41)
  g.beginStep(gardenStart(6), 0, 34)
  g.frostSpriteTimer = 1
  g.updateFrostSprite()
  assert.ok(g.frostSprite, 'a seeded frost sprite crosses the greenhouse')
  const index = g.grid.findIndex(
    (lamp) => lamp?.kind === 'lamp' && !lamp.frosted,
  )
  assert.ok(index >= 0)
  const col = index % COLS
  const row = Math.floor(index / COLS)
  const x = col * CELL + 4
  const y = HUD + row * CELL + 4
  g.frostSprite = { x: x - 1, y, vx: 1 }
  g.updateFrostSprite()
  assert.equal(at(g, col, row)?.frosted, true)
  assert.equal(at(g, col, row)?.hp, FROST_HP)
  assert.ok(g.hitFrostSprite(x, y), 'spray fixes the moving frost source')
  assert.equal(g.frostSprite, null)
  assert.equal(g.frostSpriteTimer, FROST_SPRITE_EVERY)
  assert.equal(g.hitFrostSprite(x, y), false, 'one sprite pays only once')

  const [hc, hr] = layoutCells(FROST_FRAME_GREENHOUSE, LAYOUT_HEATER)[1]!
  g.thawHeater(hc, hr)
  const heated = g.grid.findIndex((lamp, i) => {
    const c = i % COLS
    const r = Math.floor(i / COLS)
    return lamp?.kind === 'lamp' && Math.hypot(c - hc, r - hr) <= HEATER_RADIUS
  })
  assert.ok(heated >= 0, 'a lamp lies in the heater radius')
  const hx = (heated % COLS) * CELL + 4
  const hy = HUD + Math.floor(heated / COLS) * CELL + 4
  g.frostSprite = { x: hx - 1, y: hy, vx: 1 }
  g.updateFrostSprite()
  assert.notEqual(g.grid[heated]?.frosted, true, 'lit heat protects lamps')
  g.afterDeath()
  assert.equal(g.frostSprite, null, 'respawn clears the crossing threat')
  g.beginStep(gardenStart(7), 0, 40)
  g.frostSpriteTimer = 1
  g.updateFrostSprite()
  assert.equal(g.frostSprite, null, 'sprite does not leak into Snowball Hill')
}

{
  const g = make(90)
  g.beginStep(gardenStart(7), 0, 40)
  const heaters = layoutCells(SNOWBALL_HILL, LAYOUT_HEATER)
  for (const [col, row] of heaters) {
    const heater = at(g, col, row)
    g.grid[row * COLS + col + 1] = { hp: 1, kind: 'can' }
    g.grid[row * COLS + col + 2] = { hp: 1, kind: 'lamp' }
    g.splash(col + 1, row, 1)
    assert.equal(at(g, col, row), heater, 'sprinklers preserve fixtures')
    assert.equal(at(g, col + 2, row), null, 'ordinary lamps still bloom')
    g.beetle = {
      x: col * CELL + 4,
      y: HUD + row * CELL + 4,
      vx: 0,
      vy: 0,
      turn: 1000,
    }
    for (let i = 0; i < 500; i++) g.updateBeetle()
    assert.equal(at(g, col, row), heater, 'beetles preserve fixtures')
  }

  for (const [col, row] of heaters) g.grid[row * COLS + col] = null
  g.beginStep(campaignPlay(44).index, 0, 44)
  for (const [col, row] of heaters) {
    const heater = at(g, col, row)!
    assert.equal(heater.kind, 'heater', 'boss entry restores lost fixtures')
    g.water(col, row, heater)
    assert.equal(heater.lit, true)
  }
  const [col, row] = heaters[0]!
  g.water(col, row, at(g, col, row)!)
  assert.ok(g.frostMillipede.some((part) => part.thawed))
}

{
  const g = make(91)
  const bossStep = campaignPlay(44).index
  assert.ok(CAMPAIGN[bossStep]?.kind === 'boss')
  g.beginStep(bossStep, 0, 44)
  assert.equal(g.boss?.id, 'frost-millipede')
  const [hc, hr] = layoutCells(SNOWBALL_HILL, LAYOUT_HEATER)[1]!
  const heater = at(g, hc, hr)!
  assert.equal(heater.kind, 'heater')
  const first = g.frostMillipede[0]!
  assert.ok(g.hitFrostMillipede(first.x, first.y))
  assert.equal(g.frostMillipede.length, 4, 'cold armor resists spray')
  const hx = hc * CELL + CELL / 2
  const hy = HUD + hr * CELL + CELL / 2
  const fireHeater = () => {
    const beam = g.newBeam(hx, hy + CELL, false)
    for (let i = 0; i < 4; i++) if (!g.stepBeam(beam)) break
  }
  fireHeater()
  assert.equal(heater.lit, true)
  assert.ok(g.frostMillipede.every((p) => !p.thawed))
  fireHeater()
  const firstThawed = g.frostMillipede.find((p) => p.thawed)!
  assert.ok(firstThawed, 'real beam reflects through a lit heater')
  const shot = g.newBeam(firstThawed.x, firstThawed.y + 4, false)
  assert.equal(g.stepBeam(shot), false, 'real beam fixes a thawed segment')
  assert.equal(g.frostMillipede.length, 3)
  g.afterDeath()
  assert.equal(g.frostMillipede.length, 3, 'respawn preserves boss progress')
  for (let phase = 1; phase <= 3; phase++) {
    assert.equal(g.boss!.phase, phase)
    const count: number = g.frostMillipede.length
    assert.equal(count, phase === 1 ? 3 : phase + 3)
    for (let i = 0; i < count; i++) {
      g.water(hc, hr, heater)
      const target = g.frostMillipede.find((p) => p.thawed)!
      assert.ok(target, 'lit heater reflects heat onto a frozen segment')
      assert.ok(g.hitFrostMillipede(target.x, target.y))
    }
  }
  assert.ok(g.boss!.defeated)
  assert.equal(g.frostMillipede.length, 0)
  assert.ok(g.score >= 18000)
  g.update(emptyInput())
  assert.ok(g.clear > 0, 'fourth boss advances the campaign')
  assert.deepEqual(campaignPlay(45), { index: 0, lap: 1 })
  for (let i = 0; i < 200 && !g.shed; i++) g.update(emptyInput())
  assert.ok(g.shed, 'the last boss leads into the final shed')
  g.leaveShed()
  assert.equal(g.level, 45)
  assert.equal(g.lap, 1)
  assert.equal(g.garden.id, GARDENS[0]!.id)
  assert.equal(g.frostMillipede.length, 0)
}

{
  const g = make(93)
  g.beginStep(campaignPlay(44).index, 0, 44)
  g.boss!.phase = 3
  g.startFrostPhase()
  const part = g.frostMillipede[0]!
  g.px = part.x
  g.py = part.y
  const lives = g.lives
  g.checkHits()
  assert.equal(g.lives, lives - 1, 'the final coil costs a life on contact')
  assert.equal(
    g.frostMillipede.length,
    6,
    'collision does not reset boss armor',
  )
}

console.log('glitch garden winter mechanics: ok')
