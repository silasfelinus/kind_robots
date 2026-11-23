// Save the Plumber rope ladders (t-005 Gen-1 scope: ladders and climbing),
// played through the real update loop. Up or down grabs a ladder, there is no
// gravity while she holds on, A hops off, the top rung is a one-way ledge and
// climbing down onto a floor lets go. A seeded fuzz mashes every input on and
// around ladders and checks she never ends inside a wall or clinging to air.
import assert from 'node:assert/strict'
import { HERO_TALL, PlumberRun } from '../arcade/games/savePlumberPreview'
import {
  SOLID_LADDER,
  STAGE_GLYPHS,
  TILE,
  parseStage,
  type StageDef,
} from '../arcade/games/savePlumberLevels'
import { MAKER_GROUPS } from '../arcade/games/savePlumberMaker'
import { emptyInput, type InputFrame } from '../arcade/types'

const options = {
  rng: () => 0.5,
  sound: { play() {} },
  demo: false,
  hiScore: 0,
}
const COLS = 40
const LADDER_COL = 10
const TOP_ROW = 13
const FLOOR = 21 * TILE

/**
 * A ladder in column 10 from row 13 down to the floor line (row 20), and a
 * block shelf whose top is level with the top rung (row 13) to its right.
 */
function ladderLab(): StageDef {
  const rows: string[] = []
  for (let row = 0; row < 24; row++) {
    const line = Array.from({ length: COLS }, () => '.')
    if (row >= 21) line.fill('#')
    if (row >= TOP_ROW && row <= 20) line[LADDER_COL] = '|'
    if (row >= TOP_ROW && row <= 20)
      for (let col = 11; col < 20; col++) line[col] = 'B'
    if (row === 20) line[3] = '@'
    if (row === 20) line[36] = 'G'
    rows.push(line.join(''))
  }
  return { code: '1-1', name: 'Ladder Lab', rows }
}

function labRun(def = ladderLab()) {
  const run = new PlumberRun(options, { customLevel: def })
  run.heroineSeed = 2
  for (let frame = 0; frame < 70; frame++) run.update(emptyInput())
  assert.equal(run.mode, 'play')
  return run
}

type Script = (frame: number, input: InputFrame) => void
function play(run: PlumberRun, frames: number, script: Script = () => {}) {
  for (let frame = 0; frame < frames; frame++) {
    const input = emptyInput()
    script(frame, input)
    run.update(input)
  }
}
const hold =
  (...keys: ('up' | 'down' | 'left' | 'right')[]): Script =>
  (_frame, input) => {
    for (const key of keys) input.held[key] = true
  }

/** Walk to the ladder's column and stop there. */
function toLadder(run: PlumberRun, col = LADDER_COL) {
  const centre = col * TILE + TILE / 2
  for (let frame = 0; frame < 300; frame++) {
    if (Math.abs(run.hero.x - centre) < 4 && Math.abs(run.hero.vx) < 0.3) break
    const input = emptyInput()
    if (run.hero.x < centre - 3) input.held.right = true
    else if (run.hero.x > centre + 3) input.held.left = true
    run.update(input)
  }
  assert.ok(Math.abs(run.hero.x - centre) < 6, 'she reached the ladder')
  assert.ok(run.ground, 'she stands at the ladder foot')
}

const standingTop = TOP_ROW * TILE - HERO_TALL
const standingFloor = FLOOR - HERO_TALL

// 1. The parser, the glyph list and the Maker palette all know the ladder.
{
  assert.ok(STAGE_GLYPHS.includes('|'), 'the parser accepts | as a ladder')
  const stage = parseStage(ladderLab())
  assert.equal(stage.solid[15 * stage.cols + LADDER_COL], SOLID_LADDER)
  const tiles = MAKER_GROUPS.flatMap((group) => group.tiles.map((t) => t.key))
  assert.ok(tiles.includes('|'), 'the Maker exposes the ladder tile')
}

// 2. Walking past a ladder never grabs it: only up or down does.
{
  const run = labRun()
  toLadder(run)
  play(run, 40)
  assert.equal(run.climbing, false)
  assert.equal(run.hero.y, standingFloor)
}

// 3. Up climbs to the top rung and stands her on it; she can walk off onto the shelf.
{
  const run = labRun()
  toLadder(run)
  play(run, 1, hold('up'))
  assert.equal(run.climbing, true, 'up grabs the ladder')
  let frames = 0
  while (run.climbing && frames++ < 200) play(run, 1, hold('up'))
  assert.equal(run.climbing, false, 'she climbs off the top')
  assert.equal(run.ground, true)
  assert.equal(run.hero.y, standingTop, 'she stands on the top rung')
  // Still holding up at the top neither re-grabs nor sinks her into the rung.
  play(run, 20, hold('up'))
  assert.equal(run.hero.y <= standingTop, true)
  play(run, 60)
  assert.equal(run.hero.y, standingTop, 'the top rung holds her like a ledge')
  play(run, 40, hold('right'))
  assert.equal(
    run.hero.y,
    standingTop,
    'she walks from the rung onto the shelf',
  )
  assert.ok(run.hero.x > (LADDER_COL + 1) * TILE)
}

// 4. No gravity on the rope: letting go of up leaves her where she is.
{
  const run = labRun()
  toLadder(run)
  play(run, 25, hold('up'))
  assert.equal(run.climbing, true)
  const y = run.hero.y
  play(run, 90)
  assert.equal(run.climbing, true)
  assert.equal(run.hero.y, y, 'she hangs still with no input')
}

// 5. A hops off: upward, no longer climbing, and she falls back to the floor.
{
  const run = labRun()
  toLadder(run)
  play(run, 25, hold('up'))
  const y = run.hero.y
  play(run, 1, (_f, input) => {
    input.pressed.a = true
    input.held.a = true
  })
  assert.equal(run.climbing, false, 'A lets go')
  assert.ok(run.hero.y < y, 'the hop lifts her')
  play(run, 120)
  assert.equal(run.climbing, false)
  assert.equal(run.hero.y, standingFloor, 'she lands on the floor')
}

// 6. Down from the top rung grabs it again and climbs down to the floor.
{
  const run = labRun()
  toLadder(run)
  let frames = 0
  while (run.hero.y !== standingTop && frames++ < 300) play(run, 1, hold('up'))
  play(run, 10)
  play(run, 1, hold('down'))
  assert.equal(run.climbing, true, 'down on the top rung grabs it')
  frames = 0
  while (run.climbing && frames++ < 300) play(run, 1, hold('down'))
  assert.equal(run.climbing, false, 'the floor ends the climb')
  assert.equal(run.ground, true)
  assert.equal(run.hero.y, standingFloor)
}

// 7. Shuffling sideways off the rope drops her: she never clings to air.
{
  const run = labRun()
  toLadder(run)
  play(run, 20, hold('up'))
  assert.equal(run.climbing, true)
  play(run, 40, hold('left'))
  assert.equal(run.climbing, false, 'off the rope she falls')
  play(run, 90)
  assert.equal(run.hero.y, standingFloor)
}

// 8. Jumping up past a ladder holding up catches it mid-air.
{
  const run = labRun()
  toLadder(run)
  play(run, 1, (_f, input) => {
    input.pressed.a = true
    input.held.a = true
  })
  assert.equal(run.climbing, false, 'A at the ladder foot is a jump')
  play(run, 8, (_f, input) => {
    input.held.a = true
  })
  play(run, 1, hold('up'))
  assert.equal(run.climbing, true, 'up mid-jump catches the rope')
}

// 9. Seeded fuzz: every input on and around the ladder. She is never inside a
//    block, never "climbing" with no ladder in her column, never below the floor.
{
  let seed = 0x5eed1add
  const rand = () => {
    seed = (seed * 1103515245 + 12345) >>> 0
    return seed / 2 ** 32
  }
  const run = labRun()
  let climbs = 0
  let tops = 0
  for (let frame = 0; frame < 40_000; frame++) {
    if (run.mode !== 'play') break
    const input = emptyInput()
    const pick = rand()
    input.held.up = pick < 0.35
    input.held.down = pick > 0.75
    input.held.left = rand() < 0.2
    input.held.right = !input.held.left && rand() < 0.25
    if (rand() < 0.04) {
      input.pressed.a = true
      input.held.a = true
    }
    input.pressed.up = input.held.up && rand() < 0.1
    input.pressed.down = input.held.down && rand() < 0.1
    run.update(input)
    const hero = run.hero
    const col = Math.floor(hero.x / TILE)
    if (run.climbing) {
      climbs++
      assert.equal(col, LADDER_COL, `frame ${frame}: climbing off the rope`)
    }
    if (run.ground && hero.y === standingTop && col === LADDER_COL) tops++
    assert.ok(hero.y + HERO_TALL <= FLOOR + 0.01, `frame ${frame}: below floor`)
    // The shelf is solid blocks: she can stand on it, never inside it.
    if (col >= 11 && col < 20)
      assert.ok(
        hero.y + HERO_TALL <= TOP_ROW * TILE + 0.01,
        `frame ${frame}: inside the shelf at ${hero.x},${hero.y}`,
      )
  }
  assert.ok(climbs > 1000, `the fuzz spent time on the ladder (${climbs})`)
  assert.ok(tops > 0, 'the fuzz reached the top rung')
}

// 10. A free-standing ladder (open air both sides) and a ladder with its wall on
//     the LEFT both climb to the top rung and back down to the floor.
for (const variant of ['open', 'wall-left'] as const) {
  const rows: string[] = []
  const col = 25
  for (let row = 0; row < 24; row++) {
    const line = Array.from({ length: COLS }, () => '.')
    if (row >= 21) line.fill('#')
    if (row >= TOP_ROW && row <= 20) {
      line[col] = '|'
      if (variant === 'wall-left') for (let c = 21; c < col; c++) line[c] = 'B'
    }
    if (row === 20) line[3] = '@'
    if (row === 20) line[36] = 'G'
    rows.push(line.join(''))
  }
  const run = labRun({ code: '1-1', name: `Ladder Lab ${variant}`, rows })
  if (variant === 'wall-left') {
    // Reach the foot over the shelf: climb it from the right side instead.
    run.hero.x = (col + 1) * TILE + TILE / 2
    play(run, 30)
  }
  toLadder(run, col)
  assert.equal(Math.floor(run.hero.x / TILE), col, `${variant}: at the ladder`)
  let frames = 0
  play(run, 1, hold('up'))
  assert.equal(run.climbing, true, `${variant}: grabbed`)
  while (run.climbing && frames++ < 300) play(run, 1, hold('up'))
  assert.equal(run.hero.y, standingTop, `${variant}: stands on the top rung`)
  play(run, 30)
  assert.equal(run.hero.y, standingTop, `${variant}: the rung holds`)
  play(run, 1, hold('down'))
  assert.equal(run.climbing, true, `${variant}: down grabs from the top`)
  frames = 0
  while (run.climbing && frames++ < 300) play(run, 1, hold('down'))
  assert.equal(run.hero.y, standingFloor, `${variant}: back on the floor`)
}

console.log(
  'Save the Plumber ladders verified: grab with up/down only, no gravity on the rope, A hops off, top rung ledge, climb down to floor, side shuffle drops, mid-air catch, open and wall-left ladders, 40k-frame fuzz',
)
