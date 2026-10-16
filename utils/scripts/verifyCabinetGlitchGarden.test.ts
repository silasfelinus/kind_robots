// Glitch Garden depth slice 1, part 1 (conductor kr-arcade/t-088): the slime snail glitches lamps,
// a worm meeting a glitched lamp plunges to the flowerbed, side-crawlers join a worm that lingers
// in the bed, lamps creep down between waves, the beetle's speed is capped and every wave has its
// own palette.
//
//   npx tsx utils/scripts/verifyCabinetGlitchGarden.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { ARCADE_GAMES } from '../arcade/games'
import {
  BEETLE_SPEED_CAP_WAVE,
  SNAIL_WAVE,
  START_LAMPS,
  WAVE_PALETTES,
  beetleSpeed,
  create,
  paletteFor,
} from '../arcade/games/glitchGarden'
import { emptyInput } from '../arcade/types'

assert.ok(ARCADE_GAMES.some((g) => g.slug === 'glitch-garden'))
assert.equal(START_LAMPS, 34)

// The beetle's speed rises, then stops.
assert.ok(beetleSpeed(5) > beetleSpeed(2))
assert.equal(beetleSpeed(BEETLE_SPEED_CAP_WAVE), beetleSpeed(99))

// Every wave has a palette, and neighbouring waves differ.
assert.ok(WAVE_PALETTES.length >= 4)
assert.notEqual(paletteFor(1).worm, paletteFor(2).worm)
assert.equal(paletteFor(1), paletteFor(1 + WAVE_PALETTES.length))

type Cell = { hp: number; kind: 'lamp' | 'sprout'; glitched?: boolean } | null
type Worm = {
  trail: Array<{ x: number; y: number }>
  segments: number
  dx: 1 | -1
  dy: 1 | -1
  plunge?: boolean
  crawler?: boolean
}
type Probe = {
  score: number
  level: number
  lives: number
  over: boolean
  grid: Cell[]
  worms: Worm[]
  snail: { x: number; y: number; vx: number } | null
  update(input: ReturnType<typeof emptyInput>): void
  startWave(wave: number): void
  creepLamps(): void
}

const COLS = 30
const ROWS = 36
const BED_TOP = 30
const CELL = 8
const HUD = 16
const sound = { play() {} }
const make = (seed: number, demo = false) =>
  create({
    rng: mulberry32(seed),
    sound,
    demo,
    hiScore: 0,
  } as unknown as Parameters<typeof create>[0]) as unknown as Probe

const lampsIn = (g: Probe, from: number, to: number) => {
  let n = 0
  for (let r = from; r < to; r++)
    for (let c = 0; c < COLS; c++) if (g.grid[r * COLS + c]) n++
  return n
}

// Creep: lamps in the upper lawn drop a row between waves; none sink into the bed unreplaced.
{
  const g = make(3)
  g.grid.fill(null)
  g.grid[5 * COLS + 4] = { hp: 4, kind: 'lamp', glitched: true }
  g.grid[(BED_TOP - 1) * COLS + 9] = { hp: 4, kind: 'lamp' }
  g.creepLamps()
  assert.equal(g.grid[5 * COLS + 4], null)
  assert.ok(
    g.grid[6 * COLS + 4]?.glitched,
    'a glitched lamp creeps down intact',
  )
  assert.equal(lampsIn(g, BED_TOP, ROWS), 0, 'lamps never creep into the bed')
  assert.equal(
    lampsIn(g, 1, 4),
    1,
    'the lamp that sank is replanted near the top',
  )
}

// The snail crosses from wave 3 and glitches the lamps it touches.
{
  const g = make(11)
  g.grid.fill(null)
  g.startWave(SNAIL_WAVE)
  g.worms = []
  assert.equal(g.snail, null)
  let seen = false
  for (let i = 0; i < 2400 && !seen; i++) {
    if (g.snail) {
      // Plant a lamp right in its path.
      const col = Math.floor(g.snail.x / CELL) + (g.snail.vx > 0 ? 3 : -3)
      const row = Math.floor((g.snail.y - HUD) / CELL)
      if (col >= 0 && col < COLS && !g.grid[row * COLS + col])
        g.grid[row * COLS + col] = { hp: 4, kind: 'lamp' }
      seen = true
    }
    g.update(emptyInput())
  }
  assert.ok(seen, 'a snail arrives')
  for (let i = 0; i < 1500 && g.snail; i++) g.update(emptyInput())
  assert.equal(g.snail, null, 'the snail crosses and leaves')
  assert.ok(
    g.grid.some((c) => c?.glitched),
    'the lamp in its path was glitched',
  )
}
{
  const g = make(11)
  g.startWave(2)
  for (let i = 0; i < 2400; i++) {
    g.worms = []
    g.update(emptyInput())
    assert.equal(g.snail, null, 'no snail before its wave')
  }
}

// A worm that meets a glitched lamp plunges straight down to the bed.
{
  const g = make(5)
  g.grid.fill(null)
  g.worms = []
  const row = 4
  g.grid[row * COLS + 10] = { hp: 4, kind: 'lamp', glitched: true }
  g.worms.push({
    trail: [{ x: 8 * CELL, y: HUD + row * CELL }],
    segments: 1,
    dx: 1,
    dy: 1,
  })
  const w = g.worms[0]!
  let plunged = false
  for (let i = 0; i < 600; i++) {
    g.worms = [w]
    g.update(emptyInput())
    if (w.plunge) plunged = true
    const head = w.trail[0]!
    if ((head.y - HUD) / CELL >= BED_TOP) break
  }
  assert.ok(plunged, 'the worm started a plunge')
  const head = w.trail[0]!
  assert.ok((head.y - HUD) / CELL >= BED_TOP, 'and landed in the flowerbed')
  assert.ok(
    head.x < 14 * CELL,
    'dropping nearly straight down, not along the row',
  )
}
// A plain lamp still just turns the worm.
{
  const g = make(5)
  g.grid.fill(null)
  g.grid[4 * COLS + 10] = { hp: 4, kind: 'lamp' }
  g.worms = [
    { trail: [{ x: 8 * CELL, y: HUD + 4 * CELL }], segments: 1, dx: 1, dy: 1 },
  ]
  const w = g.worms[0]!
  for (let i = 0; i < 40; i++) {
    g.worms = [w]
    g.update(emptyInput())
  }
  assert.ok(!w.plunge)
  assert.ok(
    (w.trail[0]!.y - HUD) / CELL <= 6,
    'a plain lamp only turns the worm',
  )
}

// Side-crawlers join a worm that lingers in the bed, up to a cap.
{
  const g = make(9)
  g.grid.fill(null)
  g.startWave(1)
  g.worms = [
    {
      trail: [{ x: 4 * CELL, y: HUD + (BED_TOP + 1) * CELL }],
      segments: 1,
      dx: 1,
      dy: 1,
    },
  ]
  let crawlers = 0
  for (let i = 0; i < 2500; i++) {
    g.update(emptyInput())
    // Keep the real worm in the bed and the sprayer alive.
    g.lives = 3
    crawlers = Math.max(crawlers, g.worms.filter((w) => w.crawler).length)
  }
  assert.ok(crawlers >= 1, 'a crawler entered')
  assert.ok(crawlers <= 2, 'no more than the cap')
}

// Runs still end, deterministically, and the attract demo scores 0.
for (const seed of [1, 2, 3]) {
  const a = make(seed)
  const b = make(seed)
  let ticks = 0
  while (!a.over && ticks < 200_000) {
    const input = emptyInput()
    input.held.a = true
    input.held.left = (ticks >> 6) % 2 === 0
    input.held.right = !input.held.left
    a.update(input)
    b.update(input)
    ticks++
  }
  assert.ok(a.over, `seed ${seed} ends`)
  assert.equal(a.score, b.score)
  assert.equal(a.level, b.level)
}
{
  const d = make(4, true)
  for (let i = 0; i < 20_000; i++) d.update(emptyInput())
  assert.equal(d.score, 0)
}

console.log('glitch garden: ok')
