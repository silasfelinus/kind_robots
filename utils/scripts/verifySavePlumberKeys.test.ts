// Save the Plumber brass keys and padlocked bolts (t-005 Gen-1 scope: carrying
// keys), played through the real update loop. She carries one key at a time,
// touching a bolt while holding one spends it and opens that whole bolt, a hit
// sends the key home, and a death reloads keys and bolts together. A seeded
// fuzz mashes every input around keys and bolts and checks she never ends
// inside a wall and never holds more than one key.
import assert from 'node:assert/strict'
import {
  HERO_HALF,
  HERO_TALL,
  PlumberRun,
} from '../arcade/games/savePlumberPreview'
import {
  CAMPAIGN,
  SOLID_LADDER,
  SOLID_LOCK,
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
const COLS = 44
const KEY_A = 8
const KEY_B = 12
const BOLT_A = 16
const BOLT_B = 24
const GOAL = 40

/** Two full-height bolts, two keys before them, a floor on row 21. */
function keyLab(keys = [KEY_A, KEY_B]): StageDef {
  const rows: string[] = []
  for (let row = 0; row < 24; row++) {
    const line = Array.from({ length: COLS }, () => '.')
    if (row >= 21) line.fill('#')
    if (row <= 20) {
      line[BOLT_A] = '['
      line[BOLT_B] = '['
    }
    if (row === 20) {
      line[3] = '@'
      for (const col of keys) line[col] = '0'
      line[GOAL] = 'G'
    }
    rows.push(line.join(''))
  }
  return { code: '1-1', name: 'Key Lab', rows }
}

function labRun(def = keyLab()) {
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
  (...keys: ('left' | 'right' | 'a')[]): Script =>
  (_frame, input) => {
    for (const key of keys) input.held[key] = true
  }

const boltCells = (run: PlumberRun, col: number) => {
  let n = 0
  for (let row = 0; row < run.stage.rows; row++)
    if (run.solidAt(col, row) === SOLID_LOCK) n++
  return n
}
/** Walk toward a column centre until she arrives or is stopped. */
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

// 1. The parser, the glyph list and the Maker palette all know keys and bolts.
{
  assert.ok(STAGE_GLYPHS.includes('0'), 'the parser accepts 0 as a key')
  assert.ok(STAGE_GLYPHS.includes('['), 'the parser accepts [ as a bolt')
  const stage = parseStage(keyLab())
  assert.equal(stage.solid[10 * stage.cols + BOLT_A], SOLID_LOCK)
  assert.equal(stage.spawns.filter((s) => s.kind === 'key').length, 2)
  const tiles = MAKER_GROUPS.flatMap((group) => group.tiles.map((t) => t.key))
  assert.ok(
    tiles.includes('0') && tiles.includes('['),
    'the Maker exposes both',
  )
}

// 2. Without a key a bolt is a wall, running, jumping or not.
{
  const run = labRun(keyLab([]))
  play(run, 240, (frame, input) => {
    input.held.right = true
    input.held.b = true
    if (frame % 40 === 0) input.pressed.a = true
    input.held.a = frame % 40 < 20
  })
  assert.ok(
    run.hero.x + HERO_HALF <= BOLT_A * TILE + 0.5,
    'she cannot pass a padlocked bolt',
  )
  assert.equal(boltCells(run, BOLT_A), 21)
  assert.equal(run.boltsOpened, 0)
}

// 3. Walking over a key picks it up; touching the bolt opens all of it.
{
  const run = labRun()
  walkTo(run, KEY_A)
  assert.equal(run.heldKey, run.keys[0], 'she holds the first key')
  assert.equal(run.keys[0]!.state, 'held')
  // Holding one key, she walks straight past the second.
  walkTo(run, KEY_B)
  assert.equal(run.heldKey, run.keys[0])
  assert.equal(run.keys[1]!.state, 'waiting', 'one key at a time')
  play(run, 120, hold('right'))
  assert.equal(boltCells(run, BOLT_A), 0, 'the whole bolt opened')
  assert.equal(run.keys[0]!.state, 'used')
  assert.equal(run.heldKey, null)
  assert.equal(run.boltsOpened, 1)
  assert.ok(run.hero.x > (BOLT_A + 1) * TILE, 'she walks through')
  // The second bolt still holds without a key.
  play(run, 160, hold('right'))
  assert.ok(run.hero.x + HERO_HALF <= BOLT_B * TILE + 0.5)
  assert.equal(boltCells(run, BOLT_B), 21)
  // Back for the second key, then through the second bolt to the goal.
  walkTo(run, KEY_B)
  assert.equal(run.heldKey, run.keys[1])
  play(run, 400, hold('right'))
  assert.equal(boltCells(run, BOLT_B), 0)
  assert.equal(run.boltsOpened, 2)
  assert.ok(
    run.mode !== 'play' || run.hero.x > (BOLT_B + 1) * TILE,
    'she reaches the goal side',
  )
}

// 4. A hit sends the held key back to where it started.
{
  const run = labRun(keyLab([KEY_A]))
  walkTo(run, KEY_A)
  walkTo(run, 14)
  assert.equal(run.heldKey, run.keys[0])
  ;(run as unknown as { hurt(dir: number): void }).hurt(-1)
  assert.equal(run.heldKey, null)
  assert.equal(run.keys[0]!.state, 'waiting')
  assert.equal(run.keys[0]!.x, KEY_A * TILE + TILE / 2)
  assert.equal(boltCells(run, BOLT_A), 21, 'the bolt stays shut')
  // She can fetch it again.
  play(run, 100)
  walkTo(run, KEY_A)
  assert.equal(run.heldKey, run.keys[0])
}

// 5. A death reloads keys and bolts with the stage.
{
  const run = labRun()
  walkTo(run, KEY_A)
  play(run, 120, hold('right'))
  assert.equal(boltCells(run, BOLT_A), 0)
  ;(run as unknown as { die(): void }).die()
  play(run, 120)
  assert.equal(run.mode, 'play')
  assert.equal(boltCells(run, BOLT_A), 21, 'the bolt is shut again')
  assert.equal(run.heldKey, null)
  assert.ok(run.keys.every((key) => key.state === 'waiting'))
  assert.equal(run.boltsOpened, 0)
}

// 6. A key in the air above a bolt opens it from below too (head bump).
{
  const rows = keyLab([]).rows.map((line) => line.split(''))
  // A low ceiling bolt over a corridor: rows 17..18 at cols 20..23 only.
  for (let row = 0; row <= 20; row++) rows[row]![BOLT_A] = '.'
  for (let row = 0; row <= 20; row++) rows[row]![BOLT_B] = '.'
  for (let col = 20; col <= 23; col++) rows[17]![col] = '['
  rows[20]![KEY_A] = '0'
  const def = {
    code: '1-1',
    name: 'Ceiling',
    rows: rows.map((r) => r.join('')),
  }
  const run = labRun(def)
  walkTo(run, KEY_A)
  assert.ok(run.heldKey)
  walkTo(run, 21)
  play(run, 30, (frame, input) => {
    if (frame === 0) input.pressed.a = true
    input.held.a = true
  })
  assert.equal(run.boltsOpened, 1, 'a jump into a bolt with a key opens it')
  for (let col = 20; col <= 23; col++) assert.equal(run.solidAt(col, 17), 0)
}

// 7. Real campaign 1-2: the lower race route stays open while the optional
//    high route requires taking a brass key up a rope ladder to open a bolt.
{
  const index = CAMPAIGN.findIndex((stage) => stage.code === '1-2')
  assert.ok(index >= 0, 'World 1-2 is in the campaign')
  const stage = parseStage(CAMPAIGN[index]!)
  assert.ok(
    stage.spawns.some(
      (spawn) => spawn.kind === 'key' && spawn.col === 35 && spawn.row === 18,
    ),
    'the optional route has a real, reachable key',
  )
  for (let row = 12; row <= 18; row++)
    assert.equal(
      stage.solid[row * stage.cols + 39],
      SOLID_LADDER,
      'a continuous ladder connects the lower and higher routes',
    )
  for (let row = 11; row <= 16; row++)
    assert.equal(
      stage.solid[row * stage.cols + 42],
      SOLID_LOCK,
      'the elevated passage begins locked',
    )
  assert.equal(
    stage.solid[18 * stage.cols + 42],
    0,
    'the lower speed route passes beneath the lock',
  )

  const run = new PlumberRun(options)
  run.loadStage(index)
  run.mode = 'play'
  run.hero.x = 35 * TILE + TILE / 2
  run.hero.y = 19 * TILE - HERO_TALL
  run.hero.vx = 0
  run.hero.vy = 0
  run.ground = true
  play(run, 3)
  assert.ok(run.heldKey, 'walking onto the campaign key collects it')
  walkTo(run, 39)
  play(run, 1, hold('up'))
  assert.equal(run.climbing, true, 'up grabs the campaign ladder')
  play(run, 90, hold('up'))
  assert.equal(run.climbing, false, 'the top rung releases the heroine')
  assert.ok(
    run.hero.y + HERO_TALL <= 12 * TILE + 1,
    'climbing reaches the high route',
  )
  let frames = 0
  while (!run.boltsOpened && frames++ < 90) play(run, 1, hold('right'))
  assert.equal(run.boltsOpened, 1, 'the real high route consumes one key')
  assert.equal(boltCells(run, 42), 0, 'opening the lock clears its full shaft')
  assert.equal(run.heldKey, null, 'the key is spent on this optional passage')
}

// 8. Seeded fuzz: never inside a wall (bolts included), never two keys.
{
  let seed = 0x5eed
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
  const buttons = ['left', 'right', 'up', 'down', 'a', 'b', 'x'] as const
  let opened = 0
  for (let trial = 0; trial < 40; trial++) {
    const run = labRun()
    const held: Partial<Record<(typeof buttons)[number], boolean>> = {}
    for (let frame = 0; frame < 900; frame++) {
      const input = emptyInput()
      if (frame % 8 === 0)
        for (const b of buttons) {
          const next = rand() < (b === 'right' ? 0.6 : 0.25)
          if (next && !held[b]) input.pressed[b] = true
          held[b] = next
        }
      for (const b of buttons) if (held[b]) input.held[b] = true
      run.update(input)
      if (run.mode !== 'play') continue
      const inHand = run.keys.filter((key) => key.state === 'held')
      assert.ok(inHand.length <= 1, 'never two keys at once')
      assert.equal(run.heldKey ?? null, inHand[0] ?? null)
      const hero = run.hero
      for (const x of [hero.x - HERO_HALF + 1, hero.x + HERO_HALF - 1])
        for (const y of [hero.y + 2, hero.y + HERO_TALL - 2]) {
          const s = run.solidAt(Math.floor(x / TILE), Math.floor(y / TILE))
          assert.notEqual(s, SOLID_LOCK, `inside a bolt (trial ${trial})`)
        }
    }
    opened += run.boltsOpened
  }
  assert.ok(opened > 0, 'the fuzz opened at least one bolt')
}

console.log('save-the-plumber keys and bolts: all checks passed')
