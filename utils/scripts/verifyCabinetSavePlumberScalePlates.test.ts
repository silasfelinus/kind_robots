// Save the Plumber scale plates and sluice gates (conductor save-the-plumber
// t-005, GEN2-WORLDS.md: Ballast Boots hold scale plates down; Gurgle can be
// parked on one while she goes on alone). Played through the real update loop:
// light feet do nothing, the boots hold a plate only while she stands on it,
// a parked Gurgle holds it for good, two plates need both weights, and a gate
// never drops onto the heroine.
import assert from 'node:assert/strict'
import { HERO_TALL, PlumberRun } from '../arcade/games/savePlumberPreview'
import {
  CAMPAIGN,
  SOLID_SLUICE,
  STAGE_GLYPHS,
  TILE,
  type StageDef,
} from '../arcade/games/savePlumberLevels'
import { MAKER_TILES } from '../arcade/games/savePlumberMaker'
import { emptyInput, type ArcadeButton } from '../arcade/types'

const options = {
  rng: () => 0.5,
  sound: { play() {} },
  demo: false,
  hiScore: 0,
}
const COLS = 60
const FLOOR = 21 * TILE
const SLUICE = 30

/** Flat floor, a sluice wall at column 30 (rows 15-20), plates on row 20. */
function plateLab(plates: number[], barrel?: number): StageDef {
  const rows: string[] = []
  for (let row = 0; row < 24; row++) {
    const line = Array.from({ length: COLS }, () => '.')
    if (row >= 21) line.fill('#')
    if (row >= 15 && row <= 20) line[SLUICE] = 'Z'
    if (row === 20) {
      line[3] = '@'
      for (const col of plates) line[col] = '_'
      line[COLS - 3] = 'G'
    }
    rows.push(line.join(''))
  }
  return {
    code: '2-1',
    name: 'Scale plate lab',
    rows,
    ...(barrel === undefined ? {} : { gurgleBarrel: { col: barrel, row: 20 } }),
  }
}

function labRun(def: StageDef) {
  const run = new PlumberRun(options, { customLevel: def })
  run.heroineSeed = 2
  for (let i = 0; i < 70; i++) run.update(emptyInput())
  assert.equal(run.mode, 'play')
  return run
}
function frame(
  run: PlumberRun,
  held: ArcadeButton[] = [],
  pressed: ArcadeButton[] = [],
) {
  const input = emptyInput()
  for (const key of held) input.held[key] = true
  for (const key of pressed) input.pressed[key] = true
  run.update(input)
}
function walkTo(run: PlumberRun, col: number, frames = 400) {
  const centre = col * TILE + TILE / 2
  for (let i = 0; i < frames; i++) {
    if (Math.abs(run.hero.x - centre) < 3) break
    frame(run, [run.hero.x < centre ? 'right' : 'left'])
  }
  for (let i = 0; i < 10; i++) frame(run)
}
function walkRight(run: PlumberRun, frames: number) {
  for (let i = 0; i < frames; i++) frame(run, ['right'])
}
const sluiceSolid = (run: PlumberRun) =>
  run.solidAt(SLUICE, 20) === SOLID_SLUICE
const pastSluice = (run: PlumberRun) => run.hero.x > (SLUICE + 1) * TILE

// 0. Both symbols parse and are in the Maker palette.
assert.ok(STAGE_GLYPHS.includes('_'), 'the parser accepts _ as a scale plate')
assert.ok(STAGE_GLYPHS.includes('Z'), 'the parser accepts Z as a sluice gate')
assert.ok(MAKER_TILES.has('_') && MAKER_TILES.has('Z'))

// 1. Light feet do nothing: the plate stays up and the sluice stays shut.
{
  const run = labRun(plateLab([20]))
  assert.equal(run.plates.length, 1)
  walkTo(run, 20)
  assert.equal(run.plates[0]!.down, false, 'bare boots do not press a plate')
  assert.ok(sluiceSolid(run))
  walkRight(run, 240)
  assert.ok(!pastSluice(run), 'the shut sluice blocks her')
  assert.ok(run.hero.x < SLUICE * TILE)
}

// 2. Ballast Boots hold the plate down only while she stands on it.
{
  const run = labRun(plateLab([20]))
  run.power = 'ballast'
  walkTo(run, 20)
  assert.equal(run.ground, true)
  assert.equal(run.plates[0]!.down, true, 'Ballast Boots press the plate')
  assert.equal(run.sluiceOpen, true)
  assert.equal(run.solidAt(SLUICE, 20), 0, 'the sluice lifts')
  walkTo(run, 25)
  assert.equal(run.plates[0]!.down, false)
  assert.equal(run.sluiceOpen, false, 'stepping off drops the sluice')
  assert.ok(sluiceSolid(run))
}

// 3. A parked Gurgle holds the plate down for good; she goes on alone.
{
  const run = labRun(plateLab([20], 5))
  assert.ok(run.gurgle)
  walkTo(run, 5)
  frame(run, ['down'], ['x'])
  assert.equal(run.gurgle.state, 'mounted')
  walkTo(run, 20)
  frame(run, ['down'], ['x'])
  assert.equal(run.gurgle.state, 'parked')
  frame(run)
  assert.equal(run.plates[0]!.down, true, 'Gurgle weighs the plate down')
  assert.equal(run.sluiceOpen, true)
  walkRight(run, 240)
  assert.ok(pastSluice(run), 'she walks on through the lifted sluice')
  assert.equal(run.sluiceOpen, true, 'Gurgle keeps it open behind her')
  assert.equal(run.hearts, 3)
}

// 4. Two plates need both weights: Gurgle on one and the boots on the other.
{
  const run = labRun(plateLab([12, 20], 5))
  run.power = 'ballast'
  walkTo(run, 5)
  frame(run, ['down'], ['x'])
  assert.equal(run.gurgle!.state, 'mounted')
  walkTo(run, 12)
  frame(run, ['down'], ['x'])
  assert.equal(run.gurgle!.state, 'parked')
  frame(run)
  assert.equal(run.plates[0]!.down, true)
  assert.equal(run.sluiceOpen, false, 'one plate of two is not enough')
  walkTo(run, 20)
  assert.equal(run.plates[1]!.down, true)
  assert.equal(run.sluiceOpen, true, 'both plates lift the sluice')
}

// 5. The sluice never drops onto the heroine: it waits until she is clear.
{
  const run = labRun(plateLab([20]))
  run.power = 'ballast'
  walkTo(run, 20)
  assert.equal(run.sluiceOpen, true)
  run.hero.x = SLUICE * TILE + TILE / 2
  run.hero.y = FLOOR - HERO_TALL
  run.hero.vx = 0
  run.hero.vy = 0
  for (let i = 0; i < 5; i++) frame(run)
  assert.equal(run.plates[0]!.down, false)
  assert.equal(run.sluiceOpen, true, 'the gate holds while she is under it')
  walkRight(run, 30)
  for (let i = 0; i < 5; i++) frame(run)
  assert.ok(pastSluice(run))
  assert.equal(run.sluiceOpen, false, 'it drops once she is clear')
  assert.equal(run.mode, 'play')
}

// 6. A fresh stage starts with every plate up and every sluice shut.
{
  const run = labRun(plateLab([20], 20))
  assert.equal(run.gurgle!.state, 'parked')
  frame(run)
  assert.equal(
    run.sluiceOpen,
    true,
    'a barrel on a plate weighs it from the start',
  )
  const fresh = labRun(plateLab([20]))
  assert.equal(fresh.sluiceOpen, false)
  assert.ok(fresh.plates.every((plate) => !plate.down))
}

const rootcellar = CAMPAIGN.find((stage) => stage.code === '3-2')!
function enterRootTunnel(run: PlumberRun) {
  walkTo(run, 9)
  assert.ok(run.ground)
  frame(run, [], ['down'])
  assert.equal(run.hero.x, 65 * TILE + TILE / 2)
  assert.ok(run.activePipeRoom)
}

{
  const run = labRun(rootcellar)
  enterRootTunnel(run)
  walkTo(run, 70)
  assert.equal(run.plates[0]!.down, false)
  assert.equal(run.solidAt(78, 7), SOLID_SLUICE)
  walkRight(run, 90)
  assert.ok(run.hero.x < 78 * TILE, 'unweighted gate blocks walking')
  walkTo(run, 65)
  frame(run, [], ['down'])
  assert.equal(run.activePipeRoom, undefined, 'solo player can leave safely')
  assert.equal(run.deaths, 0)
}

{
  const run = labRun({
    ...rootcellar,
    gurgleBarrel: { col: 2, row: 20 },
  })
  frame(run, ['down'], ['x'])
  assert.equal(run.gurgle?.state, 'mounted')
  enterRootTunnel(run)
  walkTo(run, 70)
  frame(run, ['down'], ['x'])
  assert.equal(run.gurgle?.state, 'parked')
  assert.equal(run.plates[0]!.down, true)
  assert.equal(run.sluiceOpen, true)
  const before = run.tokens
  walkTo(run, 84)
  assert.equal(run.tokens, before + 2, 'opened route reaches both tokens')
  walkTo(run, 70)
  frame(run, ['down'], ['x'])
  assert.equal(run.gurgle?.state, 'mounted')
  assert.equal(run.sluiceOpen, false)
  walkTo(run, 65)
  frame(run, [], ['down'])
  assert.equal(run.activePipeRoom, undefined)
  assert.equal(run.deaths, 0)
  assert.equal(run.hearts, 3)
}

console.log('save-the-plumber scale plates and Rootcellar tunnel ok')
