// Save the Plumber adversarial interaction battery (t-005): enemies, carried
// crates, thieves, valves and powers, played through the real update loop.
// Each scripted case pins a defect found while hunting softlocks; the seeded
// fuzz at the end leans on every interaction system across all 32 stages.
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
const COLS = 60
const FLOOR = 21 * TILE

/** A one-screen lab: `row` is the floor-level line (row 20), solid ground below. */
function lab(row: string, code = '1-1', above: string[] = []): StageDef {
  const blank = '.'.repeat(COLS)
  const lines = [...above.map((line) => line.padEnd(COLS, '.'))]
  while (lines.length < 20) lines.unshift(blank)
  return {
    code,
    name: 'Interaction Lab',
    rows: [
      ...lines,
      row.padEnd(COLS, '.'),
      ...Array.from({ length: 3 }, () => '#'.repeat(COLS)),
    ],
  }
}

function labRun(def: StageDef) {
  const run = new PlumberRun(options, { customLevel: def })
  run.heroineSeed = 2
  for (let frame = 0; frame < 70; frame++) run.update(emptyInput())
  assert.equal(run.mode, 'play')
  assert.equal(run.immune, 0, 'the lab settles past the spawn immunity')
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
const press =
  (key: 'a' | 'x' | 'y'): Script =>
  (frame, input) => {
    input.pressed[key] = frame === 0
    input.held[key] = frame === 0
  }
/** Walk (B held runs) until `done`, at most `limit` frames. */
function walkUntil(
  run: PlumberRun,
  dir: 1 | -1,
  done: () => boolean,
  limit = 400,
) {
  for (let frame = 0; frame < limit && !done(); frame++) {
    const input = emptyInput()
    input.held.right = dir > 0
    input.held.left = dir < 0
    run.update(input)
  }
  assert.ok(done(), 'the walk reached its mark')
  play(run, 12)
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

/** Every lantern step belongs to a lantern that is lying flat right now. */
function phantomSteps(run: PlumberRun) {
  return run.platforms.filter((p) => {
    if (p.kind !== 'lantern') return false
    const owner = run.foes.find((foe) => foe.pad === p)
    return !owner || owner.state !== 'flat' || owner.fade > 0
  }).length
}

/** How far ahead of her a thrown crate comes down on a lantern lying flat. */
const THROW = 90

// 1. A flattened moss lantern knocked out by a thrown crate takes its step
//    with it. Before the fix the step stayed as an invisible floor in mid-air.
{
  const run = labRun(lab('..@.....l...........c', '3-1'))
  run.power = 'pocket-lift'
  const lantern = run.foes[0]!
  walkUntil(run, 1, () => run.hero.x >= lantern.x - 34)
  play(run, 1, press('x'))
  assert.equal(lantern.state, 'flat', 'the wrench flattens the lantern')
  assert.equal(run.platforms.length, 1, 'a flat lantern is a step')
  walkUntil(run, 1, () => run.hero.x >= 19 * TILE - 2)
  play(run, 1, press('x'))
  assert.equal(run.carrying, true, 'Pocket Lift picks up the crate')
  walkUntil(run, -1, () => run.hero.x <= lantern.x + THROW)
  play(run, 1, press('x'))
  assert.equal(run.thrown.length, 1, 'X throws the crate')
  play(run, 40)
  const hit = lantern.fade > 0 || lantern.state === 'gone'
  assert.ok(hit, 'the thrown crate knocks out the flat lantern')
  play(run, 40)
  assert.equal(lantern.state, 'gone')
  assert.equal(phantomSteps(run), 0, 'no invisible lantern step is left')
  assert.equal(lantern.pad, null)
}

// 1b. The same holds when the boss arena locks with a flat lantern inside it.
{
  const run = labRun(lab('..@.......X.l.............M...', '3-4'))
  const lantern = run.foes[0]!
  walkUntil(run, 1, () => run.hero.x >= lantern.x - 34, 600)
  play(run, 1, press('x'))
  assert.equal(lantern.state, 'flat')
  assert.equal(run.locked, false, 'flattened from outside the open arena')
  assert.equal(run.platforms.length, 1)
  walkUntil(run, 1, () => run.locked, 200)
  assert.equal(lantern.state, 'gone', 'the lock clears the stray lantern')
  assert.equal(run.platforms.length, 0, 'and leaves no step behind')
}

// 1c. A thief that fled into the arena hands its tokens back when it locks.
{
  const run = labRun(lab('..@.......X..........u....M...', '3-4'))
  const gull = run.foes[0]!
  gull.carry = 5
  run.tokens = 10
  walkUntil(run, 1, () => run.locked, 600)
  assert.equal(gull.state, 'gone', 'the lock clears the stray thief')
  assert.equal(run.tokens, 15, 'and its loot drops back to her')
}

// 2. A thief keeps its loot inside the stage, so "catch it and it drops them
//    all" stays true. Before the fix it flew off the edge with the tokens.
{
  const run = labRun(lab('..@......u'))
  run.tokens = 20
  const gull = run.foes[0]!
  gull.x = run.hero.x + 4
  gull.y = run.hero.y + 12
  play(run, 1)
  assert.equal(gull.carry, 5, 'the gull takes five tokens')
  assert.equal(run.tokens, 15)
  play(run, 3000)
  const width = run.stage.cols * TILE
  assert.ok(
    gull.x >= TILE && gull.x <= width - TILE,
    `the fleeing gull is cornered inside the stage (x=${gull.x.toFixed(0)})`,
  )
  assert.equal(gull.carry, 5, 'and still has the tokens')
  run.power = 'bottled-storm'
  walkUntil(run, 1, () => run.hero.x >= gull.x - 80, 900)
  for (let tries = 0; tries < 40 && gull.carry; tries++) {
    play(run, 1, press('x'))
    play(run, 24)
  }
  assert.equal(gull.carry, 0, 'cornered, it can be caught')
  assert.equal(run.tokens, 20, 'and it drops them all')
}

// 2b. Every token-stealing glider in the campaign patrols its line edge to
//     edge, back over the spot where it struck, and a plain heroine (no
//     power) standing there can swing and win the tokens back.
let thieves = 0
CAMPAIGN.forEach((def, index) => {
  const probe = new PlumberRun(options)
  probe.loadStage(index)
  probe.foes.forEach((spawned, which) => {
    if (!spawned.glide || spawned.kind !== 'glass-gull') return
    thieves++
    const run = new PlumberRun(options)
    run.heroineSeed = 2
    run.loadStage(index)
    run.mode = 'play'
    const gull = run.foes[which]!
    run.foes = [gull]
    run.tokens = 0
    const spot = gull.homeX
    run.hero = { x: spot, y: gull.homeY + TILE - HERO_TALL, vx: 0, vy: 0 }
    run.update(emptyInput())
    assert.equal(run.ground, true, `${def.code}: she stands where it struck`)
    run.immune = 1e6
    gull.carry = 5
    gull.x = spot - 40
    let edge = false
    const limit = (2 * run.stage.cols * TILE) / 1.3 + 600
    for (let frame = 0; frame < limit && gull.carry; frame++) {
      if (gull.x <= TILE) edge = true
      const input = emptyInput()
      input.held.left = frame === 0
      input.pressed.x = edge && gull.x > spot - 60 && gull.x < spot
      run.update(input)
      assert.ok(
        gull.x >= TILE && gull.x <= run.stage.cols * TILE - TILE,
        `${def.code}: the thief never leaves the stage`,
      )
    }
    assert.ok(edge, `${def.code}: the thief flew to the stage's edge`)
    assert.equal(gull.carry, 0, `${def.code}: and was caught on its way back`)
    assert.equal(run.tokens, 5, `${def.code}: dropping all five tokens`)
  })
})
assert.ok(thieves >= 6, 'the campaign has token-stealing gliders to check')

// 3. Every hundred tokens is a life, wherever the hundredth came from.
{
  const run = labRun(lab('..@.c'))
  run.tokens = 99
  const lives = run.lives
  play(run, 1, press('x'))
  assert.equal(run.solidAt(4, 20), 0, 'the wrench smashes the crate')
  assert.equal(run.tokens, 0, 'the hundredth token from a crate rolls over')
  assert.equal(run.lives, lives + 1, 'into an extra life')
}
{
  const run = labRun(lab('..@......u'))
  run.tokens = 98
  const gull = run.foes[0]!
  gull.carry = 5
  gull.x = run.hero.x + 30
  gull.y = run.hero.y + 12
  const lives = run.lives
  play(run, 1, press('x'))
  assert.ok(gull.fade > 0, 'the wrench catches the thief')
  assert.equal(run.tokens, 3, 'won-back tokens roll over too')
  assert.equal(run.lives, lives + 1)
}

// 4. A jump pressed while falling into a pit is not replayed on respawn.
{
  const run = labRun({
    ...lab('..@'),
    rows: lab('..@').rows.map((line, row) =>
      row > 20 ? '#'.repeat(10) + '.'.repeat(4) + '#'.repeat(COLS - 14) : line,
    ),
  })
  let frame = 0
  while (run.mode === 'play' && frame++ < 400) {
    const input = emptyInput()
    input.held.right = run.hero.x < 180
    input.pressed.a = !run.ground && run.hero.y > FLOOR - HERO_TALL
    run.update(input)
  }
  assert.equal(run.mode, 'dying', 'she falls into the pit')
  while (run.mode !== 'play' && frame++ < 800) run.update(emptyInput())
  for (let k = 0; k < 20; k++) {
    run.update(emptyInput())
    assert.ok(run.hero.vy >= 0, `respawn frame ${k}: no phantom hop`)
  }
  assert.equal(run.ground, true)
}

// 5. A storm gust turns a valve only when it reaches it, not when it blows
//    along a floor above or below the switch.
{
  const upper = ['.'.repeat(14) + 'v', '#'.repeat(12) + '.'.repeat(8)]
  const run = labRun(lab('..@.............................g', '1-2', upper))
  run.power = 'bottled-storm'
  assert.equal(run.valves[0]!.y, 19 * TILE, 'the valve sits on the upper floor')
  play(run, 1, press('x'))
  play(run, 60)
  assert.equal(
    run.valves[0]!.open,
    false,
    'a gust on the ground floor passes under the valve',
  )
  assert.equal(run.solidAt(32, 20), SOLID_GATE, 'and the gate stays shut')
  run.hero = { x: 5 * TILE, y: 19 * TILE - HERO_TALL, vx: 0, vy: 0 }
  run.facing = 1
  play(run, 4)
  play(run, 1, press('x'))
  play(run, 60)
  assert.equal(run.valves[0]!.open, true, 'a gust at its height turns it')
  assert.equal(run.solidAt(32, 20), 0, 'and opens the gate')
}

// 6. Powers: a hit costs the power (and any crate in hand) before a heart.
//    (The fuzz below checks that a death clears both.)
{
  const run = labRun(lab('..@.c...p'))
  run.power = 'pocket-lift'
  play(run, 1, press('x'))
  assert.equal(run.carrying, true)
  const foe = run.foes[0]!
  foe.x = run.hero.x + 6
  play(run, 1)
  assert.equal(run.power, null, 'the hit takes the power')
  assert.equal(run.carrying, false, 'and the crate with it')
  assert.equal(run.hearts, 3, 'but not a heart')
  play(run, 1, press('x'))
  assert.ok(run.thrown.length === 0, 'an empty-handed X throws nothing')
}

// 7. No height source reaches a closed gate's approach: the barrier battery's
//    ~24px margin (6-2, 8-3, 8-4) holds only while nothing adds height there.
for (let index = 0; index < CAMPAIGN.length; index++) {
  const run = new PlumberRun(options)
  run.loadStage(index)
  const code = CAMPAIGN[index]!.code
  for (let gate = 0; gate < run.stage.cols; gate++) {
    if (run.solidAt(gate, 1) !== SOLID_GATE) continue
    const lo = (gate - 16) * TILE
    const hi = (gate + 1) * TILE
    const near = (x: number) => x >= lo && x < hi
    assert.ok(
      !run.springs.some((s) => near(s.x)),
      `${code}: no spring by gate ${gate}`,
    )
    assert.ok(
      !run.platforms.some((p) => near(p.x) || near(p.x + p.w)),
      `${code}: no platform by gate ${gate}`,
    )
    assert.ok(
      !run.cargo.some((c) => near(c.x)),
      `${code}: no cargo drop by gate ${gate}`,
    )
    assert.ok(
      !run.foes.some((f) => !f.glide && f.kind === 'spring-hare' && near(f.x)),
      `${code}: no spring hare by gate ${gate}`,
    )
    for (let col = gate - 16; col <= gate; col++)
      for (let row = 0; row < run.stage.rows; row++)
        assert.notEqual(
          run.solidAt(col, row),
          SOLID_CRATE,
          `${code}: no crate to stack by gate ${gate}`,
        )
    for (const glider of run.foes.filter((f) => f.glide && f.x > hi))
      assert.ok(
        glider.x - 400 >= gate * TILE,
        `${code}: the glider at ${glider.x} stays put while she is held at gate ${gate}`,
      )
  }
}

// 8. Seeded interaction fuzz: she is dropped beside foes, crates, valves,
//    lifts and pickups with a random power and mashes every button.
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
const SEEDS = 6
const FRAMES = 3600
let fuzzFrames = 0
let drops = 0
for (let index = 0; index < CAMPAIGN.length; index++) {
  const code = CAMPAIGN[index]!.code
  for (let seed = 0; seed < SEEDS; seed++) {
    const random = mulberry32(index * 977 + seed * 31 + 5)
    const run = new PlumberRun(options)
    run.heroineSeed = seed
    run.loadStage(index)
    run.mode = 'play'
    run.lives = 99
    const width = run.stage.cols * TILE
    const input = emptyInput()
    let hold = 0
    let lastLoss = -1e9
    let died = false
    for (let frame = 0; frame < FRAMES && !run.over; frame++) {
      if (run.mode === 'play' && frame % 240 === 0) {
        run.power = POWERS[Math.floor(random() * POWERS.length)]!
        run.carrying = false
        const anchors = [
          ...run.foes.filter((f) => f.state !== 'gone').map((f) => f.x),
          ...run.platforms.map((p) => p.x + 8),
          ...run.valves.map((v) => v.x),
          ...run.pickups.map((p) => p.x),
        ]
        const at = anchors[Math.floor(random() * anchors.length)]
        if (at !== undefined) {
          const col = Math.floor(at / TILE) + Math.floor(random() * 13) - 6
          const spots: number[] = []
          for (let row = 2; row < run.stage.rows; row++) {
            const floor = run.solidAt(col, row)
            if (
              (WALLS.has(floor) || floor === SOLID_LEDGE) &&
              floor !== SOLID_GATE &&
              !run.solidAt(col, row - 1) &&
              !run.solidAt(col, row - 2)
            )
              spots.push(row)
          }
          const row = spots[Math.floor(random() * spots.length)]
          if (row !== undefined) {
            const from = run.hero
            const ducking = run.ducking
            run.hero = {
              x: col * TILE + 8,
              y: row * TILE - HERO_TALL,
              vx: 0,
              vy: 0,
            }
            run.ducking = false
            if (embedded(run)) {
              run.hero = from
              run.ducking = ducking
            } else {
              run.ground = false
              drops++
            }
          }
        }
      }
      if (hold-- <= 0) {
        hold = 3 + Math.floor(random() * 30)
        const dir = random()
        input.held.right = dir < 0.45
        input.held.left = dir > 0.7
        input.held.b = random() < 0.4
        input.held.down = random() < 0.1
        input.held.a = random() < 0.5
        input.held.y = random() < 0.2
      }
      input.pressed = emptyInput().pressed
      input.pressed.a = random() < 0.12
      input.pressed.x = random() < 0.12
      input.pressed.y = random() < 0.06
      input.pressed.down = random() < 0.03
      const hearts = run.hearts
      const power = run.power
      run.update(input)
      fuzzFrames++
      const where = `${code} seed ${seed} frame ${frame}`
      if (run.mode === 'clear' || run.mode === 'victory') break
      if (run.mode === 'play' && died) {
        assert.equal(run.power, null, `${where}: a death clears the power`)
        assert.equal(run.carrying, false, `${where}: and the crate in hand`)
        assert.equal(run.jumpBuffer, 0, `${where}: and any buffered jump`)
        assert.equal(run.grace, 0, `${where}: and any coyote time`)
        died = false
      }
      if (run.mode === 'dying') died = true
      if (run.mode !== 'play') continue
      if (run.hearts < hearts || (power && !run.power)) {
        assert.ok(
          frame - lastLoss >= 90,
          `${where}: hits are spaced by her invulnerability (no pin-lock)`,
        )
        lastLoss = frame
      }
      const clip = embedded(run)
      assert.equal(clip, null, `${where}: her hitbox never sits inside ${clip}`)
      assert.ok(
        !run.carrying || run.power === 'pocket-lift',
        `${where}: only Pocket Lift carries a crate`,
      )
      assert.equal(phantomSteps(run), 0, `${where}: no orphaned lantern step`)
      for (const foe of run.foes) {
        assert.ok(
          [foe.x, foe.y, foe.vx, foe.vy].every(Number.isFinite),
          `${where}: ${foe.kind} stays finite`,
        )
        if (foe.carry)
          assert.ok(
            foe.x >= 0 && foe.x <= width,
            `${where}: a ${foe.kind} thief stays catchable inside the stage`,
          )
      }
      for (const crate of run.thrown)
        assert.ok(
          Number.isFinite(crate.x) && Number.isFinite(crate.y),
          `${where}: thrown crates stay finite`,
        )
      if (run.boss)
        assert.ok(
          run.boss.hp >= 0 &&
            Number.isFinite(run.boss.x) &&
            Number.isFinite(run.boss.y),
          `${where}: the boss stays in range`,
        )
      assert.ok(
        run.hearts >= 0 &&
          run.hearts <= 3 &&
          run.tokens >= 0 &&
          run.tokens < 100,
        `${where}: hearts and tokens stay in range`,
      )
    }
  }
}
assert.ok(drops > 500, 'the fuzz dropped her beside interaction objects')

console.log(
  `Save the Plumber interactions verified: lantern steps, thieves (${thieves} campaign gliders), token lives, respawn buffer, valve gusts, powers, gate approaches, ${fuzzFrames} interaction fuzz frames`,
)
