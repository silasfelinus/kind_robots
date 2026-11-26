// Save the Plumber Ballast Boots (t-005 Gen-2 scope: a heavy form with
// movement consequences), played through the real update loop. The boots are
// collectible; wind-corridor headwinds no longer push her; ice grips like
// ordinary ground; a fall with Down held lands hard enough to break the
// crates underfoot, while an ordinary landing leaves them alone; and the
// boots never change her jump.
import assert from 'node:assert/strict'
import { HERO_TALL, PlumberRun } from '../arcade/games/savePlumberPreview'
import { SOLID_CRATE, TILE, type StageDef } from '../arcade/games/savePlumberLevels'
import { emptyInput, type InputFrame } from '../arcade/types'

const options = {
  rng: () => 0.5,
  sound: { play() {} },
  demo: false,
  hiScore: 0,
}
const COLS = 60
const FLOOR = 21 * TILE

/**
 * A flat floor on row 21. `items` puts glyphs on row 20, `floor` replaces
 * floor tiles on row 21, and `wind` marks wind-corridor columns.
 */
function ballastLab(
  items: Record<number, string> = {},
  floor: Record<number, string> = {},
  wind: number[] = [],
): StageDef {
  const rows: string[] = []
  for (let row = 0; row < 24; row++) {
    const line = Array.from({ length: COLS }, () => '.')
    if (row >= 21) line.fill('#')
    if (row === 0) for (const col of wind) line[col] = '~'
    if (row === 20) {
      line[3] = '@'
      for (const [col, glyph] of Object.entries(items))
        line[Number(col)] = glyph
      line[COLS - 3] = 'G'
    }
    if (row === 21)
      for (const [col, glyph] of Object.entries(floor))
        line[Number(col)] = glyph
    rows.push(line.join(''))
  }
  return { code: '1-1', name: 'Ballast Lab', rows }
}

function labRun(def: StageDef) {
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
const place = (run: PlumberRun, col: number, y = FLOOR - HERO_TALL) => {
  run.hero.x = col * TILE + TILE / 2
  run.hero.y = y
  run.hero.vx = 0
  run.hero.vy = 0
}

// 1. The boots are a collectible power.
{
  const run = labRun(ballastLab({ 8: '5' }))
  walkTo(run, 8)
  play(run, 4)
  assert.equal(run.power, 'ballast', 'Ballast Boots are picked up')
}

// 2. A wind-corridor headwind pushes her back, but not in Ballast Boots.
const windDrift = (power: 'ballast' | null) => {
  const wind = Array.from({ length: 30 }, (_, k) => 15 + k)
  const run = labRun(ballastLab({}, {}, wind))
  run.power = power
  place(run, 30)
  play(run, 2)
  // Wait for the start of a gust, then stand still through all of it.
  play(run, 300 - (run.tick % 300))
  const start = run.hero.x
  play(run, 150)
  return run.hero.x - start
}
const blown = windDrift(null)
const anchored = windDrift('ballast')
assert.ok(blown < -60, `the headwind pushes her back (${blown.toFixed(1)}px)`)
assert.ok(
  Math.abs(anchored) < 1,
  `Ballast Boots hold her in the gust (${anchored.toFixed(1)}px)`,
)

// 3. Ice grips like ordinary ground: a sprint stops far sooner.
const iceSlide = (power: 'ballast' | null) => {
  const ice: Record<number, string> = {}
  for (let col = 6; col < 56; col++) ice[col] = 'f'
  const run = labRun(ballastLab({}, ice))
  run.power = power
  place(run, 10, FLOOR - HERO_TALL - 1)
  play(run, 4)
  play(run, 60, (_, input) => {
    input.held.right = true
  })
  const release = run.hero.x
  play(run, 90)
  assert.ok(run.ground, 'she ends on the ice')
  return run.hero.x - release
}
const slid = iceSlide(null)
const gripped = iceSlide('ballast')
assert.ok(slid > 40, `bare boots slide on ice (${slid.toFixed(1)}px)`)
assert.ok(
  gripped < slid / 2,
  `Ballast Boots grip the ice (${gripped.toFixed(1)}px vs ${slid.toFixed(1)}px)`,
)

// 4. A Down-held drop lands hard and breaks the crate underfoot; an ordinary
// landing, or a drop without the boots, leaves the crate in place.
const crateAfterDrop = (power: 'ballast' | null, down: boolean) => {
  const run = labRun(ballastLab({}, { 30: 'c' }))
  run.power = power
  place(run, 30, FLOOR - HERO_TALL - 90)
  run.ground = false
  const tokens = run.tokens
  play(run, 40, (_, input) => {
    input.held.down = down
  })
  return { crate: run.solidAt(30, 21) === SOLID_CRATE, tokens: run.tokens - tokens }
}
const slam = crateAfterDrop('ballast', true)
assert.equal(slam.crate, false, 'a Ballast slam breaks the crate underfoot')
assert.equal(slam.tokens, 1, 'and the crate pays its token')
assert.equal(
  crateAfterDrop('ballast', false).crate,
  true,
  'an ordinary Ballast landing leaves the crate',
)
assert.equal(
  crateAfterDrop(null, true).crate,
  true,
  'a Down drop without the boots leaves the crate',
)

// 5. The boots are not a jump change.
{
  const normal = labRun(ballastLab())
  const heavy = labRun(ballastLab())
  heavy.power = 'ballast'
  for (const run of [normal, heavy])
    play(run, 1, (_, input) => {
      input.held.a = input.pressed.a = true
    })
  assert.equal(heavy.hero.vy, normal.hero.vy, 'Ballast Boots keep her jump')
}

console.log(
  `Save the Plumber Ballast Boots verified: pickup, wind hold (${blown.toFixed(0)}px vs ${anchored.toFixed(0)}px), ice grip (${slid.toFixed(0)}px vs ${gripped.toFixed(0)}px), crate slam, unchanged jump`,
)
