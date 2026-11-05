import assert from 'node:assert/strict'
import {
  HERO_HALF,
  HERO_TALL,
  PlumberRun,
  type PlumberPower,
} from '../arcade/games/savePlumberPreview'
import {
  CAMPAIGN,
  SOLID_BELT_LEFT,
  SOLID_BELT_RIGHT,
  SOLID_BLOCK,
  SOLID_CRATE,
  SOLID_FRAGILE_ICE,
  SOLID_GATE,
  SOLID_GROUND,
  SOLID_ICE,
  SOLID_LEDGE,
  SOLID_PIPE,
  SOLID_SNOWBANK,
  TILE,
  type StageDef,
} from '../arcade/games/savePlumberLevels'
import { emptyInput, type InputFrame } from '../arcade/types'

const VIEW_W = 480
const VIEW_H = 270
const JUMP_VY = -8.6
const WALLS = new Set([
  SOLID_GROUND,
  SOLID_ICE,
  SOLID_SNOWBANK,
  SOLID_FRAGILE_ICE,
  SOLID_BLOCK,
  SOLID_GATE,
  SOLID_PIPE,
  SOLID_CRATE,
  SOLID_BELT_LEFT,
  SOLID_BELT_RIGHT,
])
const options = {
  rng: () => 0.5,
  sound: { play() {} },
  demo: false,
  hiScore: 0,
}

const blank = '.'.repeat(80)
const lab: StageDef = {
  code: '1-1',
  name: 'Replay Lab',
  rows: [
    ...Array.from({ length: 20 }, () => blank),
    '..@...........................K...............................................G.',
    ...Array.from(
      { length: 3 },
      () => '#'.repeat(40) + '.'.repeat(8) + '#'.repeat(32),
    ),
  ],
}
const PIT_EDGE = 40 * TILE
const FLOOR = 21 * TILE

function labRun() {
  const run = new PlumberRun(options, { customLevel: lab })
  run.heroineSeed = 0
  const idle = emptyInput()
  for (let frame = 0; frame < 4; frame++) run.update(idle)
  return run
}

type Script = (frame: number, input: InputFrame) => void

function replay(
  run: PlumberRun,
  frames: number,
  script: Script,
  each: (frame: number) => void = () => {},
) {
  const input = emptyInput()
  const trace: { x: number; y: number; vy: number; ground: boolean }[] = []
  for (let frame = 0; frame < frames; frame++) {
    input.pressed = emptyInput().pressed
    script(frame, input)
    run.update(input)
    const { x, y, vy } = run.hero
    trace.push({ x, y, vy, ground: run.ground })
    each(frame)
  }
  return trace
}

function embedded(run: PlumberRun) {
  const hero = run.hero
  const top = run.heroTop + 1
  const bottom = hero.y + HERO_TALL - 1
  const left = hero.x - HERO_HALF + 1
  const right = hero.x + HERO_HALF - 1
  for (
    let row = Math.floor(top / TILE);
    row <= Math.floor(bottom / TILE);
    row++
  )
    for (
      let col = Math.floor(left / TILE);
      col <= Math.floor(right / TILE);
      col++
    )
      if (WALLS.has(run.solidAt(col, row))) return `${col},${row}`
  return null
}

const runRight: Script = (_, input) => {
  input.held.right = true
}
const settle = replay(labRun(), 4, () => {})
assert.equal(settle.at(-1)!.ground, true, 'the lab start stands on the floor')
assert.equal(settle.at(-1)!.y + HERO_TALL, FLOOR, 'feet rest on the floor')

const walkOff = replay(labRun(), 400, runRight)
const firstStep = walkOff.findIndex((step) => step.ground)
const leave = walkOff.findIndex(
  (step, frame) => frame > firstStep && !step.ground,
)
assert.ok(leave > 0, 'running right walks her off the pit edge')
assert.ok(
  walkOff[leave]!.x - HERO_HALF + 1 > PIT_EDGE,
  'she leaves the ground only once her whole foot is past the edge',
)
assert.ok(walkOff[leave]!.vy >= 0, 'walking off is a fall, not a jump')

const coyote = (late: number) =>
  replay(labRun(), leave + late + 2, (frame, input) => {
    input.held.right = true
    if (frame === leave + late) {
      input.pressed.a = true
      input.held.a = true
    }
  })
const COYOTE_FRAMES = 6
for (let late = 0; late <= COYOTE_FRAMES; late++) {
  const step = coyote(late)[leave + late]!
  assert.ok(
    step.vy < -8,
    `a jump ${late} frames after leaving the edge still fires (coyote time)`,
  )
}
assert.ok(
  coyote(COYOTE_FRAMES + 1)[leave + COYOTE_FRAMES + 1]!.vy >= 0,
  'past the coyote window the press does nothing',
)

const hop = replay(labRun(), 120, (frame, input) => {
  if (frame === 0) {
    input.pressed.a = true
    input.held.a = true
  } else input.held.a = frame < 40
})
const land = hop.findIndex((step, frame) => frame > 2 && step.ground)
assert.ok(land > 10, 'a standing jump lands back on the floor')
assert.equal(
  hop[land]!.y + HERO_TALL,
  FLOOR,
  'the landing snaps feet to the floor',
)
assert.equal(hop[land]!.vy, 0, 'a landing zeroes vertical speed')
const apex = Math.min(...hop.map((step) => step.y))
assert.ok(FLOOR - HERO_TALL - apex > 3 * TILE, 'a held jump clears three tiles')

const tap = replay(labRun(), 60, (frame, input) => {
  input.pressed.a = frame === 0
  input.held.a = frame === 0
})
assert.ok(
  hop[0]!.vy < -8 && tap[0]!.vy < -8 && tap[1]!.vy < 0 && tap[1]!.vy > -3.4,
  'releasing A cuts the rise (variable height)',
)
assert.ok(
  Math.min(...tap.map((step) => step.y)) > apex + TILE,
  'a tapped jump is clearly lower than a held one',
)

const buffered = (early: number) =>
  replay(labRun(), land + 20, (frame, input) => {
    if (frame === 0 || frame === land - early) {
      input.pressed.a = true
      input.held.a = true
    } else input.held.a = frame < 40
  })
const BUFFER_FRAMES = 5
for (let early = 1; early <= BUFFER_FRAMES; early++) {
  const trace = buffered(early)
  assert.ok(
    trace[land - early]!.vy > 0 &&
      (trace[land]!.vy < 0 || trace[land + 1]!.vy < 0),
    `A pressed ${early} frames before landing jumps on touchdown (buffer)`,
  )
}
{
  const trace = buffered(BUFFER_FRAMES + 1)
  assert.ok(
    trace.slice(land, land + 6).every((step) => step.vy >= 0),
    'a press far ahead of the landing is not remembered',
  )
}

{
  const run = labRun()
  const trace = replay(run, 90, (_, input) => {
    input.held.left = true
    input.held.b = true
  })
  assert.ok(
    trace.every((step) => step.x >= HERO_HALF),
    'the stage edge holds her in',
  )
  assert.ok(run.camera === 0 && run.cameraY >= 0, 'camera clamps at the left')
}

{
  const run = labRun()
  const maxX = lab.rows[0]!.length * TILE - VIEW_W
  const maxY = lab.rows.length * TILE - VIEW_H
  const deaths: number[] = []
  const spawns: { x: number; y: number }[] = []
  let wasDying = false
  for (let frame = 0; frame < 1200 && !run.over; frame++) {
    const input = emptyInput()
    input.held.right = true
    run.update(input)
    assert.ok(
      run.camera >= 0 && run.camera <= maxX + 1e-9,
      `camera x stays in the stage (frame ${frame}: ${run.camera})`,
    )
    assert.ok(
      run.cameraY >= 0 && run.cameraY <= maxY + 1e-9,
      `camera y stays in the stage (frame ${frame}: ${run.cameraY})`,
    )
    if (run.mode === 'dying' && !wasDying) deaths.push(frame)
    if (run.mode === 'play' && wasDying) {
      spawns.push({ x: run.hero.x, y: run.hero.y })
      assert.equal(run.hearts, 3, 'a respawn restores her hearts')
      assert.ok(run.immune > 0, 'a respawn grants a moment of immunity')
      assert.equal(embedded(run), null, 'a respawn never lands inside a tile')
    }
    wasDying = run.mode === 'dying'
  }
  assert.equal(deaths.length, 3, 'three falls into the pit cost three lives')
  assert.equal(run.over, true, 'the third loss ends the game')
  assert.equal(run.lives, 0)
  assert.equal(spawns.length, 2)
  const flag = run.checkpoints[0]!
  for (const spawn of spawns) {
    assert.equal(spawn.x, flag.x, 'she respawns at the reached checkpoint')
    assert.equal(spawn.y + HERO_TALL, flag.y, 'standing on its floor')
  }
}

{
  const run = new PlumberRun(options)
  run.heroineSeed = 0
  run.loadStage(0)
  run.mode = 'play'
  replay(run, 200, (_, input) => {
    if (run.hero.x < 270) {
      input.held.down = true
      input.held.right = true
    }
  })
  assert.equal(run.ducking, true, '1-1: she slides under the low pillar')
  assert.equal(embedded(run), null)
  replay(
    run,
    30,
    (frame, input) => {
      if (frame === 0) input.pressed.a = true
      input.held.a = frame < 10
    },
    (frame) =>
      assert.equal(
        embedded(run),
        null,
        `1-1 frame ${frame}: a jump under the low pillar never stands her up inside it`,
      ),
  )
  assert.equal(
    run.ducking,
    true,
    'she stays crouched while the pillar is over her',
  )
  const exit = replay(run, 120, (_, input) => {
    input.held.right = true
  })
  assert.ok(
    exit.at(-1)!.x > 18 * TILE + HERO_HALF,
    '1-1: after the bonk she can still crawl out past the pillar',
  )
}

for (let index = 0; index < CAMPAIGN.length; index++) {
  const run = new PlumberRun(options)
  run.loadStage(index)
  const code = CAMPAIGN[index]!.code
  const spots = [
    { x: run.checkpoint.x, y: run.checkpoint.y + HERO_TALL, label: 'start' },
    ...run.checkpoints.map((flag, k) => ({
      ...flag,
      label: `checkpoint ${k}`,
    })),
  ]
  for (const spot of spots) {
    run.hero = { x: spot.x, y: spot.y - HERO_TALL, vx: 0, vy: 0 }
    assert.equal(embedded(run), null, `${code} ${spot.label} is open space`)
    const under = run.solidAt(
      Math.floor(spot.x / TILE),
      Math.floor(spot.y / TILE),
    )
    assert.ok(
      WALLS.has(under) || under === SOLID_LEDGE,
      `${code} ${spot.label} respawns on solid footing, not over a pit or bridge`,
    )
  }
}

function standable(run: PlumberRun, col: number, row: number) {
  const floor = run.solidAt(col, row)
  return (
    (WALLS.has(floor) || floor === SOLID_LEDGE) &&
    floor !== SOLID_GATE &&
    run.solidAt(col, row - 1) === 0 &&
    run.solidAt(col, row - 2) === 0
  )
}

function vaultAttempts(
  index: number,
  from: number[],
  dir: 1 | -1,
  setup: (run: PlumberRun) => void,
  escaped: (run: PlumberRun) => boolean,
  lowest = 2,
) {
  let attempts = 0
  const probe = new PlumberRun(options)
  probe.loadStage(index)
  for (const col of from)
    for (let row = lowest; row < probe.stage.rows; row++) {
      if (!standable(probe, col, row)) continue
      for (let heroine = 0; heroine < 8; heroine++)
        for (const special of [0, 14]) {
          const run = new PlumberRun(options)
          run.heroineSeed = heroine
          run.loadStage(index)
          run.mode = 'play'
          run.power = 'springstep'
          run.hero = {
            x: col * TILE + 8,
            y: row * TILE - HERO_TALL,
            vx: 0,
            vy: 0,
          }
          setup(run)
          const input = emptyInput()
          for (let frame = 0; frame < 110 && run.mode === 'play'; frame++) {
            input.pressed = emptyInput().pressed
            input.held.right = dir > 0
            input.held.left = dir < 0
            input.held.b = input.held.a = input.held.y = true
            input.pressed.a = frame === 2
            input.pressed.y = special > 0 && frame === 2 + special
            run.update(input)
            attempts++
            assert.ok(
              !escaped(run),
              `${CAMPAIGN[index]!.code}: heroine ${heroine} vaulted a barrier from ${col},${row}`,
            )
          }
        }
    }
  return attempts
}

let escapeAttempts = 0
for (let index = 0; index < CAMPAIGN.length; index++) {
  const probe = new PlumberRun(options)
  probe.loadStage(index)
  for (let gate = 0; gate < probe.stage.cols; gate++) {
    if (probe.solidAt(gate, 1) !== SOLID_GATE) continue
    const from = Array.from({ length: 14 }, (_, k) => gate - 14 + k)
    escapeAttempts += vaultAttempts(
      index,
      from,
      1,
      () => {},
      (run) =>
        run.hero.x > (gate + 1) * TILE + HERO_HALF &&
        run.solidAt(gate, 1) === SOLID_GATE,
    )
  }
  const bossGate = probe.stage.gate
  if (bossGate === null) continue
  const from = Array.from({ length: 10 }, (_, k) => bossGate + 3 + k)
  escapeAttempts += vaultAttempts(
    index,
    from,
    -1,
    (run) => {
      const x = run.hero.x
      run.hero.x = (bossGate + 3) * TILE + HERO_HALF
      run.update(emptyInput())
      assert.equal(
        run.locked,
        true,
        `${CAMPAIGN[index]!.code}: the arena locks`,
      )
      run.hero.x = x
    },
    (run) => run.hero.x < (bossGate + 1) * TILE + HERO_HALF,
    12,
  )
}
assert.ok(escapeAttempts > 10000, 'the barrier battery actually ran')

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const POWERS: (PlumberPower | null)[] = [
  null,
  'springstep',
  'bottled-storm',
  'pocket-lift',
]
const FUZZ_FRAMES = 2400
let fuzzFrames = 0
for (let index = 0; index < CAMPAIGN.length; index++) {
  const code = CAMPAIGN[index]!.code
  for (let heroine = 0; heroine < 8; heroine++) {
    const random = mulberry32(index * 131 + heroine * 7 + 1)
    const run = new PlumberRun(options)
    run.heroineSeed = heroine
    run.loadStage(index)
    run.mode = 'play'
    run.power = POWERS[(index + heroine) % POWERS.length]!
    const input = emptyInput()
    let hold = 0
    let jitter = false
    let dying = 0
    let lastCol = Math.floor(run.hero.x / TILE)
    for (let frame = 0; frame < FUZZ_FRAMES && !run.over; frame++) {
      if (hold-- <= 0) {
        hold = 4 + Math.floor(random() * 36)
        const dir = random()
        jitter = random() < 0.08
        input.held.right = dir < 0.6
        input.held.left = dir > 0.8
        input.held.b = random() < 0.4
        input.held.down = random() < 0.12
        input.held.a = random() < 0.5
        input.held.y = random() < 0.15
      }
      if (jitter) {
        input.held.right = frame % 2 === 0
        input.held.left = !input.held.right
      }
      input.pressed = emptyInput().pressed
      input.pressed.a = random() < 0.12
      input.pressed.x = random() < 0.05
      input.pressed.y = random() < 0.05
      input.pressed.down = random() < 0.02
      run.update(input)
      fuzzFrames++
      const mode: string = run.mode
      dying = mode === 'dying' ? dying + 1 : 0
      assert.ok(
        dying <= 81,
        `${code} heroine ${heroine}: a death always resolves`,
      )
      if (run.mode !== 'play') continue
      const where = `${code} heroine ${heroine} frame ${frame}`
      const hero = run.hero
      for (const value of [
        hero.x,
        hero.y,
        hero.vx,
        hero.vy,
        run.camera,
        run.cameraY,
        run.score,
      ])
        assert.ok(Number.isFinite(value), `${where}: every number stays finite`)
      const width = run.stage.cols * TILE
      assert.ok(
        hero.x >= HERO_HALF - 0.5 && hero.x <= width - HERO_HALF + 0.5,
        `${where}: she stays inside the stage walls`,
      )
      const col = Math.floor(hero.x / TILE)
      if (col !== lastCol) {
        const crossed = col > lastCol ? lastCol + 1 : col
        if (run.solidAt(crossed, 1) === SOLID_GATE)
          assert.fail(
            `${where}: she crossed closed valve gate column ${crossed} at y=${hero.y.toFixed(1)}`,
          )
        lastCol = col
      }
      const clip = embedded(run)
      assert.equal(
        clip,
        null,
        `${where}: her hitbox never sits inside tile ${clip}`,
      )
      const maxX = Math.max(0, width - VIEW_W)
      assert.ok(
        run.camera >= -1e-9 && run.camera <= maxX + 1e-9,
        `${where}: camera stays inside the stage`,
      )
      assert.ok(
        run.hearts >= 0 && run.hearts <= 3 && run.lives >= 0,
        `${where}: hearts and lives stay in range`,
      )
      if (run.locked && run.stage.gate !== null)
        assert.ok(
          hero.x > (run.stage.gate + 1) * TILE + HERO_HALF,
          `${where}: nothing carries her back across a locked boss gate`,
        )
    }
    assert.ok(
      ['play', 'dying', 'clear', 'victory', 'over'].includes(run.mode),
      `${code} heroine ${heroine}: the run ends in a live state (${run.mode})`,
    )
  }
}

console.log(
  `Save the Plumber movement replay verified: coyote ${COYOTE_FRAMES + 1} frames, buffer ${BUFFER_FRAMES} frames, landing, camera bounds, respawn, ${CAMPAIGN.length} stage respawn points, ${fuzzFrames} adversarial fuzz frames`,
)
