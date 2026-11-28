// Save the Plumber scale plates and sluice gates (conductor save-the-plumber
// t-005, GEN2-WORLDS.md: Ballast Boots hold scale plates down; Gurgle can be
// parked on one while she goes on alone). Played through the real update loop:
// light feet do nothing, the boots hold a plate only while she stands on it,
// a parked Gurgle holds it for good, a Pocket Lift crate set down on a plate
// holds it until lifted off again, two plates need both weights, and a gate
// never drops onto the heroine.
import assert from 'node:assert/strict'
import { HERO_TALL, PlumberRun } from '../arcade/games/savePlumberPreview'
import {
  CAMPAIGN,
  SOLID_CRATE,
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
function plateLab(plates: number[], barrel?: number, crate?: number): StageDef {
  const rows: string[] = []
  for (let row = 0; row < 24; row++) {
    const line = Array.from({ length: COLS }, () => '.')
    if (row >= 21) line.fill('#')
    if (row >= 15 && row <= 20) line[SLUICE] = 'Z'
    if (row === 20) {
      line[3] = '@'
      for (const col of plates) line[col] = '_'
      if (crate !== undefined) line[crate] = 'c'
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

// 7. Carried weight: a Pocket Lift crate thrown onto a plate holds it down
// while she walks on alone; one that misses the plate does nothing, and
// lifting the crate back off releases the plate and drops the sluice.
const crates = (run: PlumberRun) => {
  const found: string[] = []
  for (let col = 0; col < COLS; col++)
    for (let row = 0; row < 24; row++)
      if (run.solidAt(col, row) === SOLID_CRATE) found.push(`${col},${row}`)
  return found
}
function liftCrate(run: PlumberRun, crate: number) {
  run.power = 'pocket-lift'
  walkTo(run, crate - 2)
  frame(run, [], ['x'])
  for (let i = 0; i < 25; i++) frame(run)
  assert.equal(run.carrying, true, 'the Pocket Lift picks the crate up')
  assert.deepEqual(crates(run), [])
}
function throwFrom(run: PlumberRun, col: number) {
  walkTo(run, col)
  assert.equal(run.facing, 1)
  frame(run, [], ['x'])
  for (let i = 0; i < 60; i++) frame(run)
  assert.equal(run.carrying, false)
}
{
  const run = labRun(plateLab([20], undefined, 8))
  assert.equal(
    run.plates[0]!.down,
    false,
    'a crate off the plate weighs nothing',
  )
  liftCrate(run, 8)
  throwFrom(run, 14)
  assert.deepEqual(crates(run), ['20,20'], 'the crate lands on the plate')
  assert.equal(run.plates[0]!.down, true, 'the crate weighs the plate down')
  assert.equal(run.sluiceOpen, true)
  assert.equal(run.solidAt(SLUICE, 20), 0, 'the sluice lifts')
  // Climb the crate and walk on through while it holds the plate.
  frame(run, ['right', 'a'], ['a'])
  for (let i = 0; i < 40; i++) frame(run, ['right', 'a'])
  walkRight(run, 240)
  assert.ok(pastSluice(run), 'she walks on through the lifted sluice')
  assert.equal(run.sluiceOpen, true, 'the crate keeps it open behind her')
  assert.equal(run.hearts, 3)
}
{
  const run = labRun(plateLab([20], undefined, 8))
  liftCrate(run, 8)
  throwFrom(run, 16)
  const landed = crates(run)
  assert.equal(landed.length, 1)
  assert.ok(
    Number(landed[0]!.split(',')[0]) > 20,
    'an overthrow lands past the plate',
  )
  assert.equal(
    run.plates[0]!.down,
    false,
    'a crate beside the plate does nothing',
  )
  assert.equal(run.sluiceOpen, false)
}
{
  const run = labRun(plateLab([20], undefined, 8))
  liftCrate(run, 8)
  throwFrom(run, 14)
  assert.equal(run.sluiceOpen, true)
  // Lift it straight back off the plate: the plate rises and the gate drops.
  walkTo(run, 18)
  assert.equal(run.facing, 1)
  frame(run, [], ['x'])
  for (let i = 0; i < 25; i++) frame(run)
  assert.equal(run.carrying, true, 'the crate comes back off the plate')
  assert.equal(run.plates[0]!.down, false)
  assert.equal(run.sluiceOpen, false, 'lifting the crate drops the sluice')
  assert.ok(sluiceSolid(run))
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

// Echo Sluice (6-3): an optional pipe-linked chamber where two plates must
// both be weighed. One fruit on one plate leaves the full-height sluice shut;
// carrying the second fruit onto the second plate lifts it, the seven-token
// cache lies beyond, and the pipe home stays open throughout.
const echo = CAMPAIGN.find((stage) => stage.code === '6-3')!
function carryFruit(run: PlumberRun, from: number, to: number) {
  walkTo(run, from - 3)
  walkTo(run, from - 2)
  assert.equal(run.facing, 1)
  frame(run, [], ['x'])
  assert.ok(run.heldFruit, 'she lifts the chamber fruit at ' + from)
  walkTo(run, to - 1)
  for (let i = 0; i < 25; i++) frame(run)
  assert.equal(run.facing, 1)
  frame(run, ['down'], ['x'])
  for (let i = 0; i < 20; i++) frame(run)
  assert.equal(run.heldFruit, null, 'she sets the fruit down on ' + to)
}
{
  const run = labRun(echo)
  assert.equal(run.plates.length, 2, 'Echo Sluice has two chamber plates')
  walkTo(run, 12)
  assert.ok(run.ground)
  frame(run, [], ['down'])
  assert.ok(run.activePipeRoom, 'the ground pipe leads into the chamber')
  assert.equal(run.hero.x, 33 * TILE + TILE / 2)
  for (let row = 2; row <= 7; row++)
    assert.equal(run.solidAt(49, row), SOLID_SLUICE, 'full-height sluice')
  // Unweighted: neither walking nor jumping gets past the sluice.
  walkTo(run, 46)
  for (let i = 0; i < 90; i++)
    frame(run, ['right', 'a'], i % 30 === 0 ? ['a'] : [])
  assert.ok(run.hero.x < 49 * TILE, 'the shut sluice seals the cache')
  carryFruit(run, 36, 38)
  assert.equal(run.plates.filter((plate) => plate.down).length, 1)
  assert.equal(run.sluiceOpen, false, 'one echo is not enough')
  carryFruit(run, 41, 43)
  assert.ok(run.plates.every((plate) => plate.down))
  assert.equal(run.sluiceOpen, true, 'both plates lift the sluice')
  const before = run.tokens
  walkTo(run, 58)
  assert.equal(run.tokens, before + 7, 'the cache holds seven tokens')
  walkTo(run, 33)
  frame(run, [], ['down'])
  assert.equal(run.activePipeRoom, undefined, 'she leaves the chamber safely')
  assert.equal(run.deaths, 0)
  assert.equal(run.hearts, 3)
}

// Moonpool Locks (2-3): the canal gates open backwards. The ground pipe
// leads into a lock chamber whose sluice seals a cache right behind the
// arrival pipe; the only plate lies across the lock basin. She takes the
// Tidecoat, swims across, weighs the far plate (springfruit solo, or a
// parked Gurgle) and swims back to the now-open cache.
const moonpool = CAMPAIGN.find((stage) => stage.code === '2-3')!
function swimTo(run: PlumberRun, col: number) {
  // Basin spans columns 42-49; swim (jump held) until she lands on the far bank.
  const right = col > 45
  const banked = () =>
    run.ground && (right ? run.hero.x > 50 * TILE : run.hero.x < 42 * TILE)
  for (let i = 0; i < 400 && !banked(); i++) {
    frame(run, [right ? 'right' : 'left', 'a'])
    assert.equal(run.mode, 'play', 'the lock basin is safe to swim')
  }
  for (let i = 0; i < 30; i++) frame(run)
  assert.ok(banked(), 'she climbs out onto the bank toward ' + col)
  walkTo(run, col)
}
for (const mounted of [false, true]) {
  const run = labRun(
    mounted ? { ...moonpool, gurgleBarrel: { col: 6, row: 20 } } : moonpool,
  )
  if (mounted) {
    walkTo(run, 6)
    frame(run, ['down'], ['x'])
    assert.equal(run.gurgle?.state, 'mounted')
  }
  assert.equal(run.plates.length, 1, 'Moonpool Locks has one lock plate')
  walkTo(run, 10)
  assert.ok(run.ground)
  frame(run, [], ['down'])
  assert.ok(run.activePipeRoom, 'the ground pipe leads into the lock')
  assert.equal(run.hero.x, 36 * TILE + TILE / 2)
  for (let row = 2; row <= 7; row++)
    assert.equal(run.solidAt(34, row), SOLID_SLUICE, 'full-height lock gate')
  // The cache is right behind her, but the shut gate keeps it.
  const before = run.tokens
  for (let i = 0; i < 90; i++)
    frame(run, ['left', 'a'], i % 30 === 0 ? ['a'] : [])
  assert.ok(run.hero.x > 35 * TILE, 'the shut lock gate seals the cache')
  assert.equal(run.tokens, before)
  walkTo(run, 39)
  assert.equal(run.power, 'tidecoat', 'the lock supplies the Tidecoat')
  swimTo(run, 52)
  if (mounted) {
    walkTo(run, 56)
    frame(run, ['down'], ['x'])
    assert.equal(run.gurgle?.state, 'parked', 'Gurgle waits on the plate')
  } else {
    carryFruit(run, 54, 56)
  }
  assert.equal(run.plates[0]!.down, true)
  assert.equal(run.sluiceOpen, true, 'the far plate opens the gate behind')
  walkTo(run, 62)
  assert.equal(run.tokens, before + 2, 'the far bank holds two tokens')
  swimTo(run, 40)
  walkTo(run, 31)
  assert.equal(run.tokens, before + 5, 'the cache behind the pipe pays out')
  assert.equal(run.sluiceOpen, true, 'the weight stays on the plate')
  walkTo(run, 36)
  frame(run, [], ['down'])
  assert.equal(run.activePipeRoom, undefined, 'she leaves the lock safely')
  assert.equal(run.deaths, 0)
  assert.equal(run.hearts, 3)
}

console.log(
  'save-the-plumber scale plates and Rootcellar, Echo Sluice and Moonpool lock chambers ok',
)
