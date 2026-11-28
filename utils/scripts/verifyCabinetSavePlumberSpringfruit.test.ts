// Save the Plumber springfruit (conductor save-the-plumber t-005, GEN2-WORLDS.md
// world 3: "Bounce on springfruit", "Carry fruit to the switches"). Played
// through the real update loop: walking past a fruit does nothing, dropping
// onto it bounces her far higher than a jump, X lifts and tosses it, Down+X
// sets it at her feet, a fruit at rest weighs a scale plate, a hit drops it,
// one lost down a pit grows back home, and the Rootcellar tunnel now opens for
// a solo player who carries its fruit onto the plate.
import assert from 'node:assert/strict'
import { HERO_TALL, PlumberRun } from '../arcade/games/savePlumberPreview'
import {
  CAMPAIGN,
  SOLID_SLUICE,
  STAGE_GLYPHS,
  TILE,
  parseStage,
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

function lab(
  fruit: number,
  extra: (line: string[], row: number) => void = () => {},
): StageDef {
  const rows: string[] = []
  for (let row = 0; row < 24; row++) {
    const line = Array.from({ length: COLS }, () => '.')
    if (row >= 21) line.fill('#')
    if (row === 20) {
      line[3] = '@'
      line[fruit] = 'x'
      line[COLS - 3] = 'G'
    }
    extra(line, row)
    rows.push(line.join(''))
  }
  return { code: '3-1', name: 'Springfruit lab', rows }
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
function settle(run: PlumberRun, frames = 60) {
  for (let i = 0; i < frames; i++) frame(run)
}
/** The highest point (smallest y) her head reaches during one full jump. */
function peakOfJump(run: PlumberRun) {
  let peak = run.hero.y
  frame(run, ['a'], ['a'])
  for (let i = 0; i < 120; i++) {
    frame(run, ['a'])
    peak = Math.min(peak, run.hero.y)
  }
  return peak
}

// 0. The glyph parses and the Maker offers it.
assert.ok(STAGE_GLYPHS.includes('x'), 'the parser accepts x as springfruit')
assert.ok(MAKER_TILES.has('x'), 'the Maker palette offers springfruit')
assert.ok(
  parseStage(lab(20)).spawns.some((spawn) => spawn.kind === 'springfruit'),
)

// 1. Walking past does nothing; a plain jump is the baseline.
const plainPeak = (() => {
  const run = labRun(lab(20))
  assert.equal(run.fruits.length, 1)
  walkTo(run, 26)
  assert.ok(run.hero.x > 25 * TILE, 'she walks straight past the fruit')
  assert.equal(run.fruits[0]!.state, 'resting')
  return peakOfJump(run)
})()

// 2. Dropping onto it from above bounces her far higher than a jump.
{
  const run = labRun(lab(20))
  run.hero.x = 20 * TILE + TILE / 2
  run.hero.y = FLOOR - HERO_TALL - 48
  run.hero.vx = 0
  run.hero.vy = 0
  run.ground = false
  let peak = run.hero.y
  let bounced = false
  for (let i = 0; i < 120; i++) {
    frame(run, ['a'])
    if (run.hero.vy < -8) bounced = true
    peak = Math.min(peak, run.hero.y)
  }
  assert.ok(bounced, 'landing on springfruit launches her')
  assert.ok(
    peak < plainPeak - 32,
    `fruit bounce peak ${peak} clears a plain jump ${plainPeak} by two tiles`,
  )
  assert.equal(run.fruits[0]!.state, 'resting', 'the fruit stays put')
  assert.equal(run.hearts, 3)
}

// 3. X lifts it overhead, X tosses it ahead in an arc to land on the floor.
{
  const run = labRun(lab(20))
  walkTo(run, 18)
  assert.equal(run.facing, 1)
  frame(run, [], ['x'])
  assert.equal(run.heldFruit, run.fruits[0], 'X lifts the fruit')
  assert.equal(run.fruits[0]!.state, 'held')
  walkTo(run, 10)
  assert.equal(run.heldFruit, run.fruits[0], 'she carries it as she walks')
  assert.ok(run.fruits[0]!.y < run.hero.y + 2, 'it rides overhead')
  walkTo(run, 12)
  settle(run, 25)
  frame(run, [], ['x'])
  assert.equal(run.heldFruit, null)
  settle(run)
  const fruit = run.fruits[0]!
  assert.equal(fruit.state, 'resting')
  assert.equal(fruit.y, FLOOR, 'the tossed fruit comes to rest on the floor')
  assert.ok(
    fruit.x > run.hero.x + TILE * 2,
    'a toss carries it well ahead of her',
  )
}

// 4. Down+X sets it gently at her feet, and a wall stops a toss.
{
  const run = labRun(
    lab(20, (line, row) => {
      if (row >= 17 && row <= 20) line[26] = 'B'
    }),
  )
  walkTo(run, 18)
  frame(run, [], ['x'])
  assert.ok(run.heldFruit)
  walkTo(run, 23)
  settle(run, 25)
  frame(run, ['down'], ['x'])
  settle(run)
  const fruit = run.fruits[0]!
  assert.equal(fruit.state, 'resting')
  assert.ok(
    Math.abs(fruit.x - (run.hero.x + TILE * 0.75)) < 2,
    'Down+X sets it just ahead of her feet',
  )
  walkTo(run, 22)
  frame(run, ['right'])
  settle(run, 10)
  assert.equal(run.facing, 1)
  frame(run, [], ['x'])
  assert.ok(run.heldFruit)
  walkTo(run, 25)
  settle(run, 25)
  frame(run, [], ['x'])
  settle(run)
  assert.equal(fruit.state, 'resting')
  assert.ok(fruit.x < 26 * TILE, 'the wall stops the toss on her side')
  assert.equal(fruit.y, FLOOR)
}

// 5. A fruit at rest weighs a scale plate and lifts the sluice.
{
  const run = labRun(
    lab(8, (line, row) => {
      if (row >= 15 && row <= 20) line[SLUICE] = 'Z'
      if (row === 20) line[20] = '_'
    }),
  )
  assert.equal(run.plates[0]!.down, false)
  walkTo(run, 6)
  frame(run, [], ['x'])
  assert.ok(run.heldFruit)
  assert.equal(run.plates[0]!.down, false, 'a held fruit weighs nothing')
  walkTo(run, 19)
  settle(run, 25)
  frame(run, ['down'], ['x'])
  settle(run, 20)
  assert.equal(run.plates[0]!.down, true, 'the fruit holds the plate down')
  assert.equal(run.sluiceOpen, true)
  assert.equal(run.solidAt(SLUICE, 20), 0, 'the sluice lifts')
  for (let i = 0; i < 240; i++) frame(run, ['right'])
  assert.ok(run.hero.x > (SLUICE + 1) * TILE, 'she walks on through')
  assert.equal(run.sluiceOpen, true, 'the fruit keeps it open behind her')
}

// 6. A fruit tossed down a pit grows back where it started.
{
  const run = labRun(
    lab(8, (line, row) => {
      if (row >= 21) for (let col = 16; col <= 20; col++) line[col] = '.'
    }),
  )
  walkTo(run, 6)
  frame(run, [], ['x'])
  walkTo(run, 13)
  settle(run, 25)
  frame(run, [], ['x'])
  settle(run, 120)
  const fruit = run.fruits[0]!
  assert.equal(fruit.state, 'resting', 'the lost fruit is back')
  assert.equal(fruit.x, 8 * TILE + TILE / 2)
  assert.equal(fruit.y, FLOOR)
}

// 7. A hit loosens her grip: the fruit drops where she is.
{
  const run = labRun(lab(8))
  walkTo(run, 6)
  frame(run, [], ['x'])
  assert.ok(run.heldFruit)
  ;(run as unknown as { hurt(dir: number): void }).hurt(1)
  assert.equal(run.heldFruit, null)
  settle(run, 120)
  assert.equal(run.fruits[0]!.state, 'resting')
  assert.equal(run.fruits[0]!.y, FLOOR)
}

// 8. Rootcellar: a solo player carries the tunnel's fruit onto the plate.
{
  const rootcellar = CAMPAIGN.find((stage) => stage.code === '3-2')!
  const run = labRun(rootcellar)
  walkTo(run, 9)
  frame(run, [], ['down'])
  assert.ok(run.activePipeRoom)
  assert.equal(run.fruits.length, 1)
  assert.equal(run.solidAt(78, 7), SOLID_SLUICE)
  walkTo(run, 66)
  frame(run, [], ['x'])
  assert.ok(run.heldFruit, 'she lifts the tunnel fruit')
  walkTo(run, 69)
  settle(run, 25)
  frame(run, ['down'], ['x'])
  settle(run, 20)
  assert.equal(run.plates[0]!.down, true)
  assert.equal(run.sluiceOpen, true)
  const before = run.tokens
  walkTo(run, 84)
  assert.equal(run.tokens, before + 2, 'the opened route reaches both tokens')
  walkTo(run, 65)
  frame(run, [], ['down'])
  assert.equal(run.activePipeRoom, undefined, 'she leaves safely')
  assert.equal(run.deaths, 0)
  assert.equal(run.hearts, 3)
}

// 9. Apricot Slope (3-1) keeps its promise: springfruit grows up the hillside,
// each resting on solid ground, and the checkpoint fruit bounces her onto the
// row-14 terrace that a plain jump from the same spot cannot reach.
{
  const apricot = CAMPAIGN.find((stage) => stage.code === '3-1')!
  const homes = parseStage(apricot)
    .spawns.filter((spawn) => spawn.kind === 'springfruit')
    .sort((a, b) => a.col - b.col)
  assert.deepEqual(
    homes.map((spawn) => spawn.col),
    [60, 116, 166],
    'three fruits on the hillside',
  )
  for (const { col, row } of homes)
    assert.equal(
      apricot.rows[row + 1]![col],
      '#',
      `fruit ${col} rests on ground`,
    )
  const climb = (bounce: boolean) => {
    const run = labRun(apricot)
    assert.equal(run.fruits.length, 3)
    if (!bounce) run.fruits.length = 0
    run.hero.x = 116 * TILE + TILE / 2
    run.hero.y = 17 * TILE - HERO_TALL - (bounce ? 48 : 0)
    run.hero.vx = 0
    run.hero.vy = 0
    run.ground = !bounce
    frame(run, ['a'], ['a'])
    for (let i = 0; i < 5; i++) frame(run, ['a'])
    for (let i = 0; i < 200; i++) frame(run, ['a', 'right'])
    assert.ok(run.ground, 'she lands')
    assert.equal(run.hearts, 3)
    return (run.hero.y + HERO_TALL) / TILE
  }
  assert.equal(climb(false), 16, 'a plain jump only tops the first step')
  assert.equal(climb(true), 14, 'the fruit bounce lands her on the terrace')
}

console.log('save-the-plumber springfruit ok')
