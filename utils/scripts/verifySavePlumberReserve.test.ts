// Save the Plumber reserve box (t-005 Gen-2 scope: an SMW-style reserve item),
// played through the real update loop. A power picked up while she already
// carries one banks the old one in the reserve; a hit that costs her power
// drops the reserve from above, drifting down to her so she can catch it,
// and a drop she misses is gone after RESERVE_DROP_FRAMES. A heart hit never
// drops anything, a death keeps the reserve, and a seeded fuzz checks a drop
// never outlives its timer and never duplicates the banked power.
import assert from 'node:assert/strict'
import {
  HERO_HALF,
  HERO_TALL,
  PlumberRun,
  RESERVE_DROP_FRAMES,
} from '../arcade/games/savePlumberPreview'
import { TILE, type StageDef } from '../arcade/games/savePlumberLevels'
import { emptyInput } from '../arcade/types'

const options = {
  rng: () => 0.5,
  sound: { play() {} },
  demo: false,
  hiScore: 0,
}
const COLS = 60

/** A flat floor on row 21 with the given pickup glyphs on row 20. */
function powerLab(items: Record<number, string>): StageDef {
  const rows: string[] = []
  for (let row = 0; row < 24; row++) {
    const line = Array.from({ length: COLS }, () => '.')
    if (row >= 21) line.fill('#')
    if (row === 20) {
      line[3] = '@'
      for (const [col, glyph] of Object.entries(items))
        line[Number(col)] = glyph
      line[COLS - 3] = 'G'
    }
    rows.push(line.join(''))
  }
  return { code: '1-1', name: 'Reserve Lab', rows }
}

function labRun(def: StageDef) {
  const run = new PlumberRun(options, { customLevel: def })
  run.heroineSeed = 2
  for (let frame = 0; frame < 70; frame++) run.update(emptyInput())
  assert.equal(run.mode, 'play')
  return run
}
function idle(run: PlumberRun, frames: number) {
  for (let frame = 0; frame < frames; frame++) run.update(emptyInput())
}
function walkTo(run: PlumberRun, col: number, frames = 400) {
  const centre = col * TILE + TILE / 2
  for (let frame = 0; frame < frames; frame++) {
    if (Math.abs(run.hero.x - centre) < 4) break
    const input = emptyInput()
    if (run.hero.x < centre) input.held.right = true
    else input.held.left = true
    run.update(input)
  }
}
type Hurtable = { hurt(dir: number): void; die(): void; immune: number }
const hurt = (run: PlumberRun) => {
  const r = run as unknown as Hurtable
  r.immune = 0
  r.hurt(-1)
}
const drops = (run: PlumberRun) =>
  run.pickups.filter((p) => !p.taken && p.falling !== undefined)

// 1. A second power banks the first; the same power twice banks a spare.
{
  const run = labRun(powerLab({ 8: '1', 12: '2' }))
  assert.equal(run.reserve, null)
  walkTo(run, 8)
  assert.equal(run.power, 'springstep')
  assert.equal(run.reserve, null, 'a first power fills no reserve')
  walkTo(run, 12)
  assert.equal(run.power, 'bottled-storm')
  assert.equal(run.reserve, 'springstep', 'the old power is banked')

  const twin = labRun(powerLab({ 8: '3', 12: '3' }))
  walkTo(twin, 12)
  assert.equal(twin.power, 'pocket-lift')
  assert.equal(twin.reserve, 'pocket-lift', 'a duplicate becomes a spare')
}

// 2. A hit costs the power and drops the reserve; standing still catches it.
{
  const run = labRun(powerLab({ 8: '1', 12: '2' }))
  walkTo(run, 12)
  idle(run, 30)
  const hearts = run.hearts
  hurt(run)
  assert.equal(run.power, null, 'the hit costs the power')
  assert.equal(run.hearts, hearts, 'not a heart')
  assert.equal(run.reserve, null, 'the reserve is out of the box')
  const [drop] = drops(run)
  assert.ok(drop, 'the reserve drops')
  assert.equal(drop.kind, 'springstep')
  assert.ok(drop.y < run.hero.y, 'it starts above her')
  idle(run, 200)
  assert.equal(run.power, 'springstep', 'she catches the dropped reserve')
  assert.equal(drops(run).length, 0)
  // Another hit with an empty reserve drops nothing.
  hurt(run)
  assert.equal(run.power, null)
  assert.equal(drops(run).length, 0)
}

// 3. A drop steers toward her as she walks.
{
  const run = labRun(powerLab({ 8: '1', 12: '2' }))
  walkTo(run, 12)
  idle(run, 30)
  hurt(run)
  idle(run, 40)
  walkTo(run, 18, 160)
  idle(run, 200)
  assert.equal(run.power, 'springstep', 'the drop followed her')
}

// 4. A drop she outruns is gone once its timer runs out.
{
  const run = labRun(powerLab({ 8: '1', 12: '2' }))
  walkTo(run, 12)
  idle(run, 30)
  hurt(run)
  const [drop] = drops(run)
  assert.ok(drop)
  // Keep her far from it so it can never reach her.
  for (let frame = 0; frame < RESERVE_DROP_FRAMES + 5; frame++) {
    run.hero.x = drop.x + 200
    run.update(emptyInput())
  }
  assert.ok(drop.taken, 'the uncaught drop expired')
  assert.equal(run.power, null)
  assert.equal(run.reserve, null)
}

// 5. A heart hit drops nothing, and a death keeps the reserve.
{
  const run = labRun(powerLab({ 8: '1', 12: '2' }))
  walkTo(run, 12)
  ;(run as unknown as Hurtable).die()
  assert.equal(run.power, null, 'a death costs the power')
  assert.equal(run.reserve, 'springstep', 'the reserve survives a death')
  idle(run, 160)
  assert.equal(run.mode, 'play')
  const hearts = run.hearts
  hurt(run)
  assert.equal(run.hearts, hearts - 1, 'no power: the hit costs a heart')
  assert.equal(drops(run).length, 0, 'and the reserve stays banked')
  assert.equal(run.reserve, 'springstep')
}

// 6. Seeded fuzz: drops never outlive their timer and never outnumber the
// hits that cost a power, and she stays on the floor.
{
  let seed = 0x5eed
  const rand = () => {
    seed = (seed * 1103515245 + 12345) >>> 0
    return seed / 0x100000000
  }
  for (let trial = 0; trial < 12; trial++) {
    const items: Record<number, string> = {}
    for (let col = 6; col < COLS - 6; col += 3)
      if (rand() < 0.5) items[col] = '123'[Math.floor(rand() * 3)]!
    const run = labRun(powerLab(items))
    let powerHits = 0
    for (let frame = 0; frame < 1500 && run.mode === 'play'; frame++) {
      const input = emptyInput()
      input.held.right = rand() < 0.6
      input.held.left = !input.held.right && rand() < 0.3
      if (rand() < 0.05) input.pressed.a = true
      input.held.a = rand() < 0.4
      if (rand() < 0.01 && run.hearts > 1) {
        if (run.power && run.reserve) powerHits++
        hurt(run)
      }
      run.update(input)
      const live = drops(run)
      assert.ok(live.length <= powerHits, 'every drop came from a power hit')
      for (const drop of live)
        assert.ok(
          drop.falling! > 0 && drop.falling! <= RESERVE_DROP_FRAMES,
          'a live drop is within its timer',
        )
      assert.ok(
        run.hero.y + HERO_TALL <= 21 * TILE + 0.5,
        'she never sinks into the floor',
      )
      assert.ok(run.hero.x - HERO_HALF >= -0.5, 'she stays on the stage')
    }
  }
}

console.log('Save the Plumber reserve box: OK')
